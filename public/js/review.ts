import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Submits user testimonial details and rating values to the nested trips database collection
 * @param tripId The 24-character Mongoose Trip object identifier string
 * @param review The narrative string testimonial text payload
 * @param rating Numeric score evaluation criteria integer (1 - 5)
 */
export const createReview = async (
  tripId: string,
  review: string,
  rating: number,
): Promise<void> => {
  try {
    // 🔄 Express 5 Nested Mapping Endpoint Alignment
    const res = await axios({
      method: "POST",
      url: `/api/v1/trips/${tripId}/reviews`,
      data: { review, rating },
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        "Thank you! Your feedback has been saved successfully.",
      );

      // Auto-reload active trip frame view to cleanly paint the newly submitted card layout
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err: unknown) {
    console.error("💥 XPERIENCE REVIEW FLOW EXCEPTION:", err);

    // 🛠️ Robust error readout extraction mapping values
    if (isAxiosError(err) && err.response?.data) {
      showAlert(
        "error",
        err.response.data.message ||
          "Review submission failed. Verify experience status parameters.",
      );
    } else {
      showAlert(
        "error",
        "Network execution timeout. Review submission failed.",
      );
    }
  }
};
