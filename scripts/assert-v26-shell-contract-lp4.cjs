"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "runtime/v26-shell/app.js");
const visibleContract = path.join(root, "integration/lp3/v26-visible-contract.test.cjs");

assert.ok(fs.existsSync(appPath), "V26 app.js missing");
assert.ok(fs.existsSync(visibleContract), "LP3 visible-contract test missing");

const diff = spawnSync(
  "git",
  ["diff", "--name-only", "HEAD", "--", "runtime/v26-shell"],
  { cwd: root, encoding: "utf8" },
);
assert.equal(diff.status, 0, diff.stderr || "git diff failed");
const changed = diff.stdout.trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(
  changed,
  ["runtime/v26-shell/app.js"],
  "LP4 may change only V26 app.js under the shell; no visible shell asset redesign is authorized",
);

const test = spawnSync(
  process.execPath,
  ["--test", visibleContract],
  { cwd: root, encoding: "utf8" },
);
process.stdout.write(test.stdout || "");
process.stderr.write(test.stderr || "");
assert.equal(
  test.status,
  0,
  "LP3 V26 visible-contract regression must remain GREEN",
);

const app = fs.readFileSync(appPath, "utf8");
for (const marker of [
  "hydrateLp4ProductionState",
  "lp4OperationFailure",
]) {
  assert.ok(app.includes(marker), marker);
}

console.log("V26_SHELL_VISIBLE_CONTRACT=PASS");
console.log("V26_SHELL_CHANGED_FILES=1");
console.log("V26_VISIBLE_REDESIGN=NO");
