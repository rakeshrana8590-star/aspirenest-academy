import {
  httpsCallable,
} from "firebase/functions";

export const USERNAME_AVAILABILITY_FUNCTION_NAME =
  "checkUsernameAvailability";

const cleanString = (value = "") =>
  String(value ?? "").trim();

export const createFirebaseUsernameAvailabilityCall = ({
  functionsInstance = null,
  callableFactory = httpsCallable,
  functionName =
    USERNAME_AVAILABILITY_FUNCTION_NAME,
} = {}) => {
  if (!functionsInstance) {
    throw new TypeError(
      "Canonical Firebase Functions instance is required."
    );
  }

  let callable = null;
  return async ({ username = "" } = {}) => {
    const cleanUsername = cleanString(username);
    if (!cleanUsername) {
      return Object.freeze({
        available: false,
      });
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 10000 }
      );
    }

    const response = await callable({
      username: cleanUsername,
    });
    return Object.freeze({
      available:
        response?.data?.available === true,
    });
  };
};
