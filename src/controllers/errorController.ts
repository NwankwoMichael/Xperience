import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import AppError from "../utils/appError";

// HELPER TO HANDLE MONGOOSE CASTERROR (e.g., INVALID OBJECTIDs)
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// HELPER TO HANDLE MONGOOSE DUPLICATE FIELD ERRORS (Mongo error code 11000)
const handleDuplicateFieldsDB = (err: any): AppError => {
  const errmsg =
    err.errmsg || (err.errorResponse && err.errorResponse.errmsg) || "";
  const match = errmsg.match(/(["'])(\\?.)*?\1/);
  const value = match ? match[0] : "unknown";

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// HELPER TO HANDLE MONGOOSE VALIDATIONERROR PROFILES
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400); // Changed from 404 to standard 400 Bad Request
};

// HELPER TO HANDLE JWT VALIDATION FAILURES
const handleJWTError = (): AppError =>
  new AppError("Invalid token, please log in again!", 401);

// HANDLE JWT EXPIRED ERROR
const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

// DEVELOPMENT ERROR OUTPUT: DETAILED LOGS FOR DEBUGGING
const sendErrorDev = (
  err: AppError & { stack?: string },
  req: Request,
  res: Response,
): void => {
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    return;
  }

  console.error("ERROR 💥", err);
  res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

// PRODUCTION ERROR OUTPUT: CLEAN, USER-FRIENDLY LEAKS PREVENTION
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    if (err.isOperational && err.message) {
      res
        .status(err.statusCode)
        .json({ status: err.status, message: err.message });
      return;
    }

    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
    return;
  }

  if (err.isOperational && err.message) {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      message: err.message,
    });
    return;
  }

  console.error("ERROR 💥", err);
  res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    message: "Please try again later.",
  });
};

// THE MAIN MIDDLEWARE INTERFACE ENGINE
const globalErrorHandler: ErrorRequestHandler = (
  err: any, // Typed as any here to read non-enumerable Error prototype properties safely
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // 🛠️ Object.create() preserves prototype chain links (like .name, .message) safely
    let error = Object.create(err);
    error.message = err.message;
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.code = err.code;

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
