import React from "react";
import AdminButton from "./AdminButton";

function normalizeRow(row, index) {
  if (Array.isArray(row)) {
    return {
      label: row[0],
      value: row[1],
      tone: row[2] || "default",
      span: row[3] || "normal",
      key: row[0] || index,
    };
  }

  return {
    label: row?.label,
    value: row?.value,
    tone: row?.tone || "default",
    span: row?.span || "normal",
    key: row?.key || row?.label || index,
  };
}

export default function AdminReviewPanel({
  eyebrow = "Confirmation Preview",
  title = "Review payload",
  description = "",
  rows = [],
  highlights = [],
  actionLabel = "Confirm",
  loadingLabel = "Saving...",
  actionLoading = false,
  actionDisabled = false,
  onAction,
  secondaryActionLabel = "",
  onSecondaryAction,
  secondaryActionDisabled = false,
  footerNote = "",
  className = "",
}) {
  const safeRows = rows.map(normalizeRow);

  return (
    <section className={"adminReviewPanel " + className}>
      <div className="adminReviewPanelHeader">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
          {description ? <p>{description}</p> : null}
        </div>
      </div>

      {highlights.length ? (
        <div className="adminReviewHighlights">
          {highlights.map((item, index) => {
            const row = normalizeRow(item, index);
            return (
              <article className={"adminReviewHighlight adminReviewTone-" + row.tone} key={row.key}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </article>
            );
          })}
        </div>
      ) : null}

      <div className="adminReviewGrid">
        {safeRows.map((row) => (
          <div
            className={
              "adminReviewCell adminReviewTone-" +
              row.tone +
              (row.span === "wide" ? " adminReviewCellWide" : "")
            }
            key={row.key}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <div className="adminReviewFooter">
        {footerNote ? <p>{footerNote}</p> : <span />}
        <div className="adminReviewFooterActions">
          {onSecondaryAction ? (
            <AdminButton
              type="button"
              variant="secondary"
              onClick={onSecondaryAction}
              disabled={secondaryActionDisabled || actionLoading}
            >
              {secondaryActionLabel || "Edit"}
            </AdminButton>
          ) : null}

          {onAction ? (
            <AdminButton
              type="button"
              variant="primary"
              onClick={onAction}
              loading={actionLoading}
              disabled={actionDisabled}
            >
              {actionLoading ? loadingLabel : actionLabel}
            </AdminButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}
