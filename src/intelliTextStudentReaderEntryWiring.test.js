const fs = require("node:fs");
const path = require("node:path");

const srcRoot = __dirname;
const repoRoot = path.resolve(__dirname, "..");
const source = (relative) =>
  fs.readFileSync(path.join(srcRoot, relative), "utf8");

test("canonical Student Note reader is owned by the approved Learning Drive drawer", () => {
  const index = source("index.js");
  const roleRuntime = source("v8/v8RoleRuntime.js");
  const drawerRuntime = source("v8/v8IntelliTextDrawerRuntime.js");
  const bootstrap = fs.readFileSync(
    path.join(repoRoot, "public", "v8-route-bootstrap.js"),
    "utf8"
  );
  const app = fs.readFileSync(
    path.join(repoRoot, "public", "app.js"),
    "utf8"
  );

  expect(index).not.toContain('import "./intelliTextStudentReaderEntry";');
  expect(index).toContain('import "./v8/v8IntelliTextDrawerRuntime";');
  expect(roleRuntime).toContain("isV8StudentReaderPath");
  expect(bootstrap).toContain('hash = `#learning/reader/${studentReaderId}`;');
  expect(drawerRuntime).toContain("loadPublishedTextbook");
  expect(app).toContain("FOUNDER_APPROVED_INTELLITEXT_DRAWER");
});
