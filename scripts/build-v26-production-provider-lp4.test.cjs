"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const build = spawnSync(
  process.execPath,
  [path.join(root, "scripts/build-v26-production-provider.cjs")],
  { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
);

process.stdout.write(build.stdout || "");
process.stderr.write(build.stderr || "");
assert.equal(build.status, 0, "provider build must succeed");

const out = build.stdout || "";
assert.match(out, /"ok"\s*:\s*true/);
assert.match(out, /"temporaryOutputOnly"\s*:\s*true/);
assert.match(out, /"warnings"\s*:\s*\[\s*\]/);
assert.match(out, /"magicDirectiveCount"\s*:\s*0/);
assert.match(out, /"sourceMapAssetCount"\s*:\s*0/);

const m = out.match(/"outputFile"\s*:\s*"([^"]+)"/);
assert.ok(m, "provider build outputFile missing");
assert.ok(fs.existsSync(m[1]), "provider temporary output missing");

const bundle = fs.readFileSync(m[1], "utf8");
assert.ok(
  bundle.includes("__aspirenestExactResourceAdapter"),
  "required provider global missing from built bundle",
);
assert.equal(/Module not found:/i.test(out), false);
console.log("LP4_PROVIDER_BUILD_CONTRACT=PASS");
