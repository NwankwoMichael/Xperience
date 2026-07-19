import express from "express";
import * as tripController from "../controllers/tripController";
import * as authController from "../controllers/authController";
import reviewRouter from "./reviewRoutes";

const router = express.Router();

// 🔄 NESTED ROUTE: Redirects nested review creation requests to the review router
router.use("/:tripId/reviews", reviewRouter);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tripController.getMonthlyPlan,
  );

// Special Alias Routes
router
  .route("/top-5-cheap")
  .get(tripController.aliasTopTrips, tripController.getAllTrips);

// Aggregation Analytics Open Data Pipelines
router.route("/trip-stats").get(tripController.getTripStats);

// Geospatial Routing Engine
router
  .route("/trips-within/:distance/center/:latlng/unit/:unit")
  .get(tripController.getTripsWithin);

router.route("/distances/:latlng/unit/:unit").get(tripController.getDistances);

router
  .route("/")
  .get(tripController.getAllTrips)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tripController.createTrip,
  );

// STANDARD LOOKUP PARAMETER CATCHER
router
  .route("/:id")
  .get(tripController.getTrip)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tripController.uploadTripImages,
    tripController.resizeTripImages,
    tripController.updateTrip,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tripController.deleteTrip,
  );

export default router;
