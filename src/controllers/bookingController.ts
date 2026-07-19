import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import { User } from "../models/userModel";
import { Trip } from "../models/tripModel";
import { Booking } from "../models/bookingModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";

// INITIALIZE STRIPE SECURELY WITH YOUR ENVIRONMENT SECRET KEY CONFIG MATRIX
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "dummy_key_placeholder",
);

// STRIPE CHECKOUT SESSION GENERATOR HANDLER
export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch the target trip document based on route params ID context
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) return next(new AppError("No trip found with that ID", 404));

    // Force the tripId parameters to resolve as a strict string literal
    const tripIdParam = String(req.params.tripId);

    // Generate the secure checkout session config stream via Stripe API
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      // LIVE PRODUCTION STANDARD PATHWAY:
      success_url: `${req.protocol}://${req.get("host")}/my-trips?alert=booking`,
      cancel_url: `${req.protocol}://${req.get("host")}/trip/${trip.slug}`,
      customer_email: req.user!.email,
      client_reference_id: tripIdParam,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: trip.price * 100,
            product_data: {
              name: `${trip.name} Trip`,
              description: trip.summary,
              // images: [`https://xperience.dev{trip.imageCover}`],
            },
          },
          quantity: 1,
        },
      ],
    } as any);

    // Dispatch checkout session context payload parameters state straight back to client
    res.status(200).json({
      status: "success",
      session,
    });
  },
);

// TEMPORARY INLINE CHECKOUT COMPLETION HANDLER FOR DEVELOPMENT (PUG INTEGRATION FALLBACK)
export const createBookingCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { trip, user, price } = req.query;

    if (!trip || !user || !price) return next();

    // Create the booking document tracking matrix item manually out of query parameters
    await Booking.create({
      trip: String(trip),
      user: String(user),
      price: Number(price),
    });

    // Strip out the transactional metrics from the browser address bar for security
    res.redirect(req.originalUrl.split("?")[0]);
  },
);

// PRIVATE HELPER FUNCTION TO HANDLE WRITING THE BOOKING LEDGER DIRECTLY IN MONGODB
const createBookingCheckoutDirect = async (session: any): Promise<void> => {
  const trip = session.client_reference_id;

  // Fall back to customer_details if customer_email returns undefined
  const userEmail = session.customer_email || session.customer_details?.email;

  if (!userEmail) {
    console.warn(
      "⚠️ WEBHOOK WARNING: No customer email address detected inside Stripe session data payload.",
    );
    return;
  }
  const user = (await User.findOne({ email: userEmail }))?._id;
  const price = session.amount_total / 100; // Convert cents to base currency decimals

  // Ensure trip ID is a valid ObjectId structure to prevent runtime errors
  const isValidObjectId = mongoose.Types.ObjectId.isValid(trip);

  if (trip && user && isValidObjectId) {
    await Booking.create({ trip, user, price });
    console.log(
      "✨ WEBHOOK SUCCESS: Booking ledger saved to MongoDB database cleanly!",
    );
  } else {
    console.warn(
      "⚠️ WEBHOOK WARNING: Booking skipped. Missing IDs or client_reference_id is an invalid ObjectId.",
    );
  }
};

// THE SECURE BACKGROUND STRIPE WEBHOOK HANDLER
export const webhookCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      // Reference the explicit raw binary buffer stream layer safely
      const rawBodyBuffer = (req as any).rawBody || req.body;

      // Cryptographically verify that this request came directly from Stripe's official servers
      event = stripe.webhooks.constructEvent(
        rawBodyBuffer,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err: any) {
      console.error("💥 Stripe Webhook Verification Failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Intercept the specific payment completion signal event
    if (event.type === "checkout.session.completed") {
      await createBookingCheckoutDirect(event.data.object);
    }

    // Always return a 200 ok status directly to Stripe to acknowledge receipt
    res.status(200).json({ received: true });
  },
);

// AUTOMATED FACTORY LEDGER ADMIN CRUD HANDLERS
export const createBooking = factory.createOne(Booking);
export const getBooking = factory.getOne(Booking);
export const getAllBookings = factory.getAll(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
