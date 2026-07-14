import React from "react";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase";
import { loadProtectedContentMirror } from "../../protectedContentAssetsService.js";

const RECEIPT_ROOT_COLLECTION = "mockSubmissionReceipts";
const RECEIPT_CHILD_COLLECTION = "tests";

const cleanText = (value) => String(value || "").trim();

export const getMockSubmissionReceiptRef = ({
  uid = "",
  testId = "",
} = {}) => {
  const normalizedUid = cleanText(uid);
  const normalizedTestId = cleanText(testId);

  if (!normalizedUid || !normalizedTestId) {
    throw new Error("Mock submission receipt requires uid and testId.");
  }

  return doc(
    db,
    RECEIPT_ROOT_COLLECTION,
    normalizedUid,
    RECEIPT_CHILD_COLLECTION,
    normalizedTestId
  );
};

export const submitMockSubmissionReceipt = async ({
  user = {},
  test = {},
  attemptState = {},
  reason = "student_submit",
} = {}) => {
  const uid = cleanText(user?.uid);
  const testId = cleanText(test?.id);
  const assetId = `contentItems__${testId}`;

  if (!uid || !testId) {
    throw new Error("Login and mock test are required before submission.");
  }

  const attemptKey = cleanText(
    attemptState?.attemptKey ||
      attemptState?.attemptId ||
      `${testId}_${uid}_${attemptState?.startedAt || Date.now()}`
  );

  await setDoc(
    getMockSubmissionReceiptRef({ uid, testId }),
    {
      uid,
      testId,
      assetId,
      sourceCollection: "contentItems",
      status: "submitted",
      attemptKey,
      startedAt:
        attemptState?.startedAt ??
        attemptState?.submittedAt ??
        Date.now(),
      submittedAt: serverTimestamp(),
      reason: cleanText(reason || "student_submit"),
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    uid,
    testId,
    assetId,
    attemptKey,
    status: "submitted",
  };
};

export const loadSubmittedMockTestAnswers = async ({
  test = {},
} = {}) => {
  const testId = cleanText(test?.id);

  if (!testId) {
    throw new Error("Mock answer release requires a test id.");
  }

  return loadProtectedContentMirror({
    sourceCollection: "contentItems",
    sourceId: testId,
    includeAnswers: true,
    publicItem: test,
  });
};

export const useSubmittedMockTestAnswers = ({
  test = null,
  user = null,
  enabled = false,
} = {}) => {
  const testId = cleanText(test?.id);
  const uid = cleanText(user?.uid);
  const [state, setState] = React.useState({
    test: null,
    loading: false,
    error: "",
  });

  React.useEffect(() => {
    let active = true;

    if (!enabled || !testId || !uid) {
      setState({
        test: null,
        loading: false,
        error: "",
      });

      return () => {
        active = false;
      };
    }

    setState({
      test: null,
      loading: true,
      error: "",
    });

    loadSubmittedMockTestAnswers({ test })
      .then((securedTest) => {
        if (!active) return;

        setState({
          test: securedTest,
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (!active) return;

        setState({
          test: null,
          loading: false,
          error:
            error?.message ||
            "Submitted answer key could not be loaded.",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, testId, uid]);

  return state;
};
