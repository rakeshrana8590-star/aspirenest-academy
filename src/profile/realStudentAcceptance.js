import {
  isAspireNestStaffEmail,
  isAspireNestStudent,
  normalizeAspireNestEmail,
} from "../auth/aspireNestIdentity";

const clean = (value = "") => String(value ?? "").trim();

const identityKey = (record = {}, fallback = "") => {
  const uid = clean(record.uid || record.id);
  if (uid) return `uid:${uid}`;

  const email = normalizeAspireNestEmail(
    record.email || record.normalizedEmail
  );
  if (email) return `email:${email}`;

  return fallback;
};

const planOf = (record = {}) => {
  const plan = clean(
    record.planType ||
      record.plan ||
      record.subscriptionType ||
      record.premiumStatus
  ).toUpperCase();

  if (plan && !["TRUE", "FALSE"].includes(plan)) return plan;
  return record.isPremium === true ? "PREMIUM" : "FREE";
};

const accessCountOf = (record = {}) =>
  Number(
    record.accessCount ??
      record.entitlementCount ??
      record.activeAccessCount ??
      0
  ) || 0;

const addIdentityLink = (map, key, value) => {
  if (!key || !value) return;
  const values = map.get(key) || new Set();
  values.add(value);
  map.set(key, values);
};

export const mergeRealStudentAcceptanceRecords = ({
  directory = [],
  profiles = [],
  students = [],
} = {}) => {
  const records = new Map();

  [...students, ...directory, ...profiles].forEach((record = {}, index) => {
    const email = normalizeAspireNestEmail(
      record.email || record.normalizedEmail
    );

    if (isAspireNestStaffEmail(email) || !isAspireNestStudent({ email })) {
      return;
    }

    const uid = clean(record.uid || record.id);
    const uidKey = uid ? `uid:${uid}` : "";
    const emailKey = email ? `email:${email}` : "";
    const matchingKey =
      (uidKey && records.has(uidKey) && uidKey) ||
      (emailKey && records.has(emailKey) && emailKey) ||
      uidKey ||
      emailKey ||
      `record:${index}`;

    const previous = records.get(matchingKey) || {};
    const merged = {
      ...previous,
      ...record,
      uid: uid || clean(previous.uid || previous.id),
      id: clean(record.id || previous.id || uid || previous.uid) || matchingKey,
      email: email || normalizeAspireNestEmail(previous.email),
      normalizedEmail: email || normalizeAspireNestEmail(previous.normalizedEmail),
      role: "student",
      _hasDirectoryRecord:
        previous._hasDirectoryRecord === true || directory.includes(record),
      _hasProfileRecord:
        previous._hasProfileRecord === true || profiles.includes(record),
    };

    records.set(matchingKey, merged);
    if (uidKey) records.set(uidKey, merged);
    if (emailKey) records.set(emailKey, merged);
  });

  return Array.from(new Set(records.values()));
};

export const buildRealStudentAcceptanceReport = ({
  directory = [],
  profiles = [],
  students = [],
} = {}) => {
  const sourceRecords = [...students, ...directory, ...profiles];
  const uidEmails = new Map();
  const emailUids = new Map();
  let staffRecordsExcluded = 0;

  sourceRecords.forEach((record = {}) => {
    const uid = clean(record.uid || record.id);
    const email = normalizeAspireNestEmail(
      record.email || record.normalizedEmail
    );

    if (isAspireNestStaffEmail(email)) {
      staffRecordsExcluded += 1;
      return;
    }

    addIdentityLink(uidEmails, uid, email);
    addIdentityLink(emailUids, email, uid);
  });

  const studentsMerged = mergeRealStudentAcceptanceRecords({
    directory,
    profiles,
    students,
  });

  const uidConflicts = Array.from(uidEmails.values()).filter(
    (values) => values.size > 1
  ).length;
  const emailConflicts = Array.from(emailUids.values()).filter(
    (values) => values.size > 1
  ).length;

  const rows = studentsMerged.map((student = {}) => ({
    email: normalizeAspireNestEmail(
      student.email || student.normalizedEmail
    ),
    name: clean(student.name || student.fullName || student.displayName) || "Learner",
    uidPresent: Boolean(clean(student.uid || student.id)),
    uidSuffix: clean(student.uid || student.id).slice(-6),
    profilePresent: student._hasProfileRecord === true,
    directoryPresent: student._hasDirectoryRecord === true,
    plan: planOf(student),
    accessCount: accessCountOf(student),
  }));

  const report = {
    sourceCollections: ["users", "students", "learnerProfiles"],
    readOnly: true,
    directoryRecords: directory.length,
    profileRecords: profiles.length,
    seedRecords: students.length,
    uniqueStudents: rows.length,
    staffRecordsExcluded,
    staffInStudentList: rows.filter((row) =>
      isAspireNestStaffEmail(row.email)
    ).length,
    fixedStaffIdentities: 2,
    withUid: rows.filter((row) => row.uidPresent).length,
    withEmail: rows.filter((row) => Boolean(row.email)).length,
    withProfile: rows.filter((row) => row.profilePresent).length,
    withPlan: rows.filter((row) => Boolean(row.plan)).length,
    withAccess: rows.filter((row) => row.accessCount > 0).length,
    missingUid: rows.filter((row) => !row.uidPresent).length,
    missingEmail: rows.filter((row) => !row.email).length,
    uidConflicts,
    emailConflicts,
    students: rows,
  };

  report.status =
    report.uniqueStudents < 1
      ? "red"
      : report.staffInStudentList > 0 ||
          report.uidConflicts > 0 ||
          report.emailConflicts > 0
        ? "red"
        : report.missingUid > 0 || report.missingEmail > 0
          ? "amber"
          : "green";

  return report;
};

export const buildRealStudentAcceptanceDownload = (report = {}) => ({
  generatedAt: new Date().toISOString(),
  purpose: "AspireNest G4 real-student read acceptance",
  firebaseWrites: false,
  authAccountRecreation: false,
  ...report,
});
