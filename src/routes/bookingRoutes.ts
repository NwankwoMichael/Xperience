import express from "express";
import * as bookingController from "../controllers/bookingController";
import * as authController from "../controllers/authController";

const router = express.Router();

// MOUNT VERIFICATION ALIGNMENT:
router.post("/webhook-checkout", bookingController.webhookCheckout);

// PROTECT MATRIX: All ledger actions require an authenticated login session
router.use(authController.protect);

// 🔄 TRANSACTION CHECKOUT ROUTE: Upgraded endpoint parameter for Xperience
router.get("/checkout-session/:tripId", bookingController.getCheckoutSession);

// RESTRICT ACCESS: System administration actions restricted to upper staff roles
router.use(authController.restrictTo("admin", "lead-guide"));

// SYSTEM ADMINISTRATIVE LEDGER MANAGEMENT ROUTES
router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

export default router;
