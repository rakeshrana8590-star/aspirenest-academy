import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const check = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const app = read("src/App.js");
const shell = read("src/learningDrive/LearningDriveShell.jsx");
const routes = read("src/learningDrive/learningDriveRouteMap.js");
const auth = read("src/components/AuthSection.jsx");
const access = read("src/access/admin/AdminAccessManageRoute.jsx");
const rules = read("firestore.rules");
const storageRules = read("storage.rules");
const adminHome = read("src/learningDrive/AdminDriveHomeRoute.jsx");
const learners = read("src/learningDrive/AdminDriveLearnersRoute.jsx");
const learnerProfiles = read("src/profile/learnerProfileService.js");
const firebaseConfig = read("firebase.json");
const usernameSetup = read("src/profile/StudentUsernameSetupRoute.jsx");

check("V8 shell is integrated into real App.js", app.includes("LearningDriveShell"));
check("Existing Routes stay in App.js", app.includes("<Routes") && app.includes("StudentMockTestLibraryRoute"));
check("Public preview is present", app.includes('path="/admin/preview/public"'));
check("Student preview is present", app.includes('path="/admin/preview/student"'));
check("Mentor preview is present", app.includes('path="/admin/preview/mentor"'));
check("Admin preview routes remain requireAdmin protected", /admin\/preview\/student[\s\S]{0,500}requireAdmin\(\)/.test(app));
check("Student six-area Drive navigation is preserved", routes.includes('"home", label: "Home"') && routes.includes('"learning", label: "Learning"') && routes.includes('"mentor", label: "Mentor"') && routes.includes('"live", label: "Live"') && routes.includes('"success", label: "Success"') && routes.includes('"help", label: "Help"'));
check("Admin V8 six-area Drive navigation is preserved", routes.includes('"content", label: "Content"') && routes.includes('"access", label: "Access"') && routes.includes('"people", label: "People"') && routes.includes('"commerce", label: "Commerce"') && routes.includes('"system", label: "System"'));
check("All four Admin preview experiences are present", shell.includes("Public Website") && shell.includes("Student Learning Drive") && shell.includes("Mentor Workspace") && shell.includes("Admin Learning Drive"));
check("Role switch is Admin-only", shell.includes("{isAdminUser ? ("));
check("Dropdown outside-click closes", shell.includes('document.addEventListener("mousedown", outside)'));
check("Dropdown Escape closes", shell.includes('event.key === "Escape"'));
check("Route changes close dropdowns", shell.includes("locationKey") && shell.includes("setOpenPopover(\"\")"));
check("Context rail collapse is preserved", shell.includes("contextCollapsed") && shell.includes("toggleCollapse"));
check("Mobile context and dock are preserved", shell.includes("learningDriveMobileContext") && shell.includes("learningDriveMobileDock"));
check("Global real search route is wired", shell.includes('/search?q=${encodeURIComponent(value)}'));
check("Existing rich Access actions remain", access.includes("Extend Access") && access.includes("Revoke Access") && access.includes("Shorten Validity"));
check("Registration includes username", auth.includes("Unique Username") && auth.includes("validateUsername"));
check("Registration handler uses payload credentials", app.includes("studentProfile.email ?? email") && app.includes("studentProfile.password ?? password"));
check("Failed registration rolls back Auth user", app.includes("deleteUser(createdUser)"));
check("Username reservation is referenced", app.includes("createVerifiedStudentAccountRecords"));
check("Username collection rules are present", rules.includes("match /usernames/{usernameId}"));
check("Storage rules are present", storageRules.includes("service firebase.storage") && storageRules.includes("allow write: if isAdmin()"));
check("Vercel SPA rewrite is present", read("vercel.json").includes('"destination": "/index.html"'));
check("V8 Admin Command Centre is the real /admin home", app.includes("<AdminDriveHomeRoute") && adminHome.includes("Admin Command Centre") && adminHome.includes("Grant access") && adminHome.includes("Review payments") && adminHome.includes("Open audit"));
check("V8 rich Learners route replaces the reduced legacy card screen", app.includes("<AdminDriveLearnersRoute") && learners.includes("Last active") && learners.includes("Account migration") && learners.includes("Add learner"));
check("Learners preserve email, username, plan, status, progress, access and mentor", ["learner.email", "learner.username", "learner.plan", "learner.status", "learner.progress", "learner.accessCount", "learner.mentor"].every((token) => learners.includes(token)));
check("Controlled Admin learner profile create is wired", learners.includes("upsertAdminLearnerProfile") && learners.includes("does not assign a commercial plan"));
check("Learner profile listing is real Firestore-backed data", learnerProfiles.includes("export const listLearnerProfiles") && learnerProfiles.includes("collection(db, LEARNER_PROFILE_COLLECTION)"));
check("Firebase configuration includes Storage rules", firebaseConfig.includes('"storage"') && firebaseConfig.includes('"rules": "storage.rules"'));
check("Existing and Google learners can claim a username once", app.includes('path="/profile/username"') && usernameSetup.includes("claimUsernameForExistingUser") && shell.includes("Choose username"));
check("Username owner update remains scope-limited in rules", rules.includes("isSafeUserUsernameUpdate") && rules.includes('affectedKeys().hasOnly'));
check("No iframe integration", !app.includes("<iframe") && !shell.includes("<iframe"));

const failures = checks.filter((item) => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? "PASS" : "FAIL"}=${item.name}`);
}
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failures.length}`);
console.log(`FAILED=${failures.length}`);
if (failures.length) process.exit(1);
