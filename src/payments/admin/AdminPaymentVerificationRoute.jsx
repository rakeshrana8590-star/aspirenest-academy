import React, { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  AdminButton,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminErrorBox,
  AdminFilterBar,
  AdminFilterField,
  AdminSectionHeader,
  AdminStatusPill,
} from "../../components/shared/admin";
import { extractUtr, formatDate, getIdentity, getMs, statusLabel } from "../paymentUtils";
import "../../styles/payments/adminPaymentVerification.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All Requests" },
  { value: "student_proof_submitted", label: "Proof Submitted" },
  { value: "review_required", label: "Review Required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "pending_payment", label: "Pending Payment" },
];

export default function AdminPaymentVerificationRoute({
  paymentRequests = [],
  loadPaymentRequests,
  approvePaymentRequest,
}) {
  const [statusFilter, setStatusFilter] = useState("student_proof_submitted");
  const [showRecentOnly, setShowRecentOnly] = useState(true);
  const [adminProofs, setAdminProofs] = useState({});
  const [routeError, setRouteError] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const safePayments = Array.isArray(paymentRequests) ? paymentRequests : [];

  const filteredPayments = useMemo(() => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return safePayments
      .filter((payment) => {
        if (statusFilter !== "all" && payment.status !== statusFilter) return false;
        if (!showRecentOnly) return true;
        const createdMs = getMs(payment.createdAt);
        return createdMs && Date.now() - createdMs < threeDays;
      })
      .sort((a, b) => getMs(b.createdAt) - getMs(a.createdAt));
  }, [safePayments, statusFilter, showRecentOnly]);

  const stats = useMemo(() => {
    return safePayments.reduce((acc, payment) => {
      acc.total += 1;
      acc[payment.status || "unknown"] = (acc[payment.status || "unknown"] || 0) + 1;
      return acc;
    }, { total: 0 });
  }, [safePayments]);

  async function markReviewRequired(payment) {
    if (!payment?.id) return;
    try {
      setLoadingId(payment.id);
      setRouteError("");
      await updateDoc(doc(db, "payments", payment.id), {
        status: "review_required",
        reviewRequired: true,
        reviewReason: "UTR or amount mismatch",
        reviewedAt: new Date(),
      });
      await loadPaymentRequests?.();
    } catch (error) {
      setRouteError(error?.message || "Payment review update failed.");
    } finally {
      setLoadingId("");
    }
  }

  function openRejectConfirm(payment) {
    setConfirmAction({
      type: "reject",
      payment,
      title: "Reject payment request?",
      message: "This will mark the payment request as rejected.",
    });
  }

  async function confirmRejectPayment() {
    const payment = confirmAction?.payment;
    if (!payment?.id) return;
    try {
      setLoadingId(payment.id);
      setRouteError("");
      await updateDoc(doc(db, "payments", payment.id), {
        status: "rejected",
        rejectedAt: new Date(),
      });
      await loadPaymentRequests?.();
      setConfirmAction(null);
    } catch (error) {
      setRouteError(error?.message || "Payment reject failed.");
    } finally {
      setLoadingId("");
    }
  }

  async function approvePayment(payment) {
    if (!payment?.id) return;
    try {
      setLoadingId(payment.id);
      setRouteError("");
      await approvePaymentRequest?.(payment);
    } catch (error) {
      setRouteError(error?.message || "Payment approval failed.");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <section className="adminPaymentRoute">
      <AdminSectionHeader
        eyebrow="PAYMENT VERIFICATION"
        title="Admin Payment Verification"
        description="Review UPI proof, verify UTR and amount, approve requests, and sync learner access from Content Studio."
        rightSlot={
          <AdminButton variant="primary" size="sm" onClick={() => loadPaymentRequests?.()}>
            Refresh Requests
          </AdminButton>
        }
      />

      <div className="adminPaymentKpiGrid">
        <div><span>Total</span><strong>{stats.total || 0}</strong></div>
        <div><span>Proof Submitted</span><strong>{stats.student_proof_submitted || 0}</strong></div>
        <div><span>Review</span><strong>{stats.review_required || 0}</strong></div>
        <div><span>Approved</span><strong>{stats.approved || 0}</strong></div>
      </div>

      {routeError ? <AdminErrorBox title="Payment action failed" message={routeError} /> : null}

      <AdminFilterBar
        eyebrow="Verification Queue"
        title="Payment Controls"
        description="Recent queue default hai. Audit ke liye all history open kar sakte ho."
        rightSlot={<AdminStatusPill status="info" label={showRecentOnly ? "Recent 3 Days" : "All History"} />}
      >
        <AdminFilterField label="Status">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </AdminFilterField>

        <AdminFilterField label="History View">
          <button type="button" className="adminPaymentToggleBtn" onClick={() => setShowRecentOnly((value) => !value)}>
            {showRecentOnly ? "Showing Recent Only" : "Showing All History"}
          </button>
        </AdminFilterField>
      </AdminFilterBar>

      {filteredPayments.length ? (
        <div className="adminPaymentGrid">
          {filteredPayments.map((payment) => {
            const proof = payment.studentProof || "";
            const utr = extractUtr(proof);
            const adminProof = adminProofs[payment.id] || "";
            const busy = loadingId === payment.id;
            return (
              <article className="adminPaymentCard" key={payment.id}>
                <div className="adminPaymentCardHeader">
                  <div>
                    <span>{payment.orderId || "Order Pending"}</span>
                    <h3>{getIdentity(payment)}</h3>
                  </div>
                  <AdminStatusPill status={payment.status || "neutral"} label={statusLabel(payment.status)} />
                </div>

                <div className="adminPaymentMetaGrid">
                  <div><span>Amount</span><strong>₹{payment.amount || 0}</strong></div>
                  <div><span>Plan</span><strong>{payment.planName || payment.planType || "Premium Plan"}</strong></div>
                  <div><span>Created</span><strong>{formatDate(payment.createdAt)}</strong></div>
                  <div><span>Student UTR</span><strong>{utr || "Not found"}</strong></div>
                </div>

                <div className="adminPaymentProofBox">
                  <span>Student Proof</span>
                  <p>{proof || "No proof submitted yet."}</p>
                </div>

                {payment.status !== "approved" ? (
                  <label className="adminPaymentProofInput">
                    <span>Admin Received Message / UTR</span>
                    <textarea
                      value={adminProof}
                      onChange={(event) => setAdminProofs((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                      placeholder="Admin received payment message / UTR paste karo"
                      rows="3"
                    />
                  </label>
                ) : null}

                <div className="adminPaymentActions">
                  {payment.status === "approved" ? (
                    <AdminStatusPill status="approved" label="Premium Activated" />
                  ) : (
                    <>
                      <AdminButton variant="primary" size="sm" loading={busy} onClick={() => approvePayment(payment)}>Approve Payment</AdminButton>
                      <AdminButton variant="secondary" size="sm" disabled={busy} onClick={() => markReviewRequired(payment)}>Mark Review</AdminButton>
                      <AdminButton variant="danger" size="sm" disabled={busy} onClick={() => openRejectConfirm(payment)}>Reject</AdminButton>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState
          icon="💳"
          eyebrow="Payment Queue"
          title="No payment requests found"
          description="Filter change karo, all history open karo, ya refresh requests run karo."
          actionLabel="Refresh Requests"
          onAction={() => loadPaymentRequests?.()}
        />
      )}

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title || "Confirm payment action"}
        message={confirmAction?.message || "Please confirm before continuing."}
        confirmLabel="Reject Payment"
        tone="danger"
        loading={Boolean(confirmAction?.payment?.id && loadingId === confirmAction.payment.id)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmRejectPayment}
      />
    </section>
  );
}
