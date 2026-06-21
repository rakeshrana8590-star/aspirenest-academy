import { sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const getVerifiedAuthSession = async (auth, currentUser) => {
  if (!currentUser) {
    return null;
  }

  // Launch-safe auth: keep Firebase-authenticated user logged in.
  // Student access is still controlled by Firestore plan/status gates.
  return currentUser;
};

export const syncVerifiedStudentAccountStatus = (db, verifiedUser) => {
  if (!db || !verifiedUser?.uid) {
    return Promise.resolve();
  }

  const isEmailVerified = verifiedUser.emailVerified === true;

  const verifiedProfileSync = {
    uid: verifiedUser.uid,
    email: verifiedUser.email || "",
    emailVerified: isEmailVerified,
    accountStatus: isEmailVerified ? "active" : "loginActive",
    profileStatus: isEmailVerified ? "verified" : "loginActive",
    role: "student",
    updatedAt: new Date(),
  };

  return Promise.allSettled([
    setDoc(doc(db, "students", verifiedUser.uid), verifiedProfileSync, {
      merge: true,
    }),
    setDoc(doc(db, "users", verifiedUser.uid), verifiedProfileSync, {
      merge: true,
    }),
  ]);
};

export const resendVerificationEmailAndLogout = async (auth, firebaseUser) => {
  try {
    await sendEmailVerification(firebaseUser);

    return {
      message:
        "Email verification pending. A fresh verification email has been sent. Please verify your Gmail before login.",
    };
  } catch (verificationError) {
    console.error("Verification resend failed:", verificationError);

    return {
      message:
        "Email verification pending. Please check your Gmail verification link. If needed, try again after some time.",
    };
  } finally {
    await signOut(auth);
  }
};