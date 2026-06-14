import { useEffect } from "react";
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

const isAttemptSecurityActive = ({
  locationPathname,
  universalContent,
  mockAttemptState,
}) => {
  const testId = getAttemptTestIdFromPathname(locationPathname);

  if (!testId) {
    return {
      isActive: false,
      testId: "",
      activeTest: null,
      activeState: null,
    };
  }

  const activeTest = getActiveSecurityTest(universalContent, testId);
  const activeState = mockAttemptState?.[testId] || null;

  if (!activeTest || activeState?.isSubmitted) {
    return {
      isActive: false,
      testId,
      activeTest,
      activeState,
    };
  }

  return {
    isActive: true,
    testId,
    activeTest,
    activeState,
  };
};

export const useExamSecurity = ({
  locationPathname,
  universalContent,
  mockAttemptState,
  updateAttemptState,
}) => {
  useEffect(() => {
    const { isActive } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

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
  }, [locationPathname, universalContent, mockAttemptState]);

  useEffect(() => {
    const { isActive, testId, activeTest } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

    if (!isActive) return;
    if (activeTest.tabSwitchDetection !== "yes") return;

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

      toast.error(
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
    locationPathname,
    universalContent,
    mockAttemptState,
    updateAttemptState,
  ]);

  useEffect(() => {
    const { isActive, activeTest } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

    if (!isActive) return;
    if (activeTest.copyPasteProtection !== "yes") return;

    const blockExamAction = (event) => {
      event.preventDefault();

      toast.error(
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
  }, [locationPathname, universalContent, mockAttemptState]);

  useEffect(() => {
    const { isActive, testId, activeTest } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

    if (!isActive) return;
    if (activeTest.fullscreenMode !== "yes") return;

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

      toast.error(
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
    locationPathname,
    universalContent,
    mockAttemptState,
    updateAttemptState,
  ]);

  useEffect(() => {
    const { isActive, activeTest } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

    if (!isActive) return;
    if (activeTest.fullscreenMode !== "yes") return;
    if (document.fullscreenElement) return;

    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.log("Fullscreen request skipped");
      }
    };

    enterFullscreen();
  }, [locationPathname, universalContent, mockAttemptState]);

  useEffect(() => {
    const { isActive, testId } = isAttemptSecurityActive({
      locationPathname,
      universalContent,
      mockAttemptState,
    });

    if (!isActive) return;

    const blockKeyboardShortcuts = (event) => {
      const key = event.key?.toLowerCase();

      const blockedCtrlKeys =
        event.ctrlKey &&
        ["c", "v", "x", "a", "s", "p"].includes(key);

      const blockedKeys =
        key === "f12" || key === "printscreen";

      if (!blockedCtrlKeys && !blockedKeys) return;

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

      toast.error(
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
    locationPathname,
    universalContent,
    mockAttemptState,
    updateAttemptState,
  ]);
};