import {
  buildV8ReaderAccessDecision,
  getIntelliTextStudentReaderId,
  isIntelliTextStudentReaderPath,
  resolveIntelliTextStudentReaderState,
} from "./intelliTextStudentReaderEntryModel";

describe("canonical Student IntelliText reader", () => {
  const pathname =
    "/ctet-tet/notes/read/KdOrZcjhf7wo85O5N4sn";

  test("owns only the exact canonical reader route", () => {
    expect(getIntelliTextStudentReaderId(pathname)).toBe(
      "KdOrZcjhf7wo85O5N4sn"
    );
    expect(isIntelliTextStudentReaderPath(pathname)).toBe(true);
    expect(isIntelliTextStudentReaderPath("/ctet-tet/notes")).toBe(false);
  });

  test("maps the published entitled Note to native IntelliText", () => {
    const state = resolveIntelliTextStudentReaderState({
      pathname,
      session: {
        ready: true,
        role: "student",
        user: { uid: "student-1" },
      },
      studentData: {
        ready: true,
        resources: [
          {
            id: "KdOrZcjhf7wo85O5N4sn",
            resourceId: "KdOrZcjhf7wo85O5N4sn",
            type: "note",
            title: "Science Master Guide",
            state: "open",
            requiredPlan: "PREMIUM",
            source: {
              textbookId: "KdOrZcjhf7wo85O5N4sn",
              contentVersion: 2,
            },
          },
        ],
      },
    });

    expect(state).toMatchObject({
      state: "READY",
      textbookId: "KdOrZcjhf7wo85O5N4sn",
      canonicalNote: {
        deliveryMode: "NATIVE_TEXT",
        nativeReady: true,
        publicationState: "PUBLISHED",
        status: "Published",
        contentVersion: 2,
      },
    });
  });

  test("fails closed without Student access", () => {
    const decision = buildV8ReaderAccessDecision({
      session: {
        ready: true,
        role: "student",
        user: { uid: "student-1" },
      },
      studentData: { ready: true },
      resource: { state: "locked" },
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "access_denied",
      canReadAsset: false,
    });
  });

  test("allows Admin to review the Student reader", () => {
    const decision = buildV8ReaderAccessDecision({
      session: {
        ready: true,
        role: "admin",
        user: { uid: "admin-1" },
      },
      studentData: { ready: true },
      resource: { state: "locked" },
    });

    expect(decision.allowed).toBe(true);
  });
});
