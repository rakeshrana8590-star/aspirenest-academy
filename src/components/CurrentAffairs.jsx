import { useNavigate } from "react-router-dom";

export default function CurrentAffairs({
  currentAffairsList,
  fallbackCurrentAffairs,
  hasPlanAccess,
}) {
  const navigate = useNavigate();

  const safeCurrentAffairsList = currentAffairsList || [];
  const safeFallbackCurrentAffairs = fallbackCurrentAffairs || [];

  const finalCurrentAffairs =
    safeCurrentAffairsList.length > 0
      ? safeCurrentAffairsList
      : safeFallbackCurrentAffairs;

  const isComingSoon = (item) =>
    item?.type === "COMING_SOON" || !item?.pdf || item?.pdf === "#";

  const canAccessCurrentAffair = (item) => {
    if (isComingSoon(item)) return false;

    const accessType = item?.accessPlan || item?.type || "FREE";

    if (accessType === "FREE") return true;

    return hasPlanAccess ? hasPlanAccess(accessType) : false;
  };

  const openPdf = (item) => {
    if (isComingSoon(item)) {
      alert("This month's PDF will be uploaded soon.");
      return;
    }

    const unlocked = canAccessCurrentAffair(item);

    if (!unlocked) {
      navigate("/subjects/ctet-tet/pricing");
      return;
    }

    window.open(item.pdf, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="current-affairs"
      className="currentAffairs currentAffairsRailPage"
    >
      <div className="sectionHeader">
        <span className="sectionBadge">📚 Monthly Updates</span>

        <h2>Monthly Current Affairs</h2>

        <p className="sectionText">
          Swipe monthly CTET/TET current affairs PDFs in a premium horizontal library.
        </p>
      </div>

      <div className="currentAffairsRail">
        {finalCurrentAffairs.map((item) => {
          const comingSoon = isComingSoon(item);
          const unlocked = canAccessCurrentAffair(item);

          return (
            <div
              className={`currentAffairCard currentAffairRailCard ${
                comingSoon ? "comingSoonCard" : ""
              } ${!comingSoon && !unlocked ? "lockedCourse" : ""}`}
              key={item.id}
              onClick={() => openPdf(item)}
            >
              <div className="currentAffairTop">
                <span className="planTag">
                  {comingSoon ? "COMING SOON" : item?.type || "FREE"}
                </span>

                {!comingSoon && (
                  <span className="currentAffairArrow">→</span>
                )}
              </div>

              <div className="currentAffairIcon">📰</div>

              <h3>{item.title}</h3>

              <div className="currentAffairMeta">
                <p>📅 {item.month}</p>
                <p>
                  📄 {comingSoon ? "PDF Pending" : `${item.pages} Pages`}
                </p>
              </div>

              <p className="currentAffairAccess">
                {comingSoon
                  ? "⏳ Coming Soon"
                  : unlocked
                  ? "🔓 Unlocked"
                  : `🔒 ${item.type}`}
              </p>

              <button
                className="currentAffairBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  openPdf(item);
                }}
              >
                {comingSoon
                  ? "⏳ Coming Soon"
                  : unlocked
                  ? "📥 Download PDF"
                  : "🔒 Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}