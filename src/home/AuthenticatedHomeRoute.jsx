import React, {
  useMemo,
} from "react";

import {
  buildAuthenticatedHomeModel,
} from "./authenticatedHomeModel";

import "./authenticatedHomeRoute.css";

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

const formatHomeDate = (value) => {
  if (!value) return "";

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);

  if (!Number.isFinite(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getPlanMeta = (plan = null) => {
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
  } else if (
    plan.untilManualChange === true
  ) {
    meta.push("Until manually changed");
  } else {
    const expiry = formatHomeDate(
      plan.accessUntil
    );

    if (expiry) {
      meta.push(`Valid until ${expiry}`);
    }
  }

  return meta;
};

const HomeSummaryCard = ({
  value = 0,
  label = "",
}) => (
  <article className="authenticatedHomeSummaryCard">
    <strong>{Number(value) || 0}</strong>
    <span>{label}</span>
  </article>
);

const HomeDestinationCard = ({
  item = {},
  onOpen,
}) => (
  <article
    className={`authenticatedHomeDestination authenticatedHomeDestination--${
      item.tone || "default"
    }`}
    data-home-destination={item.id || ""}
  >
    <div className="authenticatedHomeDestinationTop">
      <span aria-hidden="true">
        {cleanString(item.label).slice(0, 1) ||
          "A"}
      </span>

      {Number(item.count) > 0 ? (
        <strong>{item.count}</strong>
      ) : null}
    </div>

    <h3>{item.label || "AspireNest Learning"}</h3>

    <p>
      {item.description ||
        "Open your AspireNest learning workspace."}
    </p>

    <button
      type="button"
      disabled={
        item.disabled === true ||
        !isSafeInternalRoute(item.route)
      }
      onClick={() => onOpen(item.route)}
    >
      <span>
        {item.disabled
          ? "Unavailable"
          : "Open"}
      </span>
      <b aria-hidden="true">→</b>
    </button>
  </article>
);

const HomeSection = ({
  section = {},
  onOpen,
}) => {
  const items = Array.isArray(section.items)
    ? section.items
    : [];

  if (items.length === 0) return null;

  return (
    <section
      className="authenticatedHomeSection"
      aria-labelledby={`home-section-${section.id}`}
    >
      <div className="authenticatedHomeSectionHeader">
        <div>
          <span>ASPIRENEST WORKSPACE</span>
          <h2 id={`home-section-${section.id}`}>
            {section.title || "Learning"}
          </h2>
        </div>

        <strong>{items.length}</strong>
      </div>

      <div className="authenticatedHomeDestinationGrid">
        {items.map((item) => (
          <HomeDestinationCard
            key={item.id}
            item={item}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
};

export default function AuthenticatedHomeRoute({
  user = null,
  shellState = null,
  myAccess = null,
  contentItems = [],
  roadmaps = [],
  mockResults = [],
  recentActivity = [],
  navigate = null,
}) {
  const model = useMemo(
    () =>
      buildAuthenticatedHomeModel({
        user,
        shellState:
          shellState || {},
        myAccess:
          myAccess || {},
        contentItems,
        roadmaps,
        mockResults,
        recentActivity,
      }),
    [
      user,
      shellState,
      myAccess,
      contentItems,
      roadmaps,
      mockResults,
      recentActivity,
    ]
  );

  const planMeta = getPlanMeta(
    model.primaryPlan
  );
  const continueCard =
    model.continueCard || {};
  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(
        continueCard.progressPercent
      ) || 0
    )
  );

  const handleOpen = (route = "") => {
    if (
      !isSafeInternalRoute(route) ||
      typeof navigate !== "function"
    ) {
      return;
    }

    navigate(route);
  };

  return (
    <main
      className="authenticatedHomePage"
      data-home-mode={model.mode}
      data-home-fail-closed={
        model.isFailClosed
          ? "true"
          : "false"
      }
    >
      <section className="authenticatedHomeHero">
        <div className="authenticatedHomeHeroCopy">
          <span className="authenticatedHomeEyebrow">
            ASPIRENEST LEARNING HOME
          </span>

          <h1>
            Welcome back,{" "}
            <em>{model.userLabel}</em>
          </h1>

          <p>
            Continue your preparation, discover
            published learning resources, and manage
            your access from one intelligent workspace.
          </p>

          <div className="authenticatedHomeIdentity">
            <span>{model.roleLabel}</span>
            <strong>{model.accessLabel}</strong>
          </div>
        </div>

        <article className="authenticatedHomePlanCard">
          <span>PRIMARY ACCESS</span>

          {model.primaryPlan ? (
            <>
              <b>
                {model.primaryPlan.isCustomPlan
                  ? "CUSTOM PLAN"
                  : "LEARNING PLAN"}
              </b>
              <h2>
                {model.primaryPlan.label}
              </h2>

              {planMeta.length > 0 ? (
                <div className="authenticatedHomePlanMeta">
                  {planMeta.map((item) => (
                    <small key={item}>
                      {item}
                    </small>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <b>
                {model.isFailClosed
                  ? "CHECKING"
                  : "LEARNING ACCESS"}
              </b>
              <h2>{model.accessLabel}</h2>
              <p>
                {model.isFailClosed
                  ? "Protected personalization is hidden until access verification is available."
                  : "Use My Access to review plans, modules, bundles, and individual learning items."}
              </p>
            </>
          )}
        </article>
      </section>

      {model.isFailClosed ? (
        <section
          className="authenticatedHomeNotice authenticatedHomeNotice--warning"
          role="status"
        >
          <strong>
            Access verification is temporarily unavailable.
          </strong>
          <p>{model.emptyState}</p>
        </section>
      ) : null}

      {model.recoveryAction ? (
        <section
          className="authenticatedHomeNotice authenticatedHomeNotice--recovery"
          role="status"
        >
          <div>
            <strong>
              Access review required
            </strong>
            <p>
              {model.recoveryAction.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              handleOpen(
                model.recoveryAction.route
              )
            }
          >
            Open My Access
          </button>
        </section>
      ) : null}

      <section className="authenticatedHomeContinue">
        <div className="authenticatedHomeContinueCopy">
          <span>CONTINUE LEARNING</span>
          <h2>
            {continueCard.label ||
              "Open Learning Hub"}
          </h2>
          <p>
            {continueCard.description ||
              "Start your next AspireNest learning activity."}
          </p>

          {continueCard.source ? (
            <small>
              Source:{" "}
              {String(
                continueCard.source
              ).replace(/-/g, " ")}
            </small>
          ) : null}
        </div>

        <div className="authenticatedHomeContinueAction">
          <div className="authenticatedHomeProgressRing">
            <strong>{progress}%</strong>
            <span>Progress</span>
          </div>

          <button
            type="button"
            disabled={
              continueCard.disabled === true ||
              !isSafeInternalRoute(
                continueCard.route
              )
            }
            onClick={() =>
              handleOpen(
                continueCard.route
              )
            }
          >
            {continueCard.actionLabel ||
              (continueCard.disabled
                ? "Unavailable"
                : "Continue")}
            <b aria-hidden="true">→</b>
          </button>
        </div>
      </section>

      <section
        className="authenticatedHomeSummary"
        aria-label="Learning summary"
      >
        <HomeSummaryCard
          value={
            model.summary
              .publishedLearningItems
          }
          label="Published learning"
        />
        <HomeSummaryCard
          value={
            model.summary
              .searchableDestinations
          }
          label="Search destinations"
        />
        <HomeSummaryCard
          value={
            model.summary
              .activeAccessRecords
          }
          label="Active access"
        />
        <HomeSummaryCard
          value={
            model.summary.activeModules
          }
          label="Active modules"
        />
        <HomeSummaryCard
          value={
            model.summary.mockAttempts
          }
          label="Mock attempts"
        />
      </section>

      <div className="authenticatedHomeSections">
        {model.sections.map((section) => (
          <HomeSection
            key={section.id}
            section={section}
            onOpen={handleOpen}
          />
        ))}
      </div>

      <section className="authenticatedHomeFooterPanel">
        <div>
          <span>ONE APP • ONE SYSTEM</span>
          <h2>
            Your learning journey now starts
            from Home.
          </h2>
        </div>

        <p>
          Search discovers published learning,
          My Access explains entitlements, and
          existing module gates continue to verify
          protected content.
        </p>
      </section>
    </main>
  );
}
