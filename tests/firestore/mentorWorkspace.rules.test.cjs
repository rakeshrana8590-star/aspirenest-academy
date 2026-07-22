const test = require("node:test");
const assert = require("node:assert/strict");

const { initializeApp, deleteApp } = require("firebase/app");
const {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  where,
} = require("firebase/firestore");

const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-aspirenest-local";
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const DATABASE_ROOT = `projects/${PROJECT_ID}/databases/(default)`;
const DOCUMENT_ROOT = `http://${FIRESTORE_HOST}/v1/${DATABASE_ROOT}/documents`;

const identities = {};

const parseHostAndPort = (value) => {
  const separator = value.lastIndexOf(":");
  if (separator <= 0) {
    throw new Error(`Invalid emulator host: ${value}`);
  }
  return {
    host: value.slice(0, separator),
    port: Number(value.slice(separator + 1)),
  };
};

const { host: firestoreHost, port: firestorePort } =
  parseHostAndPort(FIRESTORE_HOST);

const encodePath = (path = "") =>
  String(path)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

const toValue = (value) => {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toValue) } };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: encodeFields(value) } };
  }
  return { stringValue: String(value) };
};

const encodeFields = (data = {}) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toValue(value)])
  );

const ownerHeaders = () => ({
  Authorization: "Bearer owner",
  "Content-Type": "application/json",
});

const ownerSet = async (path, data) => {
  const response = await fetch(`${DOCUMENT_ROOT}/${encodePath(path)}`, {
    method: "PATCH",
    headers: ownerHeaders(),
    body: JSON.stringify({ fields: encodeFields(data) }),
  });

  if (!response.ok) {
    throw new Error(`Owner seed failed for ${path}: ${await response.text()}`);
  }
};

const createIdentity = ({ uid, email }) => {
  const app = initializeApp(
    {
      apiKey: "demo-api-key",
      projectId: PROJECT_ID,
    },
    `mentor-rules-${uid}-${Date.now()}-${Math.random()}`
  );
  const db = getFirestore(app);

  connectFirestoreEmulator(db, firestoreHost, firestorePort, {
    mockUserToken: {
      sub: uid,
      email,
      email_verified: true,
      firebase: {
        identities: { email: [email] },
        sign_in_provider: "password",
      },
    },
  });

  return { uid, email, app, db };
};

const commitWrite = async ({
  path,
  data,
  identity,
  transformFields = [],
  updateMask = null,
}) => {
  const reference = doc(identity.db, path);
  const transformed = Object.fromEntries(
    transformFields.map((fieldPath) => [fieldPath, serverTimestamp()])
  );

  if (Array.isArray(updateMask)) {
    const update = Object.fromEntries(
      updateMask
        .filter((fieldPath) => Object.prototype.hasOwnProperty.call(data, fieldPath))
        .map((fieldPath) => [fieldPath, data[fieldPath]])
    );
    return updateDoc(reference, { ...update, ...transformed });
  }

  return setDoc(reference, { ...data, ...transformed });
};

const getDocument = (path, identity) => getDoc(doc(identity.db, path));

const runQuery = ({ collectionId, identity, filters = [], parent = "" }) => {
  const path = parent ? `${parent}/${collectionId}` : collectionId;
  const constraints = filters.map(([fieldPath, value]) =>
    where(fieldPath, "==", value)
  );
  return getDocs(query(collection(identity.db, path), ...constraints));
};

const errorText = (error) =>
  [error?.code, error?.message].filter(Boolean).join(": ") || String(error);

const assertAllowed = async (promise, label) => {
  try {
    return await promise;
  } catch (error) {
    assert.fail(`${label} expected allow, got ${errorText(error)}`);
  }
};

const assertDenied = async (promise, label) => {
  try {
    await promise;
    assert.fail(`${label} expected deny, but request succeeded`);
  } catch (error) {
    if (error?.name === "AssertionError") throw error;
    assert.match(
      String(error?.code || ""),
      /permission-denied/,
      `${label} expected permission-denied, got ${errorText(error)}`
    );
  }
};

const assignmentPayload = ({
  assignmentId,
  mentorUid,
  studentUid,
  accessState = "HAS_ACCESS",
} = {}) => ({
  assignmentId,
  mentorUid,
  studentUid,
  studentName: "Student One",
  resourceId: "roadmap-1",
  resourceType: "roadmap",
  moduleKey: "roadmap",
  itemType: "roadmap",
  title: "60 Day AspirePath",
  canonicalRoute: "/ctet-tet/roadmaps/roadmap-1",
  requiredPlan: "PREMIUM",
  accessState,
  matchedGrantId: "roadmap-access",
  status: "assigned",
  dueAt: null,
  objective: "Complete the first Roadmap day.",
  completedAt: null,
  reviewedAt: null,
  feedbackCount: 0,
});

