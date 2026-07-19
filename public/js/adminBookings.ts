import axios from "axios";
import { showAlert } from "./alerts";

/**
 *
 * Dispatches an administrative booking deletion command directly to the backend API endpoint
 * @param id  The 24-character MongoDB Booking object identifier string
 */
export const executeBookingMutation = async (id: string): Promise<boolean> => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `/api/v1/bookings/${id}`,
    });

    if (res.status === 204 || (res.data && res.data.status === "success")) {
      return true;
    }
    return false;
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message || "Booking revocation failed.";
    showAlert("error", errorMsg);
    return false;
  }
};
