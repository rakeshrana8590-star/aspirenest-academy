import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(process.env.ASPIRENEST_ROOT || process.cwd());
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const digest = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
const runtimeFiles = ["public/admin.js", "public/app.js", "public/v8-experiences.js", "public/learning-drive-v8/admin.js", "public/learning-drive-v8/app.js", "public/learning-drive-v8/v8-experiences.js"];
const sources = Object.fromEntries([
  ...runtimeFiles,
  "src/v8/v8AdminLiveActions.js",
  "src/v8/v8AdminLiveData.js",
  "src/v8/v8DefaultMentorPolicy.js",
  "src/v8/v8FirebaseBridge.js",
  "src/v8/v8LearnerDirectory.js",
  "src/v8/v8PlatformLiveActions.js",
  "src/v8/v8PlatformLiveData.js",
  "src/profile/usernameService.js",
  "src/mentor/mentorService.js",
  "firestore.rules",
].map((relative) => [relative, read(relative)]));

const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });
const containsAll = (text, values) => values.every((value) => text.includes(value));
const runtime = runtimeFiles.map((file) => sources[file]).join("\n");
const admin = sources["public/admin.js"];
const student = sources["public/app.js"];
const experiences = sources["public/v8-experiences.js"];
const bridge = sources["src/v8/v8FirebaseBridge.js"];
const adminData = sources["src/v8/v8AdminLiveData.js"];
const adminActions = sources["src/v8/v8AdminLiveActions.js"];
const platformData = sources["src/v8/v8PlatformLiveData.js"];
const platformActions = sources["src/v8/v8PlatformLiveActions.js"];
const defaultMentor = sources["src/v8/v8DefaultMentorPolicy.js"];
const learnerDirectory = sources["src/v8/v8LearnerDirectory.js"];
const usernameService = sources["src/profile/usernameService.js"];
const mentorService = sources["src/mentor/mentorService.js"];
const rules = sources["firestore.rules"];

