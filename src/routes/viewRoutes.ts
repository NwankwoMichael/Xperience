import express from "express";
import * as viewsController from "../controllers/viewController";
import * as authController from "../controllers/authController";

const router = express.Router();

// 🔄 WEBHOOK ALERTS MATRIX
// Runs at the very top to catch Stripe success alert queries before rendering views
router.use(viewsController.alerts);

// PUBLIC VIEW TEMPLATE ROUTES
router.get("/", authController.isLoggedIn, viewsController.getOverview);

// 🔄 Upgraded detailed item view route matching your new brand
router.get("/trip/:slug", authController.isLoggedIn, viewsController.getTrip);

router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);
router.get("/signup", authController.isLoggedIn, viewsController.getSignupForm);

// SECURED PRIVATE VIEW DASHBOARD ROUTES
router.get("/me", authController.protect, viewsController.getAccount);

// 🔄 Upgraded user booking panel route to reflect the Trip domain identity
router.get("/my-trips", authController.protect, viewsController.getMyTrips);

// SECURELY REGISTERS THE USER REVIEWS DASHBOARD PATH MAPPING
router.get("/my-reviews", authController.protect, viewsController.getMyReviews);

// PASSWORD RECOVERY WORKFLOW VIEW PATHS
router.get(
  "/forgot-password",
  authController.isLoggedIn,
  viewsController.getForgotPasswordForm,
);

router.get(
  "/reset-password/:token",
  authController.isLoggedIn,
  viewsController.getResetPasswordForm,
);

// HTML FORM LIFECYCLE ACTION SUBMISSIONS
router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updatedUserData,
);

// Manage trips route
router.get(
  "/manage-trips",
  authController.protect,
  authController.restrictTo("admin", "lead-guide"),
  viewsController.getManageTripDashboard,
);

// Manage users route
router.get(
  "/manage-users",
  authController.protect,
  authController.restrictTo("admin"),
  viewsController.getManageUsersDashboard,
);

// Manage review route
router.get(
  "/manage-reviews",
  authController.protect,
  authController.restrictTo("admin"),
  viewsController.getManageReviewsDashboard,
);

// Manage booking route
router.get(
  "/manage-bookings",
  authController.protect,
  authController.restrictTo("admin"),
  viewsController.getManageBookingsDashboard,
);

export default router;
