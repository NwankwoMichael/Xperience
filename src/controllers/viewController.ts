import { Request, Response, NextFunction } from "express";

import { Trip } from "../models/tripModel";
import { User } from "../models/userModel";
import { Booking } from "../models/bookingModel";
import { Review } from "../models/reviewModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

// WEBHOOK ALERTS INTERCEPTION MIDDLEWARE
export const alerts = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { alert } = req.query;

  if (alert === "booking") {
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up here immediately, please come back later.";
  }

  next();
};

// RENDER HOMEPAGE | OVERVIEW PAGE
export const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get all the trip data from collection
    const trips = await Trip.find();

    // Render that template using the trip data from step 1
    res.status(200).render("overview", {
      title: "All Trips",
      trips,
    });
  },
);

// RENDER THE DETAILED TRIP PAGE
export const getTrip = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the data for the requested trip (reviews & users included)
    const trip = await Trip.findOne({ slug: req.params.slug }).populate({
      path: "reviews",
      select: "review rating user",
    });

    // Error handler
    if (!trip) {
      return next(new AppError("There is no trip with that name.", 404));
    }

    // Initialize a default booking & experienced status tracker
    let isBooked = false;
    let isExperienced = false;

    // Check if user is logged in, then verify if they already booked this specific trip
    if (res.locals.user) {
      const booking = await Booking.findOne({
        user: res.locals.user.id,
        trip: trip.id,
      });

      // If a booking document is found, set your status flag to true!
      if (booking) {
        isBooked = true;

        // Check if at least one start date in the array has occurred
        const now = new Date();
        const pastDates =
          trip.startDates?.filter((date: Date) => new Date(date) < now) || [];

        if (pastDates.length > 0) {
          // Scan if a testimonial already exists for logged-in user
          const existingReview = await Review.findOne({
            user: res.locals.user.id,
            trip: trip.id,
          });

          // Only display review form if they haven't submitted a review yet!
          if (!existingReview) {
            isExperienced = true;
          }
        }
      }
    }

    // RENDER TEMPLATE
    res.status(200).render("trip", {
      title: `${trip.name} Trip`,
      trip,
      isBooked,
      isExperienced,

      // Inject mapbox access token from back-end
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,

      // Inject stripe public key from back-end
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    });
  },
);

// RENDER SIGNUP FORM
export const getSignupForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(200).render("signup", { title: "Sign up to create an account." });
};

// RENDER LOGIN FORM
export const getLoginForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

// RENDER USER ACCOUNT DASHBOARD PANEL
export const getAccount = (req: Request, res: Response): void => {
  res.status(200).render("account", {
    title: "Your account settings",
    user: req.user,
  });
};

// RENDER USER BOOKINGS (MY TRIPS) SHEET PAGE
export const getMyTrips = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Find all bookings matching user
    const bookings = await Booking.find({ user: req.user!.id });

    // Extract the trip IDs from the booking document array list safely
    const tripIDs = bookings.map((el: any) => el.trip?._id || el.trip);

    // Query the trip collection to pull all matching documents matching those IDs
    const trips = await Trip.find({ _id: { $in: tripIDs } });

    res.status(200).render("my-bookings", {
      title: "My Trip Bookings",
      trips,
      user: req.user,
    });
  },
);

// RENDER UPDATE USER PAGE
export const updatedUserData = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const updatedUser = await User.findByIdAndUpdate(
      req.user!.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).render("account", {
      title: "Your account",
      user: updatedUser,
    });
  },
);

// RENDER FORGOT PASSWORD INTERFACE REQUEST FORM
export const getForgotPasswordForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(200).render("forgotPassword", {
      title: "Account Recovery Vault",
    });
  },
);

// RENDER RESET PASSWORD CONFIGURATION TARGET FORM
export const getResetPasswordForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Extract token parameter from URL segment path
    const { token } = req.params;

    res.status(200).render("resetPassword", {
      title: "Reset Account Password",
      token, // Passed into pug template execution engine scope
    });
  },
);

// RENDER MY HISTORICAL REVIEWS PANEL
export const getMyReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Find all reviews matching the active logged-in user profile identifier
    const reviews = await Review.find({ user: req.user!.id }).populate({
      path: "trip",
      select: "name slug imageCover",
    });

    // Compile the dedicated dashboard view frame
    res.status(200).render("reviews", {
      title: "My Historical Reviews",
      reviews,
    });
  },
);

/**
 *   Render the primary trip inventory list view desk dashboard
 */
export const getManageTripDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch complete inventory arrays from MongoDB, ordered newest first
    const trips = await Trip.find().sort("-createdAt");

    // Rendeer the administrative control console layout panel
    res.status(200).render("manageTrips", {
      title: "Warehouse Trip Inventory",
      trips,
    });
  },
);

/**
 * Pulls down the total user base matrix array to populate
 */
export const getManageUsersDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch total user records, excluding password to preserve system safety footprints
    const platformUsers = await User.find({
      $or: [{ active: true }, { active: false }],
    }).sort("name");

    // Render user panel template parameters payload
    res.status(200).render("manageUsers", {
      title: "Global User Directory Console",
      platformUsers,
    });
  },
);

/**
 * Renders the global administrative reviews moderations list dashboard
 */
export const getManageReviewsDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch all platform reviews and populate basic structural entity fields
    const platformReviews = await Review.find()
      .populate({ path: "user", select: "name" })
      .populate({ path: "trip", select: "name" })
      .sort("-createdAt");

    // Render review moderation workspace layout
    res.status(200).render("manageReviews", {
      title: "Platform Reviews Moderation Control",
      platformReviews,
    });
  },
);

/**
 * Render the global administrative bookings transaction ledger view dashboard
 */
export const getManageBookingsDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch total booking documents across the platform
    const platformBookings = await Booking.find()
      .populate({ path: "user", select: "name" })
      .populate({ path: "trip", select: "name" })
      .sort("-createdAt");

    // Render booking dashboard panel view template
    res.status(200).render("manageBookings", {
      title: "Global Transaction Ledger Panel",
      platformBookings,
    });
  },
);
