// 🛠️ STEP 1: Execute environment configuration synchronously first!
import "./loadEnv";

import mongoose from "mongoose";
import gracefulShutdown from "./utils/shutdown";

// HANDLE UNCAUGHT EXCEPTIONS EARLY
process.on("uncaughtException", (err: Error) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

// STRICT CHECK TO ENSURE ENVIRONMENT KEYS ARE REGISTERED BEFORE BOOTING
const rawDatabaseUrl = process.env.DATABASE;
const databasePassword = process.env.DB_PASSWORD;

if (!rawDatabaseUrl || !databasePassword) {
  console.error("❌ CRITICAL ERROR: Environment variables failed to load!");
  console.error(
    "Please ensure your configuration files (.env or .env.production) exist in the root folder.",
  );
  process.exit(1);
}

const DB = rawDatabaseUrl.replace("<PASSWORD>", databasePassword);

// CONNECT THE MONGODB DATABASE
mongoose
  .connect(DB)
  .then(async () => {
    console.log("✨ Xperience DB connection successful!");

    // 🛠️ STEP 2: Dynamically import app after variables and DB are completely ready
    const { default: app } = await import("./app");

    // START THE SERVER
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () =>
      console.log(`🚀 Xperience server running smoothly on port ${port}...`),
    );

    // HANDLE UNHANDLED PROMISE REJECTIONS SECURELY
    process.on("unhandledRejection", (err: any) => {
      console.log("UNHANDLED REJECTION 💥 Shutting down...");
      console.log(err?.name || "Unknown Error", err?.message || err);
      if (err?.stack) console.log(err.stack);

      server.close(() => {
        if (typeof gracefulShutdown === "function") gracefulShutdown();
        else process.exit(1);
      });
    });

    // LISTEN FOR SYSTEM INFRASTRUCTURE KILL SIGNALS
    const handleSystemShutdown = (signal: string) => {
      console.log(`✋ ${signal} RECEIVED. Shutting down gracefully...`);
      server.close(() => {
        if (typeof gracefulShutdown === "function") gracefulShutdown();
        else process.exit(0);
      });
    };

    process.on("SIGTERM", () => handleSystemShutdown("SIGTERM"));
    process.on("SIGINT", () => handleSystemShutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("💥 DB connection error:", err);
    process.exit(1);
  });
