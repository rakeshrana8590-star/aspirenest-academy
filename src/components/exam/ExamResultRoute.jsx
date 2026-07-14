import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import { getAttemptStorageKey } from "./examAttemptStorage.js";
import { isExamAnswerCorrect } from "./examAnswerUtils.js";
import { savePublicMockLeaderboardMirror } from "./mockLeaderboardPublicService.js";

const safeParseJson = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "{}") || fallback;
  } catch {
    return fallback;
  }
};

const hasObjectData = (value) =>
  value && typeof value === "object" && Object.keys(value).length > 0;

const isValidQuestionOrder = (order, totalQuestions) => {
  if (!Array.isArray(order)) return false;
  if (order.length !== totalQuestions) return false;

  const sortedOrder = [...order].sort((a, b) => a - b);

  return sortedOrder.every((item, index) => item === index);
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
};

const toResultNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getResultTimestamp = (value) => {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date?.getTime?.()) ? 0 : date.getTime();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getPerformanceLabel = (percentage) => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 50) return "Good Attempt";
  return "Needs Revision";
};

const getPerformanceTone = (percentage) => {
  if (percentage >= 80) return "excellent";
  if (percentage >= 50) return "good";
  return "revision";
};

const parseAttemptLimit = (value) => {
  const normalized = String(value || "unlimited").trim().toLowerCase();

  if (!normalized || normalized === "unlimited" || normalized === "0") {
    return { isUnlimited: true, max: null };
  }

  const max = Number.parseInt(normalized, 10);

  if (Number.isFinite(max) && max > 0) {
    return { isUnlimited: false, max };
  }

  return { isUnlimited: true, max: null };
};

/* === P0 mock UID ownership v1 === */
const normalizeMockIdentity = (value) =>
  String(value || "").trim().toLowerCase();

const isSameMockOwner = (record = {}, user = {}) => {
  const expectedUid = String(user?.uid || "").trim();
  const recordUid = String(
    record?.uid ||
      record?.studentUid ||
      record?.ownerUid ||
      record?.userId ||
      ""
  ).trim();

  if (expectedUid && recordUid) {
    return recordUid === expectedUid;
  }

  const expectedEmail = normalizeMockIdentity(user?.email);
  const recordEmail = normalizeMockIdentity(
    record?.email ||
      record?.studentEmail ||
      record?.userEmail ||
      record?.ownerEmail
  );

  return Boolean(expectedEmail && recordEmail === expectedEmail);
};

const countSubmittedMockAttempts = (
  mockResults = [],
  testId = "",
  user = {}
) =>
  (Array.isArray(mockResults) ? mockResults : []).filter((result) => {
    const sameTest =
      result?.testId === testId ||
      result?.mockTestId === testId ||
      result?.testID === testId ||
      result?.contentId === testId;

    return sameTest && isSameMockOwner(result, user);
  }).length;

const hasSavedMockAttempt = (mockResults = [], attemptSaveKey = "") =>
  Boolean(attemptSaveKey) &&
  (Array.isArray(mockResults) ? mockResults : []).some(
    (result) =>
      result?.attemptKey === attemptSaveKey ||
      result?.attemptId === attemptSaveKey
  );

const isBetterLeaderboardResult = (
  currentEntry = {},
  nextPercentage = 0,
  nextScore = 0
) => {
  const currentPercentage = Number(
    currentEntry.rankScore ?? currentEntry.percentage ?? 0
  );
  const currentScore = Number(
    currentEntry.rankTieBreakerScore ?? currentEntry.score ?? 0
  );
  const safeNextPercentage = Number(nextPercentage || 0);
  const safeNextScore = Number(nextScore || 0);

  return (
    safeNextPercentage > currentPercentage ||
    (safeNextPercentage === currentPercentage &&
      safeNextScore > currentScore)
  );
};

const AutoSaveMockResult = ({
  testId,
  userEmail,
  attemptSaveKey,
  saveToLeaderboard,
}) => {
  const saveResultRef = React.useRef(saveToLeaderboard);

  React.useEffect(() => {
    saveResultRef.current = saveToLeaderboard;
  }, [saveToLeaderboard]);

  React.useEffect(() => {
    if (!testId || !userEmail) return undefined;

    const syncIdentity =
      attemptSaveKey || `${testId}_${userEmail}`;
    const successKey = `mockResultAutoSavedV2_${syncIdentity}`;
    const inFlightKey = `${successKey}_inFlight`;

    if (
      sessionStorage.getItem(successKey) ||
      sessionStorage.getItem(inFlightKey)
    ) {
      return undefined;
    }

    sessionStorage.setItem(inFlightKey, "yes");

    let isActive = true;

    const syncResult = async () => {
      try {
        const didSave = await saveResultRef.current(false);

        if (didSave) {
          sessionStorage.setItem(successKey, "yes");
        } else if (isActive) {
          console.warn(
            "Mock result auto-sync did not complete. It will retry when the result is reopened."
          );
        }
      } finally {
        sessionStorage.removeItem(inFlightKey);
      }
    };

    syncResult();

    return () => {
      isActive = false;
    };
  }, [testId, userEmail, attemptSaveKey]);

  return null;
};

