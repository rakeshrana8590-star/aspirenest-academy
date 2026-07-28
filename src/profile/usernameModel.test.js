import {
  normalizeUsername,
  validateUsername,
} from "./usernameModel";

describe("AspireNest username model", () => {
  test("normalizes a founder-friendly username", () => {
    expect(normalizeUsername(" Rakesh Rana ")).toBe("rakesh_rana");
  });

  test("requires a letter first and blocks unsafe symbols", () => {
    expect(validateUsername("22rakesh").ok).toBe(false);
    expect(validateUsername("rakesh.rana").normalizedUsername).toBe("rakeshrana");
  });

  test("blocks reserved platform identities", () => {
    expect(validateUsername("admin")).toMatchObject({
      ok: false,
      reason: "USERNAME_RESERVED",
    });
  });

  test("accepts lowercase letters, numbers and underscore", () => {
    expect(validateUsername("rakesh_rana26")).toMatchObject({
      ok: true,
      normalizedUsername: "rakesh_rana26",
    });
  });
});
