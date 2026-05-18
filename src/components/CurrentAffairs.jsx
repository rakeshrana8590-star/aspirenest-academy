export default function CurrentAffairs({
    currentAffairsList,
    fallbackCurrentAffairs,
    handleNoteAccess,
    isPremiumUser,
  }) {
    const finalCurrentAffairs =
      currentAffairsList.length > 0
        ? currentAffairsList
        : fallbackCurrentAffairs;
  
    return (
      <section id="current-affairs" className="currentAffairs">
        <h2>Current Affairs</h2>
  
        <p className="sectionText">
          Monthly current affairs PDFs for CTET/TET and teaching exams.
        </p>
  
        <div className="grid">
          {finalCurrentAffairs.map((item) => (
            <div className="course" key={item.id}>
              <span className="planTag">{item.type}</span>
  
              <h3>{item.title}</h3>
  
              <p>📅 Month: {item.month}</p>
  
              <p>📄 Pages: {item.pages}</p>
  
              <button
                className="btnLink"
                onClick={() => handleNoteAccess(item)}
              >
                {item.type === "PREMIUM" && !isPremiumUser
                  ? "🔒 Premium Only"
                  : "📥 Download PDF"}
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }