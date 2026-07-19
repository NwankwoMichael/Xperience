import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { signup } from "./signup";
import { forgotPassword, resetPassword } from "./retrievePassword";
import { createReview } from "./review";
import { updateSettings } from "./updateSettings";
import { bookTrip } from "./stripe";
import { showAlert } from "./alerts";
import { executeTripMutation } from "./adminTrips";
import { executeUserMutation } from "./adminUsers";
import { executeReviewMutation } from "./adminReviews";
import { executeBookingMutation } from "./adminBookings";

// DOM ELEMENTS SELECTION MATRIX WITH EXPLICIT TYPES
const mapBox = document.getElementById("map") as HTMLDivElement | null;
const loginForm = document.querySelector(
  ".form--login",
) as HTMLFormElement | null;
const signupForm = document.querySelector(
  ".form--signup",
) as HTMLFormElement | null;
const logoutBtn = document.querySelector(
  ".nav__el--logout",
) as HTMLAnchorElement | null;
const userUpdateForm = document.querySelector(
  ".form-user-data",
) as HTMLFormElement | null;
const userPasswordForm = document.querySelector(
  ".form-user-settings",
) as HTMLFormElement | null;
const bookBtn = document.getElementById(
  "book-trip",
) as HTMLButtonElement | null; // 🔄 Upgraded ID tracker
const forgotForm = document.querySelector(
  ".form--forgot-password",
) as HTMLFormElement | null;
const resetForm = document.querySelector(
  ".form--reset-password",
) as HTMLElement | null;
const reviewForm = document.querySelector(
  ".form--review",
) as HTMLFormElement | null;

// DOM SELECTION STRINGS IDENTIFIERS FOR ADMIN TRIP PANEL
const createTrigger = document.getElementById("btn-trigger-create-modal");
const modalOverlay = document.getElementById("admin-trip-modal");
const modalClose = document.getElementById("modal-close-trigger");
const modalForm = document.getElementById(
  "form-admin-trip-operation",
) as HTMLFormElement | null;
const modalTitle = document.getElementById("modal-title-context");
const tripTable = document.querySelector(".admin-table--trips");

// DOM LAYOUT ELEMENT STRUCTURAL SELECTION FOR ADMIN USER MANAGEMENT
const userTable = document.querySelector(".admin-table--users");
const userModal = document.getElementById("admin-user-modal");
const userModalClose = document.getElementById("user-modal-close-trigger");
const userForm = document.getElementById(
  "form-admin-user-operation",
) as HTMLFormElement | null;

// EXPAND SELECTORS FOR REVIEWS AND BOOKINGS TABLE INTERCEPTORS
const reviewsTable = document.querySelector(".admin-table--reviews");
const bookingsTable = document.querySelector("admin-table-bookings");

// OPERATIONAL STATE FIELD RECREATORS FOR ADMIN PANEL
const formId = document.getElementById(
  "form-trip-id",
) as HTMLInputElement | null;
const nameInput = document.getElementById(
  "trip-name",
) as HTMLInputElement | null;
const durationInput = document.getElementById(
  "trip-duration",
) as HTMLInputElement | null;
const sizeInput = document.getElementById(
  "trip-size",
) as HTMLInputElement | null;
const priceInput = document.getElementById(
  "trip-price",
) as HTMLInputElement | null;
const difficultyInput = document.getElementById(
  "trip-difficulty",
) as HTMLSelectElement | null;
const summaryInput = document.getElementById(
  "trip-summary",
) as HTMLInputElement | null;
const descriptionInput = document.getElementById(
  "trip-description",
) as HTMLInputElement | null;

