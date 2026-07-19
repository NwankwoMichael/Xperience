import express, { Application } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import hpp from "hpp";
import compression from "compression";
import cors from "cors";
import path from "path";
import { Request, Response, NextFunction } from "express";

import { IUser } from "./models/userModel";
import tripRouter from "./routes/tripRoutes"; // 🔄 Transformed from tourRoutes
import userRouter from "./routes/userRoutes";
import reviewRouter from "./routes/reviewRoutes";
import bookingRouter from "./routes/bookingRoutes";
import viewRouter from "./routes/viewRoutes";
import * as bookingController from "./controllers/bookingController";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";

// TYPE DECLARATION MERGING
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      user?: IUser;
    }
  }
}

// Starting express app
const app: Application = express();

app.set("trust proxy", 1); // trust first proxy

// Point the view engine directly to your true root views directory
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "pug");

// GLOBAL MIDDLEWARES
app.use(cors());
app.options("/*any", cors()); // 🛠️ Fix: Standardized wildcard catch pattern for pre-flight routing

// Serving static files
app.use(express.static(path.join(process.cwd(), "public")));

// Set security HTTP headers via Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // 🛠️ KEY UPGRADE 1: Allows inline HTML attributes (onmouseover, onmouseout, etc.) to execute safely
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // 🛠️ KEY UPGRADE 2: Prevents third-party library script block initialisation failures
        "https://api.mapbox.com",
        "https://*.mapbox.com",
        "https://cdn.jsdelivr.net",
        "https://js.stripe.com",
      ],
      frameSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
        "https://fonts.googleapis.com",
      ],
      // 🛠️ KEY UPGRADE 3: Added broad fallbacks ("https:", "data:") so fonts download completely without blocking
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https:", "data:"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
      ],
      connectSrc: [
        "'self'",
        "blob:", // 🛠️ KEY UPGRADE 4: Allows dynamic Mapbox canvas object streams
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://cdn.jsdelivr.net",
        "https://*.mapbox.com",
        "https://api.stripe.com",
        "ws://127.0.0.1:*",
        "ws://localhost:*",
      ],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
    },
  }),
);

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api/*any", limiter); // Scaled route prefix matcher for Express 5 compatibility

// Stripe Webhook Endpoint (Must receive unparsed raw body buffer)
app.post(
  "api/v1/bookings/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout,
);

//======================================================================
// ⚙️ STRIPE WEBHOOK ENHANCED UN-PARSED RAW BUFFER PARSER MATRIX
//======================================================================

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: "10kb",
    // Capture the absolute unparsed raw binary stream buffer before *any* middleware touches it
    verify: (req: Request, res: Response, buf: Buffer) => {
      if (req.originalUrl.startsWith("/api/v1/bookings/webhook-checkout")) {
        (req as any).rawBody = buf;
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Express 5 compatibility Adapter
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.query) {
    Object.defineProperty(req, "query", {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // 🔒 Activated security layer

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuality",
      "ratingsAverage", // 🛠️ Enhancement: Added to support filtering by ratings
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// Compress our text-based API/View responses
app.use(compression());

// Test middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mounted Routes
app.use("/", viewRouter);
app.use("/api/v1/trips", tripRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// SILENCING CHROME DEVTOOLS REQUEST
app.get(
  "/.well-known/appspecific/com.chrome.devtools.json",
  (req: Request, res: Response) => {
    res.status(204).end();
  },
);

// SILENCE ROOT FAVICON 404 LOG ERRORS
app.get("/favicon.ico", (req: Request, res: Response) => {
  res.status(204).end();
});

// Catch-All Unmatched Routes
app.all("/*any", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
