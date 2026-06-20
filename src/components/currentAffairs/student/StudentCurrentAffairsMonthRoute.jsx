import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentCurrentAffairsHero from "./StudentCurrentAffairsHero";
import StudentCurrentAffairsEmptyState from "./StudentCurrentAffairsEmptyState";
import { StudentCurrentAffairsWeekBlock } from "./StudentCurrentAffairsCards";

import {
  buildCurrentAffairsWeekGroups,
  canAccessCurrentAffairsPlan,
  getCurrentAffairsPdfCount,
  getCurrentAffairsPdfUrl,
  getMonthCurrentAffairs,
  getPublishedCurrentAffairs,
} from "../shared/currentAffairsUtils";

export default function StudentCurrentAffairsMonthRoute({
  universalContent = [],
  currentAffairsList = [],
  hasPlanAccess,
  isAdmin = false,
}) {
  const navigate = useNavigate();
  const { monthId } = useParams();

  const publishedCurrentAffairs = getPublishedCurrentAffairs(
    universalContent,
    currentAffairsList
  );

  const monthItems = getMonthCurrentAffairs(publishedCurrentAffairs, monthId);
  const weekGroups = buildCurrentAffairsWeekGroups(monthItems);
  const monthTitle = monthItems[0]?.month || "Current Affairs Month";

  const plansInMonth = new Set(
    monthItems.map((item) => item.planType || "FREE")
  ).size;

  const openCurrentAffairPdf = (item) => {
    const pdfUrl = getCurrentAffairsPdfUrl(item);
    const planName = item.planType || "FREE";

    if (!pdfUrl) {
      alert("PDF URL missing in this current affair item.");
      return;
    }

    if (
      !isAdmin &&
      !canAccessCurrentAffairsPlan({
        planName,
        hasPlanAccess,
      })
    ) {
      navigate("/ctet-tet/pricing");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="studentCaPage">
      <StudentCurrentAffairsHero
        badge="CURRENT AFFAIRS MONTH"
        title={monthTitle}
        text="Open weekly and monthly CTET/TET current affairs PDFs from this month."
        backLabel="Back to Library"
        onBack={() => navigate("/ctet-tet/current-affairs")}
        primaryLabel="Start Revision →"
        secondaryLabel="PDF Library"
        stats={[
          {
            label: "Weeks",
            value: weekGroups.length,
          },
          {
            label: "PDFs",
            value: getCurrentAffairsPdfCount(monthItems),
          },
          {
            label: "Plans",
            value: plansInMonth,
          },
        ]}
      />

      <div className="studentCaShelf">
        <div className="studentCaShelfHeader">
          <div>
            <span>{monthTitle}</span>

            <h2>Weekly PDF revision</h2>

            <p>
              Open weekly current affairs PDFs. Locked plan PDFs redirect
              students to pricing, while admin preview can open all PDFs.
            </p>
          </div>

          <div className="studentCaShelfStatus">
            <strong>{monthItems.length}</strong>
            <span>Ready PDFs</span>
          </div>
        </div>

        {weekGroups.length === 0 ? (
          <StudentCurrentAffairsEmptyState
            title="No PDFs found"
            text="No published current affairs PDFs are available for this month."
            actionLabel="Back to Current Affairs"
            onAction={() => navigate("/ctet-tet/current-affairs")}
          />
        ) : (
          <div className="studentCaWeekStack">
            {weekGroups.map((weekGroup) => (
              <StudentCurrentAffairsWeekBlock
                key={weekGroup.id}
                weekGroup={weekGroup}
                isAdmin={isAdmin}
                hasPlanAccess={hasPlanAccess}
                onOpenPdf={openCurrentAffairPdf}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}