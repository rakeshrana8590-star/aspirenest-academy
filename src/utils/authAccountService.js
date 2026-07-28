import { sendEmailVerification, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  isAspireNestStudent,
  resolveAspireNestRole,
} from "../auth/aspireNestIdentity";


const cleanAccountText = (value = "") => String(value || "").trim();

const readAccountDocument = async (db, collectionName, uid) => {
  try {
    const snapshot = await getDoc(doc(db, collectionName, uid));
    return snapshot.exists() ? snapshot.data() || {} : {};
  } catch (_) {
    return {};
  }
};

export const loadAspireNestAccountProfile = async (db, firebaseUser) => {
  if (!db || !firebaseUser?.uid) return {};

  const role = resolveAspireNestRole(firebaseUser);
  const collections =
    role === "mentor"
      ? ["users", "mentorProfiles"]
      : role === "admin"
        ? ["users"]
        : ["users", "students"];

  const records = await Promise.all(
    collections.map((collectionName) =>
      readAccountDocument(db, collectionName, firebaseUser.uid)
    )
  );
  const merged = Object.assign({}, ...records);

  return {
    ...merged,
    uid: firebaseUser.uid,
    email: cleanAccountText(merged.email || firebaseUser.email),
    normalizedEmail: cleanAccountText(
      merged.normalizedEmail || merged.email || firebaseUser.email
    ).toLowerCase(),
    username: cleanAccountText(merged.username),
    fullName: cleanAccountText(
      merged.fullName || merged.name || merged.displayName || firebaseUser.displayName
    ),
    planType: cleanAccountText(
      merged.planType || merged.subscriptionType || merged.currentPlan || ""
    ).toUpperCase(),
    role,
  };
};

export const getVerifiedAuthSession = async (auth, currentUser) => {
  if (!currentUser) {
    return null;
  }

  // Launch-safe auth: keep Firebase-authenticated user logged in.
  // Student access is still controlled by Firestore plan/status gates.
  return currentUser;
};

export const syncVerifiedStudentAccountStatus = (db, verifiedUser) => {
  if (!db || !verifiedUser?.uid || !isAspireNestStudent(verifiedUser)) {
    return Promise.resolve();
  }

  const isEmailVerified = verifiedUser.emailVerified === true;

  const verifiedProfileSync = {
    uid: verifiedUser.uid,
    email: verifiedUser.email || "",
    normalizedEmail: String(verifiedUser.email || "").trim().toLowerCase(),
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