import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import { User, IUser } from "../models/userModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";

// CONFIGURE MULTER MEMORY STORAGE
const multerStorage = multer.memoryStorage();

// CONFIGURE MULTER FILE FILTER TO STRICTLY ACCEPT IMAGES
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (file.mimetype.startsWith("image")) return cb(null, true);

  cb(
    new AppError("Not an Image! Please upload only images.", 400) as any,
    false,
  );
};

// MULTER CONFIG
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB size limit
});

// MULTER MIDDLEWARE
export const uploadUserPhoto = upload.single("photo");

// IMAGE PROCESSOR MIDDLEWARE
export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) return next();

    // Set file name securely linking user's identifier
    req.file.filename = `user-${req.user?.id || "unknown"}-${Date.now()}.jpeg`;

    // Process file buffer via sharp asynchronously into user storage directory
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  },
);

// HELPER FILTER FUNCTION FOR NOT ALLOWED FIELDS
const filterObj = (
  obj: Record<string, any>,
  ...allowedFields: string[]
): Record<string, any> => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// HANDLER FOR GETTING THE CURRENT LOGGED IN USER
export const getMe = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.params.id = req.user!.id;
  next();
};

// HANDLER FOR UPDATING CURRENTLY LOGGED USER'S INFORMATION
export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400,
        ),
      );
    }

    // Filter out fields that shouldn't be granted update permission
    const filteredBody = filterObj(req.body, "name", "email");

    // Handle avatar image updates or resets
    if (req.file) {
      filteredBody.photo = req.file.filename;
    } else if (req.body.photo === "default.jpg") {
      // 🛠️ Optimization: Allows programmatic resetting to the default system avatar
      filteredBody.photo = "default.jpg";
    }

    // Update user document details
    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      filteredBody,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    res.status(200).json({ status: "success", data: { user: updatedUser } });
  },
);

// HANDLER FOR DELETING CURRENTLY LOGGED USER
export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await User.findByIdAndUpdate(req.user?.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);

// HANDLER FOR CREATING USER
export const createUser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead.",
  });
};

/**
 * Administrative profile overwrite engine
 */

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 🪓 Secure exclusion: Prevent admins from manually altering passwords via this endpoint
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password configurations. Please request a recovery link.",
          400,
        ),
      );
    }

    // Explicitly extract the exact administrative tracking properties allowed
    const updateData: { role?: string; active?: boolean } = {};
    if (req.body.role) updateData.role = req.body.role;

    // Explicitly check for boolean values to prevent undefined blocks
    if (req.body.active !== undefined) {
      updateData.active =
        req.body.active === true || req.body.active === "true";
    }

    // Update using findByIdAndUpdate while forcing structural validation passes
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return next(
        new AppError(
          `No profile matching that ID was found in the system.`,
          404,
        ),
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
        data: updatedUser,
      },
    });
  },
);

// FACTORY LINKED CRUD HANDLERS
export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const deleteUser = factory.deleteOne(User);
