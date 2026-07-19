import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// 🔄 IMPORT ALL STRONGLY-TYPED XPERIENCE MODELS
import { Trip } from "../../src/models/tripModel"; // Upgraded from tourModel
import { User } from "../../src/models/userModel";
import { Review } from "../../src/models/reviewModel";
import { Booking } from "../../src/models/bookingModel";

// CONFIGURE ENVIRONMENT VARIABLES PATH SEGMENTS
dotenv.config();

// SECURELY CONNECT TO DATABASE CLUSTERS
const DB = (process.env.DATABASE as string).replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD as string,
);

mongoose
  .connect(DB)
  .then(() =>
    console.log(
      "💾 Xperience Database connected successfully for development seeding!",
    ),
  )
  .catch((err) => console.error("💥 Database seeding connection error:", err));

// 🛠️ READ JSON SOURCE FILE BUFFER LAYERS (Updated paths to capture trips payload)
const tripsFile = path.join(process.cwd(), "dev-data", "data", "trips.json");
const userFile = path.join(process.cwd(), "dev-data", "data", "users.json");
const reviewsFile = path.join(
  process.cwd(),
  "dev-data",
  "data",
  "reviews.json",
);

const trips = JSON.parse(fs.readFileSync(tripsFile, "utf-8"));
const users = JSON.parse(fs.readFileSync(userFile, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(reviewsFile, "utf-8"));

/**
 * Ingests all parsed mock datasets directly into your remote database collections
 */
const importData = async (): Promise<void> => {
  try {
    // Ingest core itineraries and customer reviews through mongoose model validators
    await Trip.create(trips);
    await Review.create(reviews);

    // Map through user array & explicitly transform string IDs into valid MongoDB ObjectIds
    // This allows pre-built dev files to maintain reference keys between reviews, bookings, and users
    const fullyTypedUsers = users.map((user: any) => ({
      ...user,
      _id: new mongoose.Types.ObjectId(user._id),
    }));

    // Ingest user records directly via the native collection driver to bypass password pre-save hooks
    // This prevents pre-encrypted passwords inside your development file from being re-hashed a second time
    await User.collection.insertMany(fullyTypedUsers);
    console.log(
      "✨ Xperience test data successfully loaded into MongoDB collections!",
    );
  } catch (err) {
    console.error("💥 Error importing development data payload:", err);
  }
  process.exit();
};

/**
 * Permanently drops records across tracked workspace database tables
 */
const deleteData = async (): Promise<void> => {
  try {
    console.log(
      "🗑️ Commencing full database scrub across operational collections...",
    );

    await Trip.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    await Booking.deleteMany();

    console.log("🛑 Data successfully flushed! All collections are clear.");
  } catch (err) {
    console.error("💥 Error purging operational collection records:", err);
  }
  process.exit();
};

// CAPTURE COMMAND LINE INTERFACE TERMINAL EXECUTION ARGV OBJECT VECTORS
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log(
    "⚠️ Operational Usage Error: Please provide an active terminal flag: --import or --delete",
  );
  process.exit();
}