import { useSubmittedMockTestAnswers } from "./mockSubmissionReceiptService.js";

/* === P0 legacy historical summary-only policy v2 === */
const findLatestSavedResultForRoute = (
  mockResults = [],
  routeTestId = "",
  user = {}
) => {
  const expectedTestId = String(routeTestId || "").trim();
  const expectedUid = String(user?.uid || "").trim();
  const expectedEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (
    !expectedTestId ||
    (!expectedUid && !expectedEmail)
  ) {
    return null;
  }

  return [...(Array.isArray(mockResults) ? mockResults : [])]
    .filter((item) => {
      const itemTestId = String(
        item?.testId ||
          item?.mockTestId ||
          item?.testID ||
          item?.contentId ||
          ""
      ).trim();

      if (itemTestId !== expectedTestId) {
        return false;
      }

      const itemUid = String(
        item?.uid ||
          item?.studentUid ||
          item?.ownerUid ||
          item?.userId ||
          ""
      ).trim();

      if (expectedUid && itemUid) {
        return itemUid === expectedUid;
      }

      const itemEmail = String(
        item?.email ||
          item?.studentEmail ||
          item?.userEmail ||
          item?.ownerEmail ||
          ""
      )
        .trim()
        .toLowerCase();

      return Boolean(
        expectedEmail &&
          itemEmail === expectedEmail
      );
    })
    .sort(
      (first, second) =>
        getResultTimestamp(
          second?.attemptSubmittedAt ||
            second?.endedAt ||
            second?.updatedAt ||
            second?.createdAt
        ) -
        getResultTimestamp(
          first?.attemptSubmittedAt ||
            first?.endedAt ||
            first?.updatedAt ||
            first?.createdAt
        )
    )[0] || null;
};

const buildHistoricalSummaryTest = (
  routeTestId = "",
  savedResult = {}
) => ({
  id: String(routeTestId || "").trim(),
  section: "mockTest",
  status: "historical-summary-only",
  title:
    savedResult?.testTitle ||
    savedResult?.title ||
    "Historical Mock Test",
  subject:
    savedResult?.subject ||
    "Subject",
  chapter:
    savedResult?.chapter ||
    "Complete Test",
  planType:
    savedResult?.planType ||
    savedResult?.accessPlan ||
    "FREE",
  examType:
    savedResult?.examType ||
    "CTET/TET",
  testType:
    savedResult?.testType ||
    "Mock Test",
  totalQuestions:
    Number(savedResult?.totalQuestions || 0),
  totalMarks:
    Number(savedResult?.totalMarks || 0),
  attemptLimit: "1",
  leaderboardMode: "disabled",
  resultPublishMode: "instant",
  questions: [],
});

