import fs from "fs";
import path from "path";

const runtime = fs.readFileSync(path.join(__dirname, "V8LearningDriveRuntime.jsx"), "utf8");
const model = fs.readFileSync(path.join(__dirname, "v8ShadowRuntimeModel.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "v8RuntimeHost.css"), "utf8");

describe("AspireNest exact V8 runtime integration", () => {
  test("isolates the exact V8 runtime from the legacy React CSS document", () => {
    expect(runtime).toContain('host.attachShadow({ mode: "open" })');
    expect(runtime).toContain("transformV8CssForShadow");
    expect(runtime).toContain("createV8ShadowEnvironment");
    expect(runtime).toContain("executeV8Script");
    expect(runtime).not.toContain("document.head.appendChild(link)");
    expect(runtime).not.toContain("document.body.appendChild(script)");
    expect(runtime.toLowerCase()).not.toContain("iframe");
    expect(css).toContain(".aspirenestV8ShadowHost");
  });

  test("preserves the exact V8 asset engines", () => {
    ["styles.css", "admin.css", "v8-experiences.css", "app.js", "admin.js", "v8-experiences.js"].forEach((asset) => {
      expect(model).toContain(asset);
    });
  });

  test("keeps real auth, role routes, account actions and brand lock", () => {
    expect(runtime).toContain('fullNavigate("/login")');
    expect(runtime).toContain('fullNavigate("/create-account")');
    expect(runtime).toContain("await logoutRef.current?.()");
    expect(runtime).toContain("allowedV8Experiences");
    expect(runtime).toContain("EXPERIENCE_ROUTE.student");
    expect(runtime).toContain('syncText(shadowRoot.querySelector("#brandHome .brand-copy strong"), "AspireNest")');
    expect(runtime).toContain('syncText(shadowRoot.querySelector("#brandHome .brand-copy small"), "Academy")');
  });

  test("does not recreate or redesign the approved static engines", () => {
    expect(runtime).toContain("Promise.all(V8_STYLE_ASSETS.map(fetchAssetText))");
    expect(runtime).toContain("Promise.all(V8_SCRIPT_ASSETS.map(fetchAssetText))");
    expect(runtime).toContain("style.textContent = transformV8CssForShadow(cssText)");
    expect(runtime).toContain("executeV8Script({ source, sourceUrl: V8_SCRIPT_ASSETS[index], environment })");
  });
  test("injects real Notes and bridges canonical opening without changing the approved shell", () => {
    expect(runtime).toContain("buildV8RealNotesRuntime");
    expect(runtime).toContain("realNotes: realNotesRuntime.resources");
    expect(runtime).toContain("__aspirenestOpenCanonicalResource");
    expect(runtime).toContain("onOpenLegacyNote");
  });

});
