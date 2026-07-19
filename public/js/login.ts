import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Sends user credentials to the authentication API endpoint
 * @param email User email address string
 * @param password User plain text password string
 */
export const login = async (email: string, password: string): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      // Display personalized Xperience session validation success banner
      showAlert(
        "success",
        "Logged in successfully! Preparing your adventure board...",
      );

      // Infinite automated delay so user can read message
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err: unknown) {
    console.error("💥 XPERIENCE AUTHENTICATION EXCEPTION:", err);

    // Safe Axios checking
    if (isAxiosError(err) && err.response?.data) {
      showAlert("error", err.response.data.message);
    } else {
      showAlert(
        "error",
        "Network connection failed. Please check your terminal framework.",
      );
    }
  }
};

/**
 * Requests the server to invalidate the active JWT cookie session immediately
 */
export const logout = async (): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/logout",
    });

    if (res.data.status === "success") {
      showAlert("success", "Session cleared cleanly. Logging out...");

      // Redirect straight back to your modern login gateway
      window.setTimeout(() => {
        location.assign("/login");
      }, 1000);
    }
  } catch (err: unknown) {
    console.error("💥 XPERIENCE LOGOUT EXCEPTION:", err);
    showAlert("error", "Error logging out securely! Please try again.");
  }
};
