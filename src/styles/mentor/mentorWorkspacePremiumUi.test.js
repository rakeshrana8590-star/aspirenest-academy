import fs from "fs";
import path from "path";

const cssPath = path.resolve(
  __dirname,
  "mentorWorkspace.css"
);
const css = fs.readFileSync(cssPath, "utf8");

describe("AspireNest premium mentor UI contract", () => {
  test("uses the locked CTET/TET premium palette and scoped variables", () => {
    expect(css).toContain("--mentor-ui-canvas: #020716");
    expect(css).toContain("--mentor-ui-surface-raised: #111b2d");
    expect(css).toContain("--mentor-ui-orange: #f97316");
    expect(css).toContain("--mentor-ui-gold: #f59e0b");
  });

  test("keeps the root page below the global premium header", () => {
    expect(css).toMatch(
      /\.appShell > section\.mentorWorkspacePage[\s\S]*?min-height:\s*calc\(100dvh - 74px\)\s*!important/
    );
    expect(css).toMatch(
      /\.appShell > section\.mentorWorkspacePage[\s\S]*?padding:[\s\S]*?clamp\(24px,\s*2\.4vw,\s*36px\)[\s\S]*?!important/
    );
    expect(css).not.toContain("min-height: 100vh;");
  });

  test("locks readable headings against legacy global section rules", () => {
    expect(css).toMatch(
      /\.mentorPanel h2[\s\S]*?-webkit-text-fill-color:\s*var\(--mentor-ui-text\)\s*!important/
    );
    expect(css).toMatch(
      /\.mentorAssignmentCard h2[\s\S]*?font-size:\s*clamp\(1rem,\s*1\.25vw,\s*1\.22rem\)\s*!important/
    );
  });

  test("locks readable light inputs with dark text and placeholders", () => {
    expect(css).toMatch(
      /\.mentorWorkspacePage input,[\s\S]*?color:\s*#0f172a\s*!important/
    );
    expect(css).toMatch(
      /input::placeholder,[\s\S]*?color:\s*#64748b\s*!important/
    );
    expect(css).toMatch(
      /input\[readonly\],[\s\S]*?background:\s*#e9eef5\s*!important/
    );
  });

  test("provides keyboard focus states for controls", () => {
    expect(css).toContain(
      ".mentorWorkspacePage input:focus-visible"
    );
    expect(css).toContain(
      ".mentorWorkspacePage button:focus-visible"
    );
  });

  test("keeps primary actions inside the orange-to-gold system", () => {
    expect(css).toMatch(
      /\.mentorPrimaryButton[\s\S]*?var\(--mentor-ui-orange\),[\s\S]*?var\(--mentor-ui-gold\)/
    );
  });

  test("uses responsive one-column layouts without fixed viewport height", () => {
    expect(css).toContain("@media (max-width: 1120px)");
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("@media (max-width: 520px)");
    expect(css).toContain("min-height: calc(100dvh - 70px)");
  });

  test("preserves access-state semantics", () => {
    expect(css).toContain(
      '[data-access-state="HAS_ACCESS"]'
    );
    expect(css).toContain(
      '[data-access-state="GRANT_REQUIRED"]'
    );
    expect(css).toContain(
      '[data-access-state="NOT_ASSIGNABLE"]'
    );
  });

  test("supports reduced-motion users", () => {
    expect(css).toContain(
      "@media (prefers-reduced-motion: reduce)"
    );
    expect(css).toContain("transition: none;");
  });

  test("isolates mentor hero from legacy global header rules", () => {
    expect(css).toMatch(
      /> header\.mentorWorkspaceHero[\s\S]*?position:\s*relative\s*!important/
    );
    expect(css).toMatch(
      /> header\.mentorWorkspaceHero[\s\S]*?height:\s*auto\s*!important/
    );
    expect(css).toMatch(
      /> header\.mentorWorkspaceHero[\s\S]*?min-height:\s*190px\s*!important/
    );
  });

  test("prevents the legacy white header background from replacing the hero", () => {
    expect(css).toMatch(
      /> header\.mentorWorkspaceHero[\s\S]*?linear-gradient\([\s\S]*?#111b2d[\s\S]*?#07101f[\s\S]*?\)\s*!important/
    );
    expect(css).toMatch(
      /> header\.mentorWorkspaceHero[\s\S]*?border-radius:\s*28px\s*!important/
    );
  });

  test("isolates nested mentor panels from global section padding", () => {
    expect(css).toMatch(
      /section\.mentorPanel[\s\S]*?padding:\s*clamp\(22px,\s*2\.6vw,\s*36px\)\s*!important/
    );
    expect(css).toMatch(
      /section\.mentorPanel[\s\S]*?height:\s*auto\s*!important/
    );
  });

  test("keeps the assigned learner card compact instead of full-width", () => {
    expect(css).toMatch(
      /\.mentorStudentGrid[\s\S]*?minmax\(300px,\s*420px\)[\s\S]*?!important/
    );
    expect(css).toMatch(
      /button\.mentorStudentCard[\s\S]*?max-width:\s*420px\s*!important/
    );
    expect(css).toMatch(
      /button\.mentorStudentCard[\s\S]*?min-height:\s*168px\s*!important/
    );
  });

  test("relocks root, hero, panel and learner card behavior for compact screens", () => {
    expect(css).toMatch(
      /@media \(max-width:\s*760px\)[\s\S]*?> header\.mentorWorkspaceHero[\s\S]*?flex-direction:\s*column\s*!important/
    );
    expect(css).toMatch(
      /@media \(max-width:\s*760px\)[\s\S]*?\.mentorStudentGrid[\s\S]*?grid-template-columns:\s*1fr\s*!important/
    );
    expect(css).toMatch(
      /@media \(max-width:\s*760px\)[\s\S]*?button\.mentorStudentCard[\s\S]*?max-width:\s*none\s*!important/
    );
  });
});

describe("AspireNest Premium Unified Foundation V1", () => {
  const sharedCssPath = path.resolve(
    __dirname,
    "../shared/experienceSystem.css"
  );
  const sharedCss = fs.readFileSync(
    sharedCssPath,
    "utf8"
  );

  test("promotes the approved CTET/TET palette into shared tokens", () => {
    expect(sharedCss).toContain(
      "--aspire-ui-canvas: #020716"
    );
    expect(sharedCss).toContain(
      "--aspire-ui-surface-raised: #111b2d"
    );
    expect(sharedCss).toContain(
      "--aspire-ui-orange: #f97316"
    );
    expect(sharedCss).toContain(
      "--aspire-ui-gold: #f59e0b"
    );
  });

  test("hides app-wide scrollbars without disabling scrolling", () => {
    expect(sharedCss).toMatch(
      /html,[\s\S]*?body,[\s\S]*?#root,[\s\S]*?\.appShell \*[\s\S]*?scrollbar-width:\s*none\s*!important/
    );
    expect(sharedCss).toMatch(
      /\.appShell \*::\-webkit-scrollbar[\s\S]*?display:\s*none\s*!important/
    );
    expect(sharedCss).not.toMatch(
      /ASPIRENEST PREMIUM UNIFIED FOUNDATION V1[\s\S]*?overflow-y:\s*hidden/
    );
  });

  test("prevents horizontal overflow at the application shell", () => {
    expect(sharedCss).toMatch(
      /body,[\s\S]*?#root,[\s\S]*?\.appShell[\s\S]*?overflow-x:\s*clip/
    );
    expect(sharedCss).toContain(
      "@supports not (overflow: clip)"
    );
  });

  test("defines shared restrained card motion and depth", () => {
    expect(sharedCss).toContain(
      "--aspire-ui-duration-card: 220ms"
    );
    expect(sharedCss).toContain(
      "--aspire-ui-shadow-hover:"
    );
    expect(sharedCss).toContain(
      "cubic-bezier(0.22, 1, 0.36, 1)"
    );
  });

  test("gives approved clickable surfaces a pointer and GPU-safe transform", () => {
    expect(sharedCss).toMatch(
      /button\.experienceCard,[\s\S]*?button\.mentorStudentCard[\s\S]*?cursor:\s*pointer/
    );
    expect(sharedCss).toContain(
      "transform: translateZ(0)"
    );
    expect(sharedCss).toContain(
      "will-change: transform"
    );
  });

  test("uses fine-pointer hover lift rather than touch-dependent hover", () => {
    expect(sharedCss).toContain(
      "@media (hover: hover) and (pointer: fine)"
    );
    expect(sharedCss).toMatch(
      /button\.ctetNextStepCard,[\s\S]*?button\.ctetS4UpdateRow[\s\S]*?translateY\(-4px\)/
    );
  });

  test("provides active press and focus-visible feedback", () => {
    expect(sharedCss).toContain(
      "translateY(-1px) scale(0.992)"
    );
    expect(sharedCss).toContain(
      "outline: 2px solid rgba(250, 204, 21, 0.84)"
    );
    expect(sharedCss).toContain(
      "--aspire-ui-focus-ring:"
    );
  });

  test("preserves reduced-motion accessibility", () => {
    expect(sharedCss).toContain(
      "@media (prefers-reduced-motion: reduce)"
    );
    expect(sharedCss).toContain(
      "transition: none !important"
    );
    expect(sharedCss).toContain(
      "animation: none !important"
    );
  });

  test("makes mentor cards consume shared tokens and lift values", () => {
    expect(css).toContain(
      "var(--aspire-ui-canvas, #020716)"
    );
    expect(css).toContain(
      "var(--aspire-ui-shadow-hover)"
    );
    expect(css).toMatch(
      /button\.mentorStudentCard:not\(:disabled\):hover[\s\S]*?translateY\(-5px\)/
    );
    expect(css).toMatch(
      /button\.mentorResourceCard:not\(:disabled\):hover[\s\S]*?translateY\(-4px\)/
    );
  });

  test("adds live glow, arrow motion and selected-state distinction", () => {
    expect(css).toContain(
      ".mentorStudentCard::before"
    );
    expect(css).toContain(
      "transform: translateX(5px)"
    );
    expect(css).toMatch(
      /\.mentorResourceCard\.isSelected[\s\S]*?rgba\(250, 204, 21, 0\.78\)/
    );
  });
});
