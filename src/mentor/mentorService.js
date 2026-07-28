import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  selectCanonicalRoadmapProgressItems,
} from "../services/roadmapService";
import {
  buildMentorAccessRequestRecord,
  buildMentorAssignmentRecord,
  buildMentorStudentLinkId,
} from "./mentorAssignmentContract";
import {
  normalizeMentorSetupEmail,
  selectExactMentorSetupAccount,
} from "./mentorUserLookupModel";

const mapSnapshot = (snapshot) =>
  snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

const sortLatest = (items = []) =>
  [...items].sort((first, second) => {
    const toMillis = (value) => {
      const raw = typeof value?.toDate === "function" ? value.toDate() : value;
      const date = raw instanceof Date ? raw : new Date(raw || 0);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    return toMillis(second.updatedAt || second.createdAt) -
      toMillis(first.updatedAt || first.createdAt);
  });

export const loadMentorProfile = async (mentorUid = "") => {
  if (!mentorUid) return null;
  const snapshot = await getDoc(doc(db, "mentorProfiles", mentorUid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const loadMentorStudents = async (mentorUid = "") => {
  if (!mentorUid) return [];
  const mentorSnapshot = await getDoc(doc(db, "mentorProfiles", mentorUid));
  const mentorProfile = mentorSnapshot.exists() ? mentorSnapshot.data() : {};
  const mentorEmail = String(mentorProfile.email || "dr.varshamaru@gmail.com").trim().toLowerCase();

  const [profileSnapshot, canonicalSnapshot, legacySnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "learnerProfiles"),
        where("mentorEmail", "==", mentorEmail),
        where("mentorAssignmentStatus", "==", "active")
      )
    ),
    getDocs(
      query(
        collection(db, "mentorStudentLinks"),
        where("mentorUid", "==", mentorUid),
        where("status", "==", "active")
      )
    ),
    getDocs(
      query(
        collection(db, "mentorProfiles", mentorUid, "students"),
        where("status", "==", "active")
      )
    ),
  ]);

  const map = new Map();
  mapSnapshot(profileSnapshot).forEach((profile) => {
    const studentUid = String(profile.uid || profile.id || "").trim();
    if (!studentUid) return;
    map.set(studentUid, {
      id: studentUid,
      studentUid,
      studentName: profile.name || profile.fullName || profile.username || profile.email || "Learner",
      studentEmail: String(profile.email || profile.normalizedEmail || "").trim().toLowerCase(),
      status: "active",
      mentorUid,
      mentorName: mentorProfile.displayName || mentorProfile.name || "Dr. Varsha Maru",
      source: profile.mentorAssignmentSource || "learner_profile",
      ...profile,
    });
  });
  mapSnapshot(canonicalSnapshot).forEach((link) => {
    const studentUid = String(link.studentUid || link.id || "").trim();
    if (!studentUid) return;
    map.set(studentUid, { ...(map.get(studentUid) || {}), ...link, id: studentUid, studentUid });
  });
  mapSnapshot(legacySnapshot).forEach((link) => {
    const studentUid = String(link.studentUid || link.id || "").trim();
    if (!studentUid) return;
    map.set(studentUid, { ...(map.get(studentUid) || {}), ...link, id: studentUid, studentUid });
  });

  return [...map.values()].sort((a, b) =>
    String(a.studentName || a.studentEmail || a.studentUid).localeCompare(
      String(b.studentName || b.studentEmail || b.studentUid)
    )
  );
};

export const loadMentorStudentWorkspace = async ({
  mentorUid = "",
  studentUid = "",
} = {}) => {
  if (!mentorUid || !studentUid) {
    throw new Error("Mentor and student UID are required.");
  }

  const [profileSnapshot, entitlementSnapshot, progressSnapshot, assignmentSnapshot] =
    await Promise.all([
      getDoc(doc(db, "learnerProfiles", studentUid)),
      getDocs(collection(db, "studentEntitlements", studentUid, "items")),
      getDocs(
        query(
          collection(db, "studyRoadmapProgress"),
          where("userId", "==", studentUid)
        )
      ),
      getDocs(
        query(
          collection(db, "mentorAssignments"),
          where("mentorUid", "==", mentorUid),
          where("studentUid", "==", studentUid)
        )
      ),
    ]);

  return {
    profile: profileSnapshot.exists()
      ? { id: profileSnapshot.id, ...profileSnapshot.data() }
      : null,
    accessRecords: mapSnapshot(entitlementSnapshot),
    roadmapProgress: sortLatest(
      selectCanonicalRoadmapProgressItems({
        items: mapSnapshot(progressSnapshot),
        userId: studentUid,
      })
    ),
    assignments: sortLatest(mapSnapshot(assignmentSnapshot)),
  };
};

export const loadMentorAssignments = async ({
  mentorUid = "",
  studentUid = "",
} = {}) => {
  if (!mentorUid) return [];
  const snapshot = studentUid
    ? await getDocs(
        query(
          collection(db, "mentorAssignments"),
          where("mentorUid", "==", mentorUid),
          where("studentUid", "==", studentUid)
        )
      )
    : await getDocs(
        query(
          collection(db, "mentorAssignments"),
          where("mentorUid", "==", mentorUid)
        )
      );

  return sortLatest(mapSnapshot(snapshot));
};