// FORM INPUT FIELDS SELECTOR FOR ADMINUSER PANEL
const formUserId = document.getElementById(
  "form-user-id",
) as HTMLInputElement | null;
const formUserName = document.getElementById(
  "user-name",
) as HTMLInputElement | null;
const formUserEmail = document.getElementById(
  "user-email",
) as HTMLInputElement | null;
const formUserRole = document.getElementById(
  "user-role",
) as HTMLSelectElement | null;
const formUserStatus = document.getElementById(
  "user-status",
) as HTMLSelectElement | null;
// ==========================================
// 🧭 ACTION EVENT DELEGATIONS
// ==========================================

// 🗺️ MAPBOX INITIATOR
if (mapBox) {
  if (typeof (window as any)["mapboxgl"] !== "undefined") {
    const locationsData = mapBox.dataset.locations || "[]";
    const mapboxToken = mapBox.dataset.mapboxToken || "";
    const locations = JSON.parse(locationsData);
    displayMap(locations, mapboxToken);
  } else {
    console.error("💥 Critical Error: Mapbox script not loaded from CDN");
  }
}

// 👤 ATTACH SIGNUP ACTION LISTENER
if (signupForm) {
  signupForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const nameEl = document.getElementById("name") as HTMLInputElement | null;
    const emailEl = document.getElementById("email") as HTMLInputElement | null;
    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;
    const passwordConfirmEl = document.getElementById(
      "password-confirm",
    ) as HTMLInputElement | null;
    const roleEl = document.getElementById("role") as HTMLInputElement | null;

    if (nameEl && emailEl && passwordEl && passwordConfirmEl) {
      try {
        const body = {
          name: nameEl.value,
          email: emailEl.value,
          password: passwordEl.value,
          passwordConfirm: passwordConfirmEl.value,
          role: roleEl ? roleEl.value : "user",
        };

        console.log("🔄 Communicating with registration API...");
        await signup(body);
        console.log("✨ Account creation lifecycle complete!");
      } catch (error) {
        console.error("💥 CRITICAL FRONTEND BREAKDOWN:", error);
      }
    } else {
      console.error(
        "❌ Critical Error: One or more registration DOM fields are missing!",
      );
    }
  });
}

// 🔐 USER LOGIN FORM SUBMISSION INTERCEPTOR
if (loginForm) {
  loginForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const emailEl = document.getElementById("email") as HTMLInputElement | null;
    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;

    if (emailEl && passwordEl) {
      await login(emailEl.value, passwordEl.value);
    }
  });
}

// 🔓 USER LOGOUT ACTION TRIGGER
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    await logout();
  });
}

// 🖼️ PROFILE METRICS UPDATE FORM INTERCEPTOR (Multer Data Layer Processing)
if (userUpdateForm) {
  userUpdateForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const form = new FormData();
    const nameInput = document.getElementById(
      "name",
    ) as HTMLInputElement | null;
    const emailInput = document.getElementById(
      "email",
    ) as HTMLInputElement | null;
    const photoInput = document.getElementById(
      "photo",
    ) as HTMLInputElement | null;

    if (nameInput) form.append("name", nameInput.value);
    if (emailInput) form.append("email", emailInput.value);
    if (photoInput && photoInput.files && photoInput.files[0]) {
      form.append("photo", photoInput.files[0]);
    }

    await updateSettings(form, "data");
  });
}

// 🔑 ACCOUNT PASSWORD MODIFICATION SUBMISSION INTERCEPTOR
if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const savePasswordBtn = document.querySelector(
      ".btn--save-password",
    ) as HTMLButtonElement | null;

    if (savePasswordBtn) savePasswordBtn.textContent = "Updating...";

    const passwordCurrent = (
      document.getElementById("password-current") as HTMLInputElement
    ).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const passwordConfirm = (
      document.getElementById("password-confirm") as HTMLInputElement
    ).value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password",
    );

    if (savePasswordBtn) savePasswordBtn.textContent = "Save password";
    userPasswordForm.reset();
  });
}

