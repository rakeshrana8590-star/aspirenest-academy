import fs from "fs";
import path from "path";
import {
  normalizeMentorResource,
  resolveMentorResourceAccessState,
} from "./mentorAccessModel";
import { MENTOR_RESOURCE_ACCESS_STATES } from "./mentorConstants";

const read = (relativePath) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("Roadmap mentor launch readiness", () => {
  test("Roadmaps are exact assignable resources", () => {
    const resource = normalizeMentorResource({
      id: "roadmap-60",
      title: "60 Day AspirePath",
      resourceType: "roadmap",
      status: "published",
      planType: "PREMIUM",
    });

    expect(resource.module).toBe("roadmap");
    expect(resource.itemType).toBe("roadmap");
    expect(resource.canonicalRoute).toBe("/ctet-tet/roadmaps/roadmap-60");
  });

  test("a Roadmap item grant does not unlock another Roadmap", () => {
    const resource = normalizeMentorResource({
      id: "roadmap-2",
      title: "Roadmap 2",
      resourceType: "roadmap",
      planType: "PREMIUM",
    });
    const decision = resolveMentorResourceAccessState({
      resource,
      accessRecords: [{
        status: "active",
        scopeType: "item",
        module: "roadmap",
        itemType: "roadmap",
        itemId: "roadmap-1",
        planType: "PREMIUM",
      }],
    });

    expect(decision.state).toBe(MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED);
  });

  test("mentor service loads only the selected learner Roadmap progress", () => {
    const serviceSource = read("src/mentor/mentorService.js");
    expect(serviceSource).toContain('collection(db, "studyRoadmapProgress")');
    expect(serviceSource).toContain('where("userId", "==", studentUid)');
  });

  test("rules allow Roadmap progress reads only for the owner, admin or assigned mentor", () => {
    const rulesSource = read("firestore.rules");
    expect(rulesSource).toContain("isAssignedMentor(resource.data.userId)");
    expect(rulesSource).toContain("isExistingProgressOwner()");
  });

  test("mentor UI exposes a launch-readiness Roadmap summary", () => {
    const routeSource = read("src/mentor/MentorWorkspaceRoute.jsx");
    expect(routeSource).toContain("Roadmap mentor launch readiness");
    expect(routeSource).toContain("Roadmap access never unlocks linked resources");
  });
});