test.before(async () => {
  identities.admin = createIdentity({
    uid: "admin-uid",
    email: "aspirenestplatform@gmail.com",
  });
  identities.mentor = createIdentity({
    uid: "mentor-1",
    email: "mentor1@example.com",
  });
  identities.otherMentor = createIdentity({
    uid: "mentor-2",
    email: "mentor2@example.com",
  });
  identities.student = createIdentity({
    uid: "student-1",
    email: "student1@example.com",
  });
  identities.otherStudent = createIdentity({
    uid: "student-2",
    email: "student2@example.com",
  });

  const { mentor, otherMentor, student } = identities;
  const now = new Date("2026-07-22T09:00:00.000Z");

  await ownerSet(`mentorProfiles/${mentor.uid}`, {
    mentorUid: mentor.uid,
    role: "mentor",
    status: "active",
    email: mentor.email,
  });
  await ownerSet(`mentorProfiles/${otherMentor.uid}`, {
    mentorUid: otherMentor.uid,
    role: "mentor",
    status: "active",
    email: otherMentor.email,
  });
  await ownerSet(`mentorProfiles/${mentor.uid}/students/${student.uid}`, {
    linkId: `${mentor.uid}_${student.uid}`,
    mentorUid: mentor.uid,
    mentorName: "Mentor One",
    studentUid: student.uid,
    studentName: "Student One",
    studentEmail: student.email,
    status: "active",
  });
  await ownerSet(`learnerProfiles/${student.uid}`, {
    uid: student.uid,
    email: student.email,
    normalizedEmail: student.email,
    role: "student",
    name: "Student One",
  });
  await ownerSet(`studentEntitlements/${student.uid}/items/roadmap-access`, {
    id: "roadmap-access",
    uid: student.uid,
    status: "active",
    scopeType: "item",
    module: "roadmap",
    itemType: "roadmap",
    itemId: "roadmap-1",
    planType: "FREE",
    noExpiry: true,
    untilManualChange: false,
    accessFrom: null,
    accessUntil: null,
  });
  await ownerSet("studyRoadmapProgress/progress-1", {
    progressKey: "progress-1",
    userId: student.uid,
    roadmapId: "roadmap-1",
    dayId: "day-1",
    completedTaskIds: ["task-1"],
    progressPercent: 50,
  });
  await ownerSet("mentorAssignments/assignment-seed", {
    ...assignmentPayload({
      assignmentId: "assignment-seed",
      mentorUid: mentor.uid,
      studentUid: student.uid,
    }),
    createdAt: now,
    updatedAt: now,
  });
  await ownerSet("mentorFeedback/feedback-seed", {
    feedbackId: "feedback-seed",
    assignmentId: "assignment-seed",
    mentorUid: mentor.uid,
    studentUid: student.uid,
    message: "Continue with the next Roadmap day.",
    status: "published",
    createdAt: now,
    updatedAt: now,
  });
});

test.after(async () => {
  await Promise.all(
    Object.values(identities).map(async (identity) => {
      await terminate(identity.db);
      await deleteApp(identity.app);
    })
  );
});

test("active mentor can read own role profile", async () => {
  await assertAllowed(
    getDocument(`mentorProfiles/${identities.mentor.uid}`, identities.mentor),
    "mentor profile read"
  );
});



test("signed-in user can read only their own mentor profile document", async () => {
  await assertAllowed(
    getDocument(
      `mentorProfiles/${identities.student.uid}`,
      identities.student
    ),
    "own mentor profile lookup"
  );

  await assertDenied(
    getDocument(
      `mentorProfiles/${identities.mentor.uid}`,
      identities.student
    ),
    "cross-account mentor profile read"
  );
});

test("assigned mentor can query exact learner links", async () => {
  await assertAllowed(
    runQuery({
      collectionId: "students",
      parent: `mentorProfiles/${identities.mentor.uid}`,
      identity: identities.mentor,
      filters: [["status", "active"]],
    }),
    "mentor student link query"
  );
});

test("assigned mentor can read learner profile", async () => {
  await assertAllowed(
    getDocument(`learnerProfiles/${identities.student.uid}`, identities.mentor),
    "assigned learner profile"
  );
});

test("assigned mentor can read exact learner entitlements", async () => {
  await assertAllowed(
    runQuery({
      collectionId: "items",
      parent: `studentEntitlements/${identities.student.uid}`,
      identity: identities.mentor,
    }),
    "assigned learner entitlements"
  );
});

test("assigned mentor can query learner Roadmap progress", async () => {
  await assertAllowed(
    runQuery({
      collectionId: "studyRoadmapProgress",
      identity: identities.mentor,
      filters: [["userId", identities.student.uid]],
    }),
    "assigned learner Roadmap progress"
  );
});

test("unassigned mentor cannot read learner profile or entitlements", async () => {
  await assertDenied(
    getDocument(`learnerProfiles/${identities.student.uid}`, identities.otherMentor),
    "unassigned learner profile"
  );
  await assertDenied(
    runQuery({
      collectionId: "items",
      parent: `studentEntitlements/${identities.student.uid}`,
      identity: identities.otherMentor,
    }),
    "unassigned learner entitlements"
  );
});

