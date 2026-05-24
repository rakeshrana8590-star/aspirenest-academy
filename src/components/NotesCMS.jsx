export default function NotesCMS({
  notesData,
  firebaseNotes,
  handleNoteAccess,
  isPremiumUser,
  setActiveSection,
  activePlan,
}) {
  const allNotes = [...notesData, ...firebaseNotes];

  const getAccessLabel = (note) => {
    if (note.type === "FREE") return "FREE ACCESS";
    if (note.type === "BASIC") return "BASIC PLAN";
    if (note.type === "MENTORSHIP") return "MENTORSHIP BONUS";
    return "PREMIUM PLAN";
  };
  const canAccessNote = (note) => {
    if (note.type === "FREE") {
      return true;
    }
  
    if (activePlan === "MENTORSHIP") {
      return true;
    }
  
    if (
      activePlan === "PREMIUM" &&
      (note.type === "PREMIUM" ||
        note.type === "BASIC")
    ) {
      return true;
    }
  
    if (
      activePlan === "BASIC" &&
      note.type === "BASIC"
    ) {
      return true;
    }
  
    return false;
  };
  const getButtonText = (note) => {
    if (canAccessNote(note)) {
      if (note.type === "FREE") {
        return "📥 Download Free PDF";
      }
  
      return "🌟 Open PDF";
    }
  
    if (note.type === "BASIC") {
      return "🔒 Upgrade to BASIC";
    }
  
    if (note.type === "PREMIUM") {
      return "🔒 Upgrade to PREMIUM";
    }
  
    if (note.type === "MENTORSHIP") {
      return "🔒 Upgrade to MENTORSHIP";
    }
  
    return "🔒 Upgrade to Unlock";
  };

  return (
    <section id="notes" className="notesSection">
      <h2>Notes Library</h2>

      <p className="sectionText">
        Free, Basic and Premium notes clearly organized for CTET/TET preparation.
      </p>

      <>
  {["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map(
    (sectionType) => {
      const sectionNotes = allNotes.filter(
        (note) => note.type === sectionType
      );

      if (sectionNotes.length === 0) return null;

      return (
        <div
          className="notesGroupSection"
          key={sectionType}
        >
          <h2 className="notesGroupTitle">
            {sectionType === "FREE" &&
              "📘 FREE NOTES"}

            {sectionType === "BASIC" &&
              "🟦 BASIC NOTES"}

            {sectionType === "PREMIUM" &&
              "🌟 PREMIUM LIBRARY"}

            {sectionType === "MENTORSHIP" &&
              "👨‍🏫 MENTORSHIP VAULT"}
          </h2>

          <div className="grid">
            {sectionNotes.map((note) => (
              <div
              className={`course ${
                note.type === "PREMIUM" && !isPremiumUser
                  ? "lockedCourse"
                  : ""
              }`}
              key={note.id}
            >
              <span className="planTag">
                {getAccessLabel(note)}
              </span>
            
              <h3>{note.title}</h3>
            
              <p>
                📂 Category: {note.category}
              </p>
            
              <p>
                📄 Pages: {note.pages}
              </p>
                
              <button
  className="btnLink"
  onClick={() => {
    if (canAccessNote(note)) {
      handleNoteAccess(note);
    } else {
 setActiveSection("pricing");
  }
  }}
>
  {getButtonText(note)}
</button>
            </div>
            ))}
          </div>
        </div>
      );
    }
  )}
</>
    </section>
  );
}