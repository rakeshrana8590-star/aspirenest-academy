export const LEARNER_PROFILE_COLLECTION = "learnerProfiles";

export const LEARNER_PROFILE_STATUS = Object.freeze({
  INCOMPLETE: "incomplete",
  COMPLETE: "complete",
  LOCKED: "locked",
});

export const LEARNER_PROFILE_SOURCE = Object.freeze({
  STUDENT_SELF: "student_self",
  ADMIN_CREATED: "admin_created",
  ACCESS_IMPORT: "access_import",
  GOOGLE_LOGIN: "google_login",
  EMAIL_LOGIN: "email_login",
});

export const LEARNER_TARGET_EXAMS = Object.freeze({
  CTET: "CTET",
  TET: "TET",
  CTET_TET: "CTET_TET",
  OTHER: "OTHER",
});

export const LEARNER_LANGUAGE_OPTIONS = Object.freeze({
  HINDI: "Hindi",
  ENGLISH: "English",
  GUJARATI: "Gujarati",
  HINGLISH: "Hinglish",
});

export const STUDENT_EDITABLE_PROFILE_FIELDS = Object.freeze([
  "name",
  "phone",
  "targetExam",
  "state",
  "city",
  "language",
]);

export const STUDENT_LOCKED_PROFILE_FIELDS = Object.freeze([
  "email",
  "normalizedEmail",
  "uid",
  "role",
  "planType",
  "accessPlanType",
  "accessStatus",
  "membershipExpiry",
  "validity",
  "source",
  "adminNote",
  "createdBy",
  "actorEmail",
]);

export const PROFILE_REQUIRED_FIELDS = Object.freeze([
  "name",
  "phone",
  "targetExam",
  "state",
  "city",
  "language",
]);