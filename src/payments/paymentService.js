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
