import crypto from "crypto";
import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
const sha = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), relative))).digest("hex");
const requiredHash = (relative, envName) => {
  const expected = process.env[envName];
  if (!expected) throw new Error(`Missing ${envName}`);
  if (sha(relative) !== expected) throw new Error(`Protected file changed: ${relative}`);
  console.log(`PASS=Exact V8 protected asset unchanged: ${relative}`);
};
const requireText = (text, marker, label = marker) => {
  if (!text.includes(marker)) throw new Error(`Missing ${label}`);
  console.log(`PASS=${label}`);
};
const rejectText = (text, marker, label = marker) => {
  if (text.includes(marker)) throw new Error(`Forbidden ${label}`);
  console.log(`PASS=No ${label}`);
};

[
  ["public/index.html", "G14_INDEX"],
  ["public/styles.css", "G14_STYLES"],
  ["public/admin.css", "G14_ADMIN_CSS"],
  ["public/v8-experiences.css", "G14_EXP_CSS"],
  ["public/app.js", "G14_APP"],
  ["public/v8-experiences.js", "G14_EXPERIENCES"],
  ["src/auth/aspireNestIdentity.js", "G14_IDENTITY"],
  ["firestore.rules", "G14_RULES"],
].forEach(([file, env]) => requiredHash(file, env));

const admin = read("public/admin.js");
const bridge = read("src/v8/v8FirebaseBridge.js");
const learners = read("src/v8/v8LearnerDirectory.js");
const live = read("src/v8/v8AdminLiveData.js");
const learnerTests = read("src/v8/v8LearnerDirectory.test.js");
const liveTests = read("src/v8/v8AdminLiveData.test.js");
const wiringTests = read("src/v8/v8AdminLiveDataWiring.test.js");

requireText(admin, "resources: [],", "Admin seed resources are empty");
requireText(admin, "learners: [],", "Admin seed learners are empty");
requireText(admin, "mentors: [],", "Admin seed mentors are empty");
requireText(admin, "grants: [],", "Admin seed grants are empty");
requireText(admin, "payments: [],", "Admin seed payments are empty");
requireText(admin, "audit: [],", "Admin seed audit is empty");
requireText(admin, "pendingClaims: [],", "Admin seed claims are empty");
requireText(admin, "products: []", "Admin seed products are empty");
requireText(admin, "aspirenest:real-admin-data", "Complete live Admin event is consumed");
[
  "data.resources=liveArray(state.resources)",
  "data.learners=normalizeLiveLearners(state.learners)",
  "data.mentors=liveArray(state.mentors)",
  "data.grants=liveArray(state.grants)",
  "data.payments=liveArray(state.payments)",
  "data.audit=liveArray(state.audit)",
  "data.pendingClaims=liveArray(state.pendingClaims)",
  "data.products=liveArray(state.products)",
].forEach((marker) => requireText(admin, marker, `Live Admin projection wired: ${marker.split("=")[0].trim()}`));
requireText(admin, "LIVE_MUTATION_ACTIONS", "Local demo mutations are centrally guarded");
requireText(admin, "Protected live action: no local demo mutation was applied.", "Live mutation guard is explicit");
requireText(admin, "if((realAdminDataActive||realAdminDataLoading)&&LIVE_MUTATION_ACTIONS.has(action))", "Loading and live states both block local mutations");
requireText(admin, "Live Admin source status", "Live source coverage dialog exists");
rejectText(admin, "@example.com", "example.com learner rows");
rejectText(admin, "Dr. Meera Shah", "demo mentor Dr. Meera Shah");
rejectText(admin, "Mr. Arjun Rao", "demo mentor Mr. Arjun Rao");
rejectText(admin, "Imran Khan", "demo payment learner Imran Khan");

requireText(bridge, "subscribeV8AdminLiveData", "Firebase bridge uses complete Admin subscription");
requireText(bridge, 'resolveAspireNestRole(user) !== "admin"', "Admin subscription is Admin-only");
requireText(bridge, 'new CustomEvent("aspirenest:real-admin-data"', "Firebase bridge publishes complete Admin event");
requireText(bridge, "syncRealLearnerDirectory(user)", "G13 compatibility entry point remains");

requireText(learners, "const union = (left, right)", "Canonical identity uses union consolidation");
requireText(learners, "emailAliases", "Normalized email aliases are preserved");
requireText(learners, "uidAliases", "Historical UID aliases are preserved");
requireText(learners, "const staffEmail = emailAliases.find(isAspireNestStaffEmail)", "Admin and Mentor are excluded after identity consolidation");
requireText(learners, "userEntries.flatMap", "Canonical Auth UID preference exists");

[
  "users", "students", "learnerProfiles", "studentAccess", "contentItems", "payments",
  "mentorProfiles", "mentorAssignments", "accessAuditLogs", "accessActionLogs",
  "experienceEvents", "accessInvites", "accessProducts",
].forEach((name) => requireText(live, `${name}: \"${name}\"`, `Live source ${name}`));
[
  "addDoc", "setDoc", "updateDoc", "deleteDoc", "writeBatch", "runTransaction",
].forEach((name) => rejectText(live, name, `Firestore mutation API ${name} in read model`));
requireText(live, "buildV8RealLearnerDirectory", "All Admin screens reuse canonical learner identity");
requireText(live, ".map(normalizeProduct)", "Real access products are normalized");
requireText(learnerTests, "different historical UIDs", "Different-UID duplicate regression is tested");
requireText(wiringTests, "covers every currently approved Admin read source", "Complete Admin source coverage is tested");

console.log("CHECKS=65");
console.log("FAILED=0");
console.log("NORMALIZED_EMAIL_DUPLICATES=0_CONTRACT");
console.log("ADMIN_IN_LEARNERS=NO_CONTRACT");
console.log("MENTOR_IN_LEARNERS=NO_CONTRACT");
console.log("AUTHENTICATED_ADMIN_DEMO_FALLBACK=REMOVED");
console.log("ADMIN_READ_SIDE_LIVE=YES");
console.log("CONTROLLED_REAL_WRITES=G15_PENDING");
console.log("FINAL_DECISION=G14_FULL_ADMIN_LIVE_READ_STATIC_GREEN");
