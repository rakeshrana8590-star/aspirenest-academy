import {
  V8_SCRIPT_ASSETS,
  V8_STYLE_ASSETS,
  allowedV8Experiences,
  buildV8ShellMarkup,
  transformV8CssForShadow,
} from "./v8ShadowRuntimeModel";

describe("V8 Shadow runtime model", () => {
  test("keeps the exact approved V8 asset inventory", () => {
    expect(V8_STYLE_ASSETS).toEqual([
      "/learning-drive-v8/styles.css",
      "/learning-drive-v8/admin.css",
      "/learning-drive-v8/v8-experiences.css",
    ]);
    expect(V8_SCRIPT_ASSETS).toEqual([
      "/learning-drive-v8/app.js",
      "/learning-drive-v8/admin.js",
      "/learning-drive-v8/v8-experiences.js",
    ]);
  });

  test("moves root and body selectors inside the Shadow DOM boundary", () => {
    const source = ':root{--ink:#111}html{height:100%}body{margin:0}body.active .brand{color:red}.topbar,.brand{display:flex}@media(max-width:700px){body{overflow:hidden}}';
    const result = transformV8CssForShadow(source);

    expect(result).toContain(":host{--ink:#111}");
    expect(result).toContain(":host{height:100%}");
    expect(result).toContain(".v8-shadow-body{margin:0}");
    expect(result).toContain(".v8-shadow-body.active .brand{color:red}");
    expect(result).toContain(".topbar,.brand{display:flex}");
    expect(result).toContain("@media(max-width:700px){.v8-shadow-body{overflow:hidden}}");
  });

  test("enforces the exact role hierarchy", () => {
    expect(allowedV8Experiences({ authenticated: false, isMentorUser: false, isAdminUser: false })).toEqual(["public"]);
    expect(allowedV8Experiences({ authenticated: true, isMentorUser: false, isAdminUser: false })).toEqual(["public", "student"]);
    expect(allowedV8Experiences({ authenticated: true, isMentorUser: true, isAdminUser: false })).toEqual(["public", "student", "mentor"]);
    expect(allowedV8Experiences({ authenticated: true, isMentorUser: true, isAdminUser: true })).toEqual(["public", "student", "mentor", "admin"]);
  });

  test("creates the canonical AspireNest Academy shell", () => {
    const markup = buildV8ShellMarkup({ initials: "RR", email: "rakesh@example.com", authenticated: true });
    expect(markup).toContain("<strong>AspireNest</strong><small>Academy</small>");
    expect(markup).toContain('id="parentNav"');
    expect(markup).toContain('id="contextNav"');
    expect(markup).toContain('id="pageContent"');
    expect(markup).toContain('id="roleSwitchButton"');
    expect(markup).toContain('id="accountButton"');
    expect(markup).toContain(">RR</button>");
    expect(markup).toContain("rakesh@example.com");
  });
});
