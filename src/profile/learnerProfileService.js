import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where,
  } from "firebase/firestore";
  
  import { db } from "../firebase";
  import {
    isAspireNestStudent,
    mergeAspireNestStudentDirectory,
  } from "../auth/aspireNestIdentity";
  import {
    LEARNER_PROFILE_COLLECTION,
    LEARNER_PROFILE_SOURCE,
    LEARNER_PROFILE_STATUS,
    PROFILE_REQUIRED_FIELDS,
    STUDENT_EDITABLE_PROFILE_FIELDS,
  } from "./learnerProfileConstants";
  
  const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);
  
  export const normalizeProfileEmail = (email = "") =>
    String(email || "").trim().toLowerCase();
  
  export const normalizeProfileText = (value = "") =>
    String(value || "").trim();
  
  export const buildLearnerProfileId = ({ uid = "", email = "" } = {}) => {
    const safeUid = normalizeProfileText(uid);
    const safeEmail = normalizeProfileEmail(email);
  
    return safeUid || safeEmail;
  };
  
  const requireAdminActor = (actor = {}) => {
    const role = normalizeProfileText(actor.role).toLowerCase();
  
    if (actor.isAdmin === true || ADMIN_ROLES.has(role)) {
      return {
        uid: actor.uid || null,
        email: normalizeProfileEmail(actor.email),
        role: role || "admin",
      };
    }
  
    throw new Error("Admin access is required for learner profile write action.");
  };
  
  const toProfileRecord = (docSnap) => {
    if (!docSnap || !docSnap.exists()) return null;
  
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  };
  
  export const calculateProfileCompletion = (profile = {}) => {
    const completedFields = PROFILE_REQUIRED_FIELDS.filter((field) =>
      Boolean(normalizeProfileText(profile[field]))
    );
  
    const total = PROFILE_REQUIRED_FIELDS.length;
    const completed = completedFields.length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
  
    return {
      total,
      completed,
      missingFields: PROFILE_REQUIRED_FIELDS.filter(
        (field) => !completedFields.includes(field)
      ),
      percentage,
      status:
        percentage >= 100
          ? LEARNER_PROFILE_STATUS.COMPLETE
          : LEARNER_PROFILE_STATUS.INCOMPLETE,
    };
  };
  
  export const sanitizeStudentProfileUpdate = (data = {}) => {
    return STUDENT_EDITABLE_PROFILE_FIELDS.reduce((payload, field) => {
      payload[field] = normalizeProfileText(data[field]);
      return payload;
    }, {});
  };
  
  export const buildStudentProfilePayload = ({ user = null, data = {} } = {}) => {
    const uid = normalizeProfileText(user?.uid);
    const email = normalizeProfileEmail(user?.email);
  
    if (!uid || !email) {
      throw new Error("Student login is required to update learner profile.");
    }
  
    const safeProfile = sanitizeStudentProfileUpdate(data);
    const completion = calculateProfileCompletion(safeProfile);
  
    return {
      ...safeProfile,
      uid,
      email,
      normalizedEmail: email,
      role: "student",
      profileCompletion: completion.percentage,
      profileMissingFields: completion.missingFields,
      profileStatus: completion.status,
      authProvider: user?.providerData?.[0]?.providerId || "",
      emailVerified: user?.emailVerified === true,
      lastLoginAt: serverTimestamp(),
      source: LEARNER_PROFILE_SOURCE.STUDENT_SELF,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
  };
  
  export const buildAdminProfilePayload = ({ actor, data = {} } = {}) => {
    const adminActor = requireAdminActor(actor);
    const uid = normalizeProfileText(data.uid);
    const email = normalizeProfileEmail(data.email);
  
    if (!uid && !email) {
      throw new Error("Learner profile requires uid or email.");
    }
  
    const baseProfile = {
      uid: uid || null,
      email,
      normalizedEmail: email,
      role: data.role || "student",
      name: normalizeProfileText(data.name),
      phone: normalizeProfileText(data.phone),
      targetExam: normalizeProfileText(data.targetExam),
      course: normalizeProfileText(data.course),
      state: normalizeProfileText(data.state),
      city: normalizeProfileText(data.city),
      language: normalizeProfileText(data.language),
      authProvider: normalizeProfileText(data.authProvider),
      emailVerified: data.emailVerified === true,
      lastLoginAt: data.lastLoginAt || null,
      source: data.source || LEARNER_PROFILE_SOURCE.ADMIN_CREATED,
      adminNote: normalizeProfileText(data.adminNote),
      updatedAt: serverTimestamp(),
      updatedBy: adminActor.uid,
      actorEmail: adminActor.email,
    };
  
    const completion = calculateProfileCompletion(baseProfile);
  
    return {
      ...baseProfile,
      profileCompletion: completion.percentage,
      profileMissingFields: completion.missingFields,
      profileStatus: completion.status,
    };
  };
  
  export const listLearnerProfiles = async ({ maxCount = 200 } = {}) => {
    const safeLimit = Math.max(1, Math.min(500, Number(maxCount) || 200));
    const profileQuery = query(
      collection(db, LEARNER_PROFILE_COLLECTION),
      limit(safeLimit)
    );
    const profileSnap = await getDocs(profileQuery);
    return profileSnap.docs.map(toProfileRecord).filter(Boolean);
  };
  
  export const listExistingStudentDirectory = async ({ maxCount = 500 } = {}) => {
    const safeLimit = Math.max(1, Math.min(500, Number(maxCount) || 500));
    const [studentsSnap, usersSnap] = await Promise.all([
      getDocs(query(collection(db, "students"), limit(safeLimit))),
      getDocs(query(collection(db, "users"), limit(safeLimit))),
    ]);

    const students = studentsSnap.docs.map((studentDoc) => ({
      id: studentDoc.id,
      uid: studentDoc.id,
      ...studentDoc.data(),
    }));
    const users = usersSnap.docs.map((userDoc) => ({
      id: userDoc.id,
      uid: userDoc.id,
      ...userDoc.data(),
    }));

    return mergeAspireNestStudentDirectory({ students, users });
  };
  
  export const getLearnerProfileById = async (profileId) => {
    const id = normalizeProfileText(profileId);
  
    if (!id) return null;
  
    const profileSnap = await getDoc(doc(db, LEARNER_PROFILE_COLLECTION, id));
  
    return toProfileRecord(profileSnap);
  };
  
  export const getLearnerProfileByUid = async (uid) => {
    const safeUid = normalizeProfileText(uid);
  
    if (!safeUid) return null;
  
    const directProfile = await getLearnerProfileById(safeUid);
  
    if (directProfile) return directProfile;
  
    const profileQuery = query(
      collection(db, LEARNER_PROFILE_COLLECTION),
      where("uid", "==", safeUid)
    );
  
    const profileSnap = await getDocs(profileQuery);
    return profileSnap.docs.map(toProfileRecord).filter(Boolean)[0] || null;
  };
  
  export const getLearnerProfilesByEmail = async (email) => {
    const normalizedEmail = normalizeProfileEmail(email);
  
    if (!normalizedEmail) return [];
  
    const directProfile = await getLearnerProfileById(normalizedEmail);
  
    const profileQuery = query(
      collection(db, LEARNER_PROFILE_COLLECTION),
      where("normalizedEmail", "==", normalizedEmail)
    );
  
    const profileSnap = await getDocs(profileQuery);
    const queryProfiles = profileSnap.docs.map(toProfileRecord).filter(Boolean);
  
    const allProfiles = directProfile
      ? [directProfile, ...queryProfiles]
      : queryProfiles;
  
    const seen = new Set();
  
    return allProfiles.filter((profile) => {
      const key = profile.id || profile.uid || profile.normalizedEmail;
  
      if (!key || seen.has(key)) return false;
  
      seen.add(key);
      return true;
    });
  };
  
  export const getLearnerProfileForUser = async (user = null) => {
    const uid = normalizeProfileText(user?.uid);
  
    if (!uid) return null;
  
    try {
      return await getLearnerProfileById(uid);
    } catch (error) {
      return null;
    }
  };
  
  export const upsertStudentLearnerProfile = async ({
    user = null,
    data = {},
  } = {}) => {
    const uid = normalizeProfileText(user?.uid);
    const email = normalizeProfileEmail(user?.email);
  
    if (!uid || !email) {
      throw new Error("Student login is required to save profile.");
    }
  
    const payload = buildStudentProfilePayload({ user, data });
  
    const existingProfile = await getLearnerProfileById(uid).catch(() => null);
    const profileId = uid;
  
    const finalPayload = {
      ...payload,
      createdAt: existingProfile?.createdAt || serverTimestamp(),
      createdBy: existingProfile?.createdBy || uid,
    };
  
    await setDoc(doc(db, LEARNER_PROFILE_COLLECTION, profileId), finalPayload, {
      merge: true,
    });
  
    return {
      id: profileId,
      ...finalPayload,
    };
  };
  
  export const upsertAdminLearnerProfile = async ({
    actor,
    data = {},
  } = {}) => {
    const adminActor = requireAdminActor(actor);
    const payload = buildAdminProfilePayload({ actor: adminActor, data });
  
    const profileId = buildLearnerProfileId({
      uid: payload.uid,
      email: payload.normalizedEmail,
    });
  
    if (!profileId) {
      throw new Error("Learner profile id could not be resolved.");
    }
  
    const existingProfile = await getLearnerProfileById(profileId);
  
    const finalPayload = {
      ...payload,
      createdAt: existingProfile?.createdAt || serverTimestamp(),
      createdBy: existingProfile?.createdBy || adminActor.uid,
    };
  
    await setDoc(doc(db, LEARNER_PROFILE_COLLECTION, profileId), finalPayload, {
      merge: true,
    });
  
    return {
      id: profileId,
      ...finalPayload,
    };
  };
  
  export const upsertLearnerLoginSnapshot = async ({
    user = null,
    authProvider = "",
  } = {}) => {
    const uid = normalizeProfileText(user?.uid);
    const email = normalizeProfileEmail(user?.email);
  
    if (!uid || !email || !isAspireNestStudent(user)) {
      return null;
    }
  
    const existingProfile = await getLearnerProfileForUser(user);
    const profileId = existingProfile?.id || uid;
  
    const payload = {
      uid,
      email,
      normalizedEmail: email,
      role: existingProfile?.role || "student",
      authProvider:
        authProvider ||
        user?.providerData?.[0]?.providerId ||
        existingProfile?.authProvider ||
        "",
      emailVerified: user?.emailVerified === true,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
      source:
        user?.providerData?.[0]?.providerId === "google.com"
          ? LEARNER_PROFILE_SOURCE.GOOGLE_LOGIN
          : LEARNER_PROFILE_SOURCE.EMAIL_LOGIN,
      createdAt: existingProfile?.createdAt || serverTimestamp(),
      createdBy: existingProfile?.createdBy || uid,
    };
  
    await setDoc(doc(db, LEARNER_PROFILE_COLLECTION, profileId), payload, {
      merge: true,
    });
  
    return {
      id: profileId,
      ...payload,
    };
  };