import axios from "axios";
import { showAlert } from "./alerts";

/**
 * Dispatches administrative profile update commands directly to the user collection REST endpoints
 * @param userId the 24-character MongoDB User object identifier string
 * @param payload key-value configuration layout modifiers (role or active attributes)
 */

export const executeUserMutation = async (
  userId: string,
  payload: { role?: string; active?: boolean },
): Promise<boolean> => {
  try {
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/users/${userId}`,
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      return true;
    }
    return false;
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message ||
      "Administrative profile modification failed.";
    showAlert("error", errorMsg);
    return false;
  }
};
