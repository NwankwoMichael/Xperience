import { Request, Response, NextFunction } from "express";
import { Review } from "../models/reviewModel";
import { Booking } from "../models/bookingModel";
import { Trip } from "../models/tripModel";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import * as factory from "./handlerFactory";

// MIDDLEWARE TO INTERCEPT NESTED ROUTE PARAMETERS FOR CREATION
export const setTripUserIds = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Assign tripId parameter
  if (!req.body.trip) req.body.trip = req.params.tripId;

  // Pull the direct primary key context string from your session matrix
  if (!req.body.user) req.body.user = req.user!._id;

  next();
};

// BACKEND SECURITY LAYER: Restricts API submissions strictly to authenticated, experienced customers
export const restrictToExperiencedBookers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Extract trip ID dynamically from the parameters
    const tripId = req.params.tripId || req.body.trip;

    // Guard clause
    if (!tripId) {
      return next(
        new AppError(
          "Review submissions must be associated with a valid Trip object tracking ID.",
          400,
        ),
      );
    }

    // Query MongoDB for an active booking contract row matching this session user
    const booking = await Booking.findOne({
      user: req.user!.id,
      trip: tripId,
    });

    if (!booking) {
      return next(
        new AppError(
          "Review Access Denied: You can only review trips that you have officially booked.",
          403,
        ),
      );
    }

    // Fetch the target trip to inspect its date parameters array matrix
    const trip = await Trip.findById(tripId);
    if (!trip) return next(new AppError("No trip found with that ID.", 404));

    // Confirm that at least one departure date occurred in the past
    const now = new Date();
    const pastDates =
      trip.startDates?.filter((date: Date) => new Date(date) < now) || [];

    if (pastDates.length === 0) {
      return next(
        new AppError(
          "Review Access Denied: You cannot review this trip until you have actually completed the experience!",
          403,
        ),
      );
    }

    // Check if user has already left a testimonial for this specific trip
    const existingReview = await Review.findOne({
      user: req.user?.id,
      trip: tripId,
    });

    if (existingReview) {
      return next(
        new AppError(
          "Review Access Denied: You have already shared your review for this adventure. Duplicate submissions are restricted!",
          400,
        ),
      );
    }

    // All anti-fraud parameter validation passed successfully!
    next();
  },
);

// AUTOMATED FACTORY CRUD HANDLERS
export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);
