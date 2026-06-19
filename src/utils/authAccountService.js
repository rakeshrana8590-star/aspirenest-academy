import { sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const getVerifiedAuthSession = async (auth, currentUser) => {
  if (!currentUser) {
    return null;
  }

  if (!currentUser.emailVerified) {
    await signOut(auth);
    return null;
  }

  return currentUser;
};

export const syncVerifiedStudentAccountStatus = (db, verifiedUser) => {
  if (!db || !verifiedUser?.uid) {
    return Promise.resolve();
  }

  const verifiedProfileSync = {
    uid: verifiedUser.uid,
    email: verifiedUser.email || "",
    emailVerified: true,
    accountStatus: "active",
    profileStatus: "verified",
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
        "Email verification pending 📩 A fresh verification email has been sent. Please verify your Gmail before login.",
    };
  } catch (verificationError) {
    console.error("Verification resend failed:", verificationError);

    return {
      message:
        "Email verification pending 📩 Please check your Gmail verification link. If needed, try again after some time.",
    };
  } finally {
    await signOut(auth);
  }
};