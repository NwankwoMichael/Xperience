import axios from "axios";
import { showAlert } from "./alerts";

/**
 *
 * Dispatches an administrative review deletion command directly to the backend API REST endpoint
 * @param id The 24-character MongoDB Review deletion object identifier string
 */
export const executeReviewMutation = async (id: string): Promise<boolean> => {
  try {
    // Utilize the generic delete factory route seamlessly
    const res = await axios({
      method: "DELETE",
      url: `/api/v1/reviews/${id}`,
    });

    if (res.status === 204 || (res.data && res.data.status === "success")) {
      return true;
    }
    return false;
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || "Review moderation failed.";
    showAlert("error", errorMsg);
    return false;
  }
};
