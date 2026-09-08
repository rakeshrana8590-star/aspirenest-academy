import React from "react";
import { useNavigate } from "react-router-dom";

import {
  canAccessRoadmap,
  loadPublishedStudyRoadmaps,
} from "../../services/roadmapService";

import MyAspirePathRoute from "./student/MyAspirePathRoute.jsx";
import StudentRoadmapDetailRoute from "./student/StudentRoadmapDetailRoute.jsx";
import StudentRoadmapDayRoute from "./student/StudentRoadmapDayRoute.jsx";

import "../../styles/roadmaps/studentRoadmapAppleLibraryV2.css";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];
const normalize = (value = "") => String(value || "").trim().toLowerCase();

const readSaved = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

export const StudentRoadmapHub = ({
  user = null,
  userPlanType = "FREE",
  hasPlanAccess,
  isAdminUser = false,
}) => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [examFilter, setExamFilter] = React.useState("ALL");
  const [utilityFilter, setUtilityFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");

  const savedKey = React.useMemo(
    () => `aspirenest:roadmaps:saved:${user?.uid || user?.email || "guest"}`,
    [user?.uid, user?.email]
  );

  const [savedIds, setSavedIds] = React.useState(() => readSaved(savedKey));

  React.useEffect(() => {
    setSavedIds(readSaved(savedKey));
  }, [savedKey]);

  React.useEffect(() => {
    document.documentElement.classList.add("roadmapAppleLibraryScrollRoot");
    document.body.classList.add("roadmapAppleLibraryScrollBody");
    return () => {
      document.documentElement.classList.remove("roadmapAppleLibraryScrollRoot");
      document.body.classList.remove("roadmapAppleLibraryScrollBody");
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const loadRoadmaps = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const publishedRoadmaps = await loadPublishedStudyRoadmaps();
        if (mounted) setRoadmaps(Array.isArray(publishedRoadmaps) ? publishedRoadmaps : []);
      } catch (error) {
        console.error("Load student roadmaps error:", error);
        if (mounted) setLoadError("Unable to load AspirePath roadmaps right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRoadmaps();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    setExamFilter("ALL");
  }, [planFilter]);

  const getPlan = React.useCallback(
    (roadmap) => String(roadmap?.planType || "FREE").trim().toUpperCase(),
    []
  );

  const hasAccess = React.useCallback(
    (roadmap) =>
      canAccessRoadmap({
        roadmapPlanType: getPlan(roadmap),
        userPlanType,
        isAdmin: isAdminUser,
        hasPlanAccess,
        accessOptions: {
          module: "roadmap",
          itemType: "roadmap",
          itemId: roadmap?.id,
        },
      }),
    [getPlan, userPlanType, isAdminUser, hasPlanAccess]
  );

  const planCounts = React.useMemo(() => {
    const counts = Object.fromEntries(PLAN_ORDER.map((plan) => [plan, 0]));
    roadmaps.forEach((roadmap) => {
      const plan = getPlan(roadmap);
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  }, [roadmaps, getPlan]);

  const planScoped = React.useMemo(
    () =>
      planFilter === "ALL"
        ? roadmaps
        : roadmaps.filter((roadmap) => getPlan(roadmap) === planFilter),
    [roadmaps, planFilter, getPlan]
  );

  const exams = React.useMemo(() => {
    const map = new Map();
    planScoped.forEach((roadmap) => {
      const name = String(roadmap?.examType || roadmap?.course || "CTET/TET").trim();
      const key = normalize(name);
      if (!map.has(key)) map.set(key, { key, name, count: 0 });
      map.get(key).count += 1;
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [planScoped]);

  const examScoped = React.useMemo(
    () =>
      examFilter === "ALL"
        ? planScoped
        : planScoped.filter(
            (roadmap) =>
              normalize(roadmap?.examType || roadmap?.course || "CTET/TET") === examFilter
          ),
    [planScoped, examFilter]
  );

  const filteredRoadmaps = React.useMemo(() => {
    return examScoped.filter((roadmap) => {
      const id = String(roadmap?.id || "");
      if (utilityFilter === "access" && !hasAccess(roadmap)) return false;
      if (utilityFilter === "free" && getPlan(roadmap) !== "FREE") return false;
      if (utilityFilter === "saved" && !savedIds.has(id)) return false;
      return true;
    });
  }, [examScoped, utilityFilter, hasAccess, getPlan, savedIds]);

  const planHasAccess = (plan) => {
    if (plan === "FREE" || isAdminUser) return true;
    const candidates = roadmaps.filter((roadmap) => getPlan(roadmap) === plan);
    if (candidates.some((roadmap) => hasAccess(roadmap))) return true;
    try {
      return Boolean(hasPlanAccess?.(plan, { module: "roadmap" }));
    } catch {
      return false;
    }
  };

  const toggleSaved = (roadmap) => {
    const id = String(roadmap?.id || "");
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

  const openRoadmap = (roadmap) => {
    if (!hasAccess(roadmap)) {
      navigate("/ctet-tet/pricing");
      return;
    }
    navigate(`/ctet-tet/roadmaps/${roadmap.id}`);
  };

  return (
    <section className="roadmapAppleLibraryV2" data-view={view}>
      <div className="roadmapAppleHeading">
        <div>
          <span className="roadmapAppleEyebrow">ASPIREPATH</span>
          <h1>Roadmaps</h1>
          <p>
            Filter the published AspirePath library by plan and exam type, then
            continue inside the existing roadmap detail, day, task, and progress engine.
          </p>
        </div>

        <button
          type="button"
          className="roadmapApplePrimaryAction"
          onClick={() => navigate("/my-aspirepath")}
        >
          My AspirePath
        </button>
      </div>

      <div className="roadmapAppleFilters">
        <div className="roadmapAppleFilterRow">
          <div className="roadmapAppleFilterLabel">
            <strong>Plans</strong>
            <span>{roadmaps.length} roadmaps</span>
          </div>

          <div className="roadmapAppleScroller">
            <button
              type="button"
              className={`roadmapAppleChip ${planFilter === "ALL" ? "active" : ""}`}
              onClick={() => setPlanFilter("ALL")}
            >
              <span>All Plans</span>
              <small>{roadmaps.length}</small>
            </button>

            {PLAN_ORDER.map((plan) => {
              const access = planHasAccess(plan);
              return (
                <button
                  type="button"
                  key={plan}
                  className={`roadmapAppleChip roadmapApplePlanChip ${
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

        <div className="roadmapAppleFilterRow">
          <div className="roadmapAppleFilterLabel">
            <strong>Exam Type</strong>
            <span>{exams.length} exams</span>
          </div>

          <div className="roadmapAppleScroller">
            <button
              type="button"
              className={`roadmapAppleChip ${examFilter === "ALL" ? "active" : ""}`}
              onClick={() => setExamFilter("ALL")}
            >
              All Exams
            </button>

            {exams.map((exam) => (
              <button
                type="button"
                key={exam.key}
                className={`roadmapAppleChip ${examFilter === exam.key ? "active" : ""}`}
                onClick={() => setExamFilter(exam.key)}
              >
                <span>{exam.name}</span>
                <small>{exam.count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="roadmapAppleFilterRow roadmapAppleUtilityRow">
          <div className="roadmapAppleScroller">
            {[
              ["all", "All Content"],
              ["access", "My Access"],
              ["free", "Free"],
              ["saved", "Saved"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`roadmapAppleChip ${utilityFilter === id ? "active" : ""}`}
                onClick={() => setUtilityFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="roadmapAppleUtilityRight">
            <div className="roadmapAppleViewToggle" aria-label="Roadmap view">
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
            <div className="roadmapAppleResultCount">
              <strong>{filteredRoadmaps.length}</strong>
              <span>roadmaps</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="roadmapAppleEmpty">
          <h3>Loading roadmaps...</h3>
          <p>Please wait while AspirePath prepares available study paths.</p>
        </div>
      ) : loadError ? (
        <div className="roadmapAppleEmpty">
          <h3>Unable to load</h3>
          <p>{loadError}</p>
        </div>
      ) : filteredRoadmaps.length ? (
        <div className="roadmapAppleResourceGrid">
          {filteredRoadmaps.map((roadmap) => {
            const id = String(roadmap?.id || "");
            const plan = getPlan(roadmap);
            const access = hasAccess(roadmap);
            const saved = savedIds.has(id);
            const exam = roadmap?.examType || roadmap?.course || "CTET/TET";
            const days = Number(roadmap?.totalDays || 0);

            return (
              <article className={`roadmapAppleCard ${access ? "" : "isLocked"}`} key={id}>
                <button
                  type="button"
                  className="roadmapAppleCardOpen"
                  onClick={() => openRoadmap(roadmap)}
                >
                  <div className="roadmapAppleThumb">
                    <span className="roadmapAppleTypeIcon">↗</span>
                    <span className={`roadmapAppleState ${access ? "open" : "locked"}`}>
                      {access ? "Open" : "Locked"}
                    </span>
                  </div>

                  <div className="roadmapAppleCardBody">
                    <div className="roadmapAppleMeta">
                      <small>{exam}</small>
                      <span>{plan}</span>
                    </div>
                    <h3>{roadmap?.title || "AspirePath Roadmap"}</h3>
                    <p>{roadmap?.description || `${days || "Daily"} day guided preparation`}</p>
                  </div>
                </button>

                <div className="roadmapAppleCardFooter">
                  <small>{access ? (days ? `${days} days` : roadmap?.startDate || "Open roadmap") : "Locked • View Access"}</small>
                  <button
                    type="button"
                    className={`roadmapAppleSave ${saved ? "saved" : ""}`}
                    onClick={() => toggleSaved(roadmap)}
                    aria-label={saved ? "Remove saved roadmap" : "Save roadmap"}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="roadmapAppleEmpty">
          <span>⌕</span>
          <h3>No roadmaps match this filter</h3>
          <p>Choose All Plans, All Exams, or All Content to return to AspirePath.</p>
        </div>
      )}
    </section>
  );
};

export const StudentRoadmapDetail = StudentRoadmapDetailRoute;
export const StudentRoadmapDay = StudentRoadmapDayRoute;
export const MyAspirePath = MyAspirePathRoute;
