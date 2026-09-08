import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";
import {
  getLiveClassStatus,
  getLiveStatusLabel,
  hasVideoPlanAccess,
  LIVE_CLASS_STATUS,
} from "./videoUtils.js";

import "../../styles/video/studentVideoAppleLibraryV2.css";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const readSaved = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

export default function StudentVideoHub({
  universalContent = [],
  hasPlanAccess = () => false,
  userPlanType = "FREE",
  user = null,
}) {
  const navigate = useNavigate();
  const library = useVideoLibrary(universalContent);

  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [subjectFilter, setSubjectFilter] = React.useState("ALL");
  const [modeFilter, setModeFilter] = React.useState("ALL");
  const [utilityFilter, setUtilityFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");

  const savedKey = React.useMemo(
    () => `aspirenest:videos:saved:${user?.uid || user?.email || "guest"}`,
    [user?.uid, user?.email]
  );

  const [savedIds, setSavedIds] = React.useState(() => readSaved(savedKey));

  React.useEffect(() => {
    setSavedIds(readSaved(savedKey));
  }, [savedKey]);

  React.useEffect(() => {
    document.documentElement.classList.add("videoAppleLibraryScrollRoot");
    document.body.classList.add("videoAppleLibraryScrollBody");
    return () => {
      document.documentElement.classList.remove("videoAppleLibraryScrollRoot");
      document.body.classList.remove("videoAppleLibraryScrollBody");
    };
  }, []);

  React.useEffect(() => {
    setSubjectFilter("ALL");
  }, [planFilter]);

  const publishedVideos = library.publishedVideos || [];

  const getPlan = React.useCallback(
    (item) => library.normalizePlan(item?.planType || "FREE"),
    [library]
  );

  const canOpenVideo = React.useCallback(
    (item) => {
      const plan = getPlan(item);
      if (plan === "FREE") return true;

      try {
        if (
          hasPlanAccess(plan, {
            module: "video",
            itemType: "video",
            itemId: item?.id,
          })
        ) {
          return true;
        }
      } catch {
        // Fall through to the established hierarchy fallback.
      }

      return hasVideoPlanAccess(plan, userPlanType);
    },
    [getPlan, hasPlanAccess, userPlanType]
  );

  const planCounts = React.useMemo(() => {
    const counts = Object.fromEntries(PLAN_ORDER.map((plan) => [plan, 0]));
    publishedVideos.forEach((item) => {
      const plan = getPlan(item);
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  }, [publishedVideos, getPlan]);

  const planScoped = React.useMemo(
    () =>
      planFilter === "ALL"
        ? publishedVideos
        : publishedVideos.filter((item) => getPlan(item) === planFilter),
    [publishedVideos, planFilter, getPlan]
  );

  const subjects = React.useMemo(() => {
    const map = new Map();

    planScoped.forEach((item) => {
      const name = String(item?.subject || "").trim();
      if (!name) return;
      const key = library.normalizeText(name);
      if (!map.has(key)) map.set(key, { key, name, count: 0 });
      map.get(key).count += 1;
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [planScoped, library]);

  const subjectScoped = React.useMemo(
    () =>
      subjectFilter === "ALL"
        ? planScoped
        : planScoped.filter(
            (item) => library.normalizeText(item?.subject) === subjectFilter
          ),
    [planScoped, subjectFilter, library]
  );

  const filteredVideos = React.useMemo(() => {
    return subjectScoped.filter((item) => {
      const classMode = library.getClassMode(item);
      const liveStatus = getLiveClassStatus(item);

      if (modeFilter === "RECORDED" && classMode !== "RECORDED") return false;
      if (
        modeFilter === "LIVE" &&
        !(classMode === "LIVE" && liveStatus !== LIVE_CLASS_STATUS.REPLAY_AVAILABLE)
      ) {
        return false;
      }
      if (
        modeFilter === "REPLAY" &&
        liveStatus !== LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      ) {
        return false;
      }

      if (utilityFilter === "access" && !canOpenVideo(item)) return false;
      if (utilityFilter === "free" && getPlan(item) !== "FREE") return false;
      if (utilityFilter === "saved" && !savedIds.has(String(item?.id || ""))) {
        return false;
      }

      return true;
    });
  }, [
    subjectScoped,
    modeFilter,
    utilityFilter,
    canOpenVideo,
    getPlan,
    savedIds,
    library,
  ]);

  const toggleSaved = (item) => {
    const id = String(item?.id || "");
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

  const planHasAccess = (plan) => {
    if (plan === "FREE") return true;
    if (publishedVideos.some((item) => getPlan(item) === plan && canOpenVideo(item))) {
      return true;
    }
    return hasVideoPlanAccess(plan, userPlanType);
  };

  return (
    <section className="videoAppleLibraryV2" data-view={view}>
      <div className="videoAppleHeading">
        <div>
          <span className="videoAppleEyebrow">ASPIRENEST CLASSROOM</span>
          <h1>Videos</h1>
          <p>
            Filter the live library by plan, subject, and class mode. The exact
            published class opens in the existing AspireNest classroom viewer.
          </p>
        </div>

        <button
          type="button"
          className="videoApplePrimaryAction"
          onClick={() =>
            document
              .querySelector(".videoAppleResourceGrid")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          Continue Learning
        </button>
      </div>

      <div className="videoAppleFilters">
        <div className="videoAppleFilterRow">
          <div className="videoAppleFilterLabel">
            <strong>Plans</strong>
            <span>{publishedVideos.length} classes</span>
          </div>

          <div className="videoAppleScroller">
            <button
              type="button"
              className={`videoAppleChip ${planFilter === "ALL" ? "active" : ""}`}
              onClick={() => setPlanFilter("ALL")}
            >
              <span>All Plans</span>
              <small>{publishedVideos.length}</small>
            </button>

            {PLAN_ORDER.map((plan) => {
              const access = planHasAccess(plan);
              return (
                <button
                  type="button"
                  key={plan}
                  className={`videoAppleChip videoApplePlanChip ${
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

        <div className="videoAppleFilterRow">
          <div className="videoAppleFilterLabel">
            <strong>Subjects</strong>
            <span>{subjects.length} subjects</span>
          </div>

          <div className="videoAppleScroller">
            <button
              type="button"
              className={`videoAppleChip ${subjectFilter === "ALL" ? "active" : ""}`}
              onClick={() => setSubjectFilter("ALL")}
            >
              All Subjects
            </button>

            {subjects.map((subject) => (
              <button
                type="button"
                key={subject.key}
                className={`videoAppleChip ${
                  subjectFilter === subject.key ? "active" : ""
                }`}
                onClick={() => setSubjectFilter(subject.key)}
              >
                <span>{subject.name}</span>
                <small>{subject.count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="videoAppleFilterRow videoAppleUtilityRow">
          <div className="videoAppleScroller">
            {[
              ["ALL", "All"],
              ["RECORDED", "Recorded"],
              ["LIVE", "Live"],
              ["REPLAY", "Replay"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`videoAppleChip ${modeFilter === id ? "active" : ""}`}
                onClick={() => setModeFilter(id)}
              >
                {label}
              </button>
            ))}

            {[
              ["all", "All Content"],
              ["access", "My Access"],
              ["free", "Free"],
              ["saved", "Saved"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`videoAppleChip ${utilityFilter === id ? "active" : ""}`}
                onClick={() => setUtilityFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="videoAppleUtilityRight">
            <div className="videoAppleViewToggle" aria-label="Video view">
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
            <div className="videoAppleResultCount">
              <strong>{filteredVideos.length}</strong>
              <span>classes</span>
            </div>
          </div>
        </div>
      </div>

      {filteredVideos.length ? (
        <div className="videoAppleResourceGrid">
          {filteredVideos.map((item) => {
            const id = String(item?.id || "");
            const plan = getPlan(item);
            const classMode = library.getClassMode(item);
            const liveStatus = getLiveClassStatus(item);
            const access = canOpenVideo(item);
            const saved = savedIds.has(id);
            const stateLabel =
              classMode === "LIVE" ? getLiveStatusLabel(liveStatus) : "Recorded";

            return (
              <article className={`videoAppleCard ${access ? "" : "isLocked"}`} key={id}>
                <button
                  type="button"
                  className="videoAppleCardOpen"
                  onClick={() => access ? navigate(`/ctet-tet/videos/watch/${id}`) : navigate("/ctet-tet/pricing")}
                >
                  <div className="videoAppleThumb">
                    <span className="videoAppleTypeIcon">
                      {classMode === "LIVE" ? "●" : "▶"}
                    </span>
                    <span className={`videoAppleState ${access ? "open" : "locked"}`}>
                      {access ? stateLabel : "Locked"}
                    </span>
                  </div>

                  <div className="videoAppleCardBody">
                    <div className="videoAppleMeta">
                      <small>{item?.subject || "Classroom"}</small>
                      <span>{plan}</span>
                    </div>
                    <h3>{item?.title || "AspireNest Class"}</h3>
                    <p>{item?.chapter || item?.description || stateLabel}</p>
                  </div>
                </button>

                <div className="videoAppleCardFooter">
                  <small>{access ? stateLabel : "Locked • View Access"}</small>
                  <button
                    type="button"
                    className={`videoAppleSave ${saved ? "saved" : ""}`}
                    onClick={() => toggleSaved(item)}
                    aria-label={saved ? "Remove saved class" : "Save class"}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="videoAppleEmpty">
          <span>⌕</span>
          <h3>No classes match this filter</h3>
          <p>Choose All Plans, All Subjects, or All Content to return to the library.</p>
        </div>
      )}
    </section>
  );
}
