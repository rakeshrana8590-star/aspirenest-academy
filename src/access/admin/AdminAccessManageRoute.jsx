import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { addAccessNote, extendAccess, listStudentAccess, normalizeAccessEmail, restoreAccess, revokeAccess, updateAccessStatus, upgradeAccess } from "../accessService";
import {
  ACCESS_PLAN_LEVELS,
  ACCESS_SCOPE_TYPES,
} from "../accessConstants";
import { AdminButton, AdminConfirmDialog, AdminEmptyState, AdminErrorBox, AdminFilterBar, AdminFilterField, AdminPortalActionMenu, AdminStatusPill } from "../../components/shared/admin";
import "../../styles/shared/adminSystem.css";

const actions = [
  { icon: "S", label: "Search", title: "Find Learner", description: "Search by registered email and review exact entitlement.", route: "/admin/content/access/manage", tone: "orange" },
  { icon: "F", label: "Filter", title: "Scope Filters", description: "Filter by status, source, plan, scope, and module.", route: "/admin/content/access/manage", tone: "blue" },
  { icon: "R", label: "Review", title: "Selected Record", description: "Select a record before any future write action.", route: "/admin/content/access/manage", tone: "green" },
  { icon: "A", label: "Audit", title: "Audit Safe", description: "Future writes will require confirmation and audit logging.", route: "/admin/content/access/audit", tone: "purple" },
];

const statusOptions = ["all", "active", "pending", "expired", "blocked"];
const sourceOptions = ["all", "redeem_key", "admin_manual", "bulk_import", "payment", "trial", "manual"];
const planOptions = ["all", "FREE", "BASIC", "PREMIUM", "MENTORSHIP"];
const scopeOptions = ["all", "plan", "module", "item", "bundle"];
const moduleOptions = ["all", "mock_test", "notes", "video", "current_affairs", "roadmap"];

const getPlanLevel = (planType = "FREE") =>
  ACCESS_PLAN_LEVELS[
    String(planType || "FREE")
      .trim()
      .toUpperCase()
  ] || 0;

const isPlanScopeRecord = (record = {}) =>
  String(
    record.scopeType ||
      ACCESS_SCOPE_TYPES.PLAN
  )
    .trim()
    .toLowerCase() ===
  ACCESS_SCOPE_TYPES.PLAN;

const lockedActionConfigs = {
  extend: {
    title: "Extend Access",
    message: "This will update the selected access expiry date and create an audit log.",
    requiresText: "EXTEND",
    tone: "warning",
  },
  shorten: {
    title: "Shorten Validity",
    message: "This will shorten the selected access expiry date and create an audit log.",
    requiresText: "SHORTEN",
    tone: "warning",
  },
  status: {
    title: "Status Change",
    message: "This will update the selected access status and create an audit log.",
    requiresText: "STATUS",
    tone: "info",
  },
  revoke: {
    title: "Revoke Access",
    message: "This will block the selected access record and create an audit log. This does not delete the learner record.",
    requiresText: "REVOKE",
    tone: "danger",
  },
  expire: {
    title: "Expire Access",
    message: "This will immediately mark the selected access record as expired and create an audit log.",
    requiresText: "EXPIRE",
    tone: "danger",
  },
  unblock: {
    title: "Unblock Learner",
    message: "This will restore only the selected blocked/revoked grant after a mandatory reason and create a before/after audit log.",
    requiresText: "UNBLOCK",
    tone: "info",
  },
  note: {
    title: "Add Admin Note",
    message: "This will save an admin note on the selected access record and create an audit log.",
    requiresText: "NOTE",
    tone: "info",
  },
  plan: {
    title: "Plan Change",
    message: "This PLAN-only action can upgrade the selected plan and set status to ACTIVE. ITEM, MODULE, and BUNDLE records cannot be converted into plans.",
    requiresText: "PLAN",
    tone: "info",
  },
};

const getDateObject = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value.toDate) {
    return value.toDate();
  }

  if (value.seconds) {
    return new Date(value.seconds * 1000);
  }

  return null;
};

