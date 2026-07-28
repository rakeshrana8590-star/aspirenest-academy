import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const checks = [];
const check = (label, value) => {
  const ok = Boolean(value);
  checks.push({ label, ok });
  console.log(`${ok ? "PASS" : "FAIL"}=${label}`);
};

const gate = read("src/v8/v8ReleaseWriteGate.js");
const adminActions = read("src/v8/v8AdminLiveActions.js");
const platformActions = read("src/v8/v8PlatformLiveActions.js");
const bridge = read("src/v8/v8FirebaseBridge.js");
const html = read("public/index.html");
const mainCss = read("public/styles.css");
const adminCss = read("public/admin.css");
const experienceCss = read("public/v8-experiences.css");

check("Release gate requires explicit environment flag", gate.includes("REACT_APP_ASPIRENEST_PRODUCTION_WRITES_ENABLED"));
check("Release gate allows exact apex production host only", gate.includes('"aspirenestacademy.in"'));
check("Release gate allows exact www production host only", gate.includes('"www.aspirenestacademy.in"'));
check("Admin mutation channel is release-gated", adminActions.includes("assertAspireNestProductionWriteEnabled(action)"));
check("Student and Mentor mutation channel is release-gated", platformActions.includes("assertAspireNestProductionWriteEnabled(action)"));
check("Admin data reads never auto-trigger relationship writes", !adminActions.includes('window.addEventListener("aspirenest:real-admin-data"'));
check("Default Mentor backfill requires explicit action", adminActions.includes('"sync-default-mentor-relationships"'));
check("Default Mentor backfill requires exact confirmation", adminActions.includes("SYNC_DEFAULT_MENTOR_RELATIONSHIPS"));
check("Admin live reads remain installed", bridge.includes("subscribeV8AdminLiveData"));
check("Public live reads remain installed", bridge.includes("subscribeV8PublicLiveData"));
check("Student live reads remain installed", bridge.includes("subscribeV8StudentLiveData"));
check("Mentor live reads remain installed", bridge.includes("subscribeV8MentorLiveData"));
check("Exact V8 runtime has no iframe", !html.includes("<iframe") && !bridge.includes("createElement(\"iframe\")"));
check("Exact V8 runtime has no Shadow DOM", !bridge.includes("attachShadow"));
check("Exact V8 main CSS remains present", mainCss.length > 1000);
check("Exact V8 Admin CSS remains present", adminCss.length > 1000);
check("Exact V8 experience CSS remains present", experienceCss.length > 1000);

const passed = checks.filter((item) => item.ok).length;
const failed = checks.length - passed;
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${passed}`);
console.log(`FAILED=${failed}`);
console.log(`PREACTIVATION_WRITE_GATE=${failed ? "RED" : "LOCKED"}`);
console.log(`FINAL_DECISION=${failed ? "G16_G1_STATIC_RED" : "G16_G1_PREACTIVATION_READ_ONLY_STATIC_GREEN"}`);
if (failed) process.exit(1);
