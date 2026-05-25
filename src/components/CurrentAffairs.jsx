import { useNavigate } from "react-router-dom";

export default function CurrentAffairs({
  currentAffairsList,
  fallbackCurrentAffairs,
  handleNoteAccess,
  isPremiumUser,
  userPlanType,
  hasPlanAccess,
  setActiveSection,
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

  const getButtonText = (item) => {
    if (canAccessCurrentAffair(item)) {
      return "📥 Download PDF";
    }

    if (item.type === "BASIC") return "🔒 Upgrade to BASIC";
    if (item.type === "PREMIUM") return "🔒 Upgrade to PREMIUM";
    if (item.type === "MENTORSHIP") return "🔒 Upgrade to MENTORSHIP";

    return "🔒 Upgrade Required";
  };

  return (
    <section id="current-affairs" className="currentAffairs">
      <div className="sectionHeader">
        <span className="sectionBadge">📚 Monthly Updates</span>

        <h2>Current Affairs Hub</h2>

        <p className="sectionText">
          Premium monthly current affairs PDFs for CTET/TET and teaching exams
          preparation.
        </p>
      </div>

      <div className="currentAffairsGrid">
        {finalCurrentAffairs.map((item) => {
          const unlocked = canAccessCurrentAffair(item);

          return (
            <div
              className={`currentAffairCard ${
                !unlocked ? "lockedCourse" : ""
              }`}
              key={item.id}
            >
              <div className="currentAffairTop">
                <span className="planTag">{item.type}</span>
              </div>

              <h3>{item.title}</h3>

              <div className="currentAffairMeta">
                <p>📅 {item.month}</p>
                <p>📄 {item.pages} Pages</p>
              </div>

              <p
                style={{
                  marginBottom: "12px",
                  fontWeight: "600",
                }}
              >
                🔐 Access: {unlocked ? "Unlocked" : item.type}
              </p>

              <button
                className="currentAffairBtn"
                onClick={() => {
                  if (unlocked) {
                    handleNoteAccess(item);
                  } else {
                    navigate("/subjects/ctet-tet/pricing");
                  }
                }}
              >
                {getButtonText(item)}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}