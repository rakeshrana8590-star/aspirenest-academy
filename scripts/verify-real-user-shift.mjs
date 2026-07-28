import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const checks = [];
const check = (label, condition) => {
  checks.push({ label, pass: Boolean(condition) });
  console.log(`${condition ? "PASS" : "FAIL"}=${label}`);
};

const identity = read("src/auth/aspireNestIdentity.js");
const app = read("src/App.js");
const rules = read("firestore.rules");
const mentorSession = read("src/mentor/useMentorSession.js");
const routeMap = read("src/learningDrive/learningDriveRouteMap.js");
const learnerService = read("src/profile/learnerProfileService.js");
const learnerRoute = read("src/learningDrive/AdminDriveLearnersRoute.jsx");
const authService = read("src/utils/authAccountService.js");

check("Admin email is exact", identity.includes('ASPIRENEST_ADMIN_EMAIL = "aspirenestplatform@gmail.com"'));
check("Mentor email is exact", identity.includes('ASPIRENEST_MENTOR_EMAIL = "dr.varshamaru@gmail.com"'));
check("All other accounts default to student", identity.includes("return ASPIRENEST_ROLES.STUDENT"));
check("Admin display name is locked", identity.includes('return "Dr. Rakesh P. Rana"'));
check("Mentor display name is locked", identity.includes('return "Dr. Varsha Maru"'));
check("Student directory merges existing users and students", identity.includes("mergeAspireNestStudentDirectory"));
check("Student sync is student-only", app.includes("isAspireNestStudent(verifiedUser)"));
check("Auth status writes reject staff", authService.includes("!isAspireNestStudent(verifiedUser)"));
check("Learner login snapshot rejects staff", learnerService.includes("!isAspireNestStudent(user)"));
check("Current students collection is read", learnerService.includes('collection(db, "students")'));
check("Current users collection is read", learnerService.includes('collection(db, "users")'));
check("Real learner directory service is wired", learnerRoute.includes("listExistingStudentDirectory"));
check("Admin and Mentor are filtered from learner list", learnerRoute.includes("isAspireNestStudent(learner)"));
check("Duplicate Full name field is absent", (learnerRoute.match(/<label>Full name/g) || []).length === 1);
check("Mentor login resolves to Mentor workspace", app.includes("isMentorUser: isMentor(user)"));
check("Mentor landing route is role-aware", app.includes("getAspireNestLandingRoute(userCredential.user)"));
check("Mentor session recognizes exact account", mentorSession.includes("isAspireNestMentor(user)"));
check("Mentor Drive route model accepts real mentor", routeMap.includes("isMentorUser = false"));
check("Firestore recognizes designated Mentor", rules.includes('request.auth.token.email == "dr.varshamaru@gmail.com"'));
check("Admin remains exact-email secured", rules.includes('request.auth.token.email == "aspirenestplatform@gmail.com"'));
check("No iframe integration", !app.includes("<iframe"));
check("No account recreation migration", !identity.includes("createUserWithEmailAndPassword") && !identity.includes("deleteUser"));

const passed = checks.filter((item) => item.pass).length;
const failed = checks.length - passed;
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${passed}`);
console.log(`FAILED=${failed}`);
if (failed) process.exit(1);
