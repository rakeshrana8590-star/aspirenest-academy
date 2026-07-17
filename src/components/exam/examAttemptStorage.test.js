import {
  EXAM_ATTEMPT_STORAGE_VERSION,
  createDefaultAttemptState,
  getAttemptAnswerStorageKey,
  getAttemptOwnerScope,
  getAttemptStorageKey,
  getLegacyAttemptStorageKey,
  isAttemptStateOwnedByIdentity,
  removeAttemptAnswerState,
  removeAttemptState,
  restoreAttemptState,
  saveAttemptState,
  setAttemptStorageIdentity,
} from "./examAttemptStorage.js";

const mockTest = {
  id: "mock-premium-1",
  questions: [{ id: "q1" }, { id: "q2" }],
};

const learnerA = {
  uid: "learner-a-uid",
  email: "LearnerA@example.com",
};

const learnerB = {
  uid: "learner-b-uid",
  email: "learnerb@example.com",
};

describe(
  "AspireNest owner-scoped mock attempt storage",
  () => {
    beforeEach(() => {
      localStorage.clear();
      setAttemptStorageIdentity(null);
    });

    test("creates private owner-scoped keys without raw identity values", () => {
      const keyA = getAttemptStorageKey(mockTest.id, learnerA);
      const keyB = getAttemptStorageKey(mockTest.id, learnerB);
      const answerKeyA = getAttemptAnswerStorageKey(
        mockTest.id,
        learnerA
      );

      expect(keyA).toContain("aspireExamAttempt_v2_uid_");
      expect(answerKeyA).toContain(
        "mockAttemptAnswers_v2_uid_"
      );
      expect(keyA).not.toBe(keyB);
      expect(keyA).not.toContain(learnerA.uid);
      expect(keyA).not.toContain(
        learnerA.email.toLowerCase()
      );
    });

    test("does not reuse a prior active owner when an explicit identity is empty", () => {
      setAttemptStorageIdentity(learnerA);

      expect(getAttemptStorageKey(mockTest.id)).toBeTruthy();
      expect(getAttemptOwnerScope({ uid: "", email: "" })).toBe(
        ""
      );
      expect(
        getAttemptStorageKey(mockTest.id, {
          uid: "",
          email: "",
        })
      ).toBe("");
    });

    test("stamps default and saved attempts with exact owner evidence", () => {
      const state = createDefaultAttemptState(
        mockTest,
        600,
        learnerA
      );

      expect(state.ownerUid).toBe(learnerA.uid);
      expect(state.ownerEmail).toBe(
        learnerA.email.toLowerCase()
      );
      expect(state.storageVersion).toBe(
        EXAM_ATTEMPT_STORAGE_VERSION
      );
      expect(state.attemptOwnerScope).toBe(
        getAttemptOwnerScope(learnerA)
      );
      expect(saveAttemptState(mockTest.id, state, learnerA)).toBe(
        true
      );

      const restored = restoreAttemptState(mockTest, 600, learnerA);

      expect(restored.ownerUid).toBe(learnerA.uid);
      expect(restored.timeLeft).toBe(600);
      expect(
        isAttemptStateOwnedByIdentity(
          restored,
          mockTest.id,
          learnerA
        )
      ).toBe(true);
    });

    test("rejects a cross-owner save before any storage mutation", () => {
      const stateForA = createDefaultAttemptState(
        mockTest,
        600,
        learnerA
      );
      const keyForB = getAttemptStorageKey(mockTest.id, learnerB);

      expect(
        saveAttemptState(mockTest.id, stateForA, learnerB)
      ).toBe(false);
      expect(localStorage.getItem(keyForB)).toBeNull();
    });

    test("fails closed and removes tampered owner data from the active scope", () => {
      const keyForA = getAttemptStorageKey(mockTest.id, learnerA);
      const stateForB = createDefaultAttemptState(
        mockTest,
        120,
        learnerB
      );

      localStorage.setItem(keyForA, JSON.stringify(stateForB));

      const restored = restoreAttemptState(mockTest, 600, learnerA);

      expect(restored.ownerUid).toBe(learnerA.uid);
      expect(restored.timeLeft).toBe(600);
      expect(localStorage.getItem(keyForA)).toBeNull();
    });

    test("migrates only a legacy attempt already carrying matching owner evidence", () => {
      const legacyKey = getLegacyAttemptStorageKey(mockTest.id);
      const scopedKey = getAttemptStorageKey(mockTest.id, learnerA);
      const ownedLegacyState = {
        ...createDefaultAttemptState(test, 400, learnerA),
        storageVersion: 1,
        timeLeft: 321,
      };

      localStorage.setItem(
        legacyKey,
        JSON.stringify(ownedLegacyState)
      );

      const restored = restoreAttemptState(mockTest, 400, learnerA);

      expect(restored.timeLeft).toBe(321);
      expect(restored.storageVersion).toBe(2);
      expect(localStorage.getItem(legacyKey)).toBeNull();
      expect(localStorage.getItem(scopedKey)).not.toBeNull();
    });

    test("does not claim an ownerless legacy attempt for the signed-in learner", () => {
      const legacyKey = getLegacyAttemptStorageKey(mockTest.id);
      const ownerlessLegacyState = {
        testId: mockTest.id,
        questionOrder: [0, 1],
        answers: { 0: "option1" },
        timeLeft: 99,
        startedAt: 100,
        isSubmitted: false,
      };

      localStorage.setItem(
        legacyKey,
        JSON.stringify(ownerlessLegacyState)
      );

      const restored = restoreAttemptState(mockTest, 600, learnerA);

      expect(restored.ownerUid).toBe(learnerA.uid);
      expect(restored.timeLeft).toBe(600);
      expect(restored.answers).toEqual({});
      expect(localStorage.getItem(legacyKey)).not.toBeNull();
    });

    test("removes only the active learner scoped attempt and answer keys", () => {
      const stateA = createDefaultAttemptState(test, 600, learnerA);
      const stateB = createDefaultAttemptState(test, 600, learnerB);
      const keyA = getAttemptStorageKey(mockTest.id, learnerA);
      const keyB = getAttemptStorageKey(mockTest.id, learnerB);
      const answerKeyA = getAttemptAnswerStorageKey(
        mockTest.id,
        learnerA
      );
      const answerKeyB = getAttemptAnswerStorageKey(
        mockTest.id,
        learnerB
      );

      saveAttemptState(mockTest.id, stateA, learnerA);
      saveAttemptState(mockTest.id, stateB, learnerB);
      localStorage.setItem(answerKeyA, "{}");
      localStorage.setItem(answerKeyB, "{}");

      expect(removeAttemptState(mockTest.id, learnerA)).toBe(true);
      expect(
        removeAttemptAnswerState(mockTest.id, learnerA)
      ).toBe(true);

      expect(localStorage.getItem(keyA)).toBeNull();
      expect(localStorage.getItem(answerKeyA)).toBeNull();
      expect(localStorage.getItem(keyB)).not.toBeNull();
      expect(localStorage.getItem(answerKeyB)).not.toBeNull();
    });
  }
);
