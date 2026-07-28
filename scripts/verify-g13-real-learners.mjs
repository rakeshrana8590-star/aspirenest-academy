import crypto from "node:crypto";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const sha = (path) => crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const checks = [];
const pass = (name, condition) => {
  checks.push({ name, condition: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}=${name}`);
};

const locked = {
  "public/index.html": process.env.G13_INDEX,
  "public/styles.css": process.env.G13_STYLES,
  "public/admin.css": process.env.G13_ADMIN_CSS,
  "public/v8-experiences.css": process.env.G13_EXP_CSS,
  "public/app.js": process.env.G13_APP,
  "public/v8-experiences.js": process.env.G13_EXPERIENCES,
  "src/auth/aspireNestIdentity.js": process.env.G13_IDENTITY,
  "firestore.rules": process.env.G13_RULES,
};

for (const [path, expected] of Object.entries(locked)) {
  pass(`Locked source unchanged: ${path}`, Boolean(expected) && sha(path) === expected);
}

const admin = read("public/admin.js");
const bridge = read("src/v8/v8FirebaseBridge.js");
const directory = read("src/v8/v8LearnerDirectory.js");
const rules = read("firestore.rules");

pass("Exact V8 Learners table preserved", admin.includes("Identity-linked profiles, exact access, progress, results and mentor assignment in one Drive workspace."));
pass("Real learner event replaces in-memory smoke rows", admin.includes("aspirenest:real-learner-directory") && admin.includes("applyRealLearnerDirectory"));
pass("Real learners are not persisted into V8 local smoke storage", !admin.includes("store.setItem(STORAGE_KEY,JSON.stringify(state.learners))"));
pass("Admin-only Firestore directory subscription", bridge.includes('resolveAspireNestRole(user) !== "admin"') && bridge.includes("subscribeV8RealLearnerDirectory"));
pass("Admin runtime receives latest directory even when script order differs", bridge.includes("aspirenest:admin-runtime-ready") && bridge.includes("__aspirenestRealLearnerDirectory"));
pass("users collection is read", directory.includes('watch("users", "users")'));
pass("students collection is read", directory.includes('watch("students", "students")'));
pass("learnerProfiles collection is read", directory.includes('watch("learnerProfiles", "profiles")'));
pass("studentAccess collection is read", directory.includes('watch("studentAccess", "accessRecords")'));
pass("Admin and Mentor are excluded from learners", directory.includes("isAspireNestStaffEmail"));
pass("UID and email identity merge exists", directory.includes("uidKey") && directory.includes("emailKey"));
pass("Real plan and access count projection exists", directory.includes("effectivePlan") && directory.includes("accessCount"));
pass("Real progress mentor and last-active mapping exists", directory.includes("progressOf") && directory.includes("mentorOf") && directory.includes("formatLastActive"));
pass("Realtime listener exists", directory.includes("onSnapshot"));
pass("Directory module is read-only", !["setDoc(", "addDoc(", "updateDoc(", "deleteDoc(", "writeBatch("].some((marker) => directory.includes(marker)));
pass("Existing Admin read rules cover directory", ["match /students/{docId}", "match /users/{userId}", "match /learnerProfiles/{profileId}", "match /studentAccess/{docId}"].every((marker) => rules.includes(marker)));
pass("No iframe integration", !bridge.includes("iframe") && !admin.includes("createElement('iframe')"));
pass("No Shadow DOM integration", !bridge.includes("attachShadow") && !admin.includes("attachShadow"));

const failed = checks.filter((item) => !item.condition);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
if (failed.length) process.exit(1);
console.log("FINAL_DECISION=G13_REAL_FIRESTORE_LEARNERS_STATIC_GREEN");
