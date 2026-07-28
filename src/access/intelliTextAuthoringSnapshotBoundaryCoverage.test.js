const fs = require("node:fs");
const path = require("node:path");

test("every Firestore snapshot data read crosses the JSON-safe normalizer", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "intelliTextAuthoringClient.js"),
    "utf8"
  );
  const helper = "normalizeFirestoreSnapshotValueForAuthoring";
  const pattern = /([A-Za-z_$][A-Za-z0-9_$]*\.data\(\))/g;
  const failures = [];
  let match;

  while ((match = pattern.exec(source))) {
    const prefix = source.slice(Math.max(0, match.index - 120), match.index);
    if (!new RegExp(`${helper}\\(\\s*$`).test(prefix)) {
      failures.push(match[1]);
    }
  }

  expect(failures).toEqual([]);
});
