import {
  signInWithCustomToken,
} from "firebase/auth";
import {
  httpsCallable,
} from "firebase/functions";

export const USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME =
  "signInWithUsernameAndPassword";

const cleanString = (value = "") =>
  String(value ?? "").trim();

export const createFirebaseUsernamePasswordSignIn = ({
  authInstance = null,
  functionsInstance = null,
  callableFactory = httpsCallable,
  customTokenSignIn = signInWithCustomToken,
  functionName =
    USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME,
} = {}) => {
  if (!authInstance) {
    throw new TypeError(
      "Canonical Firebase Auth instance is required."
    );
  }

  if (!functionsInstance) {
    throw new TypeError(
      "Canonical Firebase Functions instance is required."
    );
  }

  const apiKey = cleanString(
    authInstance?.app?.options?.apiKey
  );

  if (!apiKey) {
    throw new TypeError(
      "Canonical Firebase API key is required."
    );
  }

  if (typeof callableFactory !== "function") {
    throw new TypeError(
      "Firebase callable factory is required."
    );
  }

  if (typeof customTokenSignIn !== "function") {
    throw new TypeError(
      "Firebase custom-token sign-in is required."
    );
  }

  let callable = null;

  return async ({
    username = "",
    password = "",
  } = {}) => {
    const cleanUsername =
      cleanString(username);
    const rawPassword =
      String(password ?? "");

    if (!cleanUsername || !rawPassword) {
      throw new TypeError(
        "Username and password are required."
      );
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 15000 }
      );
    }

    const response = await callable({
      username: cleanUsername,
      password: rawPassword,
      apiKey,
    });

    const customToken = cleanString(
      response?.data?.customToken
    );

    if (!customToken) {
      throw new Error(
        "Username sign-in could not be completed."
      );
    }

    return customTokenSignIn(
      authInstance,
      customToken
    );
  };
};