test("assigned mentor can create an assignment only for verified access", async () => {
  const id = "assignment-create";
  await assertAllowed(
    commitWrite({
      path: `mentorAssignments/${id}`,
      identity: identities.mentor,
      data: assignmentPayload({
        assignmentId: id,
        mentorUid: identities.mentor.uid,
        studentUid: identities.student.uid,
      }),
      transformFields: ["createdAt", "updatedAt"],
    }),
    "valid assignment create"
  );
});

test("mentor cannot assign a resource whose access is missing", async () => {
  const id = "assignment-no-access";
  await assertDenied(
    commitWrite({
      path: `mentorAssignments/${id}`,
      identity: identities.mentor,
      data: assignmentPayload({
        assignmentId: id,
        mentorUid: identities.mentor.uid,
        studentUid: identities.student.uid,
        accessState: "GRANT_REQUIRED",
      }),
      transformFields: ["createdAt", "updatedAt"],
    }),
    "assignment without access"
  );
});

test("unassigned mentor cannot create an assignment", async () => {
  const id = "assignment-unassigned";
  await assertDenied(
    commitWrite({
      path: `mentorAssignments/${id}`,
      identity: identities.otherMentor,
      data: assignmentPayload({
        assignmentId: id,
        mentorUid: identities.otherMentor.uid,
        studentUid: identities.student.uid,
      }),
      transformFields: ["createdAt", "updatedAt"],
    }),
    "unassigned mentor assignment"
  );
});

test("student can query and complete own assignment", async () => {
  await assertAllowed(
    runQuery({
      collectionId: "mentorAssignments",
      identity: identities.student,
      filters: [["studentUid", identities.student.uid]],
    }),
    "student assignment query"
  );

  await assertAllowed(
    commitWrite({
      path: "mentorAssignments/assignment-seed",
      identity: identities.student,
      data: { status: "completed" },
      updateMask: ["status"],
      transformFields: ["completedAt", "updatedAt"],
    }),
    "student assignment completion"
  );
});

test("other student cannot read the assignment", async () => {
  await assertDenied(
    getDocument("mentorAssignments/assignment-seed", identities.otherStudent),
    "cross-student assignment read"
  );
});

test("assigned mentor can create an exact access request but cannot grant access", async () => {
  await assertAllowed(
    commitWrite({
      path: "mentorAccessRequests/request-1",
      identity: identities.mentor,
      data: {
        requestId: "request-1",
        mentorUid: identities.mentor.uid,
        studentUid: identities.student.uid,
        resourceId: "video-1",
        resourceType: "video",
        moduleKey: "video",
        itemType: "video",
        title: "Recorded lesson",
        canonicalRoute: "/ctet-tet/videos/watch/video-1",
        status: "pending",
        reason: "Required for remediation.",
        accessId: null,
        resolvedAt: null,
        resolvedBy: null,
      },
      transformFields: ["createdAt", "updatedAt"],
    }),
    "exact access request"
  );

  await assertDenied(
    commitWrite({
      path: "studentAccess/illegal-mentor-grant",
      identity: identities.mentor,
      data: {
        uid: identities.student.uid,
        status: "active",
        scopeType: "plan",
        planType: "MENTORSHIP",
      },
    }),
    "mentor broad grant"
  );
});

test("assigned mentor can publish feedback for own assignment", async () => {
  await assertAllowed(
    commitWrite({
      path: "mentorFeedback/feedback-create",
      identity: identities.mentor,
      data: {
        feedbackId: "feedback-create",
        assignmentId: "assignment-seed",
        mentorUid: identities.mentor.uid,
        studentUid: identities.student.uid,
        message: "Good progress. Continue with Day 2.",
        status: "published",
      },
      transformFields: ["createdAt", "updatedAt"],
    }),
    "mentor feedback create"
  );
});

test("student can query feedback for own assignment", async () => {
  const snapshot = await assertAllowed(
    runQuery({
      collectionId: "mentorFeedback",
      identity: identities.student,
      filters: [
        ["assignmentId", "assignment-seed"],
        ["studentUid", identities.student.uid],
      ],
    }),
    "student feedback query"
  );
  assert.ok(snapshot.docs.length > 0);
});

test("admin can provision mentor role and exact student ownership", async () => {
  const mentorUid = identities.otherMentor.uid;
  await assertAllowed(
    commitWrite({
      path: `mentorProfiles/${mentorUid}`,
      identity: identities.admin,
      data: {
        mentorUid,
        role: "mentor",
        status: "active",
        email: identities.otherMentor.email,
      },
    }),
    "admin mentor profile write"
  );
  await assertAllowed(
    commitWrite({
      path: `mentorProfiles/${mentorUid}/students/${identities.student.uid}`,
      identity: identities.admin,
      data: {
        linkId: `${mentorUid}_${identities.student.uid}`,
        mentorUid,
        studentUid: identities.student.uid,
        status: "active",
      },
    }),
    "admin mentor-student link write"
  );
});