// 💳 STRIPE BILLING TRANSACTION REDIRECT TRIGGER
if (bookBtn) {
  bookBtn.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLButtonElement;
    target.textContent = "Processing...";

    // 🔄 Dataset updated to target trip variables from your trip.pug markup
    const { tripId, stripePublicKey } = target.dataset;

    if (tripId && stripePublicKey) {
      bookTrip(tripId, stripePublicKey);
    } else {
      target.textContent = "Book trip now!";
      showAlert("error", "Missing critical checkout parameter data.");
    }
  });
}

// 📨 FORGOT PASSWORD SUBMISSION INTERCEPTION
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const emailEl = document.getElementById("email") as HTMLInputElement | null;

    if (emailEl) {
      await forgotPassword(emailEl.value);
      forgotForm.reset();
    }
  });
}

// 🔄 RESET PASSWORD SUBMISSION INTERCEPTOR
if (resetForm) {
  resetForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const token = resetForm.dataset.token || "";
    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;
    const passwordConfirmEl = document.getElementById(
      "password-confirm",
    ) as HTMLInputElement | null; // 🛠️ Fixed duplication typo hook

    if (passwordEl && passwordConfirmEl && token) {
      const body = {
        password: passwordEl.value,
        passwordConfirm: passwordConfirmEl.value,
      };
      await resetPassword(token, body);
    } else {
      showAlert(
        "error",
        "Critical initialization failure: Token metadata missing.",
      );
    }
  });
}

// ✍️ TRIP FEEDBACK REVIEW FORM SUBMISSION HANDLER
if (reviewForm) {
  reviewForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    // Extract the dataset parameters we bound to the pug form tag element
    const tripId = reviewForm.dataset.tripId || "";
    const ratingEl = document.getElementById(
      "review-rating",
    ) as HTMLSelectElement | null;
    const textEl = document.getElementById(
      "review-text",
    ) as HTMLTextAreaElement | null;

    if (tripId && ratingEl && textEl) {
      const saveBtn = reviewForm.querySelector(
        "button",
      ) as HTMLButtonElement | null;

      if (saveBtn) saveBtn.textContent = "Saving Review...";

      // Dispatch the background Axios call right to the protect Rest endpoint
      await createReview(tripId, textEl.value, +ratingEl.value);

      if (saveBtn) saveBtn.textContent = "Submit Review";
      reviewForm.reset();
    } else {
      showAlert("error", "Failed to compile review payload parameters.");
    }
  });
}

// OPEN MODAL FOR NEW INJECTIONS
if (createTrigger && modalOverlay && modalForm && modalTitle && formId) {
  createTrigger.addEventListener("click", () => {
    modalForm.reset();
    formId.value = "";
    modalTitle.textContent = "Setup New Adventure Item 🗺️";
    modalOverlay.style.display = "flex";
  });
}

// CLOSE MODAL OVERLAYS
if (modalClose && modalOverlay) {
  modalClose.addEventListener("click", () => {
    modalOverlay.style.display = "none";
  });
}

// EVENT DELEGATION: INTERCEPT TABLE ACTION (EDIT / DELETE)
if (
  tripTable &&
  modalOverlay &&
  modalTitle &&
  formId &&
  nameInput &&
  durationInput &&
  sizeInput &&
  priceInput &&
  difficultyInput &&
  summaryInput &&
  descriptionInput
) {
  tripTable.addEventListener("click", async (e: Event) => {
    const target = e.target as HTMLButtonElement;
    if (!target || target.tagName !== "BUTTON") return;

    const { action, id, name, trip } = target.dataset;

    // SCENARIO A: Trigger Context Modal Overwrite (EDIT state pre-population)
    if (action === "edit" && trip) {
      const data = JSON.parse(trip);
      formId.value = data._id || data.id;
      nameInput.value = data.name || "";
      durationInput.value = data.duration || "";
      sizeInput.value = data.maxGroupSize || "";
      priceInput.value = data.price || "";
      difficultyInput.value = data.difficulty || "easy";
      summaryInput.value = data.summary || "";
      descriptionInput.value = data.description || "";

      modalTitle.textContent = `Modify Itenerary: ${data.name} 📝`;
      modalOverlay.style.display = "flex";
    }

    // SCENARIO B: Destructive flush Purges(DELETE pipeline command)
    if (action === "delete" && id && name) {
      if (
        confirm(
          `⚠️ Warning: Are you absolutely certain you want to permanently delete this package: ${name} from your active product line? This action is irreversible.`,
        )
      ) {
        target.textContent = "Purging...";
        const success = await executeTripMutation(
          "DELETE",
          `/api/v1/trips/${id}`,
        );

        if (success) {
          showAlert(
            "success",
            "Adventure pack successfully flushed from warehouse inventory!",
          );
          window.setTimeout(() => {
            location.reload();
          }, 1000);
        } else {
          target.textContent = "Delete";
        }
      }
    }
  });
}

