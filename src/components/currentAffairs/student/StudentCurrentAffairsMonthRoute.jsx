import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadProtectedContentMirror } from "../../../protectedContentAssetsService";
import { isCanonicalPublicContentItem } from "../../../publicContentCatalogUtils";

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

  const openCurrentAffairPdf = async (item) => {
    const planName = item.planType || "FREE";

    if (
      !isAdmin &&
      !canAccessCurrentAffairsPlan({
        planName,
        hasPlanAccess,
        accessOptions: {
          module: "currentAffairs",
          itemType: "currentAffairsPdf",
          itemId: item.id,
        },
      })
    ) {
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

    const pdfUrl = getCurrentAffairsPdfUrl(resolvedItem);

    if (!pdfUrl) {
      alert("PDF URL missing in this current affair item.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  if (monthItems.length === 0) {
    return (
      <section className="studentCaPage">
        <StudentCurrentAffairsHero
          badge="CURRENT AFFAIRS MONTH"
          title="Current Affairs Not Found"
          text="This month does not have any published current affairs PDFs yet."
          backLabel="Back to Library"
          onBack={() => navigate("/ctet-tet/current-affairs")}
          primaryLabel="Back to Library →"
          secondaryLabel="View Pricing"
          onPrimary={() => navigate("/ctet-tet/current-affairs")}
          onSecondary={() => navigate("/ctet-tet/pricing")}
          stats={[
            {
              label: "Weeks",
              value: 0,
            },
            {
              label: "PDFs",
              value: 0,
            },
            {
              label: "Plans",
              value: 0,
            },
          ]}
        />

        <div className="studentCaShelf">
          <StudentCurrentAffairsEmptyState
            title="No current affairs PDFs found"
            text="Open the current affairs library and choose an available month."
            actionLabel="Back to Current Affairs"
            onAction={() => navigate("/ctet-tet/current-affairs")}
          />
        </div>
      </section>
    );
  }

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
              students to pricing, while accessible PDFs open directly for
              revision.
            </p>
          </div>

          <div className="studentCaShelfStatus">
            <strong>{monthItems.length}</strong>
            <span>Ready PDFs</span>
          </div>
        </div>

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
      </div>
    </section>
  );
}