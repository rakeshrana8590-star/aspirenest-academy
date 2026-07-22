import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe("AspireNest Current Affairs route authorization wiring", () => {
  test("App wires the direct resource viewer with access state", () => {
    const app = readSource("src/App.js");

    expect(app).toContain(
      'path="/ctet-tet/current-affairs/:monthId/read/:resourceId"'
    );
    expect(app).toContain(
      "<StudentCurrentAffairsViewerRoute"
    );
    expect(app).toContain(
      "hasPlanAccess={hasPlanAccess}"
    );
    expect(app).toContain("accessState={{");
    expect(app).toContain(
      "accessProfile?.isAccessCheckUnavailable"
    );
  });

  test("month cards resolve resource-bound READ decisions", () => {
    const cards = readSource(
      "src/components/currentAffairs/student/StudentCurrentAffairsCards.jsx"
    );
    const policy = readSource(
      "src/access/currentAffairsActionPolicy.js"
    );

    expect(cards).toContain(
      "buildCurrentAffairsAccessEvidence"
    );
    expect(cards).toContain(
      "buildCurrentAffairsActionDecision"
    );
    expect(cards).toContain(
      "action: CURRENT_AFFAIRS_ACTIONS.READ"
    );
    expect(policy).toContain(
      'module: "currentAffairs"'
    );
    expect(policy).toContain(
      'itemType: "currentAffairsPdf"'
    );
    expect(policy).toContain(
      "resolvedForResource"
    );
  });

  test("month route opens the verified viewer instead of exposing the raw PDF", () => {
    const monthRoute = readSource(
      "src/components/currentAffairs/student/StudentCurrentAffairsMonthRoute.jsx"
    );

    expect(monthRoute).toContain(
      "/read/"
    );
    expect(monthRoute).toContain(
      "openCurrentAffairsViewer"
    );
    expect(monthRoute).not.toContain(
      "window.open(pdfUrl"
    );
    expect(monthRoute).not.toContain(
      "getCurrentAffairsPdfUrl"
    );
  });

  test("direct viewer fails closed for loading, errors and denied access", () => {
    const viewer = readSource(
      "src/components/currentAffairs/student/StudentCurrentAffairsViewerRoute.jsx"
    );

    expect(viewer).toContain(
      "CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING"
    );
    expect(viewer).toContain(
      "CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR"
    );
    expect(viewer).toContain(
      "AspireNest kept this protected PDF closed"
    );
    expect(viewer).toContain(
      "if (!readDecision.allowed)"
    );
  });

  test("protected PDF resolution requires the matching READ decision", () => {
    const viewer = readSource(
      "src/components/currentAffairs/student/StudentCurrentAffairsViewerRoute.jsx"
    );
    const service = readSource(
      "src/protectedContentAssetsService.js"
    );

    expect(viewer).toContain(
      "readProtectedCurrentAffairsAssetForDecision"
    );
    expect(viewer).toContain(
      "decision: readDecision"
    );
    expect(service).toContain(
      "decision?.canRead !== true"
    );
    expect(service).toContain(
      "decision?.canResolveAsset !== true"
    );
    expect(service).toContain(
      "Protected Current Affairs asset authorization denied."
    );
  });

  test("legacy PDF delivery remains behind verified READ", () => {
    const viewer = readSource(
      "src/components/currentAffairs/student/StudentCurrentAffairsViewerRoute.jsx"
    );
    const policy = readSource(
      "src/access/currentAffairsActionPolicy.js"
    );

    expect(viewer).toContain(
      "readDecision?.legacySourceAllowed"
    );
    expect(viewer).toContain(
      "legacySourceUrl"
    );
    expect(policy).toContain(
      "legacySourceAllowed: !protectedAsset"
    );
  });

  test("protected-only canonical resources remain publishable", () => {
    const utils = readSource(
      "src/components/currentAffairs/shared/currentAffairsUtils.js"
    );

    expect(utils).toContain(
      "hasCurrentAffairsReadableAsset"
    );
    expect(utils).toContain(
      'module: item.module || "currentAffairs"'
    );
    expect(utils).toContain(
      'itemType: item.itemType || "currentAffairsPdf"'
    );
  });

  test("admin redesign and unrelated learning modules remain outside the policy", () => {
    const policy = readSource(
      "src/access/currentAffairsActionPolicy.js"
    );

    expect(policy).not.toContain(
      "AdminCurrentAffairs"
    );
    expect(policy).not.toContain(
      "roadmap"
    );
    expect(policy).not.toContain(
      "StudentClassroom"
    );
  });
});