export default function ExamResultRoute({
  universalContent,
  getMockTestAccessStatus,
  mockAttemptState,
  user,
  fullName,
  isAdmin,
  loadUserMockResults,
  loadLeaderboard,
  loadMockLeaderboardEntries,
  setMockAttemptState,
  mockResults = [],
  mockResultsLoaded = false,
  mockResultsLoadError = "",
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeResultAttemptId = decodeURIComponent(testId || "");

  const sourceTest = (Array.isArray(universalContent)
    ? universalContent
    : []
  ).find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeResultAttemptId
  );

  const legacySavedResultForRoute = React.useMemo(
    () =>
      findLatestSavedResultForRoute(
        mockResults,
        activeResultAttemptId,
        user
      ),
    [
      mockResults,
      activeResultAttemptId,
      user?.uid,
      user?.email,
    ]
  );

  const isHistoricalSummaryOnly =
    !sourceTest &&
    Boolean(legacySavedResultForRoute);

  const isHistoricalRecoveryPending =
    !sourceTest &&
    !legacySavedResultForRoute &&
    Boolean(user?.email) &&
    !mockResultsLoaded;

  const test =
    sourceTest ||
    (
      isHistoricalSummaryOnly ||
      isHistoricalRecoveryPending
        ? buildHistoricalSummaryTest(
            activeResultAttemptId,
            legacySavedResultForRoute || {}
          )
        : null
    );

  const accessStatus = isHistoricalSummaryOnly
    ? "HISTORICAL_SUMMARY_ONLY"
    : isHistoricalRecoveryPending
    ? "HISTORICAL_RECOVERY_PENDING"
    : getMockTestAccessStatus(test);

  /* === P0 mock-test catalog loading gate v2 === */
  const hasLoadedMockTestCatalog = React.useMemo(
    () =>
      (Array.isArray(universalContent)
        ? universalContent
        : []
      ).some((item) => item?.section === "mockTest"),
    [universalContent]
  );

  const [
    mockTestCatalogWaitExpired,
    setMockTestCatalogWaitExpired,
  ] = React.useState(false);

  React.useEffect(() => {
    setMockTestCatalogWaitExpired(false);

    if (test || hasLoadedMockTestCatalog) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMockTestCatalogWaitExpired(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [
    activeResultAttemptId,
    hasLoadedMockTestCatalog,
    test,
  ]);

  const isMockTestCatalogPending =
    !test &&
    !hasLoadedMockTestCatalog &&
    !mockTestCatalogWaitExpired;

  /* === P0 saved mock-result recovery v3 === */
  const [resultRecoveryRetry, setResultRecoveryRetry] =
    React.useState(0);
  const loadUserMockResultsRef = React.useRef(
    loadUserMockResults
  );

  React.useEffect(() => {
    loadUserMockResultsRef.current = loadUserMockResults;
  }, [loadUserMockResults]);

  const savedResultForTest = React.useMemo(() => {
    const expectedTestId = String(test?.id || "");
    const expectedUid = String(user?.uid || "").trim();
    const expectedEmail = String(user?.email || "")
      .trim()
      .toLowerCase();

    if (!expectedTestId || (!expectedUid && !expectedEmail)) {
      return null;
    }

    return [...(Array.isArray(mockResults) ? mockResults : [])]
      .filter((item) => {
        const itemTestId = String(
          item?.testId ||
            item?.mockTestId ||
            item?.testID ||
            item?.contentId ||
            ""
        );

        const itemUid = String(
          item?.uid ||
            item?.studentUid ||
            item?.ownerUid ||
            item?.userId ||
            ""
        ).trim();

        const itemEmail = String(
          item?.email ||
            item?.studentEmail ||
            item?.userEmail ||
            item?.ownerEmail ||
            ""
        )
          .trim()
          .toLowerCase();

        const sameOwner =
          expectedUid && itemUid
            ? itemUid === expectedUid
            : Boolean(
                expectedEmail &&
                  itemEmail === expectedEmail
              );

        return itemTestId === expectedTestId && sameOwner;
      })
      .sort(
        (first, second) =>
          getResultTimestamp(
            second?.attemptSubmittedAt ||
              second?.endedAt ||
              second?.updatedAt ||
              second?.createdAt
          ) -
          getResultTimestamp(
            first?.attemptSubmittedAt ||
              first?.endedAt ||
              first?.updatedAt ||
              first?.createdAt
          )
      )[0] || null;
  }, [mockResults, test?.id, user?.email]);

  const submittedAnswerReleaseEligible = React.useMemo(() => {
    if (
      !test?.id ||
      !user?.uid ||
      isHistoricalSummaryOnly ||
      isHistoricalRecoveryPending
    ) {
      return false;
    }

    const liveState = mockAttemptState?.[test.id] || {};
    const storedState = safeParseJson(
      localStorage.getItem(getAttemptStorageKey(test.id))
    );

    return Boolean(
      liveState?.isSubmitted === true ||
        storedState?.isSubmitted === true ||
        savedResultForTest
    );
  }, [
    mockAttemptState,
    savedResultForTest,
    test?.id,
    user?.uid,
    isHistoricalSummaryOnly,
    isHistoricalRecoveryPending,
  ]);

  const submittedAnswerRelease = useSubmittedMockTestAnswers({
    test,
    user,
    enabled: submittedAnswerReleaseEligible,
  });

  React.useEffect(() => {
    const email = user?.email;
    const activeTestId = test?.id;
    const loader = loadUserMockResultsRef.current;

    if (!email || !activeTestId || typeof loader !== "function") {
      return undefined;
    }

    let isActive = true;

    Promise.resolve(loader(email)).catch((error) => {
      if (isActive) {
        console.error("Result recovery request failed:", error);
      }
    });

    return () => {
      isActive = false;
    };
  }, [resultRecoveryRetry, test?.id, user?.email]);

  const renderStateCard = ({
    label,
    title,
    message,
    actionLabel,
    onAction,
  }) => (
    <section className="examResultPage">
      <div className="examResultShell">
        <div className="examResultStateCard">
          <span>{label}</span>
          <h1>{title}</h1>
          <p>{message}</p>

          {actionLabel && typeof onAction === "function" ? (
            <button type="button" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );

  if (isMockTestCatalogPending) {
    return renderStateCard({
      label: "Preparing",
      title: "Preparing your result",
      message:
        "Mock-test details and your submitted result are being securely restored. Please wait a moment.",
      actionLabel: "",
      onAction: undefined,
    });
  }

  if (accessStatus === "NOT_FOUND") {
    return renderStateCard({
      label: "Unavailable",
      title: "Result not found",
      message: "This mock test result is not available anymore.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  const questions =
    submittedAnswerRelease.test?.questions ||
    test.questions ||
    [];

  const storedAttemptState = safeParseJson(
    localStorage.getItem(getAttemptStorageKey(test.id))
  );

  const liveAttemptState = mockAttemptState?.[test.id] || {};

  const activeAttemptState = liveAttemptState?.isSubmitted
    ? liveAttemptState
    : storedAttemptState?.isSubmitted
    ? storedAttemptState
    : {};

  const hasSubmittedAttempt = activeAttemptState?.isSubmitted === true;

  const useRecoveredSummary =
    !hasSubmittedAttempt && Boolean(savedResultForTest);
  const hasViewableResult =
    hasSubmittedAttempt || useRecoveredSummary;

  if (hasViewableResult && submittedAnswerRelease.loading) {
    return renderStateCard({
      label: "Securing Result",
      title: "Preparing your result",
      message:
        "Your submitted answer key is being loaded securely.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (hasViewableResult && submittedAnswerRelease.error) {
    return renderStateCard({
      label: "Recovery Needed",
      title: "Answer key could not be loaded",
      message: submittedAnswerRelease.error,
      actionLabel: "Retry Result",
      onAction: () => window.location.reload(),
    });
  }
  const attemptStartedAt =
    activeAttemptState?.startedAt ||
    activeAttemptState?.submittedAt ||
    savedResultForTest?.attemptStartedAt ||
    savedResultForTest?.startedAt ||
    savedResultForTest?.createdAt ||
    Date.now();
  const attemptSubmittedAt =
    activeAttemptState?.submittedAt ||
    savedResultForTest?.attemptSubmittedAt ||
    savedResultForTest?.endedAt ||
    savedResultForTest?.updatedAt ||
    savedResultForTest?.createdAt ||
    attemptStartedAt;
  const attemptSaveKey =
    savedResultForTest?.attemptKey ||
    savedResultForTest?.attemptId ||
    `${test.id}_${user?.email || "anonymous"}_${getResultTimestamp(
      attemptStartedAt
    ) || Date.now()}`;

  const attemptLimitInfo = parseAttemptLimit(test.attemptLimit);
  const savedSubmittedCount = countSubmittedMockAttempts(
    mockResults,
    test.id,
    user
  );
  const hasSavedCurrentAttempt = hasSavedMockAttempt(
    mockResults,
    attemptSaveKey
  );
  const submittedAttemptCount =
    savedSubmittedCount +
    (hasSubmittedAttempt && !hasSavedCurrentAttempt ? 1 : 0);
  const canAttemptAgain =
    attemptLimitInfo.isUnlimited ||
    submittedAttemptCount < attemptLimitInfo.max;

  const handleAttemptAgain = () => {
    if (!canAttemptAgain) return;

    localStorage.removeItem(getAttemptStorageKey(test.id));

    try {
      localStorage.removeItem(`mockAttemptAnswers_${test.id}`);
      sessionStorage.removeItem(`mockResultAutoSaved_${test.id}_${user?.email || ""}`);
      sessionStorage.removeItem(`mockResultAutoSaved_${attemptSaveKey}`);
    } catch {
      // Ignore storage cleanup failures.
    }

    if (typeof setMockAttemptState === "function") {
      setMockAttemptState((prev) => {
        const next = { ...(prev || {}) };
        delete next[test.id];
        return next;
      });
    }

    navigate(`/ctet-tet/mock-tests/attempt/${test.id}`);
  };

  if (accessStatus === "UNPUBLISHED") {
    return renderStateCard({
      label: "Unpublished",
      title: "Result unavailable",
      message: "This mock test is not published right now.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "LOGIN_REQUIRED") {
    return renderStateCard({
      label: "Login Required",
      title: "Login required",
      message: "Please login to view your result.",
      actionLabel: "Login to Continue",
      onAction: () => navigate("/login"),
    });
  }

  // Historical result ownership is independent of current paid entitlement.
  // START / ATTEMPT routes remain access- and schedule-gated.
  if (
    (
      accessStatus === "PLAN_LOCKED" ||
      accessStatus === "EXPIRED_MEMBERSHIP"
    ) &&
    !hasViewableResult
  ) {
    return renderStateCard({
      label: "Plan Required",
      title: "Plan required",
      message: `This result needs ${test.planType || "PREMIUM"} access.`,
      actionLabel: "View Pricing",
      onAction: () => navigate("/ctet-tet/pricing"),
    });
  }

  if (
    !hasSubmittedAttempt &&
    user?.email &&
    !mockResultsLoaded
  ) {
    return renderStateCard({
      label: "Preparing",
      title: "Preparing your result",
      message:
        "Your submitted attempt is being securely restored. Please wait a moment.",
      actionLabel: "",
      onAction: undefined,
    });
  }

  if (
    !hasSubmittedAttempt &&
    user?.email &&
    mockResultsLoaded &&
    mockResultsLoadError &&
    !savedResultForTest
  ) {
    return renderStateCard({
      label: "Recovery Needed",
      title: "Result could not be loaded",
      message: mockResultsLoadError,
      actionLabel: "Retry Result",
      onAction: () =>
        setResultRecoveryRetry((current) => current + 1),
    });
  }

  if (accessStatus === "UPCOMING" && !hasViewableResult) {
    return renderStateCard({
      label: "Upcoming",
      title: "Test upcoming",
      message: "This mock test is scheduled for a future date or time.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "EXPIRED" && !hasViewableResult) {
    return renderStateCard({
      label: "Locked",
      title: "Result locked",
      message:
        "This mock test window is closed and no submitted attempt was found on this device.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (!hasViewableResult) {
    return renderStateCard({
      label: "Locked",
      title: "Result locked",
      message: "No submitted attempt was found for this test and account.",
      actionLabel: "Continue Test",
      onAction: () =>
        navigate(`/ctet-tet/mock-tests/attempt/${test.id}`),
    });
  }

  const newStoredAnswers = storedAttemptState?.answers || {};
  const liveAttemptAnswers = liveAttemptState?.answers || {};
  const activeAttemptAnswers = activeAttemptState?.answers || {};
  const recoveredAttemptAnswers =
    savedResultForTest?.answers || {};

  const oldStoredAnswers = safeParseJson(
    localStorage.getItem(`mockAttemptAnswers_${test.id}`)
  );

  const attemptAnswers = hasObjectData(activeAttemptAnswers)
    ? activeAttemptAnswers
    : hasObjectData(liveAttemptAnswers)
    ? liveAttemptAnswers
    : hasObjectData(newStoredAnswers)
    ? newStoredAnswers
    : hasObjectData(recoveredAttemptAnswers)
    ? recoveredAttemptAnswers
    : oldStoredAnswers;

  const hasReviewData =
    !isHistoricalSummaryOnly &&
    hasObjectData(attemptAnswers);

  const fallbackQuestionOrder = questions.map((_, index) => index);

  const questionOrder = isValidQuestionOrder(
    activeAttemptState?.questionOrder,
    questions.length
  )
    ? activeAttemptState.questionOrder
    : isValidQuestionOrder(
        storedAttemptState?.questionOrder,
        questions.length
      )
    ? storedAttemptState.questionOrder
    : isValidQuestionOrder(
        savedResultForTest?.questionOrder,
        questions.length
      )
    ? savedResultForTest.questionOrder
    : fallbackQuestionOrder;

  const resultQuestions = questionOrder
    .map((actualQuestionIndex) => ({
      actualQuestionIndex,
      question: questions[actualQuestionIndex],
    }))
    .filter((item) => Boolean(item.question));

  const calculatedQuestionCount = resultQuestions.length;

  const calculatedCorrectCount = resultQuestions.filter(
    ({ actualQuestionIndex, question }) =>
      isExamAnswerCorrect(
        attemptAnswers[actualQuestionIndex],
        question.answer,
        question
      )
  ).length;

  const calculatedSkippedCount = resultQuestions.filter(
    ({ actualQuestionIndex }) =>
      !attemptAnswers[actualQuestionIndex]
  ).length;

  const calculatedWrongCount =
    calculatedQuestionCount -
    calculatedCorrectCount -
    calculatedSkippedCount;

  const calculatedAccuracy =
    calculatedQuestionCount > 0
      ? Math.round(
          (calculatedCorrectCount / calculatedQuestionCount) * 100
        )
      : 0;

  const calculatedTotalMarks = resultQuestions.reduce(
    (sum, { question }) =>
      sum +
      Number(
        question.positiveMarks ||
          test.marksPerQuestion ||
          1
      ),
    0
  );

  const calculatedResultTotalMarks =
    Number(test.totalMarks) ||
    calculatedTotalMarks ||
    calculatedQuestionCount *
      Number(test.marksPerQuestion || 1);

  const calculatedScore = resultQuestions.reduce(
    (sum, { actualQuestionIndex, question }) => {
      const selected = attemptAnswers[actualQuestionIndex];

      if (!selected) return sum;

      if (
        isExamAnswerCorrect(
          selected,
          question.answer,
          question
        )
      ) {
        return (
          sum +
          Number(
            question.positiveMarks ||
              test.marksPerQuestion ||
              1
          )
        );
      }

      return (
        sum -
        Number(
          question.negativeMarks ||
            test.negativeMarks ||
            0
        )
      );
    },
    0
  );

  const calculatedPercentage =
    calculatedResultTotalMarks > 0
      ? Math.round(
          (calculatedScore / calculatedResultTotalMarks) * 100
        )
      : 0;

  const totalQuestions = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.totalQuestions,
        calculatedQuestionCount
      )
    : calculatedQuestionCount;

  const correctCount = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.correctCount ??
          savedResultForTest?.correct,
        calculatedCorrectCount
      )
    : calculatedCorrectCount;

  const wrongCount = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.wrongCount ??
          savedResultForTest?.wrong,
        calculatedWrongCount
      )
    : calculatedWrongCount;

  const skippedCount = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.skippedCount ??
          savedResultForTest?.skipped,
        calculatedSkippedCount
      )
    : calculatedSkippedCount;

  const totalMarks = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.totalMarks,
        calculatedResultTotalMarks
      )
    : calculatedResultTotalMarks;

  const score = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.score,
        calculatedScore
      )
    : calculatedScore;

  const percentage = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.percentage ??
          savedResultForTest?.accuracy,
        calculatedPercentage
      )
    : calculatedPercentage;

  const accuracy = useRecoveredSummary
    ? toResultNumber(
        savedResultForTest?.accuracy ??
          savedResultForTest?.percentage,
        calculatedAccuracy
      )
    : calculatedAccuracy;

  const safePercentage = Math.max(
    0,
    Math.min(100, percentage)
  );

  const leaderboardEnabled =
    test.leaderboardMode && test.leaderboardMode !== "disabled";

  const isAdminUser = Boolean(isAdmin?.(user));
  const canShowLeaderboardButton = leaderboardEnabled || isAdminUser;

  const startedAt = getResultTimestamp(
    activeAttemptState.startedAt ||
      savedResultForTest?.attemptStartedAt ||
      savedResultForTest?.startedAt
  );

  const endedAt = getResultTimestamp(
    activeAttemptState.submittedAt ||
      savedResultForTest?.attemptSubmittedAt ||
      savedResultForTest?.endedAt
  );

  const durationSeconds = useRecoveredSummary
    ? toResultNumber(savedResultForTest?.durationSeconds, 0)
    : Math.max(
        0,
        Math.round(
          ((endedAt || Date.now()) -
            (startedAt || Date.now())) /
            1000
        )
      );

  const performanceLabel = getPerformanceLabel(percentage);
  const performanceTone = getPerformanceTone(percentage);

  const saveToLeaderboard = async (showAlert = true) => {
    try {
      if (!user?.uid || !user?.email) {
        if (showAlert) {
          alert("Please login to save result");
        }

        return false;
      }

      const attemptKey = attemptSaveKey;

      const existingResult = await getDocs(
        query(
          collection(db, "mockResults"),
          where("attemptKey", "==", attemptKey),
          where("uid", "==", user.uid)
        )
      );

      if (existingResult.empty) {
        await addDoc(collection(db, "mockResults"), {
          attemptKey,

          testId: test.id,
          testTitle: test.title || "",

          uid: user.uid,
          email: user.email,
          studentEmail: user.email,
          studentName: fullName || user.email,

          subject: test.subject || "",
          chapter: test.chapter || "",
          planType: test.planType || "FREE",
          examType: test.examType || "",
          testType: test.testType || "",

          score,
          totalMarks,
          percentage,
          accuracy,

          correctCount,
          wrongCount,
          skippedCount,
          totalQuestions,
          durationSeconds,
          answers: attemptAnswers,
          questionOrder,

          attemptId: attemptSaveKey,
          attemptStartedAt,
          attemptSubmittedAt,
          attemptNumber: savedSubmittedCount + 1,

          startedAt: activeAttemptState.startedAt || null,
          endedAt: activeAttemptState.submittedAt || null,

          createdAt: new Date(),
        });
      } else {
        await Promise.all(
          existingResult.docs.map((resultDocument) =>
            updateDoc(resultDocument.ref, {
              testTitle: test.title || "",
              score,
              totalMarks,
              percentage,
              accuracy,
              correctCount,
              wrongCount,
              skippedCount,
              totalQuestions,
              durationSeconds,
              updatedAt: new Date(),
            })
          )
        );
      }

      if (leaderboardEnabled) {
        const leaderboardKey = `${test.id}_${user.email}_${test.leaderboardMode}`;

        const existingLeaderboard = await getDocs(
          query(
            collection(db, "mockLeaderboard"),
            where("leaderboardKey", "==", leaderboardKey)
          )
        );

        if (existingLeaderboard.empty) {
          /* === P0 public leaderboard mirror create v1 === */
          const newLeaderboardPayload = {
            leaderboardKey,
            leaderboardMode: test.leaderboardMode,

            testId: test.id,
            testTitle: test.title || "",

            uid: user.uid,
            studentEmail: user.email,
            studentName: fullName || user.email,

            subject: test.subject || "",
            chapter: test.chapter || "",
            planType: test.planType || "FREE",
            examType: test.examType || "",
            testType: test.testType || "",

            score,
            totalMarks,
            percentage,
            accuracy,

            correctCount,
            wrongCount,
            skippedCount,
            totalQuestions,
            durationSeconds,

            rankScore: percentage,
            rankTieBreakerScore: score,

            attemptId: attemptSaveKey,
            attemptStartedAt,
            attemptSubmittedAt,
            attemptNumber: savedSubmittedCount + 1,

            startedAt: activeAttemptState.startedAt || null,
            endedAt: activeAttemptState.submittedAt || null,

            createdAt: new Date(),
          };
          const newLeaderboardRef = await addDoc(
            collection(db, "mockLeaderboard"),
            newLeaderboardPayload
          );
          await savePublicMockLeaderboardMirror(
            newLeaderboardRef.id,
            newLeaderboardPayload
          );
        } else {
          const leaderboardDocumentsToUpdate =
            existingLeaderboard.docs.filter((leaderboardDocument) => {
              const leaderboardData =
                leaderboardDocument.data() || {};

              const isSameAttempt =
                Boolean(attemptSaveKey) &&
                leaderboardData.attemptId === attemptSaveKey;

              return (
                isSameAttempt ||
                isBetterLeaderboardResult(
                  leaderboardData,
                  percentage,
                  score
                )
              );
            });

          /* === P0 public leaderboard mirror update v1 === */
          await Promise.all(
            leaderboardDocumentsToUpdate.map(
              async (leaderboardDocument) => {
                const leaderboardUpdatePayload = {
                testTitle: test.title || "",
                score,
                totalMarks,
                percentage,
                accuracy,
                correctCount,
                wrongCount,
                skippedCount,
                totalQuestions,
                durationSeconds,
                rankScore: percentage,
                rankTieBreakerScore: score,
                attemptId: attemptSaveKey,
                attemptStartedAt,
                attemptSubmittedAt,
                attemptNumber: savedSubmittedCount + 1,
                startedAt: activeAttemptState.startedAt || null,
                endedAt: activeAttemptState.submittedAt || null,
                updatedAt: new Date(),
              };

                await updateDoc(
                  leaderboardDocument.ref,
                  leaderboardUpdatePayload
                );

                await savePublicMockLeaderboardMirror(
                  leaderboardDocument.id,
                  {
                    ...leaderboardDocument.data(),
                    ...leaderboardUpdatePayload,
                    leaderboardKey,
                    leaderboardMode: test.leaderboardMode,
                    testId: test.id,
                    testTitle: test.title || "",
                    studentName:
                      fullName || "AspireNest Learner",
                    planType: test.planType || "FREE",
                  }
                );
              }
            )
          );
        }
      }

      await loadUserMockResults?.(user.email);
      await loadLeaderboard?.();
      await loadMockLeaderboardEntries?.();

      if (showAlert) {
        alert(
          leaderboardEnabled
            ? "Result and leaderboard saved ✅"
            : "Result saved ✅ Leaderboard is disabled for this test"
        );
      }

      return true;
    } catch (error) {
      console.error("Save mock result error:", error);

      if (showAlert) {
        alert("Result save failed. Please try again.");
      }

      return false;
    }
  };

  const resultMetrics = [
    {
      tone: "correct",
      label: "Correct",
      value: correctCount,
      text: "Answers matched with the answer key.",
    },
    {
      tone: "wrong",
      label: "Wrong",
      value: wrongCount,
      text: "Review these first to avoid repeat mistakes.",
    },
    {
      tone: "skipped",
      label: "Skipped",
      value: skippedCount,
      text: "Unattempted questions left during the test.",
    },
    {
      tone: "neutral",
      label: "Total Questions",
      value: totalQuestions,
      text: "Final evaluated questions in this attempt.",
    },
  ];

  return (
    <section className="examResultPage">
      <div className="examResultShell">
        {hasSubmittedAttempt ? (
          <AutoSaveMockResult
            testId={test.id}
            userEmail={user?.email || ""}
            attemptSaveKey={attemptSaveKey}
            saveToLeaderboard={saveToLeaderboard}
          />
        ) : null}

        <div className="examResultHero">
          <div className="examResultHeroContent">
            <span className="examResultBadge">Mock Test Result</span>

            <h1>{test.title}</h1>

            <p>
              {test.planType || "FREE"} · {test.subject || "Subject"} ·{" "}
              {test.chapter || "Complete Test"}
            </p>

            <div className="examResultHeroStats">
              <div>
                <span>Score</span>
                <strong>
                  {score} / {totalMarks}
                </strong>
              </div>

              <div>
                <span>Percentage</span>
                <strong>{percentage}%</strong>
              </div>

              <div>
                <span>Accuracy</span>
                <strong>{accuracy}%</strong>
              </div>

              <div>
                <span>Time</span>
                <strong>{formatDuration(durationSeconds)}</strong>
              </div>
            </div>
          </div>

          <aside className="examResultScorePanel">
            <div
              className={`examResultScoreRing ${performanceTone}`}
              style={{
                "--exam-result-percent": `${safePercentage}%`,
              }}
            >
              <div>
                <strong>{percentage}%</strong>
                <span>{performanceLabel}</span>
              </div>
            </div>

            <p>
              {percentage >= 80
                ? "Strong command. Keep revising and maintain consistency."
                : percentage >= 50
                ? "Good base. Review wrong answers and strengthen weak areas."
                : "Revision needed. Start with incorrect and skipped questions."}
            </p>

            <div className="examResultActionStack">
              {hasReviewData ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/ctet-tet/mock-tests/review/${test.id}`
                    )
                  }
                >
                  Review Answers
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary"
                  disabled
                >
                  Answer Review Unavailable
                </button>
              )}

              {canAttemptAgain ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={handleAttemptAgain}
                >
                  Attempt Again
                </button>
              ) : (
                <button type="button" className="secondary" disabled>
                  Attempt limit reached
                </button>
              )}


              <button
                type="button"
                className="secondary"
                onClick={() => navigate("/ctet-tet/mock-tests")}
              >
                Back to Mock Tests
              </button>
            </div>
          </aside>
        </div>

        <section className="examResultMetricsPanel">
          <div className="examResultMetricRail">
            {resultMetrics.map((metric) => (
              <article
                key={metric.label}
                className={`examResultMetricCard ${metric.tone}`}
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="examResultInsightGrid">
          <article className="examResultInfoCard">
            <h3>Attempt Details</h3>

            <div className="examResultInfoList">
              <p>
                <span>Student</span>
                <strong>{fullName || user?.email || "Student"}</strong>
              </p>

              <p>
                <span>Test Type</span>
                <strong>{test.testType || "Mock Test"}</strong>
              </p>

              <p>
                <span>Exam Type</span>
                <strong>{test.examType || "CTET/TET"}</strong>
              </p>

              <p>
                <span>Duration Used</span>
                <strong>{formatDuration(durationSeconds)}</strong>
              </p>
            </div>
          </article>

          <article className="examResultInfoCard examResultStatusCard">
            <h3>Result Status</h3>

            <div className="examResultStatusBox">
              <strong>{performanceLabel}</strong>
              <span>
                {isHistoricalSummaryOnly
                  ? "Your score and attempt history are preserved. Detailed answer review is unavailable because the original question source for this older test no longer exists."
                  : useRecoveredSummary
                  ? "Restored securely from your saved submission."
                  : "Score saved automatically when this result page opens."}
              </span>
            </div>

            <div className="examResultInfoList">
              <p>
                <span>Leaderboard</span>
                <strong>{test.leaderboardMode || "disabled"}</strong>
              </p>

              <p>
                <span>Sync</span>
                <strong>
                  {canShowLeaderboardButton ? "Available" : "Auto saved"}
                </strong>
              </p>
            </div>

            {hasSubmittedAttempt && canShowLeaderboardButton && (
              <button
                type="button"
                className="examResultSyncButton"
                onClick={() => saveToLeaderboard(true)}
              >
                Sync Result
              </button>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}
