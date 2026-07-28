import {
  canV8AccessResource,
  normalizeV8Module,
  normalizeV8Plan,
  resolveV8EffectivePlan,
  resolveV8RecordPlan,
  resolveV8ResourcePlan,
  v8EntitlementMatchesResource,
} from "./v8EntitlementPolicy";

const modules = [
  ["Native Note", "notes"],
  ["Video", "video"],
  ["Mock Test", "mockTest"],
  ["Current Affairs", "currentAffairs"],
  ["Roadmap", "roadmap"],
  ["Live Class", "video"],
];

describe("V8 central plan entitlement policy", () => {
  test.each([
    ["FREE", "FREE", true],
    ["FREE", "BASIC", false],
    ["BASIC", "FREE", true],
    ["BASIC", "BASIC", true],
    ["BASIC", "PREMIUM", false],
    ["PREMIUM", "FREE", true],
    ["PREMIUM", "BASIC", true],
    ["PREMIUM", "PREMIUM", true],
    ["PREMIUM", "MENTORSHIP", false],
    ["MENTORSHIP", "FREE", true],
    ["MENTORSHIP", "BASIC", true],
    ["MENTORSHIP", "PREMIUM", true],
    ["MENTORSHIP", "MENTORSHIP", true],
  ])("applies %s hierarchy against %s", (userPlan, requiredPlan, expected) => {
    expect(canV8AccessResource({ resource: { requiredPlan }, userPlan })).toBe(expected);
  });

  test.each(modules)("uses the same hierarchy for %s", (resourceType) => {
    expect(canV8AccessResource({ resource: { resourceType, requiredPlan: "PREMIUM" }, userPlan: "PREMIUM" })).toBe(true);
    expect(canV8AccessResource({ resource: { resourceType, requiredPlan: "PREMIUM" }, userPlan: "BASIC" })).toBe(false);
  });

  test("supports historical plan field aliases", () => {
    expect(resolveV8RecordPlan({ plan: "PREMIUM" })).toBe("PREMIUM");
    expect(resolveV8RecordPlan({ currentPlan: "MENTORSHIP" })).toBe("MENTORSHIP");
    expect(resolveV8RecordPlan({ planCode: "BASIC" })).toBe("BASIC");
  });

  test("moves only Mentorship Notes to Premium", () => {
    expect(resolveV8ResourcePlan({ resourceType: "Native Note", planType: "MENTORSHIP" })).toBe("PREMIUM");
    expect(resolveV8ResourcePlan({ resourceType: "Video", planType: "MENTORSHIP" })).toBe("MENTORSHIP");
    expect(resolveV8ResourcePlan({ resourceType: "Native Note", planType: "BASIC" })).toBe("BASIC");
  });

  test("normalizes module aliases for module grants", () => {
    expect(normalizeV8Module("Current Affairs")).toBe("currentAffairs");
    expect(normalizeV8Module("roadmaps")).toBe("roadmap");
    expect(normalizeV8Module("Practice / Mock Tests")).toBe("mockTest");
    expect(v8EntitlementMatchesResource(
      { status: "active", scopeType: "module", module: "roadmaps", plan: "PREMIUM" },
      { id: "r1", resourceType: "roadmap", requiredPlan: "PREMIUM" }
    )).toBe(true);
  });

  test("resolves the highest effective learner plan from profile and active plan grants", () => {
    expect(resolveV8EffectivePlan({
      profile: { plan: "BASIC" },
      accessRecords: [{ status: "active", scopeType: "plan", plan: "PREMIUM" }],
    })).toBe("PREMIUM");
    expect(normalizeV8Plan("mentor-guided")).toBe("MENTORSHIP");
  });
});
