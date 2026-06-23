import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { listStudentAccess, normalizeAccessEmail } from "../accessService";

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

export default function AdminAccessManageRoute() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedRecordId, setSelectedRecordId] = useState("");
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
        <div className="adminAccessFormGrid">
          <div className="adminAccessField adminAccessFieldWide">
            <label>Search by Registered Gmail</label>
            <input
              value={searchEmail}
              onChange={(event) => {
                setSearchEmail(event.target.value);
                setMessage("");
              }}
              placeholder="learner@gmail.com"
            />
            <small>Email is normalized before Firestore search.</small>
          </div>

          <div className="adminAccessField">
            <label>Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="adminAccessField">
            <label>Source</label>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              {sourceOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="adminAccessField">
            <label>Plan</label>
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
              {planOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="adminAccessField">
            <label>Scope</label>
            <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}>
              {scopeOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="adminAccessField">
            <label>Module</label>
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
              {moduleOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="adminAccessPreviewHeader">
          <span>Manage Controls</span>
          <strong>{loading ? "Loading..." : filteredRecords.length + " shown"}</strong>
        </div>

        <div className="adminAccessHeroActions">
          <button
            type="button"
            className="adminAccessPrimaryButton"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Access"}
          </button>

          <button
            type="button"
            className="adminAccessSecondaryButton"
            onClick={() => loadRecords(searchEmail.trim())}
            disabled={loading}
          >
            Refresh Records
          </button>

          <button
            type="button"
            className="adminAccessSecondaryButton"
            onClick={handleClear}
            disabled={loading}
          >
            Clear Filters
          </button>
        </div>

        {message ? (
          <div className="adminAccessNotice">{message}</div>
        ) : null}

        {error ? (
          <div className="adminAccessErrorBox">
            <strong>Load failed:</strong>
            <span>{error}</span>
          </div>
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
                  <span>
                    {getText(record.planType, "FREE")} • {getScopeLabel(record.scopeType)} • {effectiveStatus}
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

                  <button
                    type="button"
                    className="adminAccessSecondaryButton"
                    onClick={() => setSelectedRecordId(record.id)}
                  >
                    {isSelected ? "Selected" : "Select Record"}
                  </button>

                  <button
                    type="button"
                    className="adminAccessSecondaryButton"
                    onClick={() => openLearnerProfile(record)}
                  >
                    Open Profile
                  </button>

                  <button
                    type="button"
                    className="adminAccessSecondaryButton"
                    onClick={() => handleCopy(email, "Learner email")}
                  >
                    Copy Email
                  </button>

                  <button
                    type="button"
                    className="adminAccessSecondaryButton"
                    onClick={() => handleCopy(record.accessKeyId, "Access key ID")}
                  >
                    Copy Key
                  </button>
                </div>
              );
            })
          ) : (
            <div className="adminAccessRow">
              <strong>No access records loaded</strong>
              <span>Search Gmail, clear filters, or refresh records.</span>
            </div>
          )}
        </div>
      </div>

      {selectedRecord ? (
        <div className="adminAccessPreviewPanel">
          <div className="adminAccessPreviewHeader">
            <span>Selected Record Safety</span>
            <strong>Read-only locked</strong>
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

              <strong>Future Actions</strong>
              <span>Extend, change status, change plan, and soft revoke will require confirmation and audit in the next phase.</span>

              <button type="button" className="adminAccessSecondaryButton" disabled>
                Extend Locked
              </button>

              <button type="button" className="adminAccessSecondaryButton" disabled>
                Status Locked
              </button>

              <button type="button" className="adminAccessSecondaryButton" disabled>
                Revoke Locked
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminAccessRouteShell>
  );
}
