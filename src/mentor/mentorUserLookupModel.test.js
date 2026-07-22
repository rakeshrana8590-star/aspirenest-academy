import {
  isValidMentorSetupEmail,
  normalizeMentorSetupAccount,
  normalizeMentorSetupEmail,
  selectExactMentorSetupAccount,
} from "./mentorUserLookupModel";

describe("mentor setup email lookup model", () => {
  test("normalizes account email", () => {
    expect(
      normalizeMentorSetupEmail(
        "  Mentor.P12@Example.COM "
      )
    ).toBe("mentor.p12@example.com");
  });

  test("validates email format", () => {
    expect(
      isValidMentorSetupEmail(
        "mentor.p12@example.com"
      )
    ).toBe(true);
    expect(
      isValidMentorSetupEmail("mentor-p12")
    ).toBe(false);
  });

  test("uses the user document id as UID", () => {
    expect(
      normalizeMentorSetupAccount({
        id: "uid-1",
        email: "mentor@example.com",
        name: "Launch Mentor",
      })
    ).toMatchObject({
      uid: "uid-1",
      email: "mentor@example.com",
      displayName: "Launch Mentor",
    });
  });

  test("accepts matching declared and document UID", () => {
    expect(
      normalizeMentorSetupAccount({
        id: "uid-1",
        uid: "uid-1",
        email: "student@example.com",
      }).uid
    ).toBe("uid-1");
  });

  test("rejects inconsistent UID identity", () => {
    expect(() =>
      normalizeMentorSetupAccount({
        id: "uid-1",
        uid: "uid-2",
        email: "student@example.com",
      })
    ).toThrow("identity is inconsistent");
  });

  test("selects one exact account case-insensitively", () => {
    expect(
      selectExactMentorSetupAccount({
        email: "MENTOR@EXAMPLE.COM",
        records: [
          {
            id: "uid-1",
            email: "mentor@example.com",
            displayName: "Mentor One",
          },
        ],
      })
    ).toMatchObject({
      uid: "uid-1",
      email: "mentor@example.com",
      displayName: "Mentor One",
    });
  });

  test("deduplicates the same UID returned by two lookup fields", () => {
    expect(
      selectExactMentorSetupAccount({
        email: "student@example.com",
        records: [
          {
            id: "uid-1",
            email: "student@example.com",
          },
          {
            id: "uid-1",
            normalizedEmail:
              "student@example.com",
          },
        ],
      }).uid
    ).toBe("uid-1");
  });

  test("rejects a missing account", () => {
    expect(() =>
      selectExactMentorSetupAccount({
        email: "missing@example.com",
        records: [],
      })
    ).toThrow("No AspireNest account");
  });

  test("rejects duplicate accounts with different UIDs", () => {
    expect(() =>
      selectExactMentorSetupAccount({
        email: "duplicate@example.com",
        records: [
          {
            id: "uid-1",
            email: "duplicate@example.com",
          },
          {
            id: "uid-2",
            email: "duplicate@example.com",
          },
        ],
      })
    ).toThrow("Multiple user records");
  });

  test("returns a frozen account result", () => {
    const account =
      selectExactMentorSetupAccount({
        email: "student@example.com",
        records: [
          {
            id: "uid-1",
            email: "student@example.com",
          },
        ],
      });

    expect(Object.isFrozen(account)).toBe(true);
  });
});
