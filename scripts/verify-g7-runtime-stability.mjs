import fs from "node:fs";

const runtime = fs.readFileSync(
  "src/learningDrive/V8LearningDriveRuntime.jsx",
  "utf8"
);
const dynamicTest = fs.readFileSync(
  "src/learningDrive/V8LearningDriveRuntime.stability.test.js",
  "utf8"
);

const checks = [
  ["guard helper exists", runtime.includes("export const syncPublicQuickAction")],
  ["mode is read before mutation", runtime.includes('quick.dataset.aspirenestRuntimeMode || "continue"')],
  ["login mutation is guarded", runtime.includes('shouldShowLogin && currentMode !== "login"')],
  ["continue restoration is guarded", runtime.includes('!shouldShowLogin && currentMode === "login"')],
  ["observer uses guarded helper", runtime.includes("syncPublicQuickAction({ quick, experience, authenticated })")],
  ["legacy unguarded inline handler removed", !runtime.includes('quick.onclick = () => fullNavigate("/login")')],
  ["dynamic MutationObserver regression exists", dynamicTest.includes("observerCallbacks")],
  ["dynamic regression expects one callback", dynamicTest.includes("expect(observerCallbacks).toBe(1)")],
];

let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}=${label}`);
  if (!pass) failed += 1;
}
console.log(`CHECKS=${checks.length}`);
console.log(`PASSED=${checks.length - failed}`);
console.log(`FAILED=${failed}`);
if (failed) process.exit(1);
console.log("FINAL_DECISION=G7_RUNTIME_STABILITY_STATIC_GREEN");