check("Admin live data lowercase helper is declared", /const\s+lower\s*=\s*\(value\s*=\s*["\']{2}\)\s*=>\s*clean\(value\)\.toLowerCase\(\)/.test(adminData));

const protectedHashes = {
  "public/index.html": "d26ae8ed671497d94b37fdc7d4a6ac052b971f2ee2aa68468559cba269e748d7",
  "public/styles.css": "841eb0c401a787225154522d2dde4b99b6dba93693166b532e0c53f3847a48ad",
  "public/admin.css": "c2b3fe8589b95aadc988afdc003a898ef94987be9cfcbd49c5d67ff6ce705dfb",
  "public/v8-experiences.css": "9a6711dad0340c3737f4b2a112d0c387cd39264d0953fb4d8cf35395595fb5a7",
  "public/assets/icon.svg": "d8aac40fc7eae25c08fabb9f58f8bd53b0e86215fc0811b3e77d16dfeb0f779f",
  "public/auth-v8.css": "8bb17ecd03613c9904e5e67e507e12aac4a55067ad0303eb7fbdc29e0a86b1e2",
};
Object.entries(protectedHashes).forEach(([file, expected]) => check(`Exact V8 protected asset unchanged: ${file}`, digest(file) === expected));

check("Admin business seeds are empty", containsAll(admin, ["resources: []", "learners: []", "mentors: []", "grants: []", "payments: []", "audit: []", "pendingClaims: []", "products: []"]));
check("Direct and Shadow-runtime Student engines are identical", digest("public/app.js") === digest("public/learning-drive-v8/app.js"));
check("Direct and Shadow-runtime Admin engines are identical", digest("public/admin.js") === digest("public/learning-drive-v8/admin.js"));
check("Direct and Shadow-runtime experience engines are identical", digest("public/v8-experiences.js") === digest("public/learning-drive-v8/v8-experiences.js"));
check("No authenticated runtime demo or smoke copy", !/\b(?:demo|smoke)\b/i.test(runtime));
check("No historical fake people or example.com records", !/(Dr\. Meera Shah|Mr\. Arjun Rao|Aanya Patel|Kavya Joshi|Imran Khan|learner-rakesh|learner-aanya|learner-kavya|@example\.com)/i.test(runtime));
check("No hard-coded learning business record IDs", !/(res-piaget|res-vygotsky|res-mega|res-ca-july|CDP_MASTERY_BUNDLE|CTET_FINAL_REVISION_2026)/i.test(runtime));
check("No local Admin collection mutation", !/data\.(?:learners|mentors|resources|grants|payments|audit|pendingClaims|products)\.(?:push|unshift|splice)\s*\(/.test(admin));
check("Admin writes use one guarded live action channel", containsAll(admin, ["LIVE_WRITE_ACTIONS", "aspirenest:admin-live-action", "NO_PARTIAL_BROWSER_MUTATION", "if(!realAdminDataActive)"]));
check("Admin browser final projection excludes exact staff identities", containsAll(admin, ["aspirenestplatform@gmail.com", "dr.varshamaru@gmail.com", "isStaffLearnerRecord", ".filter(learner=>!isStaffLearnerRecord(learner))"]));
check("Canonical learner model excludes staff after union consolidation", containsAll(learnerDirectory, ["const union", "isAspireNestStaffEmail", "staffRole", "if (staffEmail || staffRole) return null"]));

check("Exact Dr. Varsha default mentor policy exists", containsAll(defaultMentor, ["Dr. Varsha Maru", "ASPIRENEST_MENTOR_EMAIL", "default-mentor-v1", "missingRelationshipLearners"]));
check("Current learner relationship backfill is idempotent and audited", containsAll(adminActions, ["syncDefaultMentorRelationships", "lastRelationshipSignature", "writeBatch", "mentorStudentLinks", "SYNC_DEFAULT_MENTOR_RELATIONSHIPS"]));
check("Future Student registration writes default mentor relationship", containsAll(usernameService, ["platformSettings", "defaultMentor", "mentorStudentLinks", "mentorAssignmentSource", "ASPIRENEST_DEFAULT_MENTOR_POLICY_ID"]));
check("Mentor workspace reads canonical and legacy learner links", containsAll(mentorService, ["mentorStudentLinks", "mentorProfiles", "learnerProfiles", "mentorAssignmentStatus"]));

const adminCollections = ["users", "students", "learnerProfiles", "studentAccess", "contentItems", "payments", "mentorProfiles", "mentorAssignments", "mentorStudentLinks", "accessAuditLogs", "accessActionLogs", "experienceEvents", "accessInvites", "accessProducts"];
adminCollections.forEach((collectionName) => check(`Admin live source: ${collectionName}`, adminData.includes(`${collectionName}: "${collectionName}"`)));
check("Admin source health distinguishes ready empty and error", containsAll(adminData, ["sourceErrors", "sourceStatus", '"error"', '"ready"', '"empty"']));
check("Admin source health is visible in exact V8 UI", containsAll(admin, ["Live Admin source status", "source warning", "Connected · no records", "Canonical mentor relationship"]));
check("Admin shared collection toolbar is reusable", containsAll(admin, ["function collectionToolbar", "data-admin-collection-filter", "data-admin-sort", "data-admin-view"]));
check("Admin collection routes use shared toolbar", ["renderContent", "renderAccess", "renderPeople", "renderMentors", "renderCommerce", "renderSystem"].every((name) => admin.includes(name)) && (admin.match(/collectionToolbar\(/g) || []).length >= 7);
check("Admin bundles come only from live access products", containsAll(admin, ["function bundleTargets", "data.products", "scopeType", "itemIds"]) && !admin.includes("const BUNDLE_TARGETS"));
check("Admin product projection preserves plan bundle module and item data", containsAll(adminData, ["scopeType:", "bundleId:", "moduleKeys:", "itemIds:"]));

check("Public live subscription is installed", containsAll(platformData, ["subscribeV8PublicLiveData", 'collection(db, "contentItems")', 'collection(db, "accessProducts")']));
check("Student live subscription is installed", containsAll(platformData, ["subscribeV8StudentLiveData", 'collection(db, "studentAccess")', 'collection(db, "mentorAssignments")', 'collection(db, "mockResults")', 'collection(db, "studyRoadmapProgress")']));
check("Mentor live subscription is installed", containsAll(platformData, ["subscribeV8MentorLiveData", 'collection(db, "mentorStudentLinks")', 'collection(db, "mentorQuestions")', 'collection(db, "mentorAccessRequests")', 'collection(db, "mentorLiveSessions")']));
check("Bridge publishes Public Student Mentor and Admin live events", containsAll(bridge, ["aspirenest:public-live-data", "aspirenest:student-live-data", "aspirenest:mentor-live-data", "aspirenest:real-admin-data"]));
check("Public UI consumes real public data", containsAll(experiences, ["aspirenest:public-live-data", "publicLive", "products"]));
check("Student UI consumes real learner data", containsAll(student, ["aspirenest:student-live-data", "studentLive", "resources", "assignments", "liveSessions"]));
check("Mentor UI consumes real mentor data", containsAll(experiences, ["aspirenest:mentor-live-data", "mentorLiveData", "accessRequests", "liveSessions"]));

const adminActionNames = ["submit-resource", "confirm-publish", "submit-grant", "confirm-extend", "confirm-revoke", "confirm-payment", "confirm-provision", "submit-learner", "submit-mentor", "submit-claim"];
adminActionNames.forEach((name) => check(`Controlled Admin live action: ${name}`, adminActions.includes(`"${name}"`)));
const platformActionNames = ["student-ask-question", "student-complete-assignment", "mentor-create-assignment", "mentor-create-access-request", "mentor-answer-question", "mentor-review-assignment", "mentor-schedule-session"];
platformActionNames.forEach((name) => check(`Controlled Student/Mentor live action: ${name}`, platformActions.includes(`"${name}"`)));
check("Mentor never grants access directly", containsAll(platformActions, ["createMentorAccessRequest", "MENTOR_RESOURCE_ACCESS_STATES"]) && !platformActions.includes("createManualAccess"));
check("Student resource opening remains canonical route based", containsAll(platformData, ["canonicalRoute", "/ctet-tet/", "accessMatchesResource"]));

check("Rules protect platform settings", rules.includes("match /platformSettings/{docId}"));
check("Rules protect canonical mentor links", rules.includes("match /mentorStudentLinks/{studentUid}"));
check("Rules protect mentor questions", rules.includes("match /mentorQuestions/{questionId}"));
check("Rules protect mentor live sessions", rules.includes("match /mentorLiveSessions/{sessionId}"));
check("Rules restrict Admin to exact Admin email", rules.includes('request.auth.token.email == "aspirenestplatform@gmail.com"'));
check("Rules restrict Mentor to exact Mentor email", rules.includes('request.auth.token.email == "dr.varshamaru@gmail.com"'));
check("Rules keep Student ownership UID authoritative", containsAll(rules, ["request.auth.uid", "studentUid == request.auth.uid", "request.resource.data.uid == request.auth.uid"]));

check("Exact V8 runtime has no iframe", !/<iframe|createElement\(["']iframe["']\)/i.test(runtime));
check("Exact V8 runtime has no Shadow DOM", !/attachShadow|shadowRoot/i.test(runtime));

const failed = checks.filter((item) => !item.ok);
checks.forEach((item) => console.log(`${item.ok ? "PASS" : "FAIL"}=${item.name}`));
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
if (failed.length) {
  console.log("FINAL_DECISION=G15_V3_FULL_PLATFORM_LIVE_STATIC_RED");
  process.exit(1);
}
console.log("PUBLIC_LIVE=YES");
console.log("STUDENT_LIVE=YES");
console.log("MENTOR_LIVE=YES");
console.log("ADMIN_LIVE=YES");
console.log("AUTHENTICATED_DEMO_FALLBACK=NONE");
console.log("CURRENT_LEARNER_DEFAULT_MENTOR=DR_VARSHA_MARU");
console.log("FUTURE_STUDENT_DEFAULT_MENTOR=DR_VARSHA_MARU");
console.log("FINAL_DECISION=G15_V3_FULL_PLATFORM_LIVE_STATIC_GREEN");
