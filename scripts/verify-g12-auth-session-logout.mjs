import fs from "fs";
import crypto from "crypto";

const read = (file) => fs.readFileSync(file, "utf8");
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const checks = [];
const check = (label, pass) => { checks.push({ label, pass: Boolean(pass) }); console.log(`${pass ? "PASS" : "FAIL"}=${label}`); };

const student = read("public/app.js");
const admin = read("public/admin.js");
const exp = read("public/v8-experiences.js");
const bridge = read("src/v8/v8FirebaseBridge.js");
const accounts = read("src/utils/authAccountService.js");
const roleRuntime = read("src/v8/v8RoleRuntime.js");

check("Exact V8 HTML unchanged", sha("public/index.html") === process.env.G12_INDEX);
check("Exact V8 main styles unchanged", sha("public/styles.css") === process.env.G12_STYLES);
check("Exact V8 Admin styles unchanged", sha("public/admin.css") === process.env.G12_ADMIN_CSS);
check("Exact V8 experience styles unchanged", sha("public/v8-experiences.css") === process.env.G12_EXP_CSS);
check("Student menu uses authenticated session", student.includes("window.__aspirenestAuthSession") && student.includes("data-aspirenest-signout"));
check("Student smoke identity removed", !student.includes("Founder preview") && !student.includes("Sign out preview"));
check("Admin menu uses authenticated session", admin.includes("window.__aspirenestAuthSession") && admin.includes("Administrator"));
check("Admin real sign out wired", admin.includes("data-aspirenest-signout") && admin.includes("aspirenest:signout"));
check("Mentor real identity menu wired", exp.includes("Mentor account") && exp.includes("End this Firebase session"));
check("Mentor may open Student experience", exp.includes("Open Student Learning OS"));
check("Anonymous chooser is Public only", exp.includes("const allowed=session.user&&Array.isArray(session.allowed)?session.allowed:['public']"));
check("Anonymous runtime exposes Public only", roleRuntime.includes('if (!session?.user) return Object.freeze(["public"])'));
check("Anonymous Start Learning requires login", exp.includes("data-aspirenest-login=\"/student\"") && exp.includes("/login?returnTo="));
check("Internal role request is authorization checked", exp.includes("requestExperience") && exp.includes("aspirenest:access-denied"));
check("Real account profile load exists", accounts.includes("loadAspireNestAccountProfile") && accounts.includes("mentorProfiles"));
check("Session publishes username and plan", bridge.includes("username:") && bridge.includes("planType:"));
check("Firebase logout is deduplicated", bridge.includes("signOutInProgress") && bridge.includes("performAspireNestSignOut"));
check("Logout clears browser auth state", bridge.includes("clearAspireNestAuthSession") && bridge.includes("aspirenest:session-cleared"));
check("Logout returns to Public", bridge.includes('navigate("/", true)'));
check("No iframe", !bridge.includes("iframe") && !exp.includes("iframe"));
check("No Shadow DOM", !bridge.includes("attachShadow") && !exp.includes("attachShadow"));

const failed = checks.filter((item) => !item.pass);
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed.length}`);
console.log(`FAILED=${failed.length}`);
if (failed.length) process.exit(1);
console.log("FINAL_DECISION=G12_AUTH_SESSION_LOGOUT_STATIC_GREEN");
