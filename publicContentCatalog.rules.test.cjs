const fs = require("fs");
const path = require("path");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");

const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-public-content-catalog-test-v1";
const RULES = fs.readFileSync(
  path.resolve(__dirname, "firestore.rules"),
  "utf8"
);

const tests = [];
const defineTest = (name, run) => tests.push({ name, run });

const publicPayload = (id, overrides = {}) => ({
  id,
  sourceCollection: "contentItems",
  sourceId: id,
  status: "published",
  publicSchemaVersion: 1,
  title: "Public Content",
  section: "notes",
  planType: "FREE",
  ...overrides,
});

const seed = async (testEnv) => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "contentItems", "raw-1"), {
      title: "Raw Content",
      status: "published",
      fileUrl: "https://example.test/private.pdf",
    });

    await setDoc(
      doc(db, "contentItemsPublic", "public-1"),
      publicPayload("public-1")
    );

    await setDoc(
      doc(db, "contentItemsPublic", "malformed-1"),
      publicPayload("other-id")
    );
  });
};

defineTest("guest can get a canonical published public document", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "contentItemsPublic", "public-1")));
});

defineTest("guest cannot get a malformed public document", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "contentItemsPublic", "malformed-1")));
});

defineTest("guest can list the canonical published public catalog", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  const publicQuery = query(
    collection(db, "contentItemsPublic"),
    where("status", "==", "published"),
    where("sourceCollection", "==", "contentItems"),
    where("publicSchemaVersion", "==", 1)
  );

  await assertSucceeds(getDocs(publicQuery));
});

defineTest("guest cannot list public catalog without canonical query constraints", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  const incompleteQuery = query(
    collection(db, "contentItemsPublic"),
    where("status", "==", "published")
  );

  await assertFails(getDocs(incompleteQuery));
});

defineTest("guest cannot read raw contentItems", async (testEnv) => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "contentItems", "raw-1")));
});

defineTest("signed-in student cannot read raw contentItems", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("student-a", {
      email: "student-a@example.test",
    })
    .firestore();

  await assertFails(getDoc(doc(db, "contentItems", "raw-1")));
});

defineTest("signed-in student cannot write public catalog", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("student-a", {
      email: "student-a@example.test",
    })
    .firestore();

  await assertFails(
    setDoc(
      doc(db, "contentItemsPublic", "student-write"),
      publicPayload("student-write")
    )
  );
});

defineTest("admin can read raw contentItems", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("admin-a", {
      email: "aspirenestplatform@gmail.com",
    })
    .firestore();

  await assertSucceeds(getDoc(doc(db, "contentItems", "raw-1")));
});

defineTest("admin can write canonical public catalog", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("admin-a", {
      email: "aspirenestplatform@gmail.com",
    })
    .firestore();

  await assertSucceeds(
    setDoc(
      doc(db, "contentItemsPublic", "admin-write"),
      publicPayload("admin-write")
    )
  );
});

defineTest("admin cannot write malformed public catalog", async (testEnv) => {
  const db = testEnv
    .authenticatedContext("admin-a", {
      email: "aspirenestplatform@gmail.com",
    })
    .firestore();

  await assertFails(
    setDoc(
      doc(db, "contentItemsPublic", "admin-malformed"),
      publicPayload("different-id")
    )
  );
});

const main = async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES },
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
  console.log(`DECISION=${failed === 0 ? "GREEN" : "BLOCKED"}`);
  process.exitCode = failed === 0 ? 0 : 2;
};

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 2;
});
