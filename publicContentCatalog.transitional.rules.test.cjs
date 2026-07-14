"use strict";

const fs = require("fs");

const {
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

const liveRules = fs.readFileSync(
  "firestore.live.rules",
  "utf8"
);
const transitionalRules = fs.readFileSync(
  "firestore.transitional.rules",
  "utf8"
);

const planned = [];
let passed = 0;
let failed = 0;

const record = (name, ok, detail = "") => {
  planned.push(name);

  if (ok) {
    passed += 1;
    console.log(`PASS | ${name}`);
    return;
  }

  failed += 1;
  console.log(
    `FAIL | ${name}${detail ? ` | ${detail}` : ""}`
  );
};

const outcome = async (promise) => {
  try {
    await promise;
    return "ALLOW";
  } catch (_error) {
    return "DENY";
  }
};

const seed = async (environment) => {
  await environment.withSecurityRulesDisabled(
    async (context) => {
      const db = context.firestore();

      await setDoc(
        doc(db, "contentItems", "legacy-public-item"),
        {
          id: "legacy-public-item",
          status: "published",
          type: "notes",
          title: "Legacy public item",
        }
      );

      await setDoc(
        doc(
          db,
          "contentItemsPublic",
          "canonical-public-item"
        ),
        {
          id: "canonical-public-item",
          sourceCollection: "contentItems",
          sourceId: "canonical-public-item",
          status: "published",
          publicSchemaVersion: 1,
          type: "notes",
          title: "Canonical public item",
          hasProtectedAsset: false,
          hasProtectedAnswers: false,
        }
      );

      await setDoc(
        doc(
          db,
          "contentItemsPublic",
          "malformed-public-item"
        ),
        {
          id: "wrong-id",
          sourceCollection: "contentItems",
          sourceId: "malformed-public-item",
          status: "published",
          publicSchemaVersion: 1,
          title: "Malformed public item",
        }
      );
    }
  );
};

const rawProbe = async (environment, suffix) => {
  const guestDb = environment
    .unauthenticatedContext()
    .firestore();

  const studentDb = environment
    .authenticatedContext(
      `student-${suffix}`,
      {
        email: `student-${suffix}@example.invalid`,
      }
    )
    .firestore();

  return {
    guestGet: await outcome(
      getDoc(
        doc(
          guestDb,
          "contentItems",
          "legacy-public-item"
        )
      )
    ),
    studentGet: await outcome(
      getDoc(
        doc(
          studentDb,
          "contentItems",
          "legacy-public-item"
        )
      )
    ),
    guestList: await outcome(
      getDocs(collection(guestDb, "contentItems"))
    ),
    studentList: await outcome(
      getDocs(collection(studentDb, "contentItems"))
    ),
    guestCreate: await outcome(
      setDoc(
        doc(
          guestDb,
          "contentItems",
          `guest-create-${suffix}`
        ),
        {
          id: `guest-create-${suffix}`,
          status: "published",
        }
      )
    ),
    studentCreate: await outcome(
      setDoc(
        doc(
          studentDb,
          "contentItems",
          `student-create-${suffix}`
        ),
        {
          id: `student-create-${suffix}`,
          status: "published",
        }
      )
    ),
  };
};

(async () => {
  const unique = Date.now();

  const liveEnvironment =
    await initializeTestEnvironment({
      projectId: `aspirenest-live-parity-${unique}`,
      firestore: {
        rules: liveRules,
      },
    });

  const transitionalEnvironment =
    await initializeTestEnvironment({
      projectId:
        `aspirenest-transitional-parity-${unique}`,
      firestore: {
        rules: transitionalRules,
      },
    });

  try {
    await seed(liveEnvironment);
    await seed(transitionalEnvironment);

    const liveProbe = await rawProbe(
      liveEnvironment,
      "live"
    );
    const transitionalProbe = await rawProbe(
      transitionalEnvironment,
      "transitional"
    );

    for (const key of [
      "guestGet",
      "studentGet",
      "guestList",
      "studentList",
      "guestCreate",
      "studentCreate",
    ]) {
      record(
        `transitional raw ${key} matches live production behavior`,
        transitionalProbe[key] === liveProbe[key],
        `live=${liveProbe[key]}, transitional=${transitionalProbe[key]}`
      );
    }

    const guestDb = transitionalEnvironment
      .unauthenticatedContext()
      .firestore();

    const studentDb = transitionalEnvironment
      .authenticatedContext(
        "student-public",
        {
          email: "student-public@example.invalid",
        }
      )
      .firestore();

    record(
      "guest can read canonical public catalog document",
      (
        await outcome(
          getDoc(
            doc(
              guestDb,
              "contentItemsPublic",
              "canonical-public-item"
            )
          )
        )
      ) === "ALLOW"
    );

    record(
      "guest cannot read malformed public catalog document",
      (
        await outcome(
          getDoc(
            doc(
              guestDb,
              "contentItemsPublic",
              "malformed-public-item"
            )
          )
        )
      ) === "DENY"
    );

    const canonicalQuery = query(
      collection(guestDb, "contentItemsPublic"),
      where(
        "sourceCollection",
        "==",
        "contentItems"
      ),
      where("status", "==", "published"),
      where("publicSchemaVersion", "==", 1)
    );

    record(
      "guest can list public catalog with canonical constraints",
      (
        await outcome(getDocs(canonicalQuery))
      ) === "ALLOW"
    );

    record(
      "guest cannot list public catalog without canonical constraints",
      (
        await outcome(
          getDocs(
            collection(
              guestDb,
              "contentItemsPublic"
            )
          )
        )
      ) === "DENY"
    );

    record(
      "student cannot write public catalog",
      (
        await outcome(
          setDoc(
            doc(
              studentDb,
              "contentItemsPublic",
              "student-write"
            ),
            {
              id: "student-write",
              sourceCollection: "contentItems",
              sourceId: "student-write",
              status: "published",
              publicSchemaVersion: 1,
            }
          )
        )
      ) === "DENY"
    );
  } finally {
    await liveEnvironment.cleanup();
    await transitionalEnvironment.cleanup();
  }

  console.log();
  console.log(`PLANNED=${planned.length}`);
  console.log(`PASSED=${passed}`);
  console.log(`FAILED=${failed}`);
  console.log(
    `DECISION=${failed === 0 ? "GREEN" : "BLOCKED"}`
  );

  process.exit(failed === 0 ? 0 : 2);
})().catch((error) => {
  console.error(error);
  console.log("FAILED=1");
  console.log("DECISION=BLOCKED");
  process.exit(2);
});
