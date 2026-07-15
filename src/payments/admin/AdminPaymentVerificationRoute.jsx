import React, {
  useMemo,
  useState,
} from "react";

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

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "../../access/accessPlanCatalog";

import {
  comparePaymentProofs,
  extractUtr,
  formatDate,
  getIdentity,
  getMs,
  statusLabel,
} from "../paymentUtils";

import {
  markPaymentReviewRequired,
  rejectPaymentRequest,
  saveAdminPaymentVerification,
} from "../paymentService";

import "../../styles/payments/adminPaymentVerification.css";

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Requests",
  },
  {
    value:
      "student_proof_submitted",
    label: "Proof Submitted",
  },
  {
    value: "review_required",
    label: "Review Required",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "pending_payment",
    label: "Pending Payment",
  },
];

const createEmptyApprovalTerms = () => ({
  mode: "",
  accessFrom: "",
  accessUntil: "",
  validityDays: "",
});

const buildAdminSelection = (
  terms = {}
) => {
  if (!terms.mode) {
    throw new Error(
      "Select an access duration before approval."
    );
  }

  const selection = {
    accessFrom:
      terms.accessFrom || null,
  };

  if (
    terms.mode ===
    ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
  ) {
    if (!terms.accessUntil) {
      throw new Error(
        "Access-until date is required for a custom window."
      );
    }

    selection.accessUntil =
      terms.accessUntil;
  } else if (
    terms.mode ===
    "VALIDITY_DAYS"
  ) {
    const days = Number(
      terms.validityDays
    );

    if (
      !Number.isInteger(days) ||
      days <= 0
    ) {
      throw new Error(
        "Validity days must be a positive whole number."
      );
    }

    selection.validityDays = days;
  } else if (
    terms.mode ===
    ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
  ) {
    selection.noExpiry = true;
  } else if (
    terms.mode ===
    ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
  ) {
    selection.untilManualChange =
      true;
  } else {
    throw new Error(
      "Select a valid access duration."
    );
  }

  return selection;
};

