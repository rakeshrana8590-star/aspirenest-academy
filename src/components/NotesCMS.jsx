export default function NotesCMS({
    notesData,
    firebaseNotes,
    handleNoteAccess,
    isPremiumUser,
  }) {
    return (
      <section id="notes" className="notesSection">
        <h2>Premium Notes Library</h2>
  
        <p className="sectionText">
          Smart bilingual notes with visual learning and quick revision support.
        </p>
  
        <div className="grid">
          {[...notesData, ...firebaseNotes].map((note) => (
            <div className="course" key={note.id}>
              <span className="planTag">{note.type}</span>
  
              <h3>{note.title}</h3>
  
              <p>📂 Category: {note.category}</p>
  
              <p>📄 Pages: {note.pages}</p>
  
              <button
  className="btnLink"
  onClick={() => window.open(note.pdf, "_blank")}
>
              >
                {note.type === "PREMIUM" && !isPremiumUser
                  ? "🔒 Premium Only"
                  : note.type === "PREMIUM"
                  ? "🌟 Open Premium PDF"
                  : "📥 Download PDF"}
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }