import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("G16 preactivation read-only browser boundary", () => {
  const gate = read("src/v8/v8ReleaseWriteGate.js");
  const adminActions = read("src/v8/v8AdminLiveActions.js");
  const platformActions = read("src/v8/v8PlatformLiveActions.js");

  test("gates every Admin and Student/Mentor mutation channel", () => {
    expect(adminActions).toContain("assertAspireNestProductionWriteEnabled(action)");
    expect(platformActions).toContain("assertAspireNestProductionWriteEnabled(action)");
    expect(gate).toContain("REACT_APP_ASPIRENEST_PRODUCTION_WRITES_ENABLED");
    expect(gate).toContain('"aspirenestacademy.in"');
    expect(gate).toContain('"www.aspirenestacademy.in"');
  });

  test("never writes Mentor relationships merely because live Admin data was read", () => {
    expect(adminActions).not.toContain('window.addEventListener("aspirenest:real-admin-data"');
    expect(adminActions).toContain('"sync-default-mentor-relationships"');
    expect(adminActions).toContain("SYNC_DEFAULT_MENTOR_RELATIONSHIPS");
  });

  test("publishes the active release gate for acceptance evidence", () => {
    expect(adminActions).toContain("aspirenest:release-write-gate");
    expect(platformActions).toContain("aspirenest:release-write-gate");
  });
});
