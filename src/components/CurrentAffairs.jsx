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
      <div className="sectionHeader">
        <span className="sectionBadge">
          📚 Monthly Updates
        </span>

        <h2>Current Affairs Hub</h2>

        <p className="sectionText">
          Premium monthly current affairs PDFs for
          CTET/TET and teaching exams preparation.
        </p>
      </div>

      <div className="currentAffairsGrid">
        {finalCurrentAffairs.map((item) => (
          <div className="currentAffairCard" key={item.id}>
            <div className="currentAffairTop">
              <span className="planTag">
                {item.type}
              </span>
            </div>

            <h3>{item.title}</h3>

            <div className="currentAffairMeta">
              <p>📅 {item.month}</p>

              <p>📄 {item.pages} Pages</p>
            </div>

            <button
              className="currentAffairBtn"
              onClick={() => handleNoteAccess(item)}
            >
              {item.type === "PREMIUM" && !isPremiumUser
                ? "🔒 Open Premium PDF"
                : "📥 Download PDF"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}