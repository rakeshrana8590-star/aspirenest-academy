import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe("AspireNest Roadmaps and Live authorization wiring", () => {
  test("App passes access resolution state into every student roadmap route", () => {
    const app = readSource("src/App.js");

    expect(app).toContain(
      'path="/ctet-tet/roadmaps"'
    );
    expect(app).toContain(
      'path="/ctet-tet/roadmaps/:roadmapId"'
    );
    expect(app).toContain(
      'path="/ctet-tet/roadmaps/:roadmapId/day/:dayId"'
    );
    expect(app).toContain(
      'path="/my-aspirepath"'
    );

    expect(
      app.match(/accessState=\{\{/g)?.length
    ).toBeGreaterThanOrEqual(4);
    expect(app).toContain(
      "accessProfile?.isAccessCheckUnavailable"
    );
  });

  test("direct roadmap and day routes use resource-bound central decisions", () => {
    const detail = readSource(
      "src/components/roadmaps/student/StudentRoadmapDetailRoute.jsx"
    );
    const day = readSource(
      "src/components/roadmaps/student/StudentRoadmapDayRoute.jsx"
    );

    expect(detail).toContain(
      "buildRoadmapAccessEvidence"
    );
    expect(detail).toContain(
      "action: ROADMAP_ACTIONS.OPEN"
    );
    expect(detail).toContain(
      "ROADMAP_REASON_CODES.ACCESS_ERROR"
    );

    expect(day).toContain(
      "action: ROADMAP_ACTIONS.VIEW_DAY"
    );
    expect(day).toContain(
      "action: ROADMAP_ACTIONS.UPDATE_PROGRESS"
    );
    expect(day).toContain(
      "progressDecision.canUpdateProgress"
    );
  });

  test("My AspirePath contains only roadmaps visible in verified My Access", () => {
    const source = readSource(
      "src/components/roadmaps/student/MyAspirePathRoute.jsx"
    );

    expect(source).toContain(
      "ROADMAP_DISCOVERY_MODES.MY_ACCESS"
    );
    expect(source).toContain(
      "buildRoadmapAccessEvidence"
    );
    expect(source).toContain(
      "return decision.allowed"
    );
    expect(source).not.toContain(
      "canAccessRoadmap({"
    );
  });

  test("linked resources authorize their real module instead of inheriting roadmap access", () => {
    const day = readSource(
      "src/components/roadmaps/student/StudentRoadmapDayRoute.jsx"
    );
    const policy = readSource(
      "src/access/roadmapLinkedResourcePolicy.js"
    );

    expect(day).toContain(
      "buildRoadmapLinkedResourceAccessEvidence"
    );
    expect(day).toContain(
      "getLinkedResourceDecision"
    );
    expect(day).toContain(
      "authorizedHref"
    );

    expect(policy).toContain(
      'module: "notes"'
    );
    expect(policy).toContain(
      'module: "video"'
    );
    expect(policy).toContain(
      'module: "mockTest"'
    );
    expect(policy).toContain(
      'module: "currentAffairs"'
    );
    expect(policy).not.toContain(
      'module: "roadmap",\n      itemType: "roadmapResource"'
    );
  });

  test("student task resources use secure callbacks instead of rendering raw links", () => {
    const shared = readSource(
      "src/components/roadmaps/RoadmapShared.jsx"
    );
    const day = readSource(
      "src/components/roadmaps/student/StudentRoadmapDayRoute.jsx"
    );
    const detail = readSource(
      "src/components/roadmaps/student/StudentRoadmapDetailRoute.jsx"
    );

    expect(shared).toContain(
      "getResourceDecision"
    );
    expect(shared).toContain(
      "onOpenResource"
    );
    expect(shared).toContain(
      "secureMode"
    );
    expect(day).toContain(
      "getResourceDecision={"
    );
    expect(day).toContain(
      "onOpenResource={"
    );
    expect(detail).toContain("hideResources");
  });

  test("Live and Replay use distinct action decisions while schedule pages remain visible", () => {
    const policy = readSource(
      "src/access/videoActionPolicy.js"
    );
    const guard = readSource(
      "src/components/video/VideoAccessGuard.jsx"
    );
    const route = readSource(
      "src/components/video/StudentClassroomGuardRoute.jsx"
    );
    const classroom = readSource(
      "src/components/video/StudentClassroomRoute.jsx"
    );

    expect(policy).toContain(
      'JOIN_LIVE: "JOIN_LIVE"'
    );
    expect(policy).toContain(
      'WATCH_REPLAY: "WATCH_REPLAY"'
    );
    expect(policy).toContain("canJoinLive");
    expect(policy).toContain("canWatchReplay");

    expect(guard).toContain(
      "getLivePlaybackAction"
    );
    expect(guard).toContain(
      "liveActionDecision"
    );
    expect(route).toContain(
      "shouldResolveProtectedSource"
    );
    expect(route).toContain(
      "decision: playbackDecision"
    );
    expect(classroom).toContain(
      "verifiedPlayback"
    );
    expect(classroom).toContain(
      "playbackDecision?.canJoinLive"
    );
    expect(classroom).toContain(
      "playbackDecision?.canWatchReplay"
    );
  });

  test("protected Live sources are not resolved before a verified Join or Replay action", () => {
    const route = readSource(
      "src/components/video/StudentClassroomGuardRoute.jsx"
    );

    expect(route).toContain(
      "liveActionDecision"
    );
    expect(route).toContain(
      "playbackDecision?.allowed === true"
    );
    expect(route).toContain(
      "playbackDecision?.canWatch === true"
    );
    expect(route).toContain(
      "if (!shouldResolveProtectedSource)"
    );
  });
});
