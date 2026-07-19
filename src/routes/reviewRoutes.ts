import express from "express";
import * as authController from "../controllers/authController";
import * as reviewController from "../controllers/reviewController";

// 🔄 MERGE PARAMS: Captures the incoming :tripId parameter from your parent tripRoutes.ts configuration
const router = express.Router({ mergeParams: true });

// PROTECT MATRIX: All review activity requires an authenticated login session
router.use(authController.protect);

// STANDARD BASE & NESTED ENDPOINTS MATRIX
router.route("/").get(reviewController.getAllReviews).post(
  authController.restrictTo("user"),
  reviewController.restrictToExperiencedBookers,
  reviewController.setTripUserIds, // 🔄 Upgraded parameter binding hook for Xperience
  reviewController.createReview,
);

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview,
  );

export default router;
