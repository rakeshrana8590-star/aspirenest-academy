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

export function hasAmountMatch(text, expectedAmount) {
  const proofText = String(text || "").replace(/,/g, " ");
  const amount = Number(String(expectedAmount || "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const matches = proofText.match(/d+(?:.d+)?/g) || [];
  return matches.some((item) => Math.abs(Number(item) - amount) < 0.01);
}

export function detectDuplicateUtr(payment = {}, allPayments = []) {
  const currentUtr = extractUtr(payment.studentProof || payment.adminProof || "");
  if (!currentUtr) return false;
  const matches = allPayments.filter((item) => {
    const itemUtr = extractUtr(item.studentProof || item.adminProof || "");
    return itemUtr && itemUtr === currentUtr && item.id !== payment.id;
  });
  return matches.length > 0;
}

export function comparePaymentProofs(payment = {}, adminProof = "", allPayments = []) {
  const studentProof = payment.studentProof || "";
  const studentUtr = extractUtr(studentProof);
  const adminUtr = extractUtr(adminProof);
  const utrMatch = Boolean(studentUtr && adminUtr && studentUtr === adminUtr);
  const amountMatch = hasAmountMatch(studentProof + " " + adminProof, payment.amount);
  const duplicateUtr = detectDuplicateUtr(payment, allPayments);
  const missingStudentProof = !String(studentProof || "").trim();
  const missingAdminProof = !String(adminProof || "").trim();
  let verificationStatus = "review_required";
  let reviewReason = "Verification failed";
  if (missingStudentProof) {
    reviewReason = "Student proof missing";
  } else if (missingAdminProof) {
    reviewReason = "Admin proof missing";
  } else if (!studentUtr || !adminUtr) {
    reviewReason = "UTR missing";
  } else if (!utrMatch) {
    reviewReason = "UTR mismatch";
  } else if (!amountMatch) {
    reviewReason = "Amount mismatch";
  } else if (duplicateUtr) {
    reviewReason = "Duplicate UTR detected";
  } else {
    verificationStatus = "verified";
    reviewReason = "Verified by UTR and amount match";
  }
  return {
    verificationStatus,
    reviewReason,
    studentProof,
    adminProof,
    studentUtr,
    adminUtr,
    utrMatch,
    amountMatch,
    duplicateUtr,
    isVerified: verificationStatus === "verified",
  };
}
