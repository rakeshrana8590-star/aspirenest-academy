import React from "react";

const TONE_MAP = {
  active: "success",
  published: "success",
  approved: "success",
  used: "success",
  success: "success",
  draft: "warning",
  pending: "warning",
  warning: "warning",
  inactive: "neutral",
  archived: "neutral",
  expired: "neutral",
  neutral: "neutral",
  revoked: "danger",
  rejected: "danger",
  failed: "danger",
  danger: "danger",
  redeem: "info",
  key: "info",
  info: "info",
};

export default function AdminStatusPill({
  status = "neutral",
  label,
  tone,
  size = "md",
  className = "",
}) {
  const key = String(status || "neutral").toLowerCase();
  const finalTone = tone || TONE_MAP[key] || "neutral";

  const classes = [
    "adminStatusPill",
    "adminStatusPill--" + finalTone,
    "adminStatusPill--" + size,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{label || status || "Status"}</span>;
}
