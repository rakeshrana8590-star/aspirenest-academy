import fs from "fs";
import path from "path";
import {
  isV8StudentWorkspacePath,
  resolveV8ExperienceFromPath,
  resolveV8StudentWorkspaceHash,
} from "./v8RoleRuntime";

const root = path.join(__dirname, "../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

describe("P14 G18 M5-A2 launch-scope route bridge", () => {
  test.each([
    ["/ctet-tet/notes", "#learning/notes"],
    ["/ctet-tet/videos", "#learning/videos"],
    ["/ctet-tet/mock-tests", "#learning/practice"],
    ["/ctet-tet/mock-tests/history", "#success/history"],
    ["/ctet-tet/current-affairs", "#learning/current-affairs"],
    ["/ctet-tet/roadmaps", "#learning/roadmaps"],
    ["/my-aspirepath", "#learning/roadmaps"],
    ["/ctet-tet/my-access", "#learning/my-access"],
    ["/leaderboard", "#success/leaderboard"],
  ])("keeps %s inside the Student Learning Drive", (route, hash) => {
    expect(isV8StudentWorkspacePath(route)).toBe(true);
    expect(resolveV8ExperienceFromPath(route)).toBe("student");
    expect(resolveV8StudentWorkspaceHash(route)).toBe(hash);
  });

  test("keeps approved root roles and IntelliText reader ownership", () => {
    expect(resolveV8ExperienceFromPath("/")).toBe("public");
    expect(resolveV8ExperienceFromPath("/student")).toBe("student");
    expect(resolveV8ExperienceFromPath("/mentor")).toBe("mentor");
    expect(resolveV8ExperienceFromPath("/admin")).toBe("admin");
    expect(resolveV8ExperienceFromPath("/ctet-tet/notes/read/note-1")).toBe("student");
  });

  test("bootstrap and both Student runtimes carry the same launch bridge marker", () => {
    const bootstrap = read("public/v8-route-bootstrap.js");
    const active = read("public/app.js");
    const shadow = read("public/learning-drive-v8/app.js");
    expect(bootstrap).toContain('window.__aspirenestLaunchRouteBridge = "P14_G18_M5_A2"');
    expect(bootstrap).toContain('return "#learning/current-affairs"');
    expect(bootstrap).toContain('return "#admin/content/mock-tests"');
    [active, shadow].forEach((source) => {
      expect(source).toContain("P14_G18_M5_A2");
      expect(source).toContain("handleLaunchScopeRoute");
      expect(source).toContain("Existing data and routes remain preserved.");
      expect(source).toContain("target.startsWith('/ctet-tet/notes/read/')");
    });
  });
});
