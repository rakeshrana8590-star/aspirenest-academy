export default function NotesCMS({
  notesData,
  firebaseNotes,
  handleNoteAccess,
  isPremiumUser,
  setActiveSection,
  activePlan,
  userPlanType,
  hasPlanAccess,
}) {
  const allNotes = [...notesData, ...firebaseNotes];

  const getAccessLabel = (note) => {
    if (note.type === "FREE") return "FREE ACCESS";
    if (note.type === "BASIC") return "BASIC PLAN";
    if (note.type === "MENTORSHIP") return "MENTORSHIP BONUS";
    return "PREMIUM PLAN";
  };

  const canAccessNote = (note) => {
    if (note.type === "FREE") return true;
    if (note.type === "BASIC") return hasPlanAccess("BASIC");
    if (note.type === "PREMIUM") return hasPlanAccess("PREMIUM");
    if (note.type === "MENTORSHIP") return hasPlanAccess("MENTORSHIP");
    return false;
  };

  const getButtonText = (note) => {
    if (canAccessNote(note)) {
      if (note.type === "FREE") return "📥 Download Free PDF";
      return "🌟 Open PDF";
    }

    if (note.type === "BASIC") return "🔒 Upgrade to BASIC";
    if (note.type === "PREMIUM") return "🔒 Upgrade to PREMIUM";
    if (note.type === "MENTORSHIP") return "🔒 Upgrade to MENTORSHIP";

    return "🔒 Upgrade to Unlock";
  };

  return (
    <section id="notes" className="notesSection">
      <h2>Notes Library</h2>

      <p className="sectionText">
        Free, Basic and Premium notes clearly organized for CTET/TET preparation.
      </p>

      {["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((sectionType) => {
        const sectionNotes = allNotes.filter(
          (note) => note.type === sectionType
        );

        if (sectionNotes.length === 0) return null;

        return (
          <div className="notesGroupSection" key={sectionType}>
            <h2 className="notesGroupTitle">
              {sectionType === "FREE" && "📘 FREE NOTES"}
              {sectionType === "BASIC" && "🟦 BASIC NOTES"}
              {sectionType === "PREMIUM" && "🌟 PREMIUM LIBRARY"}
              {sectionType === "MENTORSHIP" && "👨‍🏫 MENTORSHIP VAULT"}
            </h2>

            <div className="grid">
              {sectionNotes.map((note) => {
                const unlocked = canAccessNote(note);

                return (
                  <div
                    className={`course ${!unlocked ? "lockedCourse" : ""}`}
                    key={note.id}
                  >
                    <span className="planTag">{getAccessLabel(note)}</span>

                    <h3>{note.title}</h3>

                    <p>📂 Category: {note.category}</p>
                    <p>📄 Pages: {note.pages}</p>

                    <p>
                      🔐 Access:{" "}
                      <strong>{unlocked ? "Unlocked" : getAccessLabel(note)}</strong>
                    </p>

                    <button
                      className="btnLink"
                      onClick={() => {
                        if (unlocked) {
                          handleNoteAccess(note);
                        } else {
                          setActiveSection("pricing");
                        }
                      }}
                    >
                      {getButtonText(note)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}