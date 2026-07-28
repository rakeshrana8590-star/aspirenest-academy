const fs = require("node:fs");
const path = require("node:path");

const srcRoot = __dirname;
const repoRoot = path.resolve(__dirname, "..");

const index = fs.readFileSync(
  path.join(srcRoot, "index.js"),
  "utf8"
);
const bootstrap = fs.readFileSync(
  path.join(repoRoot, "public", "v8-route-bootstrap.js"),
  "utf8"
);
const app = fs.readFileSync(
  path.join(repoRoot, "public", "app.js"),
  "utf8"
);

test("canonical Science Note deep-link binds its ID to the Learning drawer hash", () => {
  expect(bootstrap).toContain(
    'const studentReaderPrefix = "/ctet-tet/notes/read/";'
  );
  expect(bootstrap).toContain(
    'hash = `#learning/reader/${studentReaderId}`;'
  );
  expect(app).toContain(
    "state.readerResourceId=decodeURIComponent(parts[2])"
  );
});

test("rejected React Router full-page reader is not mounted", () => {
  expect(index).not.toContain(
    'import "./intelliTextStudentReaderEntry";'
  );
  expect(app).not.toContain(
    "aspirenestIntelliTextStudentReaderRoot"
  );
});

test("same canonical drawer supports side-panel and full-screen route state", () => {
  expect(app).toContain(
    "`/ctet-tet/notes/read/${encoded}#learning/reader/${encoded}/${state.readerMode}`"
  );
  expect(app).toContain(
    "state.readerMode=normalizeReaderMode(parts[3] || state.readerMode)"
  );
});
