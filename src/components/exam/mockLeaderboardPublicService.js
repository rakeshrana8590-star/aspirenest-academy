import {
  doc,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

const PUBLIC_LEADERBOARD_COLLECTION =
  "mockLeaderboardPublic";

const cleanPublicLeaderboardText = (value = "") =>
  String(value || "").trim();

const getSafePublicLeaderboardName = (entry = {}) => {
  const candidate = cleanPublicLeaderboardText(
    entry.displayName || entry.studentName
  );

  if (!candidate || candidate.includes("@")) {
    return "AspireNest Learner";
  }

  return candidate.slice(0, 80);
};

export const buildPublicMockLeaderboardPayload = (
  entry = {}
) => ({
  leaderboardKey: cleanPublicLeaderboardText(
    entry.leaderboardKey
  ),
  leaderboardMode: cleanPublicLeaderboardText(
    entry.leaderboardMode
  ),
  testId: cleanPublicLeaderboardText(entry.testId),
  testTitle: cleanPublicLeaderboardText(entry.testTitle),
  displayName: getSafePublicLeaderboardName(entry),
  score: Number(entry.score || 0),
  totalMarks: Number(entry.totalMarks || 0),
  percentage: Number(entry.percentage || 0),
  accuracy: Number(entry.accuracy || 0),
  correctCount: Number(entry.correctCount || 0),
  wrongCount: Number(entry.wrongCount || 0),
  skippedCount: Number(entry.skippedCount || 0),
  totalQuestions: Number(entry.totalQuestions || 0),
  durationSeconds: Number(entry.durationSeconds || 0),
  rankScore: Number(
    entry.rankScore ?? entry.percentage ?? 0
  ),
  rankTieBreakerScore: Number(
    entry.rankTieBreakerScore ?? entry.score ?? 0
  ),
  attemptNumber: Number(entry.attemptNumber || 0),
  attemptStartedAt:
    entry.attemptStartedAt || entry.startedAt || null,
  attemptSubmittedAt:
    entry.attemptSubmittedAt || entry.endedAt || null,
  startedAt: entry.startedAt || null,
  endedAt: entry.endedAt || null,
  createdAt: entry.createdAt || null,
  updatedAt: new Date(),
  planType: cleanPublicLeaderboardText(
    entry.planType || "FREE"
  ),
  status: "published",
});

export const savePublicMockLeaderboardMirror = async (
  rawDocumentId = "",
  entry = {}
) => {
  const documentId = cleanPublicLeaderboardText(
    rawDocumentId
  );

  if (!documentId) {
    throw new Error(
      "Public leaderboard mirror requires raw document id."
    );
  }

  const payload =
    buildPublicMockLeaderboardPayload(entry);

  if (!payload.leaderboardKey || !payload.testId) {
    throw new Error(
      "Public leaderboard mirror requires leaderboard key and test id."
    );
  }

  await setDoc(
    doc(
      db,
      PUBLIC_LEADERBOARD_COLLECTION,
      documentId
    ),
    payload
  );

  return payload;
};