export default function AdminPaymentVerificationRoute({
  paymentRequests = [],
  loadPaymentRequests,
  approvePaymentRequest,
}) {
  const [statusFilter, setStatusFilter] =
    useState(
      "student_proof_submitted"
    );
  const [showRecentOnly, setShowRecentOnly] =
    useState(true);
  const [adminProofs, setAdminProofs] =
    useState({});
  const [approvalTerms, setApprovalTerms] =
    useState({});
  const [routeError, setRouteError] =
    useState("");
  const [loadingId, setLoadingId] =
    useState("");
  const [confirmAction, setConfirmAction] =
    useState(null);

  const safePayments = Array.isArray(
    paymentRequests
  )
    ? paymentRequests
    : [];

  const filteredPayments = useMemo(() => {
    const threeDays =
      3 * 24 * 60 * 60 * 1000;

    return safePayments
      .filter((payment) => {
        if (
          statusFilter !== "all" &&
          payment.status !==
            statusFilter
        ) {
          return false;
        }

        if (!showRecentOnly) {
          return true;
        }

        const createdMs = getMs(
          payment.createdAt
        );

        return (
          createdMs &&
          Date.now() - createdMs <
            threeDays
        );
      })
      .sort(
        (first, second) =>
          getMs(second.createdAt) -
          getMs(first.createdAt)
      );
  }, [
    safePayments,
    statusFilter,
    showRecentOnly,
  ]);

  const stats = useMemo(
    () =>
      safePayments.reduce(
        (summary, payment) => {
          summary.total += 1;
          const status =
            payment.status ||
            "unknown";
          summary[status] =
            (summary[status] || 0) +
            1;
          return summary;
        },
        { total: 0 }
      ),
    [safePayments]
  );

  const updateApprovalTerm = (
    paymentId,
    field,
    value
  ) => {
    setApprovalTerms((current) => ({
      ...current,
      [paymentId]: {
        ...createEmptyApprovalTerms(),
        ...(current[paymentId] || {}),
        [field]: value,
      },
    }));
    setRouteError("");
  };

  async function markReviewRequired(
    payment
  ) {
    if (!payment?.id) {
      return;
    }

    try {
      setLoadingId(payment.id);
      setRouteError("");
      await markPaymentReviewRequired(
        payment.id,
        "UTR or amount mismatch"
      );
      await loadPaymentRequests?.();
    } catch (error) {
      setRouteError(
        error?.message ||
          "Payment review update failed."
      );
    } finally {
      setLoadingId("");
    }
  }

  function openRejectConfirm(
    payment
  ) {
    setConfirmAction({
      type: "reject",
      payment,
      title:
        "Reject payment request?",
      message:
        "This will mark the payment request as rejected.",
    });
  }

  async function confirmRejectPayment() {
    const payment =
      confirmAction?.payment;

    if (!payment?.id) {
      return;
    }

    try {
      setLoadingId(payment.id);
      setRouteError("");
      await rejectPaymentRequest(
        payment.id
      );
      await loadPaymentRequests?.();
      setConfirmAction(null);
    } catch (error) {
      setRouteError(
        error?.message ||
          "Payment reject failed."
      );
    } finally {
      setLoadingId("");
    }
  }

  async function approvePayment(
    payment
  ) {
    if (!payment?.id) {
      return;
    }

    const adminProof =
      adminProofs[payment.id] ||
      payment.adminProof ||
      "";
    const verification =
      comparePaymentProofs(
        payment,
        adminProof,
        safePayments
      );

    try {
      setLoadingId(payment.id);
      setRouteError("");

      await saveAdminPaymentVerification(
        payment.id,
        verification
      );

      if (!verification.isVerified) {
        await loadPaymentRequests?.();
        alert(
          "Payment moved to review: " +
            verification.reviewReason
        );
        return;
      }

      const adminSelection =
        buildAdminSelection(
          approvalTerms[payment.id] ||
            {}
        );

      await approvePaymentRequest?.(
        {
          ...payment,
          ...verification,
          adminProof,
        },
        adminSelection
      );
    } catch (error) {
      setRouteError(
        error?.message ||
          "Payment approval failed."
      );
    } finally {
      setLoadingId("");
    }
  }

  return (
    <section className="adminPaymentRoute">
      <AdminSectionHeader
        eyebrow="PAYMENT VERIFICATION"
        title="Admin Payment Verification"
        description="Verify UPI proof, select the exact access validity, and provision the purchased catalog plan through the central Access Engine."
        rightSlot={
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() =>
              loadPaymentRequests?.()
            }
          >
            Refresh Requests
          </AdminButton>
        }
      />

      <div className="adminPaymentKpiGrid">
        <div>
          <span>Total</span>
          <strong>
            {stats.total || 0}
          </strong>
        </div>
        <div>
          <span>Proof Submitted</span>
          <strong>
            {stats.student_proof_submitted ||
              0}
          </strong>
        </div>
        <div>
          <span>Review</span>
          <strong>
            {stats.review_required || 0}
          </strong>
        </div>
        <div>
          <span>Approved</span>
          <strong>
            {stats.approved || 0}
          </strong>
        </div>
      </div>

      {routeError ? (
        <AdminErrorBox
          title="Payment action failed"
          message={routeError}
        />
      ) : null}

      <AdminFilterBar
        eyebrow="Verification Queue"
        title="Payment Controls"
        description="Recent queue default hai. Audit ke liye all history open kar sakte ho."
        rightSlot={
          <AdminStatusPill
            status="info"
            label={
              showRecentOnly
                ? "Recent 3 Days"
                : "All History"
            }
          />
        }
      >
        <AdminFilterField label="Status">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </AdminFilterField>

        <AdminFilterField label="History View">
          <button
            type="button"
            className="adminPaymentToggleBtn"
            onClick={() =>
              setShowRecentOnly(
                (value) => !value
              )
            }
          >
            {showRecentOnly
              ? "Showing Recent Only"
              : "Showing All History"}
          </button>
        </AdminFilterField>
      </AdminFilterBar>

      {filteredPayments.length ? (
        <div className="adminPaymentGrid">
          {filteredPayments.map(
            (payment) => {
              const proof =
                payment.studentProof ||
                "";
              const utr = extractUtr(
                proof
              );
              const adminProof =
                adminProofs[
                  payment.id
                ] ||
                payment.adminProof ||
                "";
              const busy =
                loadingId ===
                payment.id;
              const verificationPreview =
                adminProof
                  ? comparePaymentProofs(
                      payment,
                      adminProof,
                      safePayments
                    )
                  : null;
              const isApproved =
                payment.status ===
                  "approved" ||
                payment.accessEngineSynced ===
                  true;
              const isRejected =
                payment.status ===
                "rejected";
              const isLocked =
                isApproved || isRejected;
              const needsAdminProof =
                !adminProof.trim();
              const terms = {
                ...createEmptyApprovalTerms(),
                ...(approvalTerms[
                  payment.id
                ] || {}),
              };
              const allowNoExpiry =
                payment.productSnapshot
                  ?.allowNoExpiry ===
                true;
              const hasSnapshot =
                Boolean(
                  payment.productSnapshot &&
                    payment.productId &&
                    (
                      payment.planCode ||
                      payment.planType
                    )
                );

              return (
                <article
                  className="adminPaymentCard"
                  key={payment.id}
                >
                  <div className="adminPaymentCardHeader">
                    <div>
                      <span>
                        {payment.orderId ||
                          "Order Pending"}
                      </span>
                      <h3>
                        {getIdentity(
                          payment
                        )}
                      </h3>
                    </div>
                    <AdminStatusPill
                      status={
                        payment.status ||
                        "neutral"
                      }
                      label={statusLabel(
                        payment.status
                      )}
                    />
                  </div>

                  <div className="adminPaymentMetaGrid">
                    <div>
                      <span>Amount</span>
                      <strong>
                        ₹
                        {payment.amount ||
                          0}
                      </strong>
                    </div>
                    <div>
                      <span>Plan</span>
                      <strong>
                        {payment.planName ||
                          payment.planCode ||
                          payment.planType ||
                          "Catalog plan missing"}
                      </strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong>
                        {formatDate(
                          payment.createdAt
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>
                        Student UTR
                      </span>
                      <strong>
                        {utr ||
                          "Not found"}
                      </strong>
                    </div>
                    <div>
                      <span>Product ID</span>
                      <strong>
                        {payment.productId ||
                          "Missing"}
                      </strong>
                    </div>
                    <div>
                      <span>Access Rank</span>
                      <strong>
                        {payment.accessRank ??
                          "Missing"}
                      </strong>
                    </div>
                  </div>

                  {!hasSnapshot ? (
                    <div className="adminPaymentReviewBox warning">
                      <strong>
                        Legacy payment record
                      </strong>
                      <p>
                        Product snapshot is missing.
                        Approval remains fail-closed;
                        review or migrate this record
                        before provisioning access.
                      </p>
                    </div>
                  ) : null}

                  <div className="adminPaymentProofBox">
                    <span>Student Proof</span>
                    <p>
                      {proof ||
                        "No proof submitted yet."}
                    </p>
                  </div>

                  {!isLocked ? (
                    <label className="adminPaymentProofInput">
                      <span>
                        Admin Received Message / UTR
                      </span>
                      <textarea
                        value={adminProof}
                        onChange={(event) =>
                          setAdminProofs(
                            (previous) => ({
                              ...previous,
                              [payment.id]:
                                event.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Admin received payment message / UTR paste karo"
                        rows="3"
                      />
                    </label>
                  ) : null}

                  {!isLocked &&
                  hasSnapshot ? (
                    <div className="adminPaymentValidityBox">
                      <div className="adminPaymentValidityHeader">
                        <div>
                          <span>
                            ACCESS VALIDITY
                          </span>
                          <strong>
                            Admin selection required
                          </strong>
                        </div>
                        <small>
                          No silent 6-month or
                          365-day fallback
                        </small>
                      </div>

                      <div className="adminPaymentValidityGrid">
                        <label>
                          <span>
                            Duration Mode
                          </span>
                          <select
                            value={
                              terms.mode
                            }
                            onChange={(
                              event
                            ) =>
                              updateApprovalTerm(
                                payment.id,
                                "mode",
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select duration
                            </option>
                            <option
                              value={
                                ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
                              }
                            >
                              Custom end date
                            </option>
                            <option value="VALIDITY_DAYS">
                              Validity days
                            </option>
                            <option
                              value={
                                ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
                              }
                              disabled={
                                !allowNoExpiry
                              }
                            >
                              No expiry
                              {allowNoExpiry
                                ? ""
                                : " (not allowed)"}
                            </option>
                            <option
                              value={
                                ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
                              }
                            >
                              Until manual change
                            </option>
                          </select>
                        </label>

                        <label>
                          <span>
                            Access From
                          </span>
                          <input
                            type="date"
                            value={
                              terms.accessFrom
                            }
                            onChange={(
                              event
                            ) =>
                              updateApprovalTerm(
                                payment.id,
                                "accessFrom",
                                event.target
                                  .value
                              )
                            }
                          />
                        </label>

                        {terms.mode ===
                        ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW ? (
                          <label>
                            <span>
                              Access Until
                            </span>
                            <input
                              type="date"
                              value={
                                terms.accessUntil
                              }
                              onChange={(
                                event
                              ) =>
                                updateApprovalTerm(
                                  payment.id,
                                  "accessUntil",
                                  event.target
                                    .value
                                )
                              }
                            />
                          </label>
                        ) : null}

                        {terms.mode ===
                        "VALIDITY_DAYS" ? (
                          <label>
                            <span>
                              Validity Days
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                terms.validityDays
                              }
                              onChange={(
                                event
                              ) =>
                                updateApprovalTerm(
                                  payment.id,
                                  "validityDays",
                                  event.target
                                    .value
                                )
                              }
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {verificationPreview ||
                  payment.reviewReason ||
                  payment.duplicateUtr ||
                  payment.verificationStatus ? (
                    <div
                      className={
                        verificationPreview
                          ?.isVerified
                          ? "adminPaymentReviewBox success"
                          : "adminPaymentReviewBox warning"
                      }
                    >
                      <strong>
                        {verificationPreview
                          ?.isVerified
                          ? "Verification Ready"
                          : "Verification Review"}
                      </strong>
                      <p>
                        {verificationPreview
                          ?.reviewReason ||
                          payment.reviewReason ||
                          payment.verificationStatus ||
                          "Proof details saved for audit."}
                      </p>
                      <div className="adminPaymentReviewChips">
                        <span>
                          {verificationPreview
                            ?.utrMatch ||
                          payment.utrMatch
                            ? "UTR Match"
                            : "UTR Pending"}
                        </span>
                        <span>
                          {verificationPreview
                            ?.amountMatch ||
                          payment.amountMatch
                            ? "Amount Match"
                            : "Amount Pending"}
                        </span>
                        {verificationPreview
                          ?.duplicateUtr ||
                        payment.duplicateUtr ? (
                          <span className="danger">
                            Duplicate UTR
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="adminPaymentActions">
                    {isApproved ? (
                      <AdminStatusPill
                        status="approved"
                        label={
                          payment.accessEngineSynced
                            ? "Access Synced"
                            : "Access Activated"
                        }
                      />
                    ) : isRejected ? (
                      <AdminStatusPill
                        status="rejected"
                        label="Rejected"
                      />
                    ) : (
                      <>
                        <AdminButton
                          variant="primary"
                          size="sm"
                          loading={busy}
                          disabled={
                            busy ||
                            needsAdminProof ||
                            !hasSnapshot ||
                            !terms.mode
                          }
                          onClick={() =>
                            approvePayment(
                              payment
                            )
                          }
                        >
                          {!hasSnapshot
                            ? "Snapshot Required"
                            : needsAdminProof
                              ? "Paste Admin Proof First"
                              : !terms.mode
                                ? "Select Validity First"
                                : "Verify & Approve"}
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            markReviewRequired(
                              payment
                            )
                          }
                        >
                          Mark Review
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            openRejectConfirm(
                              payment
                            )
                          }
                        >
                          Reject
                        </AdminButton>
                      </>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <AdminEmptyState
          icon="💳"
          eyebrow="Payment Queue"
          title="No payment requests found"
          description="Filter change karo, all history open karo, ya refresh requests run karo."
          actionLabel="Refresh Requests"
          onAction={() =>
            loadPaymentRequests?.()
          }
        />
      )}

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.title ||
          "Confirm payment action"
        }
        message={
          confirmAction?.message ||
          "Please confirm before continuing."
        }
        confirmLabel="Reject Payment"
        tone="danger"
        loading={Boolean(
          confirmAction?.payment?.id &&
            loadingId ===
              confirmAction.payment.id
        )}
        onCancel={() =>
          setConfirmAction(null)
        }
        onConfirm={
          confirmRejectPayment
        }
      />
    </section>
  );
}