export const loadStudentAssignments = async (studentUid = "") => {
  if (!studentUid) return [];
  const snapshot = await getDocs(
    query(
      collection(db, "mentorAssignments"),
      where("studentUid", "==", studentUid)
    )
  );
  return sortLatest(mapSnapshot(snapshot));
};

export const loadAssignmentFeedback = async ({
  assignmentId = "",
  mentorUid = "",
  studentUid = "",
} = {}) => {
  if (!assignmentId || (!mentorUid && !studentUid)) return [];
  const constraints = [where("assignmentId", "==", assignmentId)];

  if (mentorUid) constraints.push(where("mentorUid", "==", mentorUid));
  if (studentUid) constraints.push(where("studentUid", "==", studentUid));

  const snapshot = await getDocs(
    query(collection(db, "mentorFeedback"), ...constraints)
  );
  return sortLatest(mapSnapshot(snapshot));
};

export const createMentorAssignment = async ({
  mentorUid,
  studentUid,
  studentName,
  resource,
  accessState,
  matchedGrantId = "",
  dueAt,
  objective,
} = {}) => {
  const assignmentRef = doc(collection(db, "mentorAssignments"));
  const record = buildMentorAssignmentRecord({
    assignmentId: assignmentRef.id,
    mentorUid,
    studentUid,
    studentName,
    resource,
    accessState,
    matchedGrantId,
    dueAt,
    objective,
  });

  await setDoc(assignmentRef, {
    ...record,
    dueAt: dueAt ? new Date(dueAt) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return assignmentRef.id;
};

export const createMentorAccessRequest = async ({
  mentorUid,
  studentUid,
  resource,
  reason,
} = {}) => {
  const requestRef = doc(collection(db, "mentorAccessRequests"));
  const record = buildMentorAccessRequestRecord({
    requestId: requestRef.id,
    mentorUid,
    studentUid,
    resource,
    reason,
  });

  await setDoc(requestRef, {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return requestRef.id;
};

export const createMentorFeedback = async ({
  assignmentId = "",
  mentorUid = "",
  studentUid = "",
  message = "",
} = {}) => {
  const cleanMessage = String(message || "").trim();
  if (!assignmentId || !mentorUid || !studentUid || !cleanMessage) {
    throw new Error("Assignment, mentor, student and feedback are required.");
  }

  const feedbackRef = doc(collection(db, "mentorFeedback"));
  const assignmentRef = doc(db, "mentorAssignments", assignmentId);
  const batch = writeBatch(db);

  batch.set(feedbackRef, {
    feedbackId: feedbackRef.id,
    assignmentId,
    mentorUid,
    studentUid,
    message: cleanMessage.slice(0, 4000),
    status: "published",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(assignmentRef, {
    feedbackCount: increment(1),
    reviewedAt: serverTimestamp(),
    status: "reviewed",
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return feedbackRef.id;
};

export const markStudentAssignmentComplete = async ({
  assignmentId = "",
} = {}) => {
  if (!assignmentId) throw new Error("Assignment ID is required.");
  await updateDoc(doc(db, "mentorAssignments", assignmentId), {
    status: "completed",
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};


export const adminLookupUserByEmail = async (
  email = ""
) => {
  const normalizedEmail =
    normalizeMentorSetupEmail(email);

  const [emailSnapshot, normalizedSnapshot] =
    await Promise.all([
      getDocs(
        query(
          collection(db, "users"),
          where(
            "email",
            "==",
            normalizedEmail
          ),
          limit(2)
        )
      ),
      getDocs(
        query(
          collection(db, "users"),
          where(
            "normalizedEmail",
            "==",
            normalizedEmail
          ),
          limit(2)
        )
      ),
    ]);

  return selectExactMentorSetupAccount({
    email: normalizedEmail,
    records: [
      ...mapSnapshot(emailSnapshot),
      ...mapSnapshot(normalizedSnapshot),
    ],
  });
};

export const adminSaveMentorProfile = async ({
  mentorUid = "",
  email = "",
  displayName = "",
} = {}) => {
  if (!mentorUid || !email) {
    throw new Error("Mentor UID and email are required.");
  }

  await setDoc(
    doc(db, "mentorProfiles", mentorUid),
    {
      mentorUid,
      role: "mentor",
      status: "active",
      email: String(email).trim().toLowerCase(),
      displayName: String(displayName || "Mentor").trim(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const adminSaveMentorStudentLink = async ({
  mentorUid = "",
  mentorName = "",
  studentUid = "",
  studentName = "",
  studentEmail = "",
} = {}) => {
  const linkId = buildMentorStudentLinkId(mentorUid, studentUid);
  if (!linkId) throw new Error("Mentor and student UID are required.");

  await setDoc(
    doc(db, "mentorProfiles", mentorUid, "students", studentUid),
    {
      linkId,
      mentorUid,
      mentorName: String(mentorName || "Mentor").trim(),
      studentUid,
      studentName: String(studentName || "Student").trim(),
      studentEmail: String(studentEmail || "").trim().toLowerCase(),
      status: "active",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};
