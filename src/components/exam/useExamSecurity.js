import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const EXAM_ATTEMPT_PATH = "/ctet-tet/mock-tests/attempt/";

const getAttemptTestIdFromPathname = (pathname = "") => {
  if (!pathname.includes(EXAM_ATTEMPT_PATH)) return "";

  return decodeURIComponent(pathname.split("/")[4] || "");
};

const getActiveSecurityTest = (universalContent = [], testId = "") => {
  if (!testId) return null;

  return universalContent.find(
    (test) =>
      test.section === "mockTest" &&
      test.id === testId
  );
};

export const useExamSecurity = ({
  locationPathname = "",
  universalContent = [],
  mockAttemptState = {},
  updateAttemptState,
}) => {
  const fullscreenRequestedRef = useRef({});
  const toastCooldownRef = useRef({});

  const testId = getAttemptTestIdFromPathname(locationPathname);

  const activeTest = getActiveSecurityTest(
    universalContent,
    testId
  );

  const activeState = testId
    ? mockAttemptState?.[testId]
    : null;

  const isActive = Boolean(
    testId &&
      activeTest &&
      activeState?.isSubmitted !== true
  );

  const showLimitedToast = (key, message) => {
    const now = Date.now();
    const lastShownAt = toastCooldownRef.current[key] || 0;

    if (now - lastShownAt < 1200) return;

    toastCooldownRef.current[key] = now;
    toast.error(message);
  };

  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Your mock test is still running. Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTest?.tabSwitchDetection !== "yes") return;

    const handleVisibilityChange = () => {
      if (!document.hidden) return;

      updateAttemptState(testId, (state) => ({
        ...state,
        violations: {
          ...(state.violations || {}),
          tabSwitchCount:
            Number(state.violations?.tabSwitchCount || 0) + 1,
          lastTabSwitchAt: Date.now(),
        },
      }));

      showLimitedToast(
        "tabSwitch",
        "Tab switch detected. Please stay on the exam screen."
      );
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    isActive,
    activeTest?.tabSwitchDetection,
    testId,
    updateAttemptState,
  ]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTest?.copyPasteProtection !== "yes") return;

    const blockExamAction = (event) => {
      event.preventDefault();

      showLimitedToast(
        "copyPaste",
        "This action is blocked during the mock test."
      );
    };

    document.addEventListener("copy", blockExamAction);
    document.addEventListener("paste", blockExamAction);
    document.addEventListener("cut", blockExamAction);
    document.addEventListener("contextmenu", blockExamAction);

    return () => {
      document.removeEventListener("copy", blockExamAction);
      document.removeEventListener("paste", blockExamAction);
      document.removeEventListener("cut", blockExamAction);
      document.removeEventListener(
        "contextmenu",
        blockExamAction
      );
    };
  }, [isActive, activeTest?.copyPasteProtection]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTest?.fullscreenMode !== "yes") return;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) return;

      updateAttemptState(testId, (state) => ({
        ...state,
        violations: {
          ...(state.violations || {}),
          fullscreenExitCount:
            Number(state.violations?.fullscreenExitCount || 0) + 1,
          lastFullscreenExitAt: Date.now(),
        },
      }));

      showLimitedToast(
        "fullscreenExit",
        "Fullscreen exited. Please stay in exam mode."
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [
    isActive,
    activeTest?.fullscreenMode,
    testId,
    updateAttemptState,
  ]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTest?.fullscreenMode !== "yes") return;
    if (document.fullscreenElement) return;
    if (fullscreenRequestedRef.current[testId]) return;

    fullscreenRequestedRef.current[testId] = true;

    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        console.log("Fullscreen request skipped");
      }
    };

    enterFullscreen();
  }, [isActive, activeTest?.fullscreenMode, testId]);

  useEffect(() => {
    if (!isActive) return;

    const blockKeyboardShortcuts = (event) => {
      const key = event.key?.toLowerCase();

      const blockedClipboardKeys =
        activeTest?.copyPasteProtection === "yes" &&
        event.ctrlKey &&
        ["c", "v", "x", "a"].includes(key);

      const blockedSystemKeys =
        (event.ctrlKey && ["s", "p"].includes(key)) ||
        key === "f12" ||
        key === "printscreen";

      if (!blockedClipboardKeys && !blockedSystemKeys) return;

      event.preventDefault();

      updateAttemptState(testId, (state) => ({
        ...state,
        violations: {
          ...(state.violations || {}),
          shortcutBlockCount:
            Number(state.violations?.shortcutBlockCount || 0) + 1,
          lastShortcutBlockedAt: Date.now(),
        },
      }));

      showLimitedToast(
        "shortcut",
        "Keyboard shortcut blocked during the mock test."
      );
    };

    document.addEventListener("keydown", blockKeyboardShortcuts);

    return () => {
      document.removeEventListener(
        "keydown",
        blockKeyboardShortcuts
      );
    };
  }, [
    isActive,
    activeTest?.copyPasteProtection,
    testId,
    updateAttemptState,
  ]);
};