import React from "react";
import { useNavigate } from "react-router-dom";

import "./myAccessRoute.css";

const EMPTY_SUMMARY = Object.freeze({
  total: 0,
  active: 0,
  pending: 0,
  expired: 0,
  blocked: 0,
  plan: 0,
  module: 0,
  bundle: 0,
  item: 0,
});

const STATUS_LABELS = Object.freeze({
  active: "Active",
  pending: "Pending",
  expired: "Expired",
  blocked: "Blocked",
});

const SCOPE_MARKS = Object.freeze({
  plan: "P",
  module: "M",
  bundle: "B",
  item: "I",
});

const cleanString = (value = "") =>
  String(value ?? "").trim();

const isSafeInternalRoute = (route = "") => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

const toDate = (value) => {
  if (!value) return null;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);

  return Number.isFinite(parsed.getTime())
    ? parsed
    : null;
};

const formatAccessDate = (value) => {
  const date = toDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusLabel = (status = "") =>
  STATUS_LABELS[cleanString(status).toLowerCase()] ||
  "Pending";

const getPlanMeta = (plan = {}) => {
  if (!plan) return [];

  const meta = [];

  if (cleanString(plan.planCode)) {
    meta.push(plan.planCode);
  }

  if (
    plan.accessRank !== null &&
    plan.accessRank !== undefined
  ) {
    meta.push(`Access rank ${plan.accessRank}`);
  }

  if (plan.noExpiry === true) {
    meta.push("No expiry");
  } else if (plan.untilManualChange === true) {
    meta.push("Until manually changed");
  } else {
    const expiry = formatAccessDate(plan.accessUntil);

    if (expiry) {
      meta.push(`Valid until ${expiry}`);
    }
  }

  return meta;
};

const getRecordMeta = (item = {}) => {
  const meta = [
    cleanString(item.scopeLabel),
    cleanString(item.moduleLabel),
    cleanString(item.planLabel),
  ].filter(Boolean);

  if (
    item.noExpiry === true ||
    item.untilManualChange === true
  ) {
    meta.push(cleanString(item.validityLabel));
  } else {
    const expiry = formatAccessDate(item.accessUntil);

    if (expiry) {
      meta.push(`Until ${expiry}`);
    } else if (cleanString(item.validityLabel)) {
      meta.push(item.validityLabel);
    }
  }

  return [...new Set(meta)];
};

const SummaryCard = ({
  value = 0,
  label = "",
  tone = "default",
}) => (
  <article
    className={`myAccessSummaryCard myAccessSummaryCard--${tone}`}
  >
    <strong>{Number(value) || 0}</strong>
    <span>{label}</span>
  </article>
);

const AccessRecordCard = ({ item = {} }) => {
  const status =
    cleanString(item.status).toLowerCase() ||
    "pending";
  const meta = getRecordMeta(item);

  return (
    <article
      className="myAccessRecordCard"
      data-access-status={status}
    >
      <div className="myAccessRecordTop">
        <span
          className="myAccessScopeMark"
          aria-hidden="true"
        >
          {SCOPE_MARKS[item.scopeType] || "A"}
        </span>

        <div className="myAccessRecordHeading">
          <span>{item.scopeLabel || "Learning Access"}</span>
          <h3>{item.title || "AspireNest Access"}</h3>
        </div>

        <span
          className={`myAccessStatus myAccessStatus--${status}`}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      {meta.length > 0 ? (
        <div className="myAccessMetaRow">
          {meta.map((entry) => (
            <span key={entry}>{entry}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
};

const AccessSection = ({ section = {} }) => {
  const items = Array.isArray(section.items)
    ? section.items
    : [];

  if (items.length === 0) return null;

  return (
    <section
      className="myAccessSection"
      aria-labelledby={`my-access-${section.id}`}
    >
      <div className="myAccessSectionHeader">
        <div>
          <span>ACCESS SCOPE</span>
          <h2 id={`my-access-${section.id}`}>
            {section.title || "Access"}
          </h2>
        </div>

        <strong>{items.length}</strong>
      </div>

      <div className="myAccessRecordGrid">
        {items.map((item) => (
          <AccessRecordCard
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </section>
  );
};

export default function MyAccessRoute({
  user = null,
  myAccess = null,
}) {
  const navigate = useNavigate();
  const model = myAccess || {};
  const summary = model.summary || EMPTY_SUMMARY;
  const sections = Array.isArray(model.sections)
    ? model.sections
    : [];
  const actions = Array.isArray(model.actions)
    ? model.actions.filter((action) =>
        isSafeInternalRoute(action?.route)
      )
    : [];
  const canShowAccessDetails =
    model.canShowAccessDetails === true;
  const isFailClosed =
    model.isFailClosed === true;
  const mode =
    cleanString(model.mode).toLowerCase() ||
    (user ? "error" : "guest");
  const plan = canShowAccessDetails
    ? model.primaryPlan
    : null;
  const planMeta = getPlanMeta(plan);
  const email = cleanString(user?.email);

  return (
    <main
      className="myAccessPage"
      data-access-mode={mode}
      data-access-fail-closed={
        isFailClosed ? "true" : "false"
      }
    >
      <section className="myAccessHero">
        <div className="myAccessHeroCopy">
          <span className="myAccessEyebrow">
            ASPIRENEST ACCESS CENTER
          </span>

          <h1>My Access</h1>

          <p>
            Review every active plan, module, bundle, and
            individual learning item connected to your account.
          </p>

          <div className="myAccessIdentityRow">
            <span>{model.roleLabel || "Student"}</span>
            <strong>
              {model.accessLabel || "Access unavailable"}
            </strong>
            {email ? <small>{email}</small> : null}
          </div>
        </div>

        <article className="myAccessPlanCard">
          <span className="myAccessPlanCardLabel">
            PRIMARY ACCESS
          </span>

          {plan ? (
            <>
              <div className="myAccessPlanBadge">
                {plan.isCustomPlan ? "CUSTOM" : "PLAN"}
              </div>

              <h2>{plan.label || "Learning Access"}</h2>

              {planMeta.length > 0 ? (
                <div className="myAccessPlanMeta">
                  {planMeta.map((entry) => (
                    <span key={entry}>{entry}</span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="myAccessPlanBadge">
                {isFailClosed ? "CHECK" : "FREE"}
              </div>

              <h2>
                {model.accessLabel ||
                  "Access details unavailable"}
              </h2>

              <p>
                {isFailClosed
                  ? "Protected access remains locked until verification is available."
                  : "Redeem a key or choose a plan to unlock learning access."}
              </p>
            </>
          )}
        </article>
      </section>

      <section
        className="myAccessSummary"
        aria-label="Access summary"
      >
        <SummaryCard
          value={summary.total}
          label="Total access"
        />
        <SummaryCard
          value={summary.active}
          label="Active"
          tone="active"
        />
        <SummaryCard
          value={summary.module}
          label="Modules"
        />
        <SummaryCard
          value={
            (Number(summary.bundle) || 0) +
            (Number(summary.item) || 0)
          }
          label="Bundles & items"
        />
        <SummaryCard
          value={
            (Number(summary.expired) || 0) +
            (Number(summary.blocked) || 0)
          }
          label="Needs review"
          tone="review"
        />
      </section>

      {model.isVerificationUnavailable ? (
        <section
          className="myAccessNotice myAccessNotice--warning"
          role="status"
        >
          <strong>
            Access verification is temporarily unavailable.
          </strong>
          <p>
            Paid and partial-access details are hidden until the
            check completes successfully.
          </p>
        </section>
      ) : null}

      {!model.isVerificationUnavailable &&
      cleanString(model.emptyState) ? (
        <section
          className="myAccessNotice"
          role="status"
        >
          <strong>No access records to display</strong>
          <p>{model.emptyState}</p>
        </section>
      ) : null}

      {canShowAccessDetails ? (
        <div className="myAccessSections">
          {sections.map((section) => (
            <AccessSection
              key={section.id}
              section={section}
            />
          ))}
        </div>
      ) : null}

      <section
        className="myAccessActions"
        aria-label="My Access actions"
      >
        <div>
          <span>NEXT ACTION</span>
          <h2>Continue your AspireNest journey</h2>
        </div>

        <div className="myAccessActionButtons">
          {actions.map((action, index) => (
            <button
              type="button"
              key={action.id || action.route}
              className={
                index === 0
                  ? "myAccessPrimaryAction"
                  : "myAccessSecondaryAction"
              }
              onClick={() => navigate(action.route)}
            >
              {action.label || "Open"}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
