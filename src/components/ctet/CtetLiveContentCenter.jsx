import React, { useEffect, useMemo, useState } from "react";

const fallbackUpdates = [
  {
    id: "no-updates-yet",
    type: "live",
    title: "No launch update published yet",
    description: "Fresh published events, notes, videos, mock tests, current affairs PDFs, and roadmap items will appear here.",
    updated: "Waiting for first publish",
    route: "/ctet-tet/courses",
    cta: "Explore Learning Hub",
    source: "Experience",
    plan: "FREE",
    featured: true,
    empty: true,
  },
];

const typeMeta = {
  announcement: { label: "Announcement", icon: "!", tone: "live", route: "/ctet-tet" },
  current: { label: "Current Affairs", icon: "CA", tone: "current", route: "/ctet-tet/current-affairs" },
  currentaffairs: { label: "Current Affairs", icon: "CA", tone: "current", route: "/ctet-tet/current-affairs" },
  doubt: { label: "Doubt Session", icon: "?", tone: "live", route: "/ctet-tet/videos" },
  doubtsession: { label: "Doubt Session", icon: "?", tone: "live", route: "/ctet-tet/videos" },
  live: { label: "Live Class", icon: "LIVE", tone: "live", route: "/ctet-tet/videos" },
  liveclass: { label: "Live Class", icon: "LIVE", tone: "live", route: "/ctet-tet/videos" },
  marathon: { label: "Marathon", icon: "MR", tone: "live", route: "/ctet-tet/videos" },
  mock: { label: "Mock Test", icon: "MT", tone: "mock", route: "/ctet-tet/mock-tests" },
  mocktest: { label: "Mock Test", icon: "MT", tone: "mock", route: "/ctet-tet/mock-tests" },
  notes: { label: "Notes", icon: "NT", tone: "notes", route: "/ctet-tet/notes" },
  rankchallenge: { label: "Rank Challenge", icon: "RK", tone: "mock", route: "/ctet-tet/mock-tests" },
  revision: { label: "Revision", icon: "RV", tone: "notes", route: "/ctet-tet/notes" },
  roadmap: { label: "Roadmap", icon: "RD", tone: "roadmap", route: "/ctet-tet/roadmaps" },
  roadmaps: { label: "Roadmap", icon: "RD", tone: "roadmap", route: "/ctet-tet/roadmaps" },
  specialsession: { label: "Special Session", icon: "SS", tone: "live", route: "/ctet-tet/videos" },
  video: { label: "Videos", icon: "VD", tone: "videos", route: "/ctet-tet/videos" },
  videos: { label: "Videos", icon: "VD", tone: "videos", route: "/ctet-tet/videos" },
  webinar: { label: "Webinar", icon: "WB", tone: "live", route: "/ctet-tet/videos" },
  workshop: { label: "Workshop", icon: "WS", tone: "live", route: "/ctet-tet/videos" },
};

const filters = [
  ["all", "All", "*"],
  ["notes", "Notes", "NT"],
  ["mock", "Mock Tests", "MT"],
  ["videos", "Videos", "VD"],
  ["current", "Current Affairs", "CA"],
  ["roadmap", "Roadmaps", "RD"],
];

function cleanType(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMeta(type = "") {
  const key = cleanType(type);
  return typeMeta[key] || typeMeta[type] || typeMeta.live;
}

function cleanCtaLabel(value = "", fallback = "Open") {
  const raw = String(value || "").trim();
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");

  if (normalized === "JOIN_CHALLENGE") return "Join Challenge";
  if (normalized === "START_MOCK") return "Start";
  if (normalized === "JOIN_LIVE") return "Join Live";
  if (normalized === "VIEW_DETAILS") return "View Details";
  if (normalized === "OPEN_VIDEO") return "Watch";
  if (normalized === "READ_NOTES") return "Read";
  if (normalized === "OPEN_ROADMAP") return "Open Roadmap";

  return raw || fallback;
}

function normalizeRoute(url, fallback) {
  const target = String(url || "").trim();
  if (!target) return fallback;
  if (/^(https?:|mailto:|tel:)/i.test(target)) return target;
  return target.startsWith("/") ? target : fallback;
}

function openTarget(navigate, target) {
  if (!target) return;
  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }
  navigate(target);
}

function formatDateParts(value) {
  const date = toDate(value);
  if (!date) return { day: "--", date: "Soon", time: "Schedule pending" };

  return {
    day: date.toLocaleDateString("en-IN", { weekday: "short" }),
    date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function formatUpdated(value) {
  const date = toDate(value);
  if (!date) return "New";
  return `Updated ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
}

function getWeekStart(nowValue = new Date()) {
  const date = new Date(nowValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function sameDay(left, right) {
  if (!left || !right) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getItemDate(item = {}) {
  return (
    toDate(item.updatedAt) ||
    toDate(item.createdAt) ||
    toDate(item.date) ||
    toDate(item.startAt) ||
    toDate(item.scheduleAt)
  );
}

function getContentMeta(item = {}) {
  const section = cleanType(item.section);
  const contentType = cleanType(item.contentType);
  const sourceType = cleanType(item.sourceType);

  if (section.includes("current")) return getMeta("current");
  if (section.includes("mock")) return getMeta("mock");
  if (section.includes("roadmap")) return getMeta("roadmap");
  if (section.includes("video") || contentType.includes("video") || sourceType.includes("youtube")) {
    return getMeta("videos");
  }
  return getMeta("notes");
}

function isChallengeEvent(event = {}) {
  const key = cleanType(event.type || event.typeLabel || event.module || event.section);
  return key === "rankchallenge" || key === "challenge" || key.includes("challenge");
}

function getChallengeStatusLabel(event = {}) {
  const status = cleanType(event.status);
  if (status === "live") return "Live Challenge";
  if (status === "scheduled" || status === "published") return "Open Challenge";
  return "Challenge";
}

function eventToUpdate(event = {}, index = 0) {
  const eventType = event.type || event.module || event.section || event.typeLabel || "live";
  const meta = getMeta(eventType);
  const date = formatDateParts(event.updatedAt || event.createdAt || event.startAt);

  return {
    id: event.id || `event-${index}`,
    type: meta.tone,
    title: event.title || "AspireNest learning event",
    description:
      event.description ||
      event.subtitle ||
      event.subject ||
      "Fresh learning update synced from AspireNest Experience events.",
    updated: event.status === "live" ? "Live now" : `Updated ${date.date}`,
    route: normalizeRoute(event.cta?.url || event.url || event.link, meta.route),
    cta: cleanCtaLabel(event.cta?.label || event.ctaLabel, event.status === "live" ? "Join" : "Open"),
    source: meta.label,
    plan: event.planType || "FREE",
    featured: index === 0 || Boolean(event.featured),
    sortAt: getItemDate(event)?.getTime() || 0,
  };
}

function contentToUpdate(item = {}, index = 0) {
  const meta = getContentMeta(item);
  const route = item.fileUrl || item.videoUrl || item.url || item.link || meta.route;

  return {
    id: item.id || `content-${index}`,
    type: meta.tone,
    title: item.title || item.name || "AspireNest content update",
    description:
      item.description ||
      item.chapter ||
      item.subject ||
      item.month ||
      "New learning resource published in AspireNest.",
    updated: formatUpdated(item.updatedAt || item.createdAt || item.date),
    route: normalizeRoute(route, meta.route),
    cta: meta.tone === "videos" ? "Watch" : meta.tone === "mock" ? "Start" : "Open",
    source: meta.label,
    plan: item.planType || item.type || "FREE",
    sortAt: getItemDate(item)?.getTime() || 0,
  };
}

function currentAffairToUpdate(item = {}, index = 0) {
  const meta = getMeta("current");

  return {
    id: item.id || `current-${index}`,
    type: meta.tone,
    title: item.title || item.month || "Current Affairs update",
    description: item.description || item.month || "Latest current affairs PDF is ready for revision.",
    updated: formatUpdated(item.updatedAt || item.createdAt || item.date),
    route: normalizeRoute(item.pdf || item.fileUrl || item.url, meta.route),
    cta: "Read",
    source: meta.label,
    plan: item.planType || item.type || "FREE",
    sortAt: getItemDate(item)?.getTime() || 0,
  };
}

function dedupeItems(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = [item.id, item.route, item.title].filter(Boolean).join("|").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function CtetLiveContentCenter({
  events = [],
  upcomingEvents = [],
  contentItems = [],
  currentAffairs = [],
  loading = false,
  navigate,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTvIndex, setActiveTvIndex] = useState(0);
  const [tvPaused, setTvPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const allUpdates = useMemo(() => {
    const eventItems = (Array.isArray(events) ? events : []).map(eventToUpdate);
    const moduleItems = (Array.isArray(contentItems) ? contentItems : [])
      .filter((item) => ["published", "live"].includes(String(item.status || "published").toLowerCase()))
      .map(contentToUpdate);
    const currentItems = (Array.isArray(currentAffairs) ? currentAffairs : []).map(currentAffairToUpdate);

    const merged = dedupeItems([...eventItems, ...moduleItems, ...currentItems])
      .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || b.sortAt - a.sortAt);

    return merged.length ? merged.slice(0, 12) : fallbackUpdates;
  }, [contentItems, currentAffairs, events]);

  const visibleUpdates = useMemo(() => {
    if (activeFilter === "all") return allUpdates;
    return allUpdates.filter((item) => item.type === activeFilter);
  }, [activeFilter, allUpdates]);

  const challengeItems = useMemo(() => {
    const source = Array.isArray(events) ? events : [];
    return source
      .filter(isChallengeEvent)
      .slice(0, 3)
      .map((event, index) => {
        const dateParts = formatDateParts(event.startAt || event.scheduleAt || event.createdAt);
        const challengeCtaLabel = cleanCtaLabel(event.cta?.label || event.ctaLabel, "Join Challenge");

        return {
          id: event.id || `challenge-${index}`,
          eyebrow: getChallengeStatusLabel(event),
          title: event.title || "AspireNest Rank Challenge",
          description:
            event.description ||
            event.subject ||
            "Join the active CTET/TET challenge and test your preparation with the community.",
          subject: event.subject || "CTET/TET",
          plan: event.planType || "FREE",
          time: dateParts.time,
          date: dateParts.date,
          cta: challengeCtaLabel,
          route: normalizeRoute(event.cta?.url || event.challengeUrl || event.mockTestUrl || event.url || event.link, "/ctet-tet/mock-tests"),
          featured: index === 0 || Boolean(event.featured),
        };
      });
  }, [events]);

  const weekItems = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const source = Array.isArray(upcomingEvents) && upcomingEvents.length ? upcomingEvents : events;
    const weekEvents = (Array.isArray(source) ? source : [])
      .map((event) => ({ ...event, startDate: toDate(event.startAt || event.scheduleAt || event.createdAt) }))
      .filter((event) => event.startDate);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dayEvents = weekEvents.filter((event) => sameDay(event.startDate, date));
      const firstEvent = dayEvents[0];
      const meta = getMeta(firstEvent?.type || "live");
      const dateParts = formatDateParts(firstEvent?.startAt || date);

      if (!firstEvent) {
        return {
          id: `week-empty-${index}`,
          today: sameDay(date, now) ? "TODAY" : "",
          day: date.toLocaleDateString("en-IN", { weekday: "short" }),
          date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          time: "Open slot",
          title: "No event planned yet",
          subtitle: "Follow the roadmap while the next live class, mock test, or workshop is being scheduled.",
          type: "roadmap",
          label: "Open Slot",
          cta: "Open Roadmap",
          route: "/ctet-tet/roadmaps",
          empty: true,
        };
      }

      return {
        id: firstEvent.id || `week-${index}`,
        today: sameDay(date, now) ? "TODAY" : "",
        day: dateParts.day,
        date: dateParts.date,
        time: dateParts.time,
        title: dayEvents.length > 1 ? `${dayEvents.length} events scheduled` : firstEvent.title || "AspireNest weekly learning event",
        subtitle: firstEvent.description || firstEvent.subject || "Auto-synced learning schedule",
        type: meta.tone,
        label: dayEvents.length > 1 ? "Multiple" : meta.label,
        cta: firstEvent.status === "live" ? "Join Live" : meta.tone === "mock" ? "Start Test" : meta.tone === "videos" ? "Watch" : "View",
        route: normalizeRoute(firstEvent.cta?.url || firstEvent.url || firstEvent.link, meta.route),
      };
    });
  }, [events, upcomingEvents]);

  const featured = visibleUpdates[0] || allUpdates[0];

  const tvItems = useMemo(() => {
    const eventItems = (events || []).slice(0, 4).map((event, index) => {
      const meta = getMeta(event.type);
      return {
        id: `tv-event-${event.id || event.title || index}`,
        type: event.type,
        eyebrow: event.status === "live" ? "LIVE NOW" : event.featured ? "FEATURED" : meta.label,
        title: event.title || "AspireNest learning event",
        description: event.description || event.subject || "Live academy update for CTET/TET learners.",
        cta: cleanCtaLabel(event.cta?.label || event.ctaLabel, "View Details"),
        route: normalizeRoute(event.cta?.url || event.url || event.link, meta.route),
      };
    });

    const updateItems = allUpdates.slice(0, 5).map((item) => ({
      id: `tv-update-${item.id}`,
      type: item.type,
      eyebrow: item.empty ? "NEEDS PUBLISH" : item.source || "WHAT'S NEW",
      title: item.title,
      description: item.description,
      cta: item.cta,
      route: item.route,
    }));

    const weekSpotlight = weekItems.find((item) => !item.empty) || weekItems.find((item) => item.today);
    const weekItemsForTv = weekSpotlight
      ? [
          {
            id: `tv-week-${weekSpotlight.id}`,
            type: weekSpotlight.type,
            eyebrow: weekSpotlight.today || "THIS WEEK",
            title: weekSpotlight.title,
            description: weekSpotlight.subtitle,
            cta: weekSpotlight.cta,
            route: weekSpotlight.route,
          },
        ]
      : [];

    const mergedTvItems = [...eventItems, ...updateItems, ...weekItemsForTv];
    const seenTvItems = new Set();

    return mergedTvItems
      .filter((item) => {
        const key = [item.title, item.route].filter(Boolean).join("|").toLowerCase();
        if (!key) return true;
        if (seenTvItems.has(key)) return false;
        seenTvItems.add(key);
        return true;
      })
      .slice(0, 6);
  }, [allUpdates, events, weekItems]);

  useEffect(() => {
    setActiveTvIndex((current) => (tvItems[current] ? current : 0));
  }, [tvItems]);

  useEffect(() => {
    if (tvPaused || tvItems.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveTvIndex((current) => (current + 1) % tvItems.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [tvItems.length, tvPaused]);

  const moveTv = (direction) => {
    if (tvItems.length < 2) return;
    setActiveTvIndex((current) => (current + direction + tvItems.length) % tvItems.length);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX;
    setTouchStartX(null);
    setTvPaused(false);

    if (Math.abs(delta) < 42) return;
    moveTv(delta > 0 ? -1 : 1);
  };

  return (
    <section className="ctetS4LiveContentCenter" id="live-content-center">
      <div className="ctetS4BgGrid" />
      <div className="ctetS4Shell">
        <div className="ctetS4Hero">
          <div>
            <span className="ctetS4Eyebrow">Live Content Center</span>
            <h2>
              What's New & <span>This Week</span>
            </h2>
            <p>
              Your premium update hub for the latest real CTET/TET content and your weekly learning schedule.
            </p>
          </div>

          <div className="ctetS4SyncCard">
            <span>SYNC</span>
            <div>
              <strong>{loading ? "Syncing Updates" : "Live Sync Active"}</strong>
              <small>Synced from Notes, Mock Tests, Videos, Current Affairs, Roadmaps, and Experience events</small>
            </div>
          </div>
        </div>

        <div className="ctetS4TvStrip" aria-label="AspireNest TV">
          <div className="ctetS4TvIntro">
            <span>AspireNest TV</span>
            <h3>Live academy spotlight</h3>
            <p>Featured classes, mock tests, mentor updates, and fresh learning signals in one premium strip.</p>
            {tvItems.length > 1 ? (
              <div className="ctetS4TvControls" aria-label="AspireNest TV controls">
                <button type="button" onClick={() => moveTv(-1)} aria-label="Previous AspireNest TV item">
                  Prev
                </button>
                <strong>{activeTvIndex + 1} / {tvItems.length}</strong>
                <button type="button" onClick={() => moveTv(1)} aria-label="Next AspireNest TV item">
                  Next
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="ctetS4TvRail"
            onMouseEnter={() => setTvPaused(true)}
            onMouseLeave={() => setTvPaused(false)}
            onFocus={() => setTvPaused(true)}
            onBlur={() => setTvPaused(false)}
            onTouchStart={(event) => {
              setTvPaused(true);
              setTouchStartX(event.touches[0]?.clientX ?? null);
            }}
            onTouchEnd={handleTouchEnd}
          >
            {tvItems.map((item, tvIndex) => {
              const meta = getMeta(item.type);
              const isActive = tvIndex === activeTvIndex;
              return (
                <button
                  type="button"
                  className={`ctetS4TvCard ${isActive ? "isFeatured isActive" : ""}`.trim()}
                  key={item.id}
                  onClick={() => openTarget(navigate, item.route)}
                  aria-current={isActive ? "true" : undefined}
                >
                  <b className={"ctetS4TypePill is-" + meta.tone}>{item.eyebrow}</b>
                  <span className={"ctetS4IconBox is-" + meta.tone}>{meta.icon}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                  <strong>{item.cta} ›</strong>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ctetS4ChallengeSpotlight" aria-label="AspireNest challenge spotlight">
          <div className="ctetS4ChallengeIntro">
            <span>COMMUNITY CHALLENGE</span>
            <h3>Rank Challenge Arena</h3>
            <p>Weekly CTET/TET challenges, mock battles, and rank-focused practice will appear here from real Experience Studio events.</p>
          </div>

          <div className="ctetS4ChallengeRail">
            {challengeItems.length ? (
              challengeItems.map((item) => (
                <button
                  type="button"
                  className={`ctetS4ChallengeCard ${item.featured ? "isFeatured" : ""} ${challengeItems.length === 1 ? "isSingle" : ""}`.trim()}
                  key={item.id}
                  onClick={() => openTarget(navigate, item.route)}
                >
                  <b>{item.eyebrow}</b>
                  <div>
                    <span>{item.subject}</span>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <small>{item.date} • {item.time} • {item.plan}</small>
                  </div>
                  <strong>{item.cta} ›</strong>
                </button>
              ))
            ) : (
              <div className="ctetS4ChallengeEmpty">
                <b>Challenge schedule soon</b>
                <h4>No active rank challenge published yet</h4>
                <p>Create a Rank Challenge from Admin → Experience Studio. It will appear here without touching code.</p>
                <button type="button" onClick={() => navigate("/ctet-tet/mock-tests")}>
                  Practice Mock Tests ›
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ctetS4Grid">
          <article className="ctetS4Panel ctetS4WhatsNewPanel">
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>NEW</span>
                <div>
                  <h3>What's New</h3>
                  <p>Latest updates across all modules</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/ctet-tet/courses")}>
                View All Updates <b>›</b>
              </button>
            </div>

            <div className="ctetS4Tabs" role="tablist" aria-label="Content filters">
              {filters.map(([value, label, icon]) => (
                <button
                  type="button"
                  key={value}
                  className={activeFilter === value ? "isActive" : ""}
                  onClick={() => setActiveFilter(value)}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {featured && (
              <button
                type="button"
                className="ctetS4FeaturedUpdate"
                onClick={() => openTarget(navigate, featured.route)}
              >
                <span className="ctetS4FeaturedRibbon">{featured.empty ? "Publish Needed" : "Featured Update"}</span>
                <i>{getMeta(featured.type).icon}</i>
                <div>
                  <b className={`ctetS4TypePill is-${getMeta(featured.type).tone}`}>{featured.source || getMeta(featured.type).label}</b>
                  {featured.plan ? <b className="ctetS4PlanPill">{featured.plan}</b> : null}
                  <h4>{featured.title}</h4>
                  <p>{featured.description}</p>
                  <small>{featured.updated}</small>
                </div>
                <strong>{featured.cta} ↗</strong>
                <em>NEW</em>
              </button>
            )}

            <div className="ctetS4UpdateList">
              {visibleUpdates.slice(1, 5).map((item) => {
                const meta = getMeta(item.type);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className="ctetS4UpdateRow"
                    onClick={() => openTarget(navigate, item.route)}
                  >
                    <span className={`ctetS4IconBox is-${meta.tone}`}>{meta.icon}</span>
                    <div>
                      <b className={`ctetS4TypePill is-${meta.tone}`}>{item.source || meta.label}</b>
                      {item.plan ? <b className="ctetS4PlanPill">{item.plan}</b> : null}
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                    <small>{item.updated}</small>
                    <strong>{item.cta} ›</strong>
                  </button>
                );
              })}

              {visibleUpdates.length <= 1 ? (
                <div className="ctetS4EmptyMini">
                  <strong>No more updates in this filter</strong>
                  <span>Publish content in the matching module to fill this list.</span>
                </div>
              ) : null}
            </div>
          </article>

          <article className="ctetS4Panel ctetS4WeekPanel">
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>WEEK</span>
                <div>
                  <h3>This Week</h3>
                  <p>Current Mon-Sun learning plan</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/ctet-tet/roadmaps")}>
                Weekly Calendar
              </button>
            </div>

            <div className="ctetS4WeekList">
              {weekItems.map((item) => {
                const meta = getMeta(item.type);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`${item.today ? "ctetS4WeekRow isToday" : "ctetS4WeekRow"} ${item.empty ? "isEmpty" : ""}`.trim()}
                    onClick={() => openTarget(navigate, item.route)}
                  >
                    <div className="ctetS4DateBlock">
                      {item.today && <small>{item.today}</small>}
                      <strong>{item.day}</strong>
                      <span>{item.date}</span>
                    </div>
                    <i />
                    <div className="ctetS4WeekInfo">
                      <small>{item.time}</small>
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                    <b className={`ctetS4TypePill is-${meta.tone}`}>{item.label}</b>
                    <strong>{item.cta} ›</strong>
                  </button>
                );
              })}
            </div>

            <div className="ctetS4FooterNote">
              <span>OK</span>
              <p>Completed, cancelled, expired, and archived events stay out of the public week plan.</p>
              <small>No-event days remain useful and clean.</small>
            </div>
          </article>
        </div>

        <div className="ctetS4BottomTrust">
          <strong>Always Updated. Always Relevant.</strong>
          <span>We bring you the latest so you can stay ahead.</span>
        </div>
      </div>
    </section>
  );
}
