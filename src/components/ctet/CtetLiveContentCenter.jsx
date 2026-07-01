import React, { useMemo, useState } from "react";

const fallbackUpdates = [
  {
    id: "notes-featured",
    type: "notes",
    title: "CDP Quick Revision Notes – Learning Theories",
    description: "Concise revision notes with exam-focused points, diagrams and PYQ links.",
    updated: "Updated today, 10:30 AM",
    route: "/ctet-tet/notes",
    cta: "Open",
    featured: true,
  },
  {
    id: "mock-test",
    type: "mock",
    title: "Pedagogy Practice Test – 10",
    description: "New mock test with detailed solutions and performance insights.",
    updated: "Updated today, 09:15 AM",
    route: "/ctet-tet/mock-tests",
    cta: "View",
  },
  {
    id: "current-affairs",
    type: "current",
    title: "Daily Current Affairs – 17 May 2025",
    description: "Important education and national updates with exam relevance.",
    updated: "Updated today, 08:00 AM",
    route: "/ctet-tet/current-affairs",
    cta: "Open",
  },
  {
    id: "videos",
    type: "videos",
    title: "Inclusive Classroom Strategies – Replay",
    description: "Recorded session with practical examples and teaching approaches.",
    updated: "Updated yesterday, 07:30 PM",
    route: "/ctet-tet/videos",
    cta: "Watch",
  },
  {
    id: "roadmap",
    type: "roadmap",
    title: "AspirePath – CTET Paper 1 Roadmap",
    description: "New milestone added: Environmental Studies Deep Dive.",
    updated: "Updated yesterday, 05:45 PM",
    route: "/ctet-tet/roadmaps",
    cta: "Open",
  },
];

const fallbackWeek = [
  ["today", "Sat", "17 May", "07:00 PM – 08:00 PM", "CDP Pedagogy Deep Dive (Live Class)", "PYQs, Concepts & Exam Strategies", "live", "Join Live", "/ctet-tet/videos"],
  ["", "Sun", "18 May", "10:00 AM – 11:30 AM", "CTET Paper 1 Mock Test – 05", "Full-Length Mock with Solutions", "mock", "Start Test", "/ctet-tet/mock-tests"],
  ["", "Mon", "19 May", "06:30 PM – 07:30 PM", "AspirePath Task: EVS – Biodiversity", "Complete concept map & practice set", "roadmap", "View Task", "/ctet-tet/roadmaps"],
  ["", "Tue", "20 May", "07:00 PM – 08:00 PM", "Hindi Pedagogy Revision Session", "Teaching Methods & Practice", "live", "Join Live", "/ctet-tet/videos"],
  ["", "Wed", "21 May", "09:00 AM – 09:30 AM", "Weekly Current Affairs Drop", "Education & Teaching Updates", "current", "View PDF", "/ctet-tet/current-affairs"],
  ["", "Fri", "23 May", "06:00 PM – 07:00 PM", "Maths Pedagogy – Problem Solving", "Concepts, Tricks & Practice", "videos", "Watch", "/ctet-tet/videos"],
  ["", "Sun", "25 May", "07:00 PM – 08:00 PM", "Weekly Revision & Doubt Clearing", "Quick Revision + Q&A", "live", "Join Live", "/ctet-tet/videos"],
];

const typeMeta = {
  notes: { label: "Notes", icon: "▤", tone: "notes", route: "/ctet-tet/notes" },
  mock: { label: "Mock Test", icon: "☑", tone: "mock", route: "/ctet-tet/mock-tests" },
  mocktest: { label: "Mock Test", icon: "☑", tone: "mock", route: "/ctet-tet/mock-tests" },
  videos: { label: "Videos", icon: "▶", tone: "videos", route: "/ctet-tet/videos" },
  video: { label: "Videos", icon: "▶", tone: "videos", route: "/ctet-tet/videos" },
  live: { label: "Live Class", icon: "●", tone: "live", route: "/ctet-tet/videos" },
  current: { label: "Current Affairs", icon: "◎", tone: "current", route: "/ctet-tet/current-affairs" },
  currentaffairs: { label: "Current Affairs", icon: "◎", tone: "current", route: "/ctet-tet/current-affairs" },
  roadmap: { label: "Roadmap", icon: "⌁", tone: "roadmap", route: "/ctet-tet/roadmaps" },
  roadmaps: { label: "Roadmaps", icon: "⌁", tone: "roadmap", route: "/ctet-tet/roadmaps" },
};

