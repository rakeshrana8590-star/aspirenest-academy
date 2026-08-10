import {
  httpsCallable,
} from "firebase/functions";

export const STUDENT_PROFILE_ENSURE_FUNCTION_NAME =
  "ensureStudentProfile";

const PUBLIC_FAILURE =
  "Account profile could not be prepared.";

export const createFirebaseStudentProfileEnsure = ({
  functionsInstance = null,
  callableFactory = httpsCallable,
  functionName =
    STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
} = {}) => {
  if (!functionsInstance) {
    throw new TypeError(
      "Canonical Firebase Functions instance is required."
    );
  }

  if (typeof callableFactory !== "function") {
    throw new TypeError(
      "Firebase callable factory is required."
    );
  }

  let callable = null;

  return async () => {
    try {
      if (!callable) {
        callable = callableFactory(
          functionsInstance,
          functionName,
          { timeout: 15000 }
        );
      }

      const response =
        await callable({});

      if (
        response?.data?.prepared ===
          true
      ) {
        return Object.freeze({
          prepared: true,
        });
      }
    } catch (_) {
      // Public contract stays neutral.
    }

    return Object.freeze({
      error:
        PUBLIC_FAILURE,
    });
  };
};
