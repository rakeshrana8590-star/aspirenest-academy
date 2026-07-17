import {
  getMockLeaderboardStudentKey,
  maskMockLeaderboardName,
  rankMockLeaderboardEntries,
} from "./mockLeaderboardUtils";

describe(
  "AspireNest public-safe mock leaderboard utilities",
  () => {
    test("uses the opaque public entry id as the ranking identity", () => {
      expect(
        getMockLeaderboardStudentKey({
          publicEntryId:
            "public-entry-1",
          displayName: "Learner L.",
        })
      ).toBe("public-entry-1");
    });

    test("renders the server-projected display name without private identity fields", () => {
      expect(
        maskMockLeaderboardName({
          displayName: "Rakesh R.",
        })
      ).toBe("Rakesh R.");
    });

    test("preserves the owner marker supplied by the private owner lookup", () => {
      const result =
        rankMockLeaderboardEntries(
          [
            {
              id: "public-entry-1",
              publicEntryId:
                "public-entry-1",
              displayName: "Rakesh R.",
              testId: "mock-1",
              score: 42,
              percentage: 84,
              isOwn: true,
            },
            {
              id: "public-entry-2",
              publicEntryId:
                "public-entry-2",
              displayName: "Learner L.",
              testId: "mock-1",
              score: 40,
              percentage: 80,
            },
          ],
          {
            testId: "mock-1",
            user: {
              uid: "student-1",
              email:
                "student@example.com",
            },
          }
        );

      expect(result.total).toBe(2);
      expect(result.own).toMatchObject({
        publicEntryId:
          "public-entry-1",
        isOwn: true,
      });
      expect(result.ranked[0]).not.toHaveProperty(
        "studentEmail"
      );
      expect(result.ranked[0]).not.toHaveProperty(
        "uid"
      );
    });
  }
);
