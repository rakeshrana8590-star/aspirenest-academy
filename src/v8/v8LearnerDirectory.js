import { collection, limit, onSnapshot, query } from "firebase/firestore";

import {
  isAspireNestStaffEmail,
  normalizeAspireNestEmail,
} from "../auth/aspireNestIdentity";

const clean = (value = "") => String(value ?? "").trim();
const upper = (value = "") => clean(value).toUpperCase();

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatLastActive = (value) => {
  const millis = toMillis(value);
  if (!millis) return "Not recorded";
  return new Date(millis).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const numberOf = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || typeof value === "boolean") continue;
    const normalized = typeof value === "string" ? value.trim() : value;
    if (normalized === "") continue;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const planRank = Object.freeze({
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
  "MENTOR-GUIDED": 3,
});

const sourceRank = Object.freeze({
  learnerProfiles: 30,
  students: 20,
  users: 10,
});

const normalizePlan = (value) => {
  const plan = upper(value);
  if (!plan || ["TRUE", "FALSE", "ACTIVE", "EXPIRED"].includes(plan)) return "";
  if (plan === "MENTOR_GUIDED") return "MENTOR-GUIDED";
  return plan;
};

const planFromRecord = (record = {}) =>
  normalizePlan(
    record.planType ||
      record.plan ||
      record.subscriptionType ||
      record.currentPlan ||
      record.premiumPlan ||
      record.accessPlan
  ) || (record.isPremium === true ? "PREMIUM" : "");

const accessPlan = (record = {}) => {
  const scope = upper(record.scopeType || record.scope || record.accessScope);
  if (scope && scope !== "PLAN") return "";
  return normalizePlan(record.planCode || record.planType || record.target || record.plan);
};

const isActiveAccess = (record = {}, now = Date.now()) => {
  const status = clean(record.status || record.accessStatus).toLowerCase();
  if (["revoked", "expired", "inactive", "disabled", "cancelled", "denied", "blocked"].includes(status)) return false;
  const starts = toMillis(record.accessFrom || record.startsAt || record.startDate || record.validFrom);
  const expires = toMillis(record.accessUntil || record.expiresAt || record.endDate || record.validUntil);
  if (starts && starts > now) return false;
  if (expires && expires <= now && record.noExpiry !== true && record.untilManualChange !== true) return false;
  return !status || ["active", "approved", "verified", "granted", "paid", "success"].includes(status);
};

const learnerStatus = (records = [], activeAccess = [], now = Date.now()) => {
  const rawValues = records
    .flatMap(({ record }) => [record.accountStatus, record.status, record.profileStatus, record.premiumStatus])
    .map((value) => clean(value).toLowerCase())
    .filter(Boolean);

  if (rawValues.some((value) => ["suspended", "blocked", "disabled"].includes(value))) return "Suspended";
  if (rawValues.some((value) => ["inactive", "revoked", "cancelled"].includes(value))) return "Inactive";

  const latestExpiry = Math.max(
    0,
    ...records.map(({ record }) =>
      toMillis(
        record.validUntil ||
          record.accessUntil ||
          record.subscriptionExpiry ||
          record.premiumExpiry ||
          record.expiryDate
      )
    )
  );
  if ((rawValues.includes("expired") || (latestExpiry && latestExpiry <= now)) && activeAccess.length === 0) return "Expired";
  return "Active";
};

const aliasesFor = (record = {}) => {
  const uidAliases = [record.uid, record.userId, record.studentUid, record.authUid, record.id]
    .map(clean)
    .filter(Boolean);
  const emailAliases = [record.email, record.normalizedEmail, record.studentEmail, record.userEmail]
    .map(normalizeAspireNestEmail)
    .filter(Boolean);

  return {
    uidAliases: [...new Set(uidAliases)],
    emailAliases: [...new Set(emailAliases)],
  };
};

const entrySort = (first, second) => {
  const rankDifference = (sourceRank[second.source] || 0) - (sourceRank[first.source] || 0);
  if (rankDifference) return rankDifference;
  const firstTime = toMillis(first.record.updatedAt || first.record.lastActiveAt || first.record.createdAt);
  const secondTime = toMillis(second.record.updatedAt || second.record.lastActiveAt || second.record.createdAt);
  return secondTime - firstTime;
};

