export default function WarningCard({
  tabSwitchCount,
  fullscreenExitCount,
}) {
  const safeTabSwitchCount = Number(tabSwitchCount || 0);
  const safeFullscreenExitCount = Number(fullscreenExitCount || 0);

  const hasWarnings =
    safeTabSwitchCount > 0 || safeFullscreenExitCount > 0;

  if (!hasWarnings) {
    return null;
  }

  return (
    <div className="examWarningCard">
      <div>
        <strong>Exam Warning</strong>

        <span>
          Tab: {safeTabSwitchCount} · Fullscreen:{" "}
          {safeFullscreenExitCount}
        </span>
      </div>

      <small>Stay on screen</small>
    </div>
  );
}