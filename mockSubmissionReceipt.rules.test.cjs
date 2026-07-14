const fs = require("fs");
const path = require("path");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");

const {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-mock-answer-receipt-test-v4";
const RULES = fs.readFileSync(
  path.resolve(__dirname, "firestore.rules"),
  "utf8"
);

const now = Date.now();
const accessFrom = Timestamp.fromMillis(now - 60 * 60 * 1000);
const accessUntil = Timestamp.fromMillis(now + 60 * 60 * 1000);

const tests = [];

const defineTest = (name, run) => {
  tests.push({ name, run });
};

const receiptRef = (db, uid, testId) =>
  doc(db, "mockSubmissionReceipts", uid, "tests", testId);

const assetRef = (db, testId) =>
  doc(db, "protectedContentAssets", `contentItems__${testId}`);

const receiptPayload = (
  uid,
  testId,
  attemptKey = "attempt-1",
  assetId = `contentItems__${testId}`
) => ({
  uid,
  testId,
  assetId,
  sourceCollection: "contentItems",
  status: "submitted",
  attemptKey,
  startedAt: now - 1000,
  submittedAt: serverTimestamp(),
  reason: "student_submit",
  schemaVersion: 1,
  updatedAt: serverTimestamp(),
});

const planAccess = (uid, planType) => ({
  uid,
  email: `${uid}@example.test`,
  normalizedEmail: `${uid}@example.test`,
  planType,
  scopeType: "plan",
  module: null,
  itemType: null,
  itemId: null,
  itemIds: [],
  bundleId: null,
  course: "CTET_TET",
  status: "active",
  source: "rules_test",
  accessFrom,
  accessUntil,
  validityMode: "fixed_window",
  validityPolicy: "fixed_window",
});

const planEntitlement = (uid, accessId, planType) => ({
  id: `plan_${planType}`,
  uid,
  email: `${uid}@example.test`,
  normalizedEmail: `${uid}@example.test`,
  accessId,
  planType,
  scopeType: "plan",
  module: null,
  itemType: null,
  itemId: null,
  itemIds: [],
  bundleId: null,
  course: "CTET_TET",
  status: "active",
  source: "rules_test",
  accessFrom,
  accessUntil,
  validityMode: "fixed_window",
  validityPolicy: "fixed_window",
  authorizationSchemaVersion: 2,
  updatedAt: Timestamp.fromMillis(now),
});

const seed = async (testEnv) => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(assetRef(db, "free-test"), {
      id: "contentItems__free-test",
      status: "published",
      sourceCollection: "contentItems",
      sourceId: "free-test",
      planType: "FREE",
      requiredEntitlementId: "",
      directAssets: {},
      answerEntries: [
        {
          path: "questions[0].answer",
          value: "option1",
        },
      ],
    });

    await setDoc(assetRef(db, "premium-test"), {
      id: "contentItems__premium-test",
      status: "published",
      sourceCollection: "contentItems",
      sourceId: "premium-test",
      planType: "PREMIUM",
      requiredEntitlementId: "plan_PREMIUM",
      directAssets: {},
      answerEntries: [
        {
          path: "questions[0].answer",
          value: "option2",
        },
      ],
    });

    await setDoc(assetRef(db, "free-asset"), {
      id: "contentItems__free-asset",
      status: "published",
      sourceCollection: "contentItems",
      sourceId: "free-asset",
      planType: "FREE",
      requiredEntitlementId: "",
      directAssets: {
        pdfUrl: "https://example.test/free.pdf",
      },
      answerEntries: [],
    });

    await setDoc(assetRef(db, "free-asset-missing-policy"), {
      id: "contentItems__free-asset-missing-policy",
      status: "published",
      sourceCollection: "contentItems",
      sourceId: "free-asset-missing-policy",
      planType: "FREE",
      directAssets: {
        pdfUrl: "https://example.test/free-missing.pdf",
      },
      answerEntries: [],
    });
  });
};

defineTest("guest cannot read an answer mirror", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(assetRef(db, "free-test")));
});

defineTest(
  "signed-in FREE learner cannot read answers before receipt",
  async (testEnv) => {
    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertFails(getDoc(assetRef(db, "free-test")));
  }
);

defineTest(
  "signed-in FREE learner can create own receipt and then read answers",
  async (testEnv) => {
    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertSucceeds(
      setDoc(
        receiptRef(db, "student-a", "free-test"),
        receiptPayload("student-a", "free-test"),
        { merge: true }
      )
    );

    await assertSucceeds(getDoc(assetRef(db, "free-test")));
  }
);

defineTest("learner cannot forge another UID receipt", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("student-a", {
      email: "student-a@example.test",
    })
    .firestore();

  await assertFails(
    setDoc(
      receiptRef(db, "student-b", "free-test"),
      receiptPayload("student-b", "free-test"),
      { merge: true }
    )
  );
});

defineTest("learner cannot read another learner receipt", async (testEnv) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      receiptRef(context.firestore(), "student-b", "free-test"),
      {
        ...receiptPayload("student-b", "free-test"),
        submittedAt: Timestamp.fromMillis(now),
        updatedAt: Timestamp.fromMillis(now),
      }
    );
  });

  const db = testEnv
    .authenticatedContext("student-a", {
      email: "student-a@example.test",
    })
    .firestore();

  await assertFails(
    getDoc(receiptRef(db, "student-b", "free-test"))
  );
});

defineTest(
  "PREMIUM learner without entitlement cannot create receipt",
  async (testEnv) => {
    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertFails(
      setDoc(
        receiptRef(db, "student-a", "premium-test"),
        receiptPayload("student-a", "premium-test"),
        { merge: true }
      )
    );
  }
);

defineTest(
  "PREMIUM learner with matching fixed-window entitlement can submit and read",
  async (testEnv) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const accessId = "access-premium";

      await setDoc(
        doc(db, "studentAccess", accessId),
        planAccess("student-a", "PREMIUM")
      );

      await setDoc(
        doc(
          db,
          "studentEntitlements",
          "student-a",
          "items",
          "plan_PREMIUM"
        ),
        planEntitlement("student-a", accessId, "PREMIUM")
      );
    });

    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertSucceeds(
      setDoc(
        receiptRef(db, "student-a", "premium-test"),
        receiptPayload("student-a", "premium-test"),
        { merge: true }
      )
    );

    await assertSucceeds(getDoc(assetRef(db, "premium-test")));
  }
);

defineTest(
  "answer receipt cannot be created with mismatched testId field",
  async (testEnv) => {
    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertFails(
      setDoc(
        receiptRef(db, "student-a", "free-test"),
        receiptPayload("student-a", "other-test"),
        { merge: true }
      )
    );
  }
);

defineTest(
  "answer receipt cannot point to another protected asset",
  async (testEnv) => {
    const db = testEnv
      .authenticatedContext("student-a", {
        email: "student-a@example.test",
      })
      .firestore();

    await assertFails(
      setDoc(
        receiptRef(db, "student-a", "free-test"),
        receiptPayload(
          "student-a",
          "free-test",
          "attempt-1",
          "contentItems__premium-test"
        ),
        { merge: true }
      )
    );
  }
);

defineTest(
  "non-answer FREE asset remains readable without receipt",
  async (testEnv) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(assetRef(db, "free-asset")));
  }
);

defineTest(
  "non-answer FREE asset remains readable when exact policy field is absent",
  async (testEnv) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(
      getDoc(assetRef(db, "free-asset-missing-policy"))
    );
  }
);

const main = async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: RULES,
    },
  });

  let passed = 0;
  let failed = 0;

  try {
    for (const testCase of tests) {
      await seed(testEnv);

      try {
        await testCase.run(testEnv);
        passed += 1;
        console.log(`PASS | ${testCase.name}`);
      } catch (error) {
        failed += 1;
        console.error(`FAIL | ${testCase.name}`);
        console.error(error?.stack || error);
      }
    }
  } finally {
    await testEnv.cleanup();
  }

  console.log();
  console.log(`PLANNED=${tests.length}`);
  console.log(`PASSED=${passed}`);
  console.log(`FAILED=${failed}`);
  console.log(
    `DECISION=${failed === 0 ? "GREEN" : "BLOCKED"}`
  );

  process.exitCode = failed === 0 ? 0 : 2;
};

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 2;
});