const filters = [
  ["all", "All", "●"],
  ["notes", "Notes", "▤"],
  ["mock", "Mock Tests", "☑"],
  ["videos", "Videos", "▶"],
  ["current", "Current Affairs", "◎"],
  ["roadmap", "Roadmaps", "⌁"],
];

function cleanType(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMeta(type = "") {
  const key = cleanType(type);
  return typeMeta[key] || typeMeta[type] || typeMeta.live;
}

function formatDateParts(value, index = 0) {
  const date = toDate(value);
  if (!date) {
    const fallback = fallbackWeek[index % fallbackWeek.length];
    return { day: fallback[1], date: fallback[2], time: fallback[3] };
  }

  return {
    day: date.toLocaleDateString("en-IN", { weekday: "short" }),
    date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function normalizeRoute(url, fallback) {
  if (!url) return fallback;
  return url;
}

function openTarget(navigate, target) {
  if (!target) return;
  if (/^https?:\/\//i.test(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }
  navigate(target);
}

export default function CtetLiveContentCenter({
  events = [],
  upcomingEvents = [],
  loading = false,
  navigate,
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const eventUpdates = useMemo(() => {
    const source = Array.isArray(events) ? events : [];
    const mapped = source.slice(0, 8).map((event, index) => {
      const eventType = event.type || event.module || event.section || event.typeLabel || "live";
      const meta = getMeta(eventType);
      const date = formatDateParts(event.updatedAt || event.createdAt || event.startAt, index);

      return {
        id: event.id || `event-${index}`,
        type: meta.tone,
        title: event.title || "AspireNest learning update",
        description:
          event.description ||
          event.subtitle ||
          "Fresh learning update synced from AspireNest live experience events.",
        updated: event.status === "live" ? "Live now" : `Updated ${date.date}`,
        route: normalizeRoute(event.cta?.url || event.url || event.link, meta.route),
        cta: event.status === "live" ? "Join" : "Open",
        featured: index === 0,
      };
    });

    return mapped.length ? mapped : fallbackUpdates;
  }, [events]);

  const visibleUpdates = useMemo(() => {
    if (activeFilter === "all") return eventUpdates;
    return eventUpdates.filter((item) => item.type === activeFilter);
  }, [activeFilter, eventUpdates]);

  const weekItems = useMemo(() => {
    const source = Array.isArray(upcomingEvents) && upcomingEvents.length ? upcomingEvents : events;
    const mapped = (Array.isArray(source) ? source : []).slice(0, 7).map((event, index) => {
      const eventType = event.type || event.module || event.section || event.typeLabel || "live";
      const meta = getMeta(eventType);
      const date = formatDateParts(event.startAt || event.scheduleAt || event.createdAt, index);

      return {
        id: event.id || `week-${index}`,
        today: index === 0 ? "TODAY" : "",
        day: date.day,
        date: date.date,
        time: date.time,
        title: event.title || "AspireNest weekly learning event",
        subtitle: event.description || event.subject || "Auto-synced learning schedule",
        type: meta.tone,
        label: meta.label,
        cta: event.status === "live" ? "Join Live" : meta.tone === "mock" ? "Start Test" : meta.tone === "videos" ? "Watch" : "View",
        route: normalizeRoute(event.cta?.url || event.url || event.link, meta.route),
      };
    });

    if (mapped.length) return mapped;

    return fallbackWeek.map((item, index) => ({
      id: `fallback-week-${index}`,
      today: item[0] ? "TODAY" : "",
      day: item[1],
      date: item[2],
      time: item[3],
      title: item[4],
      subtitle: item[5],
      type: item[6],
      label: getMeta(item[6]).label,
      cta: item[7],
      route: item[8],
    }));
  }, [events, upcomingEvents]);

  const featured = visibleUpdates[0];

  const tvItems = useMemo(() => {
    const eventItems = (events || []).slice(0, 3).map((event) => {
      const meta = getMeta(event.type);
      return {
        id: `tv-event-${event.id || event.title}`,
        type: event.type,
        eyebrow: event.status === "live" ? "LIVE NOW" : event.featured ? "FEATURED" : meta.label,
        title: event.title || "AspireNest learning event",
        description: event.description || event.subject || "Live academy update for CTET/TET learners.",
        cta: event.cta?.label || "View Details",
        route: normalizeRoute(event.cta?.url || event.url || event.link, meta.route),
      };
    });

    const updateItems = visibleUpdates.slice(0, 2).map((item) => ({
      id: `tv-update-${item.id}`,
      type: item.type,
      eyebrow: "WHAT'S NEW",
      title: item.title,
      description: item.description,
      cta: item.cta,
      route: item.route,
    }));

    const weekSpotlight = weekItems[0]
      ? [
          {
            id: `tv-week-${weekItems[0].id}`,
            type: weekItems[0].type,
            eyebrow: weekItems[0].today || "THIS WEEK",
            title: weekItems[0].title,
            description: weekItems[0].subtitle,
            cta: weekItems[0].cta,
            route: weekItems[0].route,
          },
        ]
      : [];

    const merged = [...eventItems, ...updateItems, ...weekSpotlight].filter(Boolean);

    if (merged.length) return merged.slice(0, 5);

    return [
      {
        id: "tv-empty-state",
        type: "ANNOUNCEMENT",
        eyebrow: loading ? "SYNCING" : "ASPIRENEST TV",
        title: loading ? "Preparing academy spotlight" : "AspireNest TV will appear here soon",
        description: loading
          ? "Fetching latest events and updates."
          : "Featured classes, mock tests, mentor updates, and platform highlights will be shown here.",
        cta: "Open Learning Hub",
        route: "/ctet-tet/courses",
      },
    ];
  }, [events, loading, visibleUpdates, weekItems]);

  return (
    <section className="ctetS4LiveContentCenter" id="live-content-center">
      <div className="ctetS4BgGrid" />
      <div className="ctetS4Shell">
        <div className="ctetS4Hero">
          <div>
            <span className="ctetS4Eyebrow">⌁ Live Content Center</span>
            <h2>
              What’s New & <span>This Week</span>
            </h2>
            <p>
              Your premium update hub for the latest real CTET/TET content and your weekly learning schedule.
            </p>
          </div>

          <div className="ctetS4SyncCard">
            <span>↻</span>
            <div>
              <strong>{loading ? "Syncing Updates" : "Live Sync Active"}</strong>
              <small>Synced from Notes, Mock Tests, Videos, Current Affairs, and AspirePath</small>
            </div>
          </div>
        </div>

          <div className="ctetS4TvStrip" aria-label="AspireNest TV">
            <div className="ctetS4TvIntro">
              <span>▶ AspireNest TV</span>
              <h3>Live academy spotlight</h3>
              <p>Featured classes, mock tests, mentor updates, and fresh learning signals in one premium strip.</p>
            </div>

            <div className="ctetS4TvRail">
              {tvItems.map((item, tvIndex) => {
                const meta = getMeta(item.type);
                return (
                  <button
                    type="button"
                    className={tvIndex === 0 ? "ctetS4TvCard isFeatured" : "ctetS4TvCard"}
                    key={item.id}
                    onClick={() => openTarget(navigate, item.route)}
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

        <div className="ctetS4Grid">
          <article className="ctetS4Panel ctetS4WhatsNewPanel">
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>🔔</span>
                <div>
                  <h3>What’s New</h3>
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
                <span className="ctetS4FeaturedRibbon">Featured Update</span>
                <i>{getMeta(featured.type).icon}</i>
                <div>
                  <h4>{featured.title}</h4>
                  <p>{featured.description}</p>
                  <small>◷ {featured.updated}</small>
                </div>
                <strong>{featured.cta} ↗</strong>
                <em>☆</em>
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
                      <b className={`ctetS4TypePill is-${meta.tone}`}>{meta.label}</b>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                    <small>{item.updated}</small>
                    <strong>{item.cta} ›</strong>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="ctetS4Panel ctetS4WeekPanel">
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>▣</span>
                <div>
                  <h3>This Week</h3>
                  <p>Your auto-synced weekly plan</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/ctet-tet/roadmaps")}>
                ▣ Weekly Calendar
              </button>
            </div>

            <div className="ctetS4WeekList">
              {weekItems.map((item) => {
                const meta = getMeta(item.type);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={item.today ? "ctetS4WeekRow isToday" : "ctetS4WeekRow"}
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
                    <b className={`ctetS4TypePill is-${meta.tone}`}>{meta.label}</b>
                    <strong>{item.cta} ›</strong>
                  </button>
                );
              })}
            </div>

            <div className="ctetS4FooterNote">
              <span>✣</span>
              <p>Auto-synced weekly plan from your learning activity.</p>
              <small>No-event premium state supported.</small>
            </div>
          </article>
        </div>

        <div className="ctetS4BottomTrust">
          <strong>🛡 Always Updated. Always Relevant.</strong>
          <span>We bring you the latest so you can stay ahead.</span>
        </div>
      </div>
    </section>
  );
}