// SUBMIT FORM PROCESSOR (CREATES OR UPDATES DATA PATHS DYNAMICALLy)
if (
  modalForm &&
  formId &&
  nameInput &&
  durationInput &&
  sizeInput &&
  priceInput &&
  difficultyInput &&
  summaryInput &&
  descriptionInput &&
  modalOverlay
) {
  modalForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const submitBtn = document.getElementById(
      "btn-modal-submit",
    ) as HTMLButtonElement | null;

    if (submitBtn) submitBtn.textContent = "synchronizing...";

    const payload = {
      name: nameInput.value,
      duration: +durationInput.value,
      maxGroupSize: +sizeInput.value,
      price: +priceInput.value,
      difficulty: difficultyInput.value,
      summary: summaryInput.value,
      description: descriptionInput.value,
    };

    const isUpdate = formId.value !== "";
    const method = isUpdate ? "PATCH" : "POST";
    const url = isUpdate ? `/api/v1/trips/${formId.value}` : "/api/v1/trips";

    const success = await executeTripMutation(method, url, payload);
    if (success) {
      showAlert(
        "success",
        isUpdate
          ? "Itenerary modifications saved!"
          : "Brand new adventure package registered!",
      );
      window.setTimeout(() => {
        location.reload();
      }, 1200);
    } else {
      if (submitBtn) submitBtn.textContent = "Save Adventure Pack";
    }
  });
}

// EVENT DELEGATION: INTERCEPT TABLE MUTATION TRIGGERS
if (
  userTable &&
  userModal &&
  formUserId &&
  formUserName &&
  formUserEmail &&
  formUserRole &&
  formUserStatus
) {
  userTable.addEventListener("click", async (e: Event) => {
    const target = e.target as HTMLButtonElement;
    if (!target || target.tagName !== "BUTTON") return;

    const { action, id, name, active, user } = target.dataset;

    // SCENARIO A: POPULATE & INITIALIZE EDIT STATE OVERLAY PORTAL
    if (action === "edit-user" && user) {
      const data = JSON.parse(user);

      formUserId.value = data._id || data.id;
      formUserName.value = data.name || "Unknown User";
      formUserEmail.value = data.email || "";
      formUserRole.value = data.role || "user";
      formUserStatus.value = data.active !== false ? "true" : "false";

      userModal.style.display = "flex";
    }

    // SCENARIO B: FAST INLINE TOGGLE FOR STATUS SUSPENSIONS
    if (action === "toggle-status" && id && name && active) {
      const isCurrentlyActive = active === "true";
      const promptText = isCurrentlyActive
        ? `Are you certain you want to SUSPEND the account of "${name}"? They will be locked out of platform functionalities instantly.`
        : `Are you certain you want to ACTIVATE the account of "${name}"? Their portal permissions will be restored completely.`;

      if (confirm(promptText)) {
        target.textContent = "Updating...";

        // Execute mutation payload
        const success = await executeUserMutation(id, {
          active: !isCurrentlyActive,
        });

        if (success) {
          showAlert(
            "success",
            `Security access profile for "${name}" updated successfully.`,
          );
        } else {
          target.textContent = "Modify Status";
        }
      }
    }
  });
}

// DISMISS PROFILE MODAL FRAMES
if (userModalClose && userModal) {
  userModalClose.addEventListener("click", () => {
    userModal.style.display = "none";
  });
}

// SECURE FORM PROCESSING DELEGATION LINK
if (userForm && formUserId && formUserRole && formUserStatus && userModal) {
  userForm.addEventListener("submit", async (e: Event) => {
    // Force the browser to completely freeze anchor fragments from leaking!
    e.preventDefault();
    e.stopPropagation();

    const submitBtn = document.getElementById(
      "btn-user-modal-submit",
    ) as HTMLButtonElement | null;
    if (submitBtn) submitBtn.textContent = "Synchronizing credentials...";

    const userId = formUserId.value;
    const payload = {
      role: formUserRole.value,
      active: formUserStatus.value === "true",
    };

    const success = await executeUserMutation(userId, payload);

    if (success) {
      showAlert(
        "success",
        `User profile directory permissions saved successfully.`,
      );
      userModal.style.display = "none";
      window.setTimeout(() => {
        location.reload();
      }, 1200);
    } else {
      if (submitBtn) submitBtn.textContent = "Save Profile Metrics";
    }
  });
}

// ========================================================================
// ✍️ ADMINISTRATIVE REVIEWS MODERATION EVENT HANDLER
// ========================================================================
if (reviewsTable) {
  reviewsTable.addEventListener("click", async (e: Event) => {
    const target = e.target as HTMLButtonElement;
    if (!target || target.tagName !== "BUTTON") return;
    const { action, id } = target.dataset;

    if (action === "delete-review" && id) {
      if (
        confirm(
          "🚨 Administrative Action: Are you absolutely certain you want to permanently delete and purge this customer review text from your database registry?",
        )
      ) {
        const originalText = target.textContent;
        target.textContent = "Purging...";

        // Call external API module function cleanly
        const success = await executeReviewMutation(id);
        if (success) {
          showAlert(
            "success",
            `User review successfully dropped from system registry.`,
          );
          window.setTimeout(() => {
            location.reload();
          }, 1000);
        } else {
          // Reset button layout state if it falls back to an exception error
          target.textContent = originalText;
        }
      }
    }
  });
}

//======================================================================
// 💳 ADMINISTRATIVE BOOKINGS REVOCATION EVENT HANDLER
//======================================================================
if (bookingsTable) {
  bookingsTable.addEventListener("click", async (e: Event) => {
    const target = e.target as HTMLButtonElement;
    if (!target || target.tagName !== "BUTTON") return;

    const { action, id } = target.dataset;

    if (action === "delete-booking" && id) {
      if (
        confirm(
          "🚨 Critical Revocation: Are you certain you want to revoke this transaction receipt? The customer will instantly lose exploration clearance permissions for this itinerary.",
        )
      ) {
        const originalText = target.textContent;
        target.textContent = "Revoking...";

        // Call external API module function cleanly
        const success = await executeBookingMutation(id);

        if (success) {
          showAlert("success", "Booking receipt successfully invalidated.");
          window.setTimeout(() => {
            location.reload();
          }, 1000);
        } else {
          // Reset button state layout if it falls back to exception error
          target.textContent = originalText;
        }
      }
    }
  });
}

// ==========================================
// 💳 INBOUND WEBHOOK ALERTS INTERCEPTOR
// ==========================================
const bodyElement = document.querySelector("body") as HTMLBodyElement | null;
const alertMessage = bodyElement?.dataset.alert;

if (alertMessage) {
  // Uses your type-locked alert engine to display a persistent 20-second success banner
  showAlert("success", alertMessage, 20);
}
