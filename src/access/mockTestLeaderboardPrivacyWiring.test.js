import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(__dirname, "..", relativePath),
    "utf8"
  );

describe(
  "AspireNest leaderboard privacy and public projection wiring",
  () => {
    test("result route submits leaderboard data through the authenticated callable", () => {
      const source = readSource(
        "components/exam/ExamResultRoute.jsx"
      );

      expect(source).toContain(
        "saveMockTestLeaderboardEntry"
      );
      expect(source).toContain(
        "loadMockLeaderboardPublicEntries?.("
      );
      expect(source).not.toContain(
        'collection(db, "mockLeaderboard")'
      );
      expect(source).not.toContain(
        "leaderboardKey ="
      );
    });

    test("App separates admin-private entries from student public-safe entries", () => {
      const source = readSource(
        "App.js"
      );

      expect(source).toContain(
        '"mockLeaderboardPublic"'
      );
      expect(source).toContain(
        "mockLeaderboardPublicEntries"
      );
      expect(source).toContain(
        "setMockLeaderboardPublicEntries"
      );
      expect(source).toContain(
        "loadMockLeaderboardPublicEntries"
      );
      expect(source).toContain(
        'collection(db, "mockLeaderboard")'
      );
      expect(source).toContain(
        'where(\n              "ownerUid"'
      );
      expect(source).toContain(
        "mockLeaderboardEntries={\n        mockLeaderboardPublicEntries"
      );
    });

    test("public leaderboard rendering uses server-projected names and owner markers", () => {
      const source = readSource(
        "components/exam/mockLeaderboardUtils.js"
      );

      expect(source).toContain(
        "entry.publicEntryId"
      );
      expect(source).toContain(
        "entry.displayName"
      );
      expect(source).toContain(
        "entry?.isOwn === true"
      );
    });

    test("Firestore rules lock private and public writes while exposing only public projections", () => {
      const rules = fs.readFileSync(
        path.join(
          __dirname,
          "..",
          "..",
          "firestore.rules"
        ),
        "utf8"
      );

      expect(rules).toContain(
        "function isMockLeaderboardOwner()"
      );
      expect(rules).toContain(
        "match /mockLeaderboard/{docId}"
      );
      expect(rules).toContain(
        "allow read: if isAdmin() || isMockLeaderboardOwner();"
      );
      expect(rules).toContain(
        "match /mockLeaderboardPublic/{docId}"
      );
      expect(rules).toContain(
        "allow read: if true;"
      );
      expect(rules).toContain(
        "allow create, update, delete: if false;"
      );
      expect(rules).not.toContain(
        "match /mockLeaderboard/{docId} {\n      allow read: if true;"
      );
    });

    test("Cloud Function generates separate private and public documents", () => {
      const source = fs.readFileSync(
        path.join(
          __dirname,
          "..",
          "..",
          "functions",
          "index.js"
        ),
        "utf8"
      );

      expect(source).toContain(
        'LEADERBOARD_PRIVATE_COLLECTION =\n  "mockLeaderboard"'
      );
      expect(source).toContain(
        'LEADERBOARD_PUBLIC_COLLECTION =\n  "mockLeaderboardPublic"'
      );
      expect(source).toContain(
        "buildMockTestLeaderboardProjection"
      );
      expect(source).toContain(
        "upsertMockTestLeaderboardEntry"
      );
      expect(source).toContain(
        "loadOwnedSubmittedMockResult"
      );
      expect(source).toContain(
        'source: "authenticated_callable"'
      );
      expect(source).toContain(
        "displayName"
      );
      expect(source).toContain(
        "ownerUid"
      );
    });
  }
);
