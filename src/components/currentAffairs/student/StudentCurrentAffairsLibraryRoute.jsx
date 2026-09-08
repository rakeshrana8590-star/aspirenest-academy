import React from "react";
import { useNavigate } from "react-router-dom";

import {
  canAccessCurrentAffairsPlan,
  getCurrentAffairsPdfUrl,
  getPublishedCurrentAffairs,
} from "../shared/currentAffairsUtils";

import "../../../styles/currentAffairs/studentCurrentAffairsAppleLibraryV2.css";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const normalize = (value = "") => String(value || "").trim().toLowerCase();
const itemId = (item = {}) => String(item.id || item.slug || item.title || "").trim();

const readSaved = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

export default function StudentCurrentAffairsLibraryRoute({
  universalContent = [],
  currentAffairsList = [],
  hasPlanAccess = () => false,
  isAdmin = false,
  user = null,
}) {
  const navigate = useNavigate();

  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [monthFilter, setMonthFilter] = React.useState("ALL");
  const [utilityFilter, setUtilityFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");

  const savedKey = React.useMemo(
    () => `aspirenest:current-affairs:saved:${user?.uid || user?.email || "guest"}`,
    [user?.uid, user?.email]
  );

  const [savedIds, setSavedIds] = React.useState(() => readSaved(savedKey));

  React.useEffect(() => {
    setSavedIds(readSaved(savedKey));
  }, [savedKey]);

  React.useEffect(() => {
    document.documentElement.classList.add("caAppleLibraryScrollRoot");
    document.body.classList.add("caAppleLibraryScrollBody");
    return () => {
      document.documentElement.classList.remove("caAppleLibraryScrollRoot");
      document.body.classList.remove("caAppleLibraryScrollBody");
    };
  }, []);

  React.useEffect(() => {
    setMonthFilter("ALL");
  }, [planFilter]);

  const publishedItems = React.useMemo(
    () => getPublishedCurrentAffairs(universalContent, currentAffairsList),
    [universalContent, currentAffairsList]
  );

  const getPlan = React.useCallback(
    (item) => String(item?.planType || "FREE").trim().toUpperCase(),
    []
  );

  const canOpen = React.useCallback(
    (item) => {
      const planName = getPlan(item);
      if (isAdmin || planName === "FREE") return true;

      return canAccessCurrentAffairsPlan({
        planName,
        hasPlanAccess,
        accessOptions: {
          module: "currentAffairs",
          itemType: "currentAffairsPdf",
          itemId: item?.id,
        },
      });
    },
    [getPlan, hasPlanAccess, isAdmin]
  );

  const planCounts = React.useMemo(() => {
    const counts = Object.fromEntries(PLAN_ORDER.map((plan) => [plan, 0]));
    publishedItems.forEach((item) => {
      const plan = getPlan(item);
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  }, [publishedItems, getPlan]);

  const planScoped = React.useMemo(
    () =>
      planFilter === "ALL"
        ? publishedItems
        : publishedItems.filter((item) => getPlan(item) === planFilter),
    [publishedItems, planFilter, getPlan]
  );

  const months = React.useMemo(() => {
    const map = new Map();
    planScoped.forEach((item) => {
      const name = String(item?.month || "Current Affairs").trim();
      const key = normalize(name);
      if (!map.has(key)) map.set(key, { key, name, count: 0 });
      map.get(key).count += 1;
    });
    return [...map.values()].sort((a, b) => b.name.localeCompare(a.name));
  }, [planScoped]);

  const monthScoped = React.useMemo(
    () =>
      monthFilter === "ALL"
        ? planScoped
        : planScoped.filter((item) => normalize(item?.month) === monthFilter),
    [planScoped, monthFilter]
  );

  const filteredItems = React.useMemo(() => {
    return monthScoped.filter((item) => {
      const id = itemId(item);
      if (utilityFilter === "access" && !canOpen(item)) return false;
      if (utilityFilter === "free" && getPlan(item) !== "FREE") return false;
      if (utilityFilter === "saved" && !savedIds.has(id)) return false;
      return true;
    });
  }, [monthScoped, utilityFilter, canOpen, getPlan, savedIds]);

  const planHasAccess = (plan) => {
    if (plan === "FREE" || isAdmin) return true;
    const candidates = publishedItems.filter((item) => getPlan(item) === plan);
    if (candidates.some((item) => canOpen(item))) return true;
    try {
      return Boolean(hasPlanAccess(plan, { module: "currentAffairs" }));
    } catch {
      return false;
    }
  };

  const toggleSaved = (item) => {
    const id = itemId(item);
    if (!id) return;
    const next = new Set(savedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSavedIds(next);
    try {
      window.localStorage.setItem(savedKey, JSON.stringify([...next]));
    } catch {
      // Device-local convenience only.
    }
  };

  const openItem = (item) => {
    const pdfUrl = getCurrentAffairsPdfUrl(item);

    if (!canOpen(item)) {
      navigate("/ctet-tet/pricing");
      return;
    }

    if (!pdfUrl) {
      alert("PDF URL missing in this current affair item.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="caAppleLibraryV2" data-view={view}>
      <div className="caAppleHeading">
        <div>
          <span className="caAppleEyebrow">CTET / TET CURRENT AFFAIRS</span>
          <h1>Current Affairs</h1>
          <p>
            Filter the published library by plan and month, then open the exact
            live PDF through the existing AspireNest access flow.
          </p>
        </div>

        <button
          type="button"
          className="caApplePrimaryAction"
          onClick={() => navigate("/my-profile")}
        >
          Open My Access
        </button>
      </div>

      <div className="caAppleFilters">
        <div className="caAppleFilterRow">
          <div className="caAppleFilterLabel">
            <strong>Plans</strong>
            <span>{publishedItems.length} resources</span>
          </div>

          <div className="caAppleScroller">
            <button
              type="button"
              className={`caAppleChip ${planFilter === "ALL" ? "active" : ""}`}
              onClick={() => setPlanFilter("ALL")}
            >
              <span>All Plans</span>
              <small>{publishedItems.length}</small>
            </button>

            {PLAN_ORDER.map((plan) => {
              const access = planHasAccess(plan);
              return (
                <button
                  type="button"
                  key={plan}
                  className={`caAppleChip caApplePlanChip ${
                    planFilter === plan ? "active" : ""
                  }`}
                  onClick={() => setPlanFilter(plan)}
                >
                  <span>{plan}</span>
                  <small>{planCounts[plan] || 0}</small>
                  <em className={access ? "hasAccess" : "lockedAccess"}>
                    {access ? "Access" : "Locked"}
                  </em>
                </button>
              );
            })}
          </div>
        </div>

        <div className="caAppleFilterRow">
          <div className="caAppleFilterLabel">
            <strong>Months</strong>
            <span>{months.length} months</span>
          </div>

          <div className="caAppleScroller">
            <button
              type="button"
              className={`caAppleChip ${monthFilter === "ALL" ? "active" : ""}`}
              onClick={() => setMonthFilter("ALL")}
            >
              All Months
            </button>

            {months.map((month) => (
              <button
                type="button"
                key={month.key}
                className={`caAppleChip ${monthFilter === month.key ? "active" : ""}`}
                onClick={() => setMonthFilter(month.key)}
              >
                <span>{month.name}</span>
                <small>{month.count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="caAppleFilterRow caAppleUtilityRow">
          <div className="caAppleScroller">
            {[
              ["all", "All Content"],
              ["access", "My Access"],
              ["free", "Free"],
              ["saved", "Saved"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`caAppleChip ${utilityFilter === id ? "active" : ""}`}
                onClick={() => setUtilityFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="caAppleUtilityRight">
            <div className="caAppleViewToggle" aria-label="Current affairs view">
              <button
                type="button"
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                aria-label="List view"
              >
                ☷
              </button>
              <button
                type="button"
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                ▦
              </button>
            </div>
            <div className="caAppleResultCount">
              <strong>{filteredItems.length}</strong>
              <span>resources</span>
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length ? (
        <div className="caAppleResourceGrid">
          {filteredItems.map((item) => {
            const id = itemId(item);
            const plan = getPlan(item);
            const access = canOpen(item);
            const saved = savedIds.has(id);
            const pdfReady = Boolean(getCurrentAffairsPdfUrl(item));

            return (
              <article className={`caAppleCard ${access ? "" : "isLocked"}`} key={id}>
                <button
                  type="button"
                  className="caAppleCardOpen"
                  onClick={() => openItem(item)}
                >
                  <div className="caAppleThumb">
                    <span className="caAppleTypeIcon">CA</span>
                    <span className={`caAppleState ${access ? "open" : "locked"}`}>
                      {access ? "Open" : "Locked"}
                    </span>
                  </div>

                  <div className="caAppleCardBody">
                    <div className="caAppleMeta">
                      <small>{item?.month || "Current Affairs"}</small>
                      <span>{plan}</span>
                    </div>
                    <h3>{item?.title || "Current Affairs PDF"}</h3>
                    <p>{item?.week || item?.chapter || (pdfReady ? "PDF Ready" : "PDF Pending")}</p>
                  </div>
                </button>

                <div className="caAppleCardFooter">
                  <small>{access ? (pdfReady ? "PDF Ready" : "PDF Pending") : "Locked • View Access"}</small>
                  <button
                    type="button"
                    className={`caAppleSave ${saved ? "saved" : ""}`}
                    onClick={() => toggleSaved(item)}
                    aria-label={saved ? "Remove saved current affair" : "Save current affair"}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="caAppleEmpty">
          <span>⌕</span>
          <h3>No current affairs match this filter</h3>
          <p>Choose All Plans, All Months, or All Content to return to the library.</p>
        </div>
      )}
    </section>
  );
}