const formatDateValue = (value, fallback = "Not set") => {
  const dateValue = getDateObject(value);

  if (dateValue) {
    return dateValue.toLocaleDateString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
};

const formatDateTimeValue = (value, fallback = "Not available") => {
  const dateValue = getDateObject(value);

  if (dateValue) {
    return dateValue.toLocaleString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
};

const getText = (value, fallback = "Not set") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const normalizeFilterValue = (value) => String(value || "").trim().toLowerCase();

const getEffectiveStatus = (record = {}) => {
  const status = normalizeFilterValue(record.status || "active");

  if (status === "blocked") return "blocked";
  if (status === "pending") return "pending";
  if (status === "expired") return "expired";

  const untilDate = getDateObject(record.accessUntil);

  if (untilDate) {
    const endDate = new Date(untilDate);
    endDate.setHours(23, 59, 59, 999);

    if (endDate.getTime() < Date.now()) {
      return "expired";
    }
  }

  return status || "active";
};

const getSourceLabel = (source) => {
  const value = normalizeFilterValue(source);

  if (value === "redeem_key") return "Access Key Redeem";
  if (value === "admin_manual") return "Admin Manual";
  if (value === "bulk_import") return "Bulk Import";
  if (value === "payment") return "Payment";
  if (value === "trial") return "Trial";
  if (value === "manual") return "Manual";

  return source || "Not available";
};

const getScopeLabel = (scopeType) => {
  const value = normalizeFilterValue(scopeType || "plan");

  if (value === "plan") return "Plan Access";
  if (value === "module") return "Module Access";
  if (value === "item") return "Item Access";
  if (value === "bundle") return "Bundle Access";

  return scopeType || "Plan Access";
};

const getLearnerEmail = (record = {}) =>
  record.email || record.normalizedEmail || record.learnerEmail || record.userEmail || "";

export default function AdminAccessManageRoute({ user = null, isAdmin = () => false } = {}) {
  const navigate = useNavigate();

  const adminActor = useMemo(() => ({
    uid: user?.uid || null,
    email: user?.email || "",
    isAdmin: typeof isAdmin === "function" ? isAdmin(user) : Boolean(isAdmin),
    role: "admin",
  }), [user, isAdmin]);

  const [records, setRecords] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [accessActionMenu, setAccessActionMenu] = useState({
    open: false,
    anchorRect: null,
    recordId: "",
  });
  const [lockedActionConfirm, setLockedActionConfirm] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    requiresText: "",
    tone: "warning",
  });
  const [lockedActionResult, setLockedActionResult] = useState("");
  const [actionDraft, setActionDraft] = useState({
    accessUntil: "",
    status: "active",
    note: "",
    planType: "FREE",
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedEmail = useMemo(
    () => normalizeAccessEmail(searchEmail),
    [searchEmail]
  );

  const loadRecords = async (emailValue = searchEmail) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await listStudentAccess({
        maxCount: 100,
        email: emailValue,
      });

      setRecords(Array.isArray(data) ? data : []);
      setSelectedRecordId("");

      if (!data || !data.length) {
        setMessage("No student access record found for current search.");
      }
    } catch (loadError) {
      setRecords([]);
      setSelectedRecordId("");
      setError(loadError && loadError.message ? loadError.message : "Student access load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords("");
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const effectiveStatus = getEffectiveStatus(record);
      const source = normalizeFilterValue(record.source || "manual");
      const plan = normalizeFilterValue(record.planType || "FREE");
      const scope = normalizeFilterValue(record.scopeType || "plan");
      const moduleName = normalizeFilterValue(record.module || record.moduleType || "");

      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
      if (sourceFilter !== "all" && source !== normalizeFilterValue(sourceFilter)) return false;
      if (planFilter !== "all" && plan !== normalizeFilterValue(planFilter)) return false;
      if (scopeFilter !== "all" && scope !== normalizeFilterValue(scopeFilter)) return false;
      if (moduleFilter !== "all" && moduleName !== normalizeFilterValue(moduleFilter)) return false;

      return true;
    });
  }, [records, statusFilter, sourceFilter, planFilter, scopeFilter, moduleFilter]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) || null,
    [records, selectedRecordId]
  );

  const closeLockedActionConfirm = () => {
    setLockedActionConfirm({
      open: false,
      type: "",
      title: "",
      message: "",
      requiresText: "",
      tone: "warning",
    });
  };

  const openLockedActionConfirm = (type) => {
    const config = lockedActionConfigs[type];

    if (!adminActor.isAdmin || !adminActor.email) {
      setAccessActionMenu({ open: false, anchorRect: null, recordId: "" });
      setMessage("Admin actor is not ready for access actions.");
      return;
    }
    setLockedActionResult("");
    setActionDraft({
      accessUntil: "",
      status: getEffectiveStatus(selectedRecord || {}) || "active",
      note: "",
      planType: selectedRecord?.planType || "FREE",
    });

    if (!selectedRecord || !config) {
      setMessage("Select an access record before opening a locked action.");
      return;
    }

    setAccessActionMenu({
      open: false,
      anchorRect: null,
      recordId: "",
    });

    setLockedActionConfirm({
      open: true,
      type,
      ...config,
    });
  };

  const handleLockedActionConfirm = async () => {
    if (lockedActionConfirm.type === "extend") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before extending access.");
        return;
      }

      if (!actionDraft.accessUntil) {
        setMessage("Select new access expiry date before confirming extend.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write an extension reason before confirming extend.");
        return;
      }

      setActionSubmitting(true);

      try {
        await extendAccess(selectedRecord.id, actionDraft.accessUntil, adminActor, {
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Extend Access completed. Access expiry updated to " +
          actionDraft.accessUntil +
          " and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Extend access failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "status") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before changing status.");
        return;
      }

      if (!actionDraft.status) {
        setMessage("Select new access status before confirming status change.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write a status-change reason before confirming.");
        return;
      }

      setActionSubmitting(true);

      try {
        await updateAccessStatus(selectedRecord.id, actionDraft.status, adminActor, {
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Status Change completed. Access status updated to " +
          actionDraft.status +
          " and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Status change failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "revoke") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before revoking access.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write revoke note before confirming revoke.");
        return;
      }

      setActionSubmitting(true);

      try {
        await revokeAccess(selectedRecord.id, adminActor, {
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Revoke Access completed. Access status updated to blocked and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Revoke access failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "plan") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before changing plan.");
        return;
      }

      if (!isPlanScopeRecord(selectedRecord)) {
        setMessage(
          "Plan change is allowed only for PLAN access records. ITEM, MODULE, and BUNDLE grants remain isolated."
        );
        return;
      }

      if (!actionDraft.planType) {
        setMessage("Select new access plan before confirming plan change.");
        return;
      }

      if (
        getPlanLevel(actionDraft.planType) <
        getPlanLevel(selectedRecord.planType)
      ) {
        setMessage(
          "Plan downgrade is blocked in this screen. Use a separately approved correction workflow."
        );
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write a plan-change reason before confirming.");
        return;
      }

      setActionSubmitting(true);

      try {
        await upgradeAccess(selectedRecord.id, actionDraft.planType, adminActor, {
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Plan Change completed. Access plan updated to " +
          actionDraft.planType +
          " and audit log created. Status set to active.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Plan change failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "shorten") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before shortening validity.");
        return;
      }

      if (!actionDraft.accessUntil) {
        setMessage("Select shortened access expiry date before confirming.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write a validity-change reason before confirming.");
        return;
      }

      setActionSubmitting(true);

      try {
        await extendAccess(selectedRecord.id, actionDraft.accessUntil, adminActor, {
          action: "shorten_access_validity",
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Shorten Validity completed. Access expiry updated to " +
          actionDraft.accessUntil +
          " and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Shorten validity failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "expire") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before expiring access.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write an expiry reason before confirming.");
        return;
      }

      setActionSubmitting(true);

      try {
        await updateAccessStatus(selectedRecord.id, "expired", adminActor, {
          action: "expire_access",
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Expire Access completed. Access status updated to expired and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Expire access failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "unblock") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before unblocking learner.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write a restore reason before unblocking learner access.");
        return;
      }

      setActionSubmitting(true);

      try {
        await restoreAccess(selectedRecord.id, adminActor, {
          action: "unblock_access",
          reason: actionDraft.note.trim(),
          note: actionDraft.note.trim(),
          source: "admin_access_manage",
        });
        const resultMessage =
          "Unblock Learner completed. Access status updated to active and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Unblock learner failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    if (lockedActionConfirm.type === "note") {
      if (!selectedRecord?.id) {
        setMessage("Select an access record before adding note.");
        return;
      }

      if (!actionDraft.note.trim()) {
        setMessage("Write admin note before confirming.");
        return;
      }

      setActionSubmitting(true);

      try {
        await addAccessNote(selectedRecord.id, actionDraft.note.trim(), adminActor, {
          source: "admin_access_manage",
        });
        const resultMessage =
          "Add Admin Note completed. Note saved and audit log created.";

        setMessage(resultMessage);
        setLockedActionResult(resultMessage);
        closeLockedActionConfirm();
        await loadRecords(normalizedEmail || searchEmail);
        setSelectedRecordId(selectedRecord.id);
      } catch (actionError) {
        const errorMessage =
          "Add note failed: " +
          (actionError?.message || "Unknown error.");
        setMessage(errorMessage);
        setLockedActionResult(errorMessage);
      } finally {
        setActionSubmitting(false);
      }

      return;
    }

    const draftParts = [];
    if (lockedActionConfirm.type === "status" && actionDraft.status) {
      draftParts.push("New status: " + actionDraft.status);
    }
    if (actionDraft.note) {
      draftParts.push("Note: " + actionDraft.note);
    }
    const draftText = draftParts.length ? " Draft: " + draftParts.join(" • ") + "." : "";
    const resultMessage =
      lockedActionConfirm.title +
      " confirmed as a safe placeholder. No access record was changed." +
      draftText;
    setMessage(resultMessage);
    setLockedActionResult(resultMessage);
    closeLockedActionConfirm();
  };

  const handleActionDraftChange = (field, value) => {
    setActionDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const stats = useMemo(() => {
    const activeCount = records.filter((record) => getEffectiveStatus(record) === "active").length;
    const redeemCount = records.filter((record) => normalizeFilterValue(record.source) === "redeem_key").length;
    const granularCount = records.filter((record) => {
      const scope = normalizeFilterValue(record.scopeType || "plan");
      return scope === "module" || scope === "item" || scope === "bundle";
    }).length;

    return [
      { value: String(records.length || 0), label: "Total Access" },
      { value: String(activeCount), label: "Active" },
      { value: String(redeemCount), label: "Redeem Key" },
      { value: String(granularCount), label: "Scope Access" },
    ];
  }, [records]);

  const handleSearch = () => {
    if (!normalizedEmail) {
      setMessage("Enter learner Gmail or clear search to load recent records.");
      return;
    }

    loadRecords(normalizedEmail);
  };

  const handleClear = () => {
    setSearchEmail("");
    setStatusFilter("all");
    setSourceFilter("all");
    setPlanFilter("all");
    setScopeFilter("all");
    setModuleFilter("all");
    loadRecords("");
  };

  const openLearnerProfile = (record) => {
    const email = getLearnerEmail(record) || normalizedEmail;

    if (!email) {
      setMessage("Select or search a learner email first.");
      return;
    }

    navigate("/admin/content/access/profile/" + encodeURIComponent(email));
  };

  const handleCopy = async (value, label) => {
    const text = String(value || "").trim();

    if (!text) {
      setMessage("Nothing to copy for " + label + ".");
      return;
    }

    try {
      await window.navigator.clipboard.writeText(text);
      setMessage(label + " copied.");
    } catch (copyError) {
      setMessage("Copy failed. Value: " + text);
    }
  };

  return (
    <AdminAccessRouteShell
      badge="MANAGE ACCESS"
      title="Manage Access"
      description="Search, filter, review, and safely prepare learner access actions from one central entitlement command center."
      icon="M"
      primaryAction={{ label: "Add Learner Access", route: "/admin/content/access/add" }}
      secondaryAction={{ label: "Audit Logs", route: "/admin/content/access/audit" }}
      sectionTitle="Scope-aware access manager"
      sectionDescription="Read-only phase: plan, module, item, bundle, source, key, validity, and selected-record safety are visible before write actions are connected."
      actions={actions}
      stats={stats}
    >
      <div className="adminAccessFormPanel">
        <AdminFilterBar
          eyebrow="Manage Controls"
          title="Search & Filter Access"
          description="Find learner entitlements by Gmail, status, source, plan, scope, and module without changing any access record."
          rightSlot={<strong>{loading ? "Loading..." : filteredRecords.length + " shown"}</strong>}
          footerSlot={
            <div className="adminAccessHeroActions adminAccessHeroActions--filterBar">
              <AdminButton
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                compactMode={true}
      >
                {loading ? "Searching..." : "Search Access"}
              </AdminButton>

              <AdminButton
                variant="secondary"
                onClick={() => loadRecords(searchEmail.trim())}
                disabled={loading}
              >
                Refresh Records
              </AdminButton>

              <AdminButton
                variant="secondary"
                onClick={handleClear}
                disabled={loading}
              >
                Clear Filters
              </AdminButton>
            </div>
          }
        >
          <AdminFilterField
            label="Search by Registered Gmail"
            hint="Email is normalized before Firestore search."
            className="adminAccessFieldWide"
          >
            <input
              value={searchEmail}
              onChange={(event) => {
                setSearchEmail(event.target.value);
                setMessage("");
              }}
              placeholder="learner@gmail.com"
            />
          </AdminFilterField>

          <AdminFilterField label="Status">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </AdminFilterField>

          <AdminFilterField label="Source">
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {sourceOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </AdminFilterField>

          <AdminFilterField label="Plan">
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
              {planOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </AdminFilterField>

          <AdminFilterField label="Scope">
            <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}>
              {scopeOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </AdminFilterField>

          <AdminFilterField label="Module">
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
              {moduleOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </AdminFilterField>
        </AdminFilterBar>

        {message ? (
          <div className="adminAccessNotice">{message}</div>
        ) : null}

        {error ? (
          <AdminErrorBox title="Load failed" message={error} />
        ) : null}
      </div>

      <div className="adminAccessPreviewPanel">
        <div className="adminAccessPreviewHeader">
          <span>Access Records</span>
          <strong>{filteredRecords.length} records</strong>
        </div>

        <div className="adminAccessRows">
          {filteredRecords.length ? (
            filteredRecords.map((record) => {
              const email = getLearnerEmail(record);
              const effectiveStatus = getEffectiveStatus(record);
              const isSelected = selectedRecordId === record.id;

              return (
                <div className="adminAccessRow" key={record.id}>
                  <strong>{email || record.uid || record.id}</strong>
                  <span className="adminAccessRecordMeta">
                    <span>{getText(record.planType, "FREE")} • {getScopeLabel(record.scopeType)}</span>
                    <AdminStatusPill status={effectiveStatus} label={effectiveStatus} size="sm" />
                  </span>

                  <strong>Source</strong>
                  <span>{getSourceLabel(record.source)}</span>

                  <strong>Access Key</strong>
                  <span>{getText(record.accessKeyId, "No key")}</span>

                  <strong>Product / Payment</strong>
                  <span>{getText(record.productId, "No product")} • {getText(record.paymentId, "No payment")}</span>

                  <strong>Module / Item</strong>
                  <span>
                    {getText(record.module || record.moduleType, "No module")} • {getText(record.itemType, "No item type")} • {getText(record.itemId, "No item")}
                  </span>

                  <strong>Item Title / Bundle</strong>
                  <span>{getText(record.itemTitle, "No title")} • {getText(record.bundleId, "No bundle")}</span>

                  <strong>Validity</strong>
                  <span>
                    {formatDateValue(record.accessFrom, "No start")} → {formatDateValue(record.accessUntil, "No expiry")}
                  </span>

                  <strong>Audit Info</strong>
                  <span>
                    {getText(record.adminNote || record.notes, "No note")} • {formatDateTimeValue(record.updatedAt || record.createdAt)}
                  </span>

                  <div className="adminAccessRowActions">
                    <AdminButton
                      variant={isSelected ? "primary" : "secondary"}
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      {isSelected ? "Selected" : "Select Record"}
                    </AdminButton>

                    <AdminButton
                      variant="secondary"
                      onClick={() => openLearnerProfile(record)}
                    >
                      Open Profile
                    </AdminButton>

                    <AdminButton
                      variant="secondary"
                      onClick={() => handleCopy(email, "Learner email")}
                    >
                      Copy Email
                    </AdminButton>

                    <AdminButton
                      variant="secondary"
                      onClick={() => handleCopy(record.accessKeyId, "Access key ID")}
                    >
                      Copy Key
                    </AdminButton>
                  </div>
                </div>
              );
            })
          ) : (
            <AdminEmptyState
              eyebrow="No access records"
              title="No access records loaded"
              description="Search Gmail, clear filters, or refresh records."
              icon="A"
            />
          )}
        </div>
      </div>

      {selectedRecord ? (
        <div className="adminAccessPreviewPanel">
          <div className="adminAccessPreviewHeader">
            <span>Selected Record Safety</span>
            <strong>All access actions live</strong>
          </div>

          <div className="adminAccessRows">
            <div className="adminAccessRow">
              <strong>Selected ID</strong>
              <span>{selectedRecord.id}</span>

              <strong>Learner</strong>
              <span>{getLearnerEmail(selectedRecord) || "No email"}</span>

              <strong>Scope</strong>
              <span>{getScopeLabel(selectedRecord.scopeType)}</span>

              <strong>Source / Key</strong>
              <span>{getSourceLabel(selectedRecord.source)} • {getText(selectedRecord.accessKeyId, "No key")}</span>

              <strong>Access Actions</strong>
              <span>Extend, status change, revoke, and plan change are live with audit logging.</span>

              {lockedActionResult ? (
                <div className="adminAccessLockedResult">{lockedActionResult}</div>
              ) : null}

              <AdminButton
                variant="secondary"
                onClick={(event) =>
                  setAccessActionMenu({
                    open: true,
                    anchorRect: event.currentTarget.getBoundingClientRect(),
                    recordId: selectedRecord.id,
                  })
                }
              >
                Open Access Actions
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={lockedActionConfirm.open}
        title={lockedActionConfirm.title || "Locked Action"}
        message={lockedActionConfirm.message || "This action is locked for the audited action phase."}
        confirmLabel={lockedActionConfirm.type === "extend" ? "Extend Access" : lockedActionConfirm.type === "shorten" ? "Shorten Validity" : lockedActionConfirm.type === "expire" ? "Expire Access" : lockedActionConfirm.type === "unblock" ? "Unblock Learner" : lockedActionConfirm.type === "note" ? "Add Note" : lockedActionConfirm.type === "status" ? "Update Status" : lockedActionConfirm.type === "revoke" ? "Revoke Access" : lockedActionConfirm.type === "plan" ? "Change Plan" : "Confirm Locked Check"}
        cancelLabel="Cancel"
        tone={lockedActionConfirm.tone}
        requiresText={lockedActionConfirm.requiresText}
        loading={actionSubmitting}
        onCancel={closeLockedActionConfirm}
        onConfirm={handleLockedActionConfirm}
      >
        <div className="adminAccessActionDraft">
          {lockedActionConfirm.type === "extend" || lockedActionConfirm.type === "shorten" ? (
            <label>
              <span>{lockedActionConfirm.type === "shorten" ? "Shortened expiry date" : "New access expiry date"}</span>
              <input
                type="date"
                value={actionDraft.accessUntil}
                onChange={(event) => handleActionDraftChange("accessUntil", event.target.value)}
              />
            </label>
          ) : null}

          {lockedActionConfirm.type === "status" ? (
            <label>
              <span>New access status</span>
              <select
                value={actionDraft.status}
                onChange={(event) => handleActionDraftChange("status", event.target.value)}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
              </select>
            </label>
          ) : null}

          {lockedActionConfirm.type === "plan" ? (
            <label>
              <span>New access plan</span>
              <select
                value={actionDraft.planType}
                onChange={(event) => handleActionDraftChange("planType", event.target.value)}
              >
                {[
                  "FREE",
                  "BASIC",
                  "PREMIUM",
                  "MENTORSHIP",
                ].map((planType) => (
                  <option
                    key={planType}
                    value={planType}
                    disabled={
                      getPlanLevel(planType) <
                      getPlanLevel(
                        selectedRecord?.planType
                      )
                    }
                  >
                    {planType}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {lockedActionConfirm.type === "plan" ? (
            <p>
              Only PLAN records can be changed here. Downgrades are blocked; ITEM, MODULE, and BUNDLE grants stay isolated.
            </p>
          ) : null}

          {lockedActionConfirm.type === "revoke" ? (
            <label>
              <span>Revoke note</span>
              <textarea
                value={actionDraft.note}
                onChange={(event) => handleActionDraftChange("note", event.target.value)}
                placeholder="Write reason for audit trail. Required before revoke."
                rows="3"
              />
            </label>
          ) : null}

          {lockedActionConfirm.type !== "revoke" ? (
            <label>
              <span>{lockedActionConfirm.type === "note" ? "Admin note" : "Action note"}</span>
              <textarea
                value={actionDraft.note}
                onChange={(event) => handleActionDraftChange("note", event.target.value)}
                placeholder="Action reason for audit trail. Lifecycle changes require a reason."
                rows="2"
              />
            </label>
          ) : null}

          <p>This action will update access and create an audit log.</p>
        </div>
      </AdminConfirmDialog>

      <AdminPortalActionMenu
        open={accessActionMenu.open}
        anchorRect={accessActionMenu.anchorRect}
        title="Access Actions"
        onClose={() =>
          setAccessActionMenu({
            open: false,
            anchorRect: null,
            recordId: "",
          })
        }
        actions={[
          {
            key: "extend-locked",
            label: "Extend Access",
            description: "Update expiry with audit log.",
            tone: "warning",
            onClick: () => openLockedActionConfirm("extend"),
          },
          {
            key: "shorten-validity",
            label: "Shorten Validity",
            description: "Shorten expiry with audit log.",
            tone: "warning",
            onClick: () => openLockedActionConfirm("shorten"),
          },
          {
            key: "status-locked",
            label: "Status Change",
            description: "Update status with audit log.",
            tone: "info",
            onClick: () => openLockedActionConfirm("status"),
          },
          {
            key: "expire-access",
            label: "Expire Access",
            description: "Mark expired with audit log.",
            tone: "danger",
            onClick: () => openLockedActionConfirm("expire"),
          },
          {
            key: "unblock-access",
            label: "Unblock Learner",
            description: "Set status active with audit log.",
            tone: "info",
            onClick: () => openLockedActionConfirm("unblock"),
          },
          {
            key: "add-note",
            label: "Add Note",
            description: "Save admin note with audit log.",
            tone: "info",
            onClick: () => openLockedActionConfirm("note"),
          },
          {
            key: "revoke-locked",
            label: "Revoke Access",
            description: "Block access with audit log.",
            tone: "danger",
            onClick: () => openLockedActionConfirm("revoke"),
          },
          isPlanScopeRecord(selectedRecord)
            ? {
                key: "plan-change",
                label: "Plan Change",
                description: "PLAN-only upgrade with audit log.",
                tone: "info",
                onClick: () =>
                  openLockedActionConfirm("plan"),
              }
            : null,
        ].filter(Boolean)}
      />
    </AdminAccessRouteShell>
  );
}
