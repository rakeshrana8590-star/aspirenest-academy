import { useNavigate } from "react-router-dom";

import { loadProtectedContentMirror } from "../protectedContentAssetsService";
import { isCanonicalPublicContentItem } from "../publicContentCatalogUtils";
import { hasValidCurrentAffairsPdf } from "./currentAffairs/shared/currentAffairsUtils";

export default function CurrentAffairs({
  currentAffairsList,
  fallbackCurrentAffairs,
  hasPlanAccess,
}) {
  const navigate = useNavigate();

  const getMonthFromText = (text = "") => {
    const match = text.match(
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i
    );

    return match ? match[0] : "";
  };

  const getPdfUrl = (item) =>
    item?.fileUrl || item?.pdfUrl || item?.pdf || "";

  const sourceCurrentAffairs = [
    ...(currentAffairsList || []),
    ...(fallbackCurrentAffairs || []),
  ];

  const realCurrentAffairs = sourceCurrentAffairs
    .map((item) => {
      const month =
        item.month ||
        getMonthFromText(item.title) ||
        getMonthFromText(item.chapter) ||
        "";

      return {
        ...item,
        id: item.id,
        title:
          item.title ||
          item.chapter ||
          `${month || "Current Affairs"} PDF`,
        month,
        pdf: getPdfUrl(item),
        pages: item.pages || item.duration || "",
        type: item.type || item.planType || "FREE",
        accessPlan:
          item.accessPlan ||
          item.planType ||
          item.type ||
          "FREE",
      };
    })
    .filter(
      (item) =>
        item.month &&
        hasValidCurrentAffairsPdf(item) &&
        item.type !== "COMING_SOON"
    );

  const uniqueCurrentAffairs = realCurrentAffairs.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (x) =>
          x.month === item.month &&
          x.title === item.title &&
          x.pdf === item.pdf
      )
  );

  const groupedCurrentAffairs = uniqueCurrentAffairs.reduce(
    (acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = [];
      }

      acc[item.month].push(item);
      return acc;
    },
    {}
  );

  const monthOrder = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const monthGroups = Object.entries(groupedCurrentAffairs).sort(
    ([a], [b]) => {
      const [monthA, yearA] = a.toLowerCase().split(" ");
      const [monthB, yearB] = b.toLowerCase().split(" ");
  
      if (yearA !== yearB) {
        return Number(yearB) - Number(yearA);
      }
  
      return (
        monthOrder.indexOf(monthB) -
        monthOrder.indexOf(monthA)
      );
    }
  );
  const canAccessCurrentAffair = (item) => {
    const accessType = item.accessPlan || "FREE";

    if (accessType === "FREE") return true;

    return hasPlanAccess ? hasPlanAccess(accessType) : false;
  };

  const openPdf = async (item) => {
    if (!canAccessCurrentAffair(item)) {
      navigate("/ctet-tet/pricing");
      return;
    }

    let resolvedItem = item;

    if (isCanonicalPublicContentItem(item)) {
      try {
        resolvedItem = await loadProtectedContentMirror({
          sourceCollection: item.sourceCollection || "contentItems",
          sourceId: item.sourceId || item.id,
          publicItem: item,
        });
      } catch (error) {
        console.error("Protected current affairs PDF load failed:", error);
        alert("This protected PDF is not available right now.");
        return;
      }
    }

    const pdfUrl = getPdfUrl(resolvedItem);

    if (!pdfUrl || pdfUrl === "#") {
      alert("This PDF will be uploaded soon.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
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
          Upload any number of monthly CTET/TET current affairs PDFs.
          They will automatically appear inside the correct month.
        </p>
      </div>

      <div className="currentAffairsRail">
        {monthGroups.map(([month, items]) => (
       <div
       className="currentAffairCard currentAffairRailCard"
       key={month}
       onClick={() => openPdf(items[0])}
     >
            <div className="currentAffairTop">
              <span className="planTag">{month}</span>
              <span className="currentAffairArrow">→</span>
            </div>

            <div className="currentAffairIcon">📰</div>

            <h3>{month} Current Affairs</h3>

            <div className="currentAffairMeta">
              <p>📅 {month}</p>
              <p>📄 {items.length} PDF</p>
            </div>

            <div className="currentAffairPdfList">
              {items.map((item) => {
                const unlocked = canAccessCurrentAffair(item);

                return (
                  <button
                    key={item.id}
                    className="currentAffairBtn"
                    onClick={() => openPdf(item)}
                  >
                    {unlocked
                      ? `📥 ${item.title}`
                      : `🔒 ${item.type}`}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}