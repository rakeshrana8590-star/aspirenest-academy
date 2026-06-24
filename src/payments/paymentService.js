import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function markPaymentReviewRequired(paymentId, reason = "UTR or amount mismatch") {
  if (!paymentId) throw new Error("Payment id is required");
  await updateDoc(doc(db, "payments", paymentId), {
    status: "review_required",
    reviewRequired: true,
    reviewReason: reason,
    reviewedAt: new Date(),
  });
}

export async function rejectPaymentRequest(paymentId) {
  if (!paymentId) throw new Error("Payment id is required");
  await updateDoc(doc(db, "payments", paymentId), {
    status: "rejected",
    rejectedAt: new Date(),
  });
}


export async function saveAdminPaymentVerification(paymentId, verification = {}) {
  if (!paymentId) throw new Error("Payment id is required");
  const isVerified = verification.verificationStatus === "verified";
  await updateDoc(doc(db, "payments", paymentId), {
    adminProof: verification.adminProof || "",
    studentUtr: verification.studentUtr || "",
    adminUtr: verification.adminUtr || "",
    utrMatch: Boolean(verification.utrMatch),
    amountMatch: Boolean(verification.amountMatch),
    duplicateUtr: Boolean(verification.duplicateUtr),
    verificationStatus: verification.verificationStatus || "review_required",
    reviewReason: verification.reviewReason || "Verification failed",
    matchStatus: isVerified ? "auto_verified" : "review_required",
    status: isVerified ? "student_proof_submitted" : "review_required",
    verifiedAt: isVerified ? new Date() : null,
    reviewedAt: new Date(),
  });
}