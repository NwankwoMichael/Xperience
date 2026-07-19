import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

// STRICT TYPES FOR TEXT-ONLY PROFILE UPDATE OPERATIONS
export interface IProfileUpdatePayload {
  name?: string;
  email?: string;
  passwordCurrent?: string;
  password?: string;
  passwordConfirm?: string;
}

/**
 * Sends profile modifications or password rotations securely to the backend user endpoints
 * @param data Strongly-typed object data payload or a FormData stream wrapper for multipart photo assets
 * @param type Context filter: "data" for profile updates or "password" for credential changes
 */
export const updateSettings = async (
  data: IProfileUpdatePayload | FormData,
  type: "data" | "password",
): Promise<void> => {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updateMyPassword"
        : "/api/v1/users/updateMe";

    // Detect if payload is a raw file data stream to handle content-type delegation correctly
    const isForm = data instanceof FormData;

    const res = await axios({
      method: "PATCH",
      url,
      data,
      // 🛠️ Let axios set boundaries automatically for FormData, explicitly bind JSON strings otherwise
      headers: isForm ? undefined : { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`,
      );

      // Force a brief delay so the user can read the success status banner cleanly before layout re-rendering
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err: unknown) {
    console.error(
      `💥 XPERIENCE SETTINGS UPDATE EXCEPTION (${type.toUpperCase()}):`,
      err,
    );

    // Safe Axios network trace inspection
    if (isAxiosError(err) && err.response?.data) {
      showAlert("error", err.response.data.message);
    } else {
      showAlert(
        "error",
        "Network synchronization failed. Please try again later.",
      );
    }
  }
};
