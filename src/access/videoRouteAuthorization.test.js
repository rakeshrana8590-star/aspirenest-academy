import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe("AspireNest Video route authorization wiring", () => {
  test("App passes access resolution state into the direct watch route", () => {
    const app = readSource("src/App.js");

    expect(app).toContain(
      'path="/ctet-tet/videos/watch/:videoId"'
    );
    expect(app).toContain("<StudentClassroomGuardRoute");
    expect(app).toContain("hasPlanAccess={hasPlanAccess}");
    expect(app).toContain("accessState={{");
    expect(app).toContain(
      "accessProfile?.isAccessCheckUnavailable"
    );
  });

  test("the direct route resolves a resource-bound WATCH decision", () => {
    const guard = readSource(
      "src/components/video/VideoAccessGuard.jsx"
    );
    const route = readSource(
      "src/components/video/StudentClassroomGuardRoute.jsx"
    );

    expect(guard).toContain("buildVideoActionDecision");
    expect(guard).toContain("action: VIDEO_ACTIONS.WATCH");
    expect(guard).toContain('module: "video"');
    expect(guard).toContain('itemType: "video"');
    expect(guard).toContain("resolvedForResource");

    expect(route).toContain("watchDecision,");
    expect(route).toContain("liveActionDecision,");
    expect(route).toContain("watchDecision={watchDecision}");
    expect(route).toContain(
      "liveActionDecision={liveActionDecision}"
    );
  });

  test("loading and access lookup errors fail closed", () => {
    const guard = readSource(
      "src/components/video/VideoAccessGuard.jsx"
    );

    expect(guard).toContain(
      "VIDEO_REASON_CODES.ACCESS_LOADING"
    );
    expect(guard).toContain(
      "VIDEO_REASON_CODES.ACCESS_ERROR"
    );
    expect(guard).toContain("ACCESS UNAVAILABLE");
    expect(guard).toContain("kept this protected class closed");
  });

  test("protected media is resolved only after WATCH authorization", () => {
    const route = readSource(
      "src/components/video/StudentClassroomGuardRoute.jsx"
    );
    const service = readSource(
      "src/protectedContentAssetsService.js"
    );

    expect(route).toContain(
      "readProtectedVideoAssetForDecision"
    );
    expect(route).toContain(
      "decision: playbackDecision"
    );
    expect(route).toContain(
      "shouldResolveProtectedSource"
    );
    expect(route).toContain("requiresProtectedAsset");
    expect(service).toContain(
      "decision?.canResolveAsset !== true"
    );
    expect(service).toContain(
      "decision?.canWatch !== true"
    );
    expect(service).toContain(
      "Protected video asset authorization denied."
    );
  });

  test("the player accepts only an authorized source prop", () => {
    const classroom = readSource(
      "src/components/video/StudentClassroomRoute.jsx"
    );
    const player = readSource(
      "src/components/video/SecureVideoPlayer.jsx"
    );

    expect(classroom).toContain("verifiedClassroomAccess");
    expect(classroom).toContain("authorizedSourceUrl");
    expect(classroom).toContain(
      "playbackDecision || watchDecision"
    );

    expect(player).toContain("authorizationDecision?.allowed");
    expect(player).toContain(
      "authorizationDecision?.canWatch"
    );
    expect(player).toContain(
      "authorizationDecision?.videoId === expectedResourceId"
    );
    expect(player).not.toContain(
      "classroomItem.videoUrl ||"
    );
    expect(player).not.toContain(
      "classroomItem.replayUrl ||"
    );
  });

  test("legacy video delivery is preserved behind verified WATCH", () => {
    const classroom = readSource(
      "src/components/video/StudentClassroomRoute.jsx"
    );
    const policy = readSource(
      "src/access/videoActionPolicy.js"
    );

    expect(classroom).toContain(
      "playbackDecision?.legacySourceAllowed"
    );
    expect(classroom).toContain("legacyPlaybackUrl");
    expect(policy).toContain(
      "legacySourceAllowed: !protectedAsset"
    );
  });

  test("admin video management and unrelated modules remain outside the patch", () => {
    const policy = readSource(
      "src/access/videoActionPolicy.js"
    );

    expect(policy).not.toContain("currentAffairs");
    expect(policy).not.toContain("roadmap");
    expect(policy).not.toContain("VideoManagerHome");
  });
});
