export default function WarningCard({
    tabSwitchCount,
    fullscreenExitCount,
  }) {
    const hasWarnings =
      Number(tabSwitchCount || 0) > 0 ||
      Number(fullscreenExitCount || 0) > 0;
  
    if (!hasWarnings) {
      return null;
    }
  
    return (
      <div className="examFinalBox">
        <h4>Exam Warning</h4>
  
        <p>
          Tab switches detected: {Number(tabSwitchCount || 0)}
        </p>
  
        <p>
          Fullscreen exits: {Number(fullscreenExitCount || 0)}
        </p>
  
        <span className="notesSubjectTag">
          Stay on exam screen
        </span>
      </div>
    );
  }