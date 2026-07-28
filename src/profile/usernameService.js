import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import { validateUsername } from "./usernameModel";
import {
  ASPIRENEST_MENTOR_EMAIL,
} from "../auth/aspireNestIdentity";
import {
  ASPIRENEST_DEFAULT_MENTOR_NAME,
  ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
} from "../v8/v8DefaultMentorPolicy";

export const USERNAME_COLLECTION = "usernames";

export const createVerifiedStudentAccountRecords = async ({
  firebaseUser = null,
  profile = {},
} = {}) => {
  const uid = String(firebaseUser?.uid || "").trim();
  const email = String(firebaseUser?.email || profile.email || "")
    .trim()
    .toLowerCase();
  const validation = validateUsername(profile.username);

  if (!uid || !email) {
    throw new Error("Authenticated student identity is required.");
  }

  if (!validation.ok) {
    const error = new Error(validation.message);
    error.code = validation.reason;
    throw error;
  }

  const normalizedUsername = validation.normalizedUsername;
  const usernameRef = doc(db, USERNAME_COLLECTION, normalizedUsername);
  const studentRef = doc(db, "students", uid);
  const userRef = doc(db, "users", uid);
  const learnerProfileRef = doc(db, "learnerProfiles", uid);
  const defaultMentorRef = doc(db, "platformSettings", "defaultMentor");
  const defaultMentorSnapshot = await getDoc(defaultMentorRef).catch(() => null);
  const defaultMentorData = defaultMentorSnapshot?.exists() ? defaultMentorSnapshot.data() : {};
  const defaultMentor = {
    uid: String(defaultMentorData.mentorUid || "").trim(),
    email: String(defaultMentorData.mentorEmail || ASPIRENEST_MENTOR_EMAIL).trim().toLowerCase(),
    name: String(defaultMentorData.mentorName || ASPIRENEST_DEFAULT_MENTOR_NAME).trim(),
  };

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);

    if (usernameSnap.exists() && usernameSnap.data()?.uid !== uid) {
      const error = new Error("This username is already in use.");
      error.code = "USERNAME_ALREADY_EXISTS";
      throw error;
    }

    const createdAt = serverTimestamp();
    const mentorRelation = {
      mentorUid: defaultMentor.uid,
      mentorEmail: defaultMentor.email,
      mentorName: defaultMentor.name,
      mentorAssignmentStatus: "active",
      mentorAssignedAt: createdAt,
      mentorAssignmentSource: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
    };
    const baseRecord = {
      ...profile,
      uid,
      email,
      normalizedEmail: email,
      username: normalizedUsername,
      normalizedUsername,
      role: "student",
      ...mentorRelation,
      updatedAt: createdAt,
    };

    transaction.set(usernameRef, {
      uid,
      username: normalizedUsername,
      normalizedUsername,
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });

    transaction.set(studentRef, {
      ...baseRecord,
      createdAt,
    });

    transaction.set(userRef, {
      ...baseRecord,
      displayName: profile.fullName || profile.name || normalizedUsername,
      paymentStatus: "FREE",
      premiumStatus: "FREE",
      createdAt,
    });

    transaction.set(learnerProfileRef, {
      uid,
      email,
      normalizedEmail: email,
      role: "student",
      name: profile.fullName || profile.name || normalizedUsername,
      phone: profile.mobile || profile.phone || "",
      targetExam: profile.targetExam || "",
      language: profile.preferredMedium || profile.language || "",
      authProvider: firebaseUser?.providerData?.[0]?.providerId || "password",
      emailVerified: firebaseUser?.emailVerified === true,
      profileCompletion: 100,
      profileMissingFields: [],
      profileStatus: "complete",
      source: "verified_student_registration",
      ...mentorRelation,
      createdAt,
      createdBy: uid,
      updatedAt: createdAt,
      updatedBy: uid,
    }, { merge: true });

    if (defaultMentor.uid) {
      const linkRecord = {
        linkId: `${defaultMentor.uid}_${uid}`,
        mentorUid: defaultMentor.uid,
        mentorName: defaultMentor.name,
        mentorEmail: defaultMentor.email,
        studentUid: uid,
        studentName: profile.fullName || profile.name || normalizedUsername,
        studentEmail: email,
        status: "active",
        source: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
        createdAt,
        updatedAt: createdAt,
      };
      transaction.set(
        doc(db, "mentorProfiles", defaultMentor.uid, "students", uid),
        linkRecord,
        { merge: true }
      );
      transaction.set(doc(db, "mentorStudentLinks", uid), linkRecord, { merge: true });
    }
  });

  return {
    uid,
    email,
    username: normalizedUsername,
  };
};

export const claimUsernameForExistingUser = async ({
  firebaseUser = null,
  username = "",
} = {}) => {
  const uid = String(firebaseUser?.uid || "").trim();
  const email = String(firebaseUser?.email || "").trim().toLowerCase();
  const validation = validateUsername(username);

  if (!uid || !email) {
    throw new Error("Authenticated learner identity is required.");
  }

  if (!validation.ok) {
    const error = new Error(validation.message);
    error.code = validation.reason;
    throw error;
  }

  const normalizedUsername = validation.normalizedUsername;
  const usernameRef = doc(db, USERNAME_COLLECTION, normalizedUsername);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);

    if (usernameSnap.exists() && usernameSnap.data()?.uid !== uid) {
      const error = new Error("This username is already in use.");
      error.code = "USERNAME_ALREADY_EXISTS";
      throw error;
    }

    const timestamp = serverTimestamp();
    transaction.set(usernameRef, {
      uid,
      username: normalizedUsername,
      normalizedUsername,
      status: "active",
      createdAt: usernameSnap.exists()
        ? usernameSnap.data()?.createdAt || timestamp
        : timestamp,
      updatedAt: timestamp,
    }, { merge: true });

    transaction.set(userRef, {
      uid,
      email,
      username: normalizedUsername,
      normalizedUsername,
      updatedAt: timestamp,
    }, { merge: true });
  });

  return { uid, email, username: normalizedUsername };
};
