import {
  httpsCallable,
} from "firebase/functions";
import {
  auth,
  functions,
} from "../firebase";

export const MOCK_TEST_SERVER_TIME_FUNCTION_NAME =
  "getMockTestServerTime";

const cleanString = (value = "") =>
  String(value ?? "").trim();

export const createFirebaseMockTestServerTimeCall = ({
  authInstance = auth,
  functionsInstance = functions,
  callableFactory = httpsCallable,
  functionName =
    MOCK_TEST_SERVER_TIME_FUNCTION_NAME,
} = {}) => {
  let callable = null;

  return async ({
    purpose = "mock_test_attempt",
    testId = "",
  } = {}) => {
    const uid = cleanString(
      authInstance?.currentUser?.uid
    );

    if (!uid) {
      const error = new Error(
        "Verified login is required before requesting trusted server time."
      );
      error.code = "auth/unauthenticated";
      throw error;
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 10000 }
      );
    }

    return callable({
      purpose: cleanString(purpose),
      testId: cleanString(testId),
    });
  };
};

export const requestMockTestServerTime =
  createFirebaseMockTestServerTimeCall();
