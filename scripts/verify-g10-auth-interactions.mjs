import crypto from "node:crypto";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const checks = [];
const check = (name, pass) => {
  checks.push([name, Boolean(pass)]);
  console.log(`${pass ? "PASS" : "FAIL"}=${name}`);
};

const bridge = read("src/v8/v8FirebaseBridge.js");
const experiences = read("public/v8-experiences.js");
const test = read("src/v8/v8AuthInteractionWiring.test.js");

check("Exact AspireNest brand remains in V8 root", read("public/index.html").includes("<strong>AspireNest</strong><small>Academy</small>"));
check("Canonical V8 styles unchanged", hash("public/styles.css") === process.env.G10_EXPECTED_STYLES);
check("Canonical Admin styles unchanged", hash("public/admin.css") === process.env.G10_EXPECTED_ADMIN_CSS);
check("Canonical experience styles unchanged", hash("public/v8-experiences.css") === process.env.G10_EXPECTED_EXPERIENCE_CSS);
check("Canonical Student engine unchanged", hash("public/app.js") === process.env.G10_EXPECTED_APP_JS);
check("Canonical Admin engine unchanged", hash("public/admin.js") === process.env.G10_EXPECTED_ADMIN_JS);
check("Auth overlay bypass exists", experiences.includes("if(event.target.closest('#aspirenestAuthOverlay'))return;"));
check("Auth overlay bypass precedes global click blocker",
  experiences.indexOf("if(event.target.closest('#aspirenestAuthOverlay'))return;") <
  experiences.indexOf("event.stopImmediatePropagation();",
    experiences.indexOf("if(event.target.closest('#aspirenestAuthOverlay'))return;"))
);
check("Google popup is active", bridge.includes("signInWithPopup(auth, createGoogleProvider())"));
check("Google account chooser is explicit", bridge.includes('provider.setCustomParameters({ prompt: "select_account" })'));
check("Create Account button opens route", bridge.includes('navigate(`/create-account${window.location.search}`)'));
check("Top close button opens Public", bridge.includes('document.querySelector("[data-auth-close]").addEventListener("click", () => navigate("/"))'));
check("Escape closes auth", bridge.includes('event.key === "Escape"') && bridge.includes('navigate("/", true)'));
check("Email account creation is active", bridge.includes("createUserWithEmailAndPassword"));
check("Username reservation is active", bridge.includes("createVerifiedStudentAccountRecords"));
check("Verification email is active", bridge.includes("sendEmailVerification(createdUser)"));
check("Failed setup rolls Auth user back", bridge.includes("deleteUser(createdUser)"));
check("Registration race is blocked", bridge.includes("if (accountSetupInProgress) return"));
check("Student-only staff block remains", bridge.includes("isAspireNestStaffEmail(values.email)"));
check("Interaction regression test exists", test.includes("allows every login and create-account control"));
check("No iframe", !read("public/index.html").toLowerCase().includes("<iframe"));
check("No Shadow DOM wrapper", !read("src/index.js").includes("attachShadow"));

const failed = checks.filter(([, pass]) => !pass);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
if (failed.length) process.exit(1);
console.log("FINAL_DECISION=G10_AUTH_INTERACTION_STATIC_GREEN");
