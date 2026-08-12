"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");

const entry = spawnSync(
  process.execPath,
  [path.join(root, "src/integration/v26/browser/productionProviderEntry.test.cjs")],
  { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
process.stdout.write(entry.stdout || "");
process.stderr.write(entry.stderr || "");
assert.equal(entry.status, 0, "provider entry contract must pass");

const build = spawnSync(
  process.execPath,
  [path.join(root, "scripts/build-v26-production-provider.cjs")],
  { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
);
process.stdout.write(build.stdout || "");
process.stderr.write(build.stderr || "");
assert.equal(build.status, 0, "full provider module graph must bundle without unresolved imports");

const out = build.stdout || "";
assert.equal(/Module not found:/i.test(out), false);
assert.match(out, /"warnings"\s*:\s*\[\s*\]/);

const m = out.match(/"outputFile"\s*:\s*"([^"]+)"/);
assert.ok(m && fs.existsSync(m[1]), "runtime closure bundle missing");
const bundle = fs.readFileSync(m[1], "utf8");

assert.ok(
  bundle.includes("__aspirenestExactResourceAdapter"),
  "__aspirenestExactResourceAdapter",
);

console.log("LP4_PROVIDER_RUNTIME_CLOSURE=PASS");
console.log("LP4_PROVIDER_UNRESOLVED_IMPORTS=0");
