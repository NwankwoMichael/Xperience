import { Schema, model, Document, Types, Query, Aggregate } from "mongoose";
import slugify from "slugify";

// DEFINE THE TYPESCRIPT INTERFACE
export interface IGeoJSONPoint {
  type: "Point";
  coordinates: number[];
  address?: string;
  description?: string;
  day?: number;
}

export interface ITrip extends Document {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  createdAt: Date;
  startDates: Date[];
  secretTrip: boolean;
  startLocation: IGeoJSONPoint;
  locations: IGeoJSONPoint[];
  guides: Types.ObjectId[] | string[];
  durationWeeks?: number;
  reviews?: any[];
}

const tripSchema = new Schema<ITrip>(
  {
    name: {
      type: String,
      required: [true, "A trip must have a name"],
      unique: true,
      maxlength: [40, "A trip must have less than or equal 40 characters."],
      minlength: [10, "A trip must have equal or more than 10 characters."],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A trip must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A trip must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A trip must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A trip must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: ITrip, value: number) {
          // this only points to current doc on new document creation
          return value < this.price;
        },
        message:
          "Discount price ({VALUE}) should be less than the regular price.",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A trip must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A trip must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: () => new Date(),
      select: false,
    },
    startDates: [Date],
    secretTrip: { type: Boolean, default: false },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], // Longitude first and latitude second
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// SETTING INDEXES FOR STARTLOCATION
tripSchema.index({ startLocation: "2dsphere" });

// SETTING INDEXES FOR THE PRICE FIELD
tripSchema.index({ price: 1, ratingsAverage: -1 });
tripSchema.index({ slug: 1 });

tripSchema.virtual("durationWeeks").get(function (this: ITrip): number {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tripSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "trip", // Ensure your Review model matches this field reference
  localField: "_id",
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create command
tripSchema.pre("save", function (this: ITrip) {
  this.slug = slugify(this.name, { lower: true });
});

// QUERY MIDDLEWARE
tripSchema.pre(/^find/, function (this: Query<any, ITrip> & { start?: any }) {
  // "this" is the query object!
  this.find({ secretTrip: { $ne: true } });

  //   Create new start property on a fly
  this.start = Date.now();
});

tripSchema.post(/^find/, function (this: Query<any, ITrip> & { start?: any }) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
});

// AGGREGATION MIDDLEWARE
tripSchema.pre("aggregate", function (this: Aggregate<any>) {
  // Exteact the pipeline reference once to optimize memory
  const pipeline = this.pipeline();

  //   Exit if the pipeline is empty or starts with a geospatial step
  if (pipeline.length > 0 && "$geoNear" in pipeline[0]) return;

  //   Inject the data firewall cleanly into the query matrix
  pipeline.unshift({
    $match: { secretTrip: { $ne: true } },
  });
});

// THE POPULATION HOOK
tripSchema.pre(/^find/, function (this: any) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt ",
  });
});

export const Trip = model<ITrip>("Trip", tripSchema);
