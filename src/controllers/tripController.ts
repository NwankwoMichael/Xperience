import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import { Trip, ITrip } from "../models/tripModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";

// Configure Multer Memory Storage
const multerStorage = multer.memoryStorage();

// Configure Multer File Filter to Strictly Accept Images
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  // Accept the file
  if (file.mimetype.startsWith("image")) return cb(null, true);

  //   Reject the file
  cb(
    new AppError("Not an Image! Please upload only images.", 400) as any,
    false,
  );
};

// Create the Upload instance config
export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB size limit
});

export const uploadTripImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// IMAGE PROCESSOR MIDDLEWARE
export const resizeTripImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Cast req.file safely to an object dictionary containing multer file arrays
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    //   Safely check if both fields exists before proceeding
    if (!files || !files.imageCover || !files.images) return next();

    // Process Cover Image
    const imageCoverFile = files.imageCover[0];
    if (imageCoverFile) {
      req.body.imageCover = `trip-${req.params.id}-${Date.now()}-cover.jpeg`;

      await sharp(imageCoverFile.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/trips/${req.body.imageCover}`);
    }

    // Process Images Array
    req.body.images = [];

    await Promise.all(
      files.images.map(async (file, index) => {
        // Initialize file name
        const filename = `trip-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

        // Use sharp image processor to resize and process each image file
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/trips/${filename}`);

        //   Push the compiled filename into your body array matrix
        req.body.images.push(filename);
      }),
    );
    next();
  },
);

// ALIAS MIDDLEWARE
export const aliasTopTrips = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// ROUTE HANDLERS
export const getAllTrips = factory.getAll(Trip);
export const getTrip = factory.getOne(Trip, { path: "reviews" });
export const createTrip = factory.createOne(Trip);
export const updateTrip = factory.updateOne(Trip);
export const deleteTrip = factory.deleteOne(Trip);

// Get Trip Stats
export const getTripStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await Trip.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTrips: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({ status: "success", data: { stats } });
  },
);

// Get Monthly Plan
export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const year = Number(req.params.year);

    const plan = await Trip.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTripStarts: { $sum: 1 },
          trips: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: {
          numTripStarts: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({ status: "success", data: { plan } });
  },
);

// Define Interface For Specific Routes Params
interface TripWithinParams {
  distance: string;
  latlng: string;
  unit: string;
  [key: string]: string | undefined;
}

// Get Trips Within Geospatial Boundary
export const getTripsWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get route parameters
    const { distance, latlng, unit } =
      req.params as unknown as TripWithinParams;

    //  Guard clause to ensure both strings exists before calling split
    if (!latlng)
      return next(
        new AppError("Please provide latitude and longitude parameters.", 400),
      );

    //   Get latitude & longitude from latlng
    const [lat, lng] = latlng.split(",");

    // Ensure lat, lng exists
    if (!lat || !lng)
      return next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng.",
          400,
        ),
      );

    //   Convert strings to float metrics for geospatial math radius boundaries
    const radius =
      unit === "mi" ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    //   Get trips that match geospatial query
    const trips = await Trip.find({
      startLocation: {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] },
      },
    });

    res.status(200).json({
      status: "success",
      results: trips.length,
      data: { data: trips },
    });
  },
);

// Get Distances from a Point
export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get parameters using casting pattern
    const { latlng, unit } = req.params as unknown as TripWithinParams;

    // Guard clause to ensure latlng exists before calling split
    if (!latlng)
      return next(
        new AppError(
          "Please provide a latitude and longitude in format lat,lng.",
          400,
        ),
      );

    //   Get latitude & lomgitude from latlng
    const [lat, lng] = latlng.split(",");

    // Testing for the unit
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    // Guard clause to ensure lat & lng exists
    if (!lat || !lng)
      return next(
        new AppError(
          "Please provide a latitude and a longitude in the format lat,lng",
          400,
        ),
      );

    //   Commence geospatial aggregation
    const distances = await Trip.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    // Send response to client
    res.status(200).json({
      status: "success",
      data: { data: distances },
    });
  },
);
