import React from "react";

import {
  CURRENT_AFFAIRS_ACTIONS,
  CURRENT_AFFAIRS_REASON_CODES,
  buildCurrentAffairsAccessEvidence,
  buildCurrentAffairsActionDecision,
} from "../../../access/currentAffairsActionPolicy.js";
import {
  getCurrentAffairsPdfUrl,
  hasCurrentAffairsProtectedAsset,
} from "../shared/currentAffairsUtils";

export function StudentCurrentAffairsMonthCard({
  month,
  onOpen,
}) {
  const planCount = Array.isArray(month.planTypes)
    ? month.planTypes.length
    : 0;

  return (
    <button
      type="button"
      className="studentCaPlanCard"
      onClick={() => onOpen(month)}
      aria-label={`Open ${month.title} current affairs`}
    >
      <div className="studentCaPlanCardTop">
        <span className="studentCaPlanIcon">
          {month.cover || "📰"}
        </span>
        <span className="studentCaPlanPill">
          MONTH
        </span>
      </div>

      <h3>{month.title}</h3>

      <p>
        Open weekly and monthly CTET/TET current
        affairs PDFs for quick revision.
      </p>

      <div className="studentCaPlanStats">
        <div>
          <strong>{month.pdfCount || 0}</strong>
          <span>PDFs</span>
        </div>

        <div>
          <strong>{planCount}</strong>
          <span>Plans</span>
        </div>
      </div>

      <div className="studentCaPlanFooter">
        <span>Weekly PDF revision</span>
        <strong>Open →</strong>
      </div>
    </button>
  );
}

const getAccessLabel = (decision = {}) => {
  if (decision.allowed) return "Access Ready";

  if (
    decision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING
  ) {
    return "Verifying Access";
  }

  if (
    decision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR
  ) {
    return "Access Unavailable";
  }

  if (
    decision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.LOGIN_REQUIRED
  ) {
    return "Login Required";
  }

  return "Plan Locked";
};

export function StudentCurrentAffairsPdfCard({
  item,
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
  onOpen,
}) {
  const planName = item.planType || "FREE";
  const pdfUrl = getCurrentAffairsPdfUrl(item);
  const protectedAsset =
    hasCurrentAffairsProtectedAsset(item);

  const access = buildCurrentAffairsAccessEvidence({
    resource: item,
    user,
    isAdmin,
    hasPlanAccess,
    accessState,
  });

  const decision =
    buildCurrentAffairsActionDecision({
      action: CURRENT_AFFAIRS_ACTIONS.READ,
      resource: item,
      principal: {
        uid: user?.uid || "",
        email: user?.email || "",
        role: user?.role || "",
        isAuthenticated: Boolean(user),
        isAdmin,
      },
      access,
    });

  const locked = !decision.allowed;
  const accessLabel = getAccessLabel(decision);

  return (
    <button
      type="button"
      className={`studentCaPdfCard ${
        locked ? "isLocked" : ""
      }`}
      onClick={() => onOpen(item, decision)}
      aria-label={
        locked
          ? `${accessLabel}: ${item.title}`
          : `Open ${item.title} current affairs PDF`
      }
    >
      <div className="studentCaPdfTop">
        <span className="studentCaPdfIcon">
          {locked ? "🔒" : "📄"}
        </span>

        <div className="studentCaPdfBadges">
          <span>{planName}</span>
          <span>
            {item.week ||
              item.chapter ||
              "Monthly PDFs"}
          </span>
        </div>
      </div>

      <h3>{item.title}</h3>

      <p>
        {item.month || "Current Affairs"} •{" "}
        {item.week ||
          item.chapter ||
          "Monthly PDFs"}
      </p>

      <div className="studentCaPdfMeta">
        <div>
          <span>Status</span>
          <strong>{accessLabel}</strong>
        </div>

        <div>
          <span>Source</span>
          <strong>
            {protectedAsset
              ? "Protected PDF"
              : pdfUrl
                ? "PDF Ready"
                : "Pending"}
          </strong>
        </div>
      </div>

      <div className="studentCaPdfFooter">
        <span>
          {decision.allowed
            ? "Verified READ access"
            : accessLabel}
        </span>
        <strong className="studentCaPdfOpenPill">
          {decision.allowed
            ? "Open Viewer →"
            : decision.reason ===
                CURRENT_AFFAIRS_REASON_CODES
                  .LOGIN_REQUIRED
              ? "Login →"
              : "View Access →"}
        </strong>
      </div>
    </button>
  );
}

export function StudentCurrentAffairsWeekBlock({
  weekGroup,
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
  onOpenPdf,
}) {
  return (
    <div className="studentCaWeekBlock">
      <div className="studentCaWeekHeader">
        <div>
          <span>Weekly current affairs</span>
          <h2>{weekGroup.title}</h2>
        </div>

        <strong>
          {weekGroup.pdfCount} PDF
          {weekGroup.pdfCount === 1 ? "" : "s"}
        </strong>
      </div>

      <div className="studentCaPdfGrid">
        {(weekGroup.items || []).map((item) => (
          <StudentCurrentAffairsPdfCard
            key={item.id}
            item={item}
            user={user}
            isAdmin={isAdmin}
            hasPlanAccess={hasPlanAccess}
            accessState={accessState}
            onOpen={onOpenPdf}
          />
        ))}
      </div>
    </div>
  );
}
