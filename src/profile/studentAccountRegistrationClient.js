import {
  httpsCallable,
} from "firebase/functions";

export const STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME =
  "registerStudentAccount";

export const STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE =
  "Account could not be created.";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const failure = () =>
  Object.freeze({
    error:
      STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE,
  });

export const createFirebaseStudentAccountRegistration = ({
  functionsInstance = null,
  callableFactory = httpsCallable,
  functionName =
    STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME,
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

  return async ({
    fullName = "",
    username = "",
    email = "",
    password = "",
  } = {}) => {
    const cleanFullName =
      cleanString(fullName);
    const cleanUsername =
      cleanString(username);
    const cleanEmail =
      normalizeEmail(email);
    const rawPassword =
      String(password ?? "");

    if (
      !cleanFullName
      || !cleanUsername
      || !cleanEmail
      || !rawPassword
    ) {
      return failure();
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 20000 }
      );
    }

    try {
      const response =
        await callable({
          fullName:
            cleanFullName,
          username:
            cleanUsername,
          email:
            cleanEmail,
          password:
            rawPassword,
        });

      if (
        response?.data?.prepared !==
        true
      ) {
        return failure();
      }

      return Object.freeze({
        prepared: true,
      });
    } catch (_) {
      return failure();
    }
  };
};
