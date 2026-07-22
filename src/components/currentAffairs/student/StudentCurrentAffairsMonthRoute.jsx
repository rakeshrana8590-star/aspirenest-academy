import React from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  CURRENT_AFFAIRS_REASON_CODES,
} from "../../../access/currentAffairsActionPolicy.js";
import StudentCurrentAffairsHero from "./StudentCurrentAffairsHero";
import StudentCurrentAffairsEmptyState from "./StudentCurrentAffairsEmptyState";
import {
  StudentCurrentAffairsWeekBlock,
} from "./StudentCurrentAffairsCards";

import {
  buildCurrentAffairsWeekGroups,
  getCurrentAffairsPdfCount,
  getMonthCurrentAffairs,
  getPublishedCurrentAffairs,
} from "../shared/currentAffairsUtils";

const encodeRouteValue = (value = "") =>
  encodeURIComponent(String(value || ""));

export default function StudentCurrentAffairsMonthRoute({
  universalContent = [],
  currentAffairsList = [],
  user = null,
  hasPlanAccess,
  accessState = {},
  isAdmin = false,
}) {
  const navigate = useNavigate();
  const { monthId } = useParams();

  const publishedCurrentAffairs =
    getPublishedCurrentAffairs(
      universalContent,
      currentAffairsList
    );

  const monthItems = getMonthCurrentAffairs(
    publishedCurrentAffairs,
    monthId
  );
  const weekGroups =
    buildCurrentAffairsWeekGroups(monthItems);
  const monthTitle =
    monthItems[0]?.month ||
    "Current Affairs Month";

  const plansInMonth = new Set(
    monthItems.map(
      (item) => item.planType || "FREE"
    )
  ).size;

  const openCurrentAffairsViewer = (
    item,
    decision = {}
  ) => {
    const resourceId = String(item?.id || "");
    const viewerRoute =
      `/ctet-tet/current-affairs/` +
      `${encodeRouteValue(monthId)}/read/` +
      `${encodeRouteValue(resourceId)}`;

    if (!resourceId) {
      window.alert(
        "This current affairs resource is unavailable."
      );
      return;
    }

    if (
      decision.reason ===
      CURRENT_AFFAIRS_REASON_CODES.LOGIN_REQUIRED
    ) {
      navigate(
        `/login?returnTo=${encodeURIComponent(
          viewerRoute
        )}`
      );
      return;
    }

    if (
      decision.reason ===
      CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING
    ) {
      window.alert(
        "AspireNest is still verifying access. Please retry in a moment."
      );
      return;
    }

    if (
      decision.reason ===
      CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR
    ) {
      window.alert(
        "Current Affairs access could not be verified. Reload or contact support."
      );
      return;
    }

    if (!decision.allowed) {
      navigate("/ctet-tet/pricing");
      return;
    }

    navigate(viewerRoute);
  };

  if (monthItems.length === 0) {
    return (
      <section className="studentCaPage">
        <StudentCurrentAffairsHero
          badge="CURRENT AFFAIRS MONTH"
          title="Current Affairs Not Found"
          text="This month does not have any published current affairs PDFs yet."
          backLabel="Back to Library"
          onBack={() =>
            navigate("/ctet-tet/current-affairs")
          }
          primaryLabel="Back to Library →"
          secondaryLabel="View Pricing"
          onPrimary={() =>
            navigate("/ctet-tet/current-affairs")
          }
          onSecondary={() =>
            navigate("/ctet-tet/pricing")
          }
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
            onAction={() =>
              navigate(
                "/ctet-tet/current-affairs"
              )
            }
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
        onBack={() =>
          navigate("/ctet-tet/current-affairs")
        }
        primaryLabel="Start Revision →"
        secondaryLabel="PDF Library"
        stats={[
          {
            label: "Weeks",
            value: weekGroups.length,
          },
          {
            label: "PDFs",
            value:
              getCurrentAffairsPdfCount(
                monthItems
              ),
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
              Open each resource inside the verified
              AspireNest viewer. Direct routes and
              protected sources re-check READ access.
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
              user={user}
              isAdmin={isAdmin}
              hasPlanAccess={hasPlanAccess}
              accessState={accessState}
              onOpenPdf={
                openCurrentAffairsViewer
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
