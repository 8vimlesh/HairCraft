import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth";

// Check if Firebase configs are provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

const isMockMode = 
  import.meta.env.VITE_MOCK_AUTH === "true" || 
  !isFirebaseConfigured;

let app;
let auth;

if (!isMockMode) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Auth:", error);
  }
}

export const getFirebaseAuth = () => auth;

/**
 * Sends OTP to the given phone number.
 * @param {string} phoneNumber Format: +919999999999
 * @param {string} recaptchaContainerId DOM element ID for Recaptcha
 * @returns {Promise<any>} Confirmation result or mock confirmation object
 */
export const sendOtp = async (phoneNumber, recaptchaContainerId) => {
  if (isMockMode) {
    console.log(`[MOCK AUTH] Sending verification OTP to ${phoneNumber}`);
    return {
      isMock: true,
      phoneNumber,
      confirm: async (verificationCode) => {
        if (verificationCode === "123456") {
          console.log("[MOCK AUTH] Verification code matched!");
          return {
            user: {
              phoneNumber,
              uid: "mock-uid-customer-" + phoneNumber.replace(/\+/g, ""),
              getIdToken: async () => `mock-customer-token-${phoneNumber}`
            }
          };
        } else {
          throw new Error("Invalid verification code. Use 123456.");
        }
      }
    };
  }

  try {
    const el = document.getElementById(recaptchaContainerId);
    if (!el) {
      throw new Error(`Recaptcha container #${recaptchaContainerId} not found in DOM`);
    }
    
    // Clear container to avoid duplicate widgets
    el.innerHTML = "";
    
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        // Response expired
      }
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending SMS OTP:", error);
    throw error;
  }
};

/**
 * Owner Mock/Real authentication
 * @param {string} phoneNumber 
 * @param {string} recaptchaContainerId 
 * @returns {Promise<any>}
 */
export const sendOwnerOtp = async (phoneNumber, recaptchaContainerId) => {
  if (isMockMode) {
    console.log(`[MOCK AUTH] Sending owner OTP to ${phoneNumber}`);
    return {
      isMock: true,
      phoneNumber,
      confirm: async (verificationCode) => {
        if (verificationCode === "123456") {
          return {
            user: {
              phoneNumber,
              uid: "mock-uid-owner",
              getIdToken: async () => `mock-owner-token-${phoneNumber}`
            }
          };
        } else {
          throw new Error("Invalid code. Use 123456.");
        }
      }
    };
  }
  
  return await sendOtp(phoneNumber, recaptchaContainerId);
};