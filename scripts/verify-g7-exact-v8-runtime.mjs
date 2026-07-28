import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const app = read("src/App.js");
const runtime = read("src/learningDrive/V8LearningDriveRuntime.jsx");
const authRoute = read("src/components/public/AuthRoute.jsx");
const authSection = read("src/components/AuthSection.jsx");
const v8App = read("public/learning-drive-v8/app.js");
const v8Admin = read("public/learning-drive-v8/admin.js");
const v8Experiences = read("public/learning-drive-v8/v8-experiences.js");

const checks = [
  ["Public root opens exact V8 runtime", app.includes('if (path === "/") return "public"')],
  ["Student route opens exact V8 runtime", app.includes('if (path === "/student" && user) return "student"')],
  ["Mentor route is Mentor/Admin protected", app.includes('if (path === "/mentor" && user && (isAdmin(user) || isMentor(user))) return "mentor"')],
  ["Admin route is Admin protected", app.includes('if (path === "/admin" && user && isAdmin(user)) return "admin"')],
  ["Exact V8 runtime component is wired", app.includes("<V8LearningDriveRuntime")],
  ["Exact brand copy is present", runtime.includes("<strong>AspireNest</strong><small>Academy</small>")],
  ["Runtime has no iframe", !runtime.toLowerCase().includes("iframe")],
  ["Public and Student are baseline access", runtime.includes('const roles = ["public", "student"]')],
  ["Mentor adds Mentor access", runtime.includes('if (isMentorUser || isAdminUser) roles.push("mentor")')],
  ["Admin adds Admin access", runtime.includes('if (isAdminUser) roles.push("admin")')],
  ["Login is wired", runtime.includes('fullNavigate("/login")')],
  ["Create account is wired", runtime.includes('fullNavigate("/create-account")')],
  ["Logout is wired", runtime.includes("await logoutRef.current?.()")],
  ["Create Account route exists", app.includes('path="/create-account"')],
  ["Create Account opens registration mode", authRoute.includes('initialRegisterOpen={initialMode === "register"}') && authSection.includes("initialRegisterOpen = false")],
  ["Escape closes overlays", runtime.includes('if (event.key === "Escape") removeRuntimeOverlays()')],
  ["Outside click closes account popover", runtime.includes('!event.target.closest(".aspirenestRuntimeAccount")')],
  ["Main app owns service worker", v8App.includes("main AspireNest app owns service-worker lifecycle")],
  ["Admin brand remains Academy", v8Admin.includes("small.textContent='Academy'")],
  ["Public and Mentor brand remain Academy", v8Experiences.includes("small.textContent='Academy'")],
  ["Exact V8 CSS exists", exists("public/learning-drive-v8/styles.css") && exists("public/learning-drive-v8/admin.css") && exists("public/learning-drive-v8/v8-experiences.css")],
  ["Exact V8 JS exists", exists("public/learning-drive-v8/app.js") && exists("public/learning-drive-v8/admin.js") && exists("public/learning-drive-v8/v8-experiences.js")],
];

let passed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}=${label}`);
  if (ok) passed += 1;
}

console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${passed}`);
console.log(`FAILED=${checks.length - passed}`);

if (passed !== checks.length) process.exit(1);
