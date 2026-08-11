const fs = require("node:fs");
const path = require("node:path");
const {
  after,
  before,
  beforeEach,
  test,
} = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-lp2-rules-test";
const RULES = fs.readFileSync(
  path.join(__dirname, "..", "..", "firestore.rules"),
  "utf8",
);

let env;

const emulatorAddress = () => {
  const value = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, rawPort] = value.split(":");
  return { host, port: Number(rawPort) };
};

const authDb = (uid, token = {}) =>
  env.authenticatedContext(uid, token).firestore();

const seed = (fn) => env.withSecurityRulesDisabled(
  async (ctx) => fn(ctx.firestore()),
);

before(async () => {
  const { host, port } = emulatorAddress();
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host, port, rules: RULES },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  if (env) await env.cleanup();
});

test("student cannot create or update role, plan, entitlement, or account authority", async () => {
  const uid = "student-1";
  const email = "student1@example.invalid";
  const db = authDb(uid, { email, email_verified: true, auth_time: 100 });

  await assertFails(setDoc(doc(db, "users", uid), {
    uid,
    email,
    normalizedEmail: email,
    role: "admin",
  }));

  await assertSucceeds(setDoc(doc(db, "users", uid), {
    uid,
    email,
    normalizedEmail: email,
    role: "student",
    premiumStatus: "FREE",
  }));

  await assertFails(updateDoc(doc(db, "users", uid), {
    role: "admin",
  }));

  await assertFails(updateDoc(doc(db, "users", uid), {
    premiumStatus: "PREMIUM",
  }));

  await seed((adminDb) => setDoc(doc(adminDb, "students", uid), {
    uid,
    email,
    normalizedEmail: email,
    role: "student",
    emailVerified: true,
    accountStatus: "active",
  }));

  await assertFails(updateDoc(doc(db, "students", uid), {
    accountStatus: "blocked",
  }));

  await assertFails(updateDoc(doc(db, "students", uid), {
    emailVerified: false,
  }));
});

test("learner profile writes are server/Admin owned while Student keeps owner read", async () => {
  const uid = "student-2";
  const email = "student2@example.invalid";
  const student = authDb(uid, { email, email_verified: true, auth_time: 100 });
  const admin = authDb("founder", {
    email: "aspirenestplatform@gmail.com",
    email_verified: true,
    auth_time: 100,
  });

  await assertFails(setDoc(doc(student, "learnerProfiles", uid), {
    uid,
    email,
    normalizedEmail: email,
    role: "student",
    fullName: "Student Two",
  }));

  await assertSucceeds(setDoc(doc(admin, "learnerProfiles", uid), {
    uid,
    email,
    normalizedEmail: email,
    role: "student",
    fullName: "Student Two",
  }));

  await assertSucceeds(getDoc(doc(student, "learnerProfiles", uid)));
  await assertFails(updateDoc(doc(student, "learnerProfiles", uid), {
    role: "admin",
  }));
});

test("dynamic Admin requires active server authority plus matching custom claims", async () => {
  const uid = "admin-dynamic";
  const email = "admin.dynamic@example.invalid";

  await seed(async (db) => {
    await setDoc(doc(db, "roleAuthorities", uid), {
      uid,
      role: "admin",
      accountStatus: "active",
      authorityVersion: 3,
      tokensValidAfterSeconds: 50,
    });
  });

  const mismatch = authDb(uid, {
    email,
    email_verified: true,
    auth_time: 100,
    aspirenestRole: "student",
    aspirenestAccountStatus: "active",
    aspirenestAuthorityVersion: 3,
  });
  await assertFails(setDoc(doc(mismatch, "users", "other"), {
    uid: "other",
    email: "other@example.invalid",
  }));

  const admin = authDb(uid, {
    email,
    email_verified: true,
    auth_time: 100,
    aspirenestRole: "admin",
    aspirenestAccountStatus: "active",
    aspirenestAuthorityVersion: 3,
  });
  await assertSucceeds(setDoc(doc(admin, "users", "other"), {
    uid: "other",
    email: "other@example.invalid",
  }));
});

test("blocked or pre-revocation sessions fail closed at Firestore", async () => {
  const uid = "student-revoked";
  const email = "revoked@example.invalid";

  await seed(async (db) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      normalizedEmail: email,
      role: "student",
    });
    await setDoc(doc(db, "roleAuthorities", uid), {
      uid,
      role: "student",
      accountStatus: "active",
      authorityVersion: 1,
      tokensValidAfterSeconds: 200,
    });
  });

  const stale = authDb(uid, {
    email,
    email_verified: true,
    auth_time: 100,
  });
  await assertFails(getDoc(doc(stale, "users", uid)));

  const fresh = authDb(uid, {
    email,
    email_verified: true,
    auth_time: 300,
  });
  await assertSucceeds(getDoc(doc(fresh, "users", uid)));

  await seed((db) => setDoc(doc(db, "roleAuthorities", uid), {
    uid,
    role: "student",
    accountStatus: "blocked",
    authorityVersion: 2,
    tokensValidAfterSeconds: 0,
  }));

  const blocked = authDb(uid, {
    email,
    email_verified: true,
    auth_time: 500,
  });
  await assertFails(getDoc(doc(blocked, "users", uid)));
});

test("role authority and device-session documents are client read-only", async () => {
  const uid = "student-device";
  const email = "device@example.invalid";

  await seed(async (db) => {
    await setDoc(doc(db, "roleAuthorities", uid), {
      uid,
      role: "student",
      accountStatus: "active",
      authorityVersion: 1,
      tokensValidAfterSeconds: 0,
    });
    await setDoc(doc(db, "accountDeviceSessions", `${uid}_abc`), {
      uid,
      deviceKey: "abc",
      platform: "Windows",
      browser: "Chrome",
    });
  });

  const student = authDb(uid, { email, email_verified: true, auth_time: 100 });
  await assertSucceeds(getDoc(doc(student, "roleAuthorities", uid)));
  await assertFails(setDoc(doc(student, "roleAuthorities", uid), {
    uid,
    role: "admin",
    accountStatus: "active",
    authorityVersion: 99,
  }));

  await assertSucceeds(getDoc(doc(student, "accountDeviceSessions", `${uid}_abc`)));
  await assertFails(setDoc(doc(student, "accountDeviceSessions", `${uid}_x`), {
    uid,
    deviceKey: "x",
  }));
});

console.log("LP2_IDENTITY_RULES=GREEN");
