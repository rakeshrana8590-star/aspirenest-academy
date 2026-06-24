export function getMs(value) {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function formatDate(value) {
  const ms = getMs(value);
  if (!ms) return "Recently";
  return new Date(ms).toLocaleString();
}

export function extractUtr(text) {
  return String(text || "").match(/d{6,}/)?.[0] || "";
}

export function statusLabel(status) {
  const map = {
    pending_payment: "Pending Payment",
    student_proof_submitted: "Proof Submitted",
    review_required: "Review Required",
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[status] || status || "Unknown";
}

export function getIdentity(payment = {}) {
  return payment.studentEmail || payment.email || payment.studentName || "Student";
}
