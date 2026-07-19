import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Initiates the checkout flow by generating a Stripe session and redirecting the client
 * @param tripId The 24-character Mongoose Trip object ID string
 * @param stripePublicKey The backend-provided public key string from your environment
 */
export const bookTrip = async (
  tripId: string,
  stripePublicKey: string,
): Promise<void> => {
  try {
    // Access the global Stripe loader cleanly without unsafe mutations
    const StripeFunc = window.Stripe;

    // Guard clause against slow CDN execution threads or script block timeouts
    if (!StripeFunc) {
      throw new Error(
        "Stripe script failed to load from CDN! Check your internet connection.",
      );
    }

    // Initialize Stripe dynamically using the passed public key variable matrix
    const stripe = StripeFunc(stripePublicKey);

    // Get checkout session from the updated Express 5 endpoint path prefix
    const res = await axios(`/api/v1/bookings/checkout-session/${tripId}`);

    // Create checkout form + charge credit card + redirect user to Stripe's secure payment overlay screen
    const result = await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (err: unknown) {
    console.error("💥 XPERIENCE TRANSACTION GATEWAY EXCEPTION:", err);

    // Safely extract error message string properties to display alert banner natively
    if (isAxiosError(err) && err.response?.data) {
      showAlert(
        "error",
        err.response.data.message ||
          "Checkout transaction initialization failed.",
      );
    } else if (err instanceof Error) {
      showAlert("error", err.message);
    } else {
      showAlert(
        "error",
        "An unexpected error occurred during transactional preparation.",
      );
    }
  }
};
