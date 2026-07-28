import {
  resolveAspireNestReleaseWriteGate,
} from "./v8ReleaseWriteGate";

describe("AspireNest controlled production write gate", () => {
  test("keeps local review read-only even when the environment flag is requested", () => {
    expect(resolveAspireNestReleaseWriteGate({ requested: true, hostname: "127.0.0.1" })).toMatchObject({
      enabled: false,
      requested: true,
      productionHost: false,
    });
  });

  test("requires both the explicit environment flag and the exact production host", () => {
    expect(resolveAspireNestReleaseWriteGate({ requested: false, hostname: "aspirenestacademy.in" }).enabled).toBe(false);
    expect(resolveAspireNestReleaseWriteGate({ requested: true, hostname: "aspirenestacademy.in" }).enabled).toBe(true);
    expect(resolveAspireNestReleaseWriteGate({ requested: true, hostname: "www.aspirenestacademy.in" }).enabled).toBe(true);
  });

  test("does not accept lookalike domains", () => {
    expect(resolveAspireNestReleaseWriteGate({ requested: true, hostname: "aspirenestacademy.in.example.com" }).enabled).toBe(false);
    expect(resolveAspireNestReleaseWriteGate({ requested: true, hostname: "preview.vercel.app" }).enabled).toBe(false);
  });
});