const firstText = (entries, fields = []) => {
  for (const entry of [...entries].sort(entrySort)) {
    for (const field of fields) {
      const value = clean(entry.record[field]);
      if (value) return value;
    }
  }
  return "";
};

const progressOf = (entries = []) => {
  const values = entries.map(({ record }) =>
    numberOf(
      record.progress,
      record.overallProgress,
      record.courseProgress,
      record.learningProgress,
      record.profileCompletion
    )
  );
  return Math.min(100, Math.max(0, ...values));
};

const mentorDetailsOf = (entries = []) => ({
  mentor: firstText(entries, [
    "mentorName",
    "assignedMentorName",
    "mentorDisplayName",
    "assignedMentor",
    "mentorEmail",
  ]) || "Unassigned",
  mentorName: firstText(entries, ["mentorName", "assignedMentorName", "mentorDisplayName", "assignedMentor"]),
  mentorEmail: normalizeAspireNestEmail(firstText(entries, ["mentorEmail", "assignedMentorEmail"])),
  mentorUid: firstText(entries, ["mentorUid", "assignedMentorUid", "mentorId"]),
  mentorAssignmentStatus: clean(firstText(entries, ["mentorAssignmentStatus", "mentorStatus"]) || ""),
});

const groupIdentityEntries = ({ users = [], students = [], profiles = [] } = {}) => {
  const entries = [];
  const append = (records, source) =>
    (Array.isArray(records) ? records : []).forEach((record = {}, index) => {
      entries.push({ record, source, index, ...aliasesFor(record) });
    });

  append(users, "users");
  append(students, "students");
  append(profiles, "learnerProfiles");

  const parent = entries.map((_, index) => index);
  const find = (index) => {
    let cursor = index;
    while (parent[cursor] !== cursor) cursor = parent[cursor];
    while (parent[index] !== index) {
      const next = parent[index];
      parent[index] = cursor;
      index = next;
    }
    return cursor;
  };
  const union = (left, right) => {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft !== rootRight) parent[rootRight] = rootLeft;
  };

  const aliasOwners = new Map();
  entries.forEach((entry, index) => {
    const aliases = [
      ...entry.uidAliases.map((value) => `uid:${value}`),
      ...entry.emailAliases.map((value) => `email:${value}`),
    ];
    aliases.forEach((alias) => {
      if (aliasOwners.has(alias)) union(index, aliasOwners.get(alias));
      else aliasOwners.set(alias, index);
    });
  });

  const groups = new Map();
  entries.forEach((entry, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(entry);
  });
  return [...groups.values()];
};

const accessMatchesLearner = (access = {}, learner = {}) => {
  const accessUids = aliasesFor(access).uidAliases;
  const accessEmails = aliasesFor(access).emailAliases;
  const learnerUids = new Set([learner.uid, ...(learner.uidAliases || [])].map(clean).filter(Boolean));
  const learnerEmails = new Set([learner.email, ...(learner.emailAliases || [])].map(normalizeAspireNestEmail).filter(Boolean));
  return accessUids.some((uid) => learnerUids.has(uid)) || accessEmails.some((email) => learnerEmails.has(email));
};

