import axios from "axios";
import { showAlert } from "./alerts";

/**
 * Executes a REST APO network mutation tracking call directly to the Express 5 controllers
 */
export const executeTripMutation = async (
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  data?: any,
): Promise<boolean> => {
  try {
    const res = await axios({
      method,
      url,
      data,
      headers:
        method !== "DELETE" ? { "Content-Type": "application/json" } : {},
    });

    if (res.data.status === "success" || res.status === 204) {
      return true;
    }
    return false;
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.message || "Warehouse inventory mutation failed.";
    showAlert("error", errorMsg);
    return false;
  }
};
