import axios from "axios";
import { showAlert } from "./alerts";

// INTERFACE FOR THE SIGNUP REQUEST BODY PAYLOAD
export interface SignupBody {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
}

/**
 * Dispatches an account registration submission request to the backend API directory matrix
 * @param body Strongly-typed structured user collection payload values
 */
export const signup = async (body: SignupBody): Promise<void> => {
  try {
    const { name, email, password, passwordConfirm, role } = body;

    // Dispatches network payload cleanly across relative browser origin tunnels
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        passwordConfirm,
        role,
      },
    });

    if (res.data.status === "success") {
      // Display personalized Xperience onboarding success alert banner frame
      showAlert(
        "success",
        "Welcome to Xperience! Your registration was successful!",
      );

      // Clear structural browser input elements safely
      const signupForm = document.querySelector(
        ".form--signup",
      ) as HTMLFormElement | null;
      if (signupForm) signupForm.reset();

      // Initiate a temporary timeout sequence so your traveler has ample time to read the status bar
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err: any) {
    // Robust fallbacks parse precise errors without risking blank feedback notifications
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      "Registration failed. Please check your credentials.";

    console.error("🕵️ XPERIENCE FRONTEND SIGNUP EXCEPTION:", errorMessage);
    showAlert("error", errorMessage);
  }
};