export const buildV8RealLearnerDirectory = ({
  users = [],
  students = [],
  profiles = [],
  accessRecords = [],
  now = Date.now(),
} = {}) => {
  const groups = groupIdentityEntries({ users, students, profiles });

  return groups
    .map((entries) => {
      const uidAliases = [...new Set(entries.flatMap((entry) => entry.uidAliases))];
      const emailAliases = [...new Set(entries.flatMap((entry) => entry.emailAliases))];
      const staffEmail = emailAliases.find(isAspireNestStaffEmail);
      const staffRole = entries.some(({ record }) =>
        ["admin", "super_admin", "owner", "mentor"].includes(clean(record.role || record.userRole).toLowerCase())
      );
      if (staffEmail || staffRole) return null;

      const userEntries = entries.filter((entry) => entry.source === "users").sort(entrySort);
      const canonicalUid =
        userEntries.flatMap((entry) => entry.uidAliases)[0] ||
        [...entries].sort(entrySort).flatMap((entry) => entry.uidAliases)[0] ||
        "";
      const canonicalEmail = emailAliases[0] || "";
      if (!canonicalUid && !canonicalEmail) return null;

      const identity = {
        uid: canonicalUid,
        id: canonicalUid || canonicalEmail,
        email: canonicalEmail,
        normalizedEmail: canonicalEmail,
        uidAliases,
        emailAliases,
      };
      const matchedAccess = (Array.isArray(accessRecords) ? accessRecords : []).filter(
        (access) => accessMatchesLearner(access, identity) && isActiveAccess(access, now)
      );
      const accessIds = new Set(
        matchedAccess.map((access, index) =>
          clean(access.id || access.accessId || access.entitlementId || access.grantKey) || `access:${index}`
        )
      );
      const recordPlan = entries.reduce((best, { record }) => {
        const candidate = planFromRecord(record);
        return (planRank[candidate] ?? -1) > (planRank[best] ?? -1) ? candidate : best;
      }, "FREE");
      const effectivePlan = matchedAccess.reduce((best, access) => {
        const candidate = accessPlan(access);
        return (planRank[candidate] ?? -1) > (planRank[best] ?? -1) ? candidate : best;
      }, recordPlan);
      const lastActiveMillis = Math.max(
        0,
        ...entries.map(({ record }) =>
          toMillis(record.lastLoginAt || record.lastActiveAt || record.lastActive || record.updatedAt || record.createdAt)
        )
      );
      const name =
        firstText(entries, ["fullName", "name", "displayName", "studentName"]) ||
        firstText(entries, ["username"]) ||
        canonicalEmail.split("@")[0] ||
        "Learner";

      const mentorDetails = mentorDetailsOf(entries);

      return {
        ...identity,
        name,
        username: firstText(entries, ["username"]),
        plan: effectivePlan || "FREE",
        status: learnerStatus(entries, matchedAccess, now),
        progress: progressOf(entries),
        accessCount: Math.max(
          accessIds.size,
          ...entries.map(({ record }) =>
            Math.max(
              numberOf(record.accessCount, record.entitlementCount, record.activeAccessCount),
              Array.isArray(record.purchasedCourses) ? record.purchasedCourses.length : 0
            )
          )
        ),
        ...mentorDetails,
        lastActive: formatLastActive(lastActiveMillis),
        lastActiveMillis,
        sourceCollections: [...new Set(entries.map((entry) => entry.source))],
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name, "en", { sensitivity: "base" }));
};

const docsToRecords = (snapshot) =>
  snapshot.docs.map((item) => {
    const record = item.data() || {};
    return { ...record, id: item.id, uid: clean(record.uid || record.userId || item.id) };
  });

export const subscribeV8RealLearnerDirectory = ({
  db,
  onLoading = () => {},
  onChange = () => {},
  onError = () => {},
  maxCount = 500,
} = {}) => {
  if (!db) throw new Error("Firestore is required for learner directory subscription.");

  const safeLimit = Math.max(1, Math.min(1000, Number(maxCount) || 500));
  const state = { users: null, students: null, profiles: null, accessRecords: null };
  let stopped = false;

  const emit = () => {
    if (stopped || Object.values(state).some((value) => !Array.isArray(value))) return;
    onChange(buildV8RealLearnerDirectory(state));
  };

  const watch = (collectionName, stateKey) =>
    onSnapshot(
      query(collection(db, collectionName), limit(safeLimit)),
      (snapshot) => {
        state[stateKey] = docsToRecords(snapshot);
        emit();
      },
      (error) => {
        state[stateKey] = [];
        emit();
        if (!stopped) onError(error, collectionName);
      }
    );

  onLoading();
  const unsubscribe = [
    watch("users", "users"),
    watch("students", "students"),
    watch("learnerProfiles", "profiles"),
    watch("studentAccess", "accessRecords"),
  ];

  return () => {
    stopped = true;
    unsubscribe.forEach((stop) => {
      try {
        stop();
      } catch (_) {}
    });
  };
};
