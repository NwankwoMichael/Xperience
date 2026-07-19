import mongoose, { Schema, model, Document, Types } from "mongoose";
import { Trip } from "./tripModel";

// DEFINE THE REVIEW TYPESCRIPT INTERFACE
export interface IReview extends Document {
  review: string;
  rating: number;
  createdAt: Date;
  trip: Types.ObjectId | string;
  user: Types.ObjectId | string;
}

// BUILD THE MONGOOSE SCHEMA MATCHING THE INTERFACE DEFINITIONS
const reviewSchema = new Schema<IReview>(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      required: [true, "A review must have a rating."],
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Review must belong to a trip."],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// PREVENT DUPLICATE REVIEWS: ENSURE A SINGLE USER CAN ONLY LEAVE ONE REVIEW PER TRIP
reviewSchema.index({ trip: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE: Automatically populate user information on find
reviewSchema.pre(/^find/, function (this: mongoose.Query<any, IReview>) {
  this.populate({
    path: "user",
    select: "name photo", // Only essential user profile attributes
  });
});

// EXTEND THE MODEL INTERFACE TO RECOGNIZE YOUR CUSTOM STATIC FUNCTION SIGNATURE
interface ReviewModel extends mongoose.Model<IReview> {
  calcAverageRatings(tripId: Types.ObjectId | string): Promise<void>;
}

// IMPLEMENT THE STATIC METHOD ON THE SCHEMA
reviewSchema.statics.calcAverageRatings = async function (
  this: any,
  tripId: Types.ObjectId | string,
): Promise<void> {
  // Execute aggregation calculation matrices
  const stats = await this.aggregate([
    { $match: { trip: tripId } },
    {
      $group: {
        _id: "$trip",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Trip.findByIdAndUpdate(tripId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // Fallback default states if all reviews get deleted
    await Trip.findByIdAndUpdate(tripId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Hook the calculator directly into post-save operations
reviewSchema.post("save", function (this: IReview) {
  // "this.constructor" targets the model class definition template
  (this.constructor as ReviewModel).calcAverageRatings(this.trip);
});

// CREATE AN INTERMEDIATE INTERFACE TYPE EXTENSION TO PASS DOCUMENT HOOKS CLEANLY
interface ReviewQuery extends mongoose.Query<any, IReview> {
  r?: IReview | null;
}

// PRE-QUERY HOOK: FETCH AND STASH THE TARGET DOCUMENT REFERENCE BEFORE EXECUTION
reviewSchema.pre(/^findOneAnd/, async function (this: ReviewQuery) {
  this.r = await this.clone().findOne();
});

// POST-QUERY HOOK: TRIGGER RECALCULATION ON THE STASHED DOCUMENT DATA PROFILE
reviewSchema.post(/^findOneAnd/, async function (this: ReviewQuery) {
  if (this.r) {
    await (this.r.constructor as ReviewModel).calcAverageRatings(this.r.trip);
  }
});

// COMPILE AND EXPORT THE FINALIZED MODEL WRAPPER
export const Review = model<IReview, ReviewModel>("Review", reviewSchema);
