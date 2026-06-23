import React from "react";

import {
  canAccessCurrentAffairsPlan,
  getCurrentAffairsPdfUrl,
} from "../shared/currentAffairsUtils";

export function StudentCurrentAffairsMonthCard({ month, onOpen }) {
  const planCount = Array.isArray(month.planTypes) ? month.planTypes.length : 0;

  return (
    <button
      type="button"
      className="studentCaPlanCard"
      onClick={() => onOpen(month)}
      aria-label={`Open ${month.title} current affairs`}
    >
      <div className="studentCaPlanCardTop">
        <span className="studentCaPlanIcon">{month.cover || "📰"}</span>
        <span className="studentCaPlanPill">MONTH</span>
      </div>

      <h3>{month.title}</h3>

      <p>
        Open weekly and monthly CTET/TET current affairs PDFs for quick
        revision.
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

export function StudentCurrentAffairsPdfCard({
  item,
  isAdmin = false,
  hasPlanAccess,
  onOpen,
}) {
  const planName = item.planType || "FREE";
  const pdfUrl = getCurrentAffairsPdfUrl(item);

  const locked =
    !isAdmin &&
    !canAccessCurrentAffairsPlan({
      planName,
      hasPlanAccess,
      accessOptions: {
        module: "currentAffairs",
        itemType: "currentAffairsPdf",
        itemId: item.id,
      },
    });

  return (
    <button
      type="button"
      className={`studentCaPdfCard ${locked ? "isLocked" : ""}`}
      onClick={() => onOpen(item)}
      aria-label={
        locked
          ? `Unlock ${item.title}`
          : `Open ${item.title} current affairs PDF`
      }
    >
      <div className="studentCaPdfTop">
        <span className="studentCaPdfIcon">{locked ? "🔒" : "📄"}</span>

        <div className="studentCaPdfBadges">
          <span>{planName}</span>
          <span>{item.week || item.chapter || "Monthly PDFs"}</span>
        </div>
      </div>

      <h3>{item.title}</h3>

      <p>
        {item.month || "Current Affairs"} •{" "}
        {item.week || item.chapter || "Monthly PDFs"}
      </p>

      <div className="studentCaPdfMeta">
        <div>
          <span>Status</span>
          <strong>{locked ? "Plan Locked" : "Access Ready"}</strong>
        </div>

        <div>
          <span>Source</span>
          <strong>{pdfUrl ? "PDF Ready" : "Pending"}</strong>
        </div>
      </div>

      <div className="studentCaPdfFooter">
        <span>{locked ? "Premium access required" : "Access ready"}</span>
        <strong className="studentCaPdfOpenPill">
          {locked ? "View Plan →" : "Open PDF →"}
        </strong>
      </div>
    </button>
  );
}

export function StudentCurrentAffairsWeekBlock({
  weekGroup,
  isAdmin = false,
  hasPlanAccess,
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
          {weekGroup.pdfCount} PDF{weekGroup.pdfCount === 1 ? "" : "s"}
        </strong>
      </div>

      <div className="studentCaPdfGrid">
        {(weekGroup.items || []).map((item) => (
          <StudentCurrentAffairsPdfCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            hasPlanAccess={hasPlanAccess}
            onOpen={onOpenPdf}
          />
        ))}
      </div>
    </div>
  );
}