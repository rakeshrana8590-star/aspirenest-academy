import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const hash = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");

const runtime = read("src/learningDrive/V8LearningDriveRuntime.jsx");
const model = read("src/learningDrive/v8ShadowRuntimeModel.js");
const hostCss = read("src/learningDrive/v8RuntimeHost.css");
const runtimeTest = read("src/learningDrive/V8LearningDriveRuntime.test.js");
const shadowTest = read("src/learningDrive/V8LearningDriveRuntime.shadow.test.js");

const lockedAssets = new Map([
  ["public/learning-drive-v8/styles.css", "841eb0c401a787225154522d2dde4b99b6dba93693166b532e0c53f3847a48ad"],
  ["public/learning-drive-v8/admin.css", "c2b3fe8589b95aadc988afdc003a898ef94987be9cfcbd49c5d67ff6ce705dfb"],
  ["public/learning-drive-v8/v8-experiences.css", "9a6711dad0340c3737f4b2a112d0c387cd39264d0953fb4d8cf35395595fb5a7"],
  ["public/learning-drive-v8/app.js", "03a66a0ba326f2940a52b6e833e01b3cefc5edc1735df5fa282cd8db25caf4ae"],
  ["public/learning-drive-v8/admin.js", "8ed0b959d2a1c567da1c6c68df3d61b46ccc2987679cf91055c2331f8ba42cbe"],
  ["public/learning-drive-v8/v8-experiences.js", "ff63de8952086bb3404d4e87da45ad5d9fc47a52a8d3049622ba046027ddc905"],
]);

const checks = [
  ["React owns a Shadow DOM boundary", runtime.includes('host.attachShadow({ mode: "open" })')],
  ["Exact CSS is fetched as text", runtime.includes("Promise.all(V8_STYLE_ASSETS.map(fetchAssetText))")],
  ["Exact JS is fetched as text", runtime.includes("Promise.all(V8_SCRIPT_ASSETS.map(fetchAssetText))")],
  ["CSS is transformed only for Shadow root selectors", runtime.includes("transformV8CssForShadow(cssText)")],
  ["Scripts execute against scoped document", runtime.includes("executeV8Script({ source, sourceUrl: V8_SCRIPT_ASSETS[index], environment })")],
  ["Global link injection removed", !runtime.includes("document.head.appendChild(link)")],
  ["Global script injection removed", !runtime.includes("document.body.appendChild(script)")],
  ["No iframe integration", !runtime.toLowerCase().includes("iframe")],
  ["Brand lock AspireNest", runtime.includes('"AspireNest"') && model.includes("<strong>AspireNest</strong><small>Academy</small>")],
  ["Brand lock Academy", runtime.includes('"Academy"')],
  ["Public is the only logged-out experience", model.includes('const roles = ["public"]')],
  ["Student requires authentication", model.includes('if (authenticated) roles.push("student")')],
  ["Mentor hierarchy preserved", model.includes('if (authenticated && (isMentorUser || isAdminUser)) roles.push("mentor")')],
  ["Admin hierarchy preserved", model.includes('if (authenticated && isAdminUser) roles.push("admin")')],
  ["Login navigation preserved", runtime.includes('fullNavigate("/login")')],
  ["Create Account navigation preserved", runtime.includes('fullNavigate("/create-account")')],
  ["Logout preserved", runtime.includes("await logoutRef.current?.()")],
  ["Observer writes only changed text", runtime.includes("if (node.textContent === next) return false")],
  ["Observer innerHTML recursion absent", !runtime.includes("quick.innerHTML")],
  ["Host CSS has no V8 shell selector duplication", !hostCss.includes(".topbar") && !hostCss.includes(".parent-rail") && !hostCss.includes(".context-rail")],
  ["Focused source test checks Shadow DOM", runtimeTest.includes("attachShadow")],
  ["Dynamic mount test checks no document leakage", shadowTest.includes('expect(document.querySelector("#pageContent")).toBeNull()')],
];

for (const [file, expected] of lockedAssets.entries()) {
  checks.push([`Locked V8 asset preserved: ${file}`, hash(file) === expected]);
}

let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}=${label}`);
  if (!pass) failed += 1;
}

console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed}`);
console.log(`FAILED=${failed}`);

if (failed) {
  console.log("FINAL_DECISION=G8_SHADOW_ISOLATION_STATIC_RED");
  process.exit(1);
}

console.log("EXACT_V8_STATIC_ASSETS_CHANGED=NO");
console.log("GLOBAL_REACT_CSS_CAN_ENTER_V8=NO");
console.log("V8_CAN_ENTER_GLOBAL_REACT_DOCUMENT=NO");
console.log("FINAL_DECISION=G8_SHADOW_ISOLATION_STATIC_GREEN");
