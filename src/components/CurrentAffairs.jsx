import { useNavigate } from "react-router-dom";

export default function CurrentAffairs({
  currentAffairsList,
  fallbackCurrentAffairs,
  handleNoteAccess,
  hasPlanAccess,
}) {
  const navigate = useNavigate();

  const safeCurrentAffairsList = currentAffairsList || [];
  const safeFallbackCurrentAffairs = fallbackCurrentAffairs || [];

  const finalCurrentAffairs =
    safeCurrentAffairsList.length > 0
      ? safeCurrentAffairsList
      : safeFallbackCurrentAffairs;

  const canAccessCurrentAffair = (item) => {
    if (item.type === "FREE") return true;
    if (item.type === "BASIC") return hasPlanAccess("BASIC");
    if (item.type === "PREMIUM") return hasPlanAccess("PREMIUM");
    if (item.type === "MENTORSHIP") return hasPlanAccess("MENTORSHIP");
    return false;
  };

  const openCurrentAffair = (item) => {
    const unlocked = canAccessCurrentAffair(item);

    if (!unlocked) {
      navigate("/subjects/ctet-tet/pricing");
      return;
    }

    navigate(`/subjects/ctet-tet/current-affairs/${item.id}`);
  };

  return (
    <section id="current-affairs" className="currentAffairs currentAffairsRailPage">
      <div className="sectionHeader">
        <span className="sectionBadge">📚 Monthly Updates</span>

        <h2>Monthly Current Affairs</h2>

        <p className="sectionText">
          Swipe monthly CTET/TET current affairs PDFs in a premium horizontal library.
        </p>
      </div>

      <div className="currentAffairsRail">
        {finalCurrentAffairs.map((item) => {
          const unlocked = canAccessCurrentAffair(item);

          return (
            <div
              className={`currentAffairCard currentAffairRailCard ${
                !unlocked ? "lockedCourse" : ""
              }`}
              key={item.id}
              onClick={() => openCurrentAffair(item)}
            >
              <div className="currentAffairTop">
                <span className="planTag">{item.type}</span>
                <span className="currentAffairArrow">→</span>
              </div>

              <div className="currentAffairIcon">📰</div>

              <h3>{item.title}</h3>

              <div className="currentAffairMeta">
                <p>📅 {item.month}</p>
                <p>📄 {item.pages} Pages</p>
              </div>

              <p className="currentAffairAccess">
                {unlocked ? "🔓 Unlocked" : `🔒 ${item.type}`}
              </p>

              <button
                className="currentAffairBtn"
                onClick={(e) => {
                  e.stopPropagation();

                  if (unlocked) {
                    handleNoteAccess(item);
                  } else {
                    navigate("/subjects/ctet-tet/pricing");
                  }
                }}
              >
                {unlocked ? "📥 Download PDF" : "🔒 Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}