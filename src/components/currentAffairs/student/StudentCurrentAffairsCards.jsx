import React from "react";

import {
  canAccessCurrentAffairsPlan,
  getCurrentAffairsPdfUrl,
} from "../shared/currentAffairsUtils";

export function StudentCurrentAffairsMonthCard({ month, onOpen }) {
  return (
    <button
      type="button"
      className="studentCaMonthCard"
      onClick={() => onOpen(month)}
    >
      <div className="studentCaMonthTop">
        <span className="studentCaMonthIcon">{month.cover || "📰"}</span>

        <span className="studentCaMonthCount">
          {month.pdfCount} PDF{month.pdfCount === 1 ? "" : "s"}
        </span>
      </div>

      <h3>{month.title}</h3>

      <p>
        {month.count} item{month.count === 1 ? "" : "s"} •{" "}
        {month.latestWeek || "Monthly PDFs"}
      </p>

      <div className="studentCaPlanPills">
        {(month.planTypes || []).slice(0, 4).map((plan) => (
          <span key={plan}>{plan}</span>
        ))}
      </div>

      <strong>Open month →</strong>
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
    });

  return (
    <button
      type="button"
      className={`studentCaPdfCard ${locked ? "isLocked" : ""}`}
      onClick={() => onOpen(item)}
    >
      <div className="studentCaPdfTop">
        <span className="studentCaPdfIcon">{locked ? "🔒" : "📄"}</span>
        <span className="studentCaPdfPlan">{planName}</span>
      </div>

      <h3>{item.title}</h3>

      <p>
        {item.month || "Current Affairs"} •{" "}
        {item.week || item.chapter || "Monthly PDFs"}
      </p>

      <div className="studentCaPdfMeta">
        <span>{pdfUrl ? "PDF Ready" : "PDF Missing"}</span>
        <span>{locked ? "Upgrade required" : "Open access"}</span>
      </div>

      <strong>{locked ? "View plan →" : "Open PDF →"}</strong>
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