import React, { useMemo } from "react";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "Latest mentor guidance";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function clean(value = "") {
  return String(value || "").trim();
}

function routeOf(value = "", fallback = "/ctet-tet/roadmaps") {
  const route = clean(value);
  if (!route) return fallback;

  try {
    const parsed = new URL(route, window.location.origin);
    const isInternalHost =
      parsed.hostname === window.location.hostname ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "aspirenest-academy.vercel.app" ||
      parsed.hostname === "aspirenestacademy.in" ||
      parsed.hostname === "www.aspirenestacademy.in";

    if (isInternalHost) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // fallback below
  }

  if (route.startsWith("/")) return route;
  if (/^https?:\/\//i.test(route)) return route;

  return fallback;
}

function openRoute(route, navigate) {
  const target = routeOf(route);

  if (/^https?:\/\//i.test(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  navigate?.(target);
}

function isMentorEvent(event = {}) {
  const text = [
    event.type,
    event.typeLabel,
    event.title,
    event.description,
    event.mentorName,
    event.ctaLabel,
  ]
    .map((value) => clean(value).toLowerCase())
    .join(" ");

  return (
    text.includes("mentor") ||
    text.includes("varsha") ||
    text.includes("guidance") ||
    text.includes("roadmap")
  );
}

export default function CtetMentorPresenceBand({
  events = [],
  navigate,
}) {
  const mentorEvent = useMemo(() => {
    return [...(Array.isArray(events) ? events : [])]
      .filter(isMentorEvent)
      .sort((a, b) => {
        const bTime = toDate(b.updatedAt || b.createdAt || b.startAt || b.scheduleAt)?.getTime() || 0;
        const aTime = toDate(a.updatedAt || a.createdAt || a.startAt || a.scheduleAt)?.getTime() || 0;
        return bTime - aTime;
      })[0] || null;
  }, [events]);

  const title = mentorEvent?.title || "This Week’s Mentor Focus";
  const description =
    mentorEvent?.description ||
    "Complete one roadmap task, revise your weakest chapter, and attempt one focused mock before the next class.";

  const primaryLabel =
    mentorEvent?.cta?.label ||
    mentorEvent?.ctaLabel ||
    "Start Mentor Plan";

  const primaryRoute = routeOf(
    mentorEvent?.cta?.url ||
      mentorEvent?.ctaUrl ||
      mentorEvent?.ctaLink ||
      mentorEvent?.url ||
      mentorEvent?.link,
    "/ctet-tet/roadmaps"
  );

  const dateLabel = formatDate(
    mentorEvent?.updatedAt ||
      mentorEvent?.createdAt ||
      mentorEvent?.startAt ||
      mentorEvent?.scheduleAt
  );

  return (
    <section className="ctetS3MentorPresenceBand" aria-label="Latest mentor presence message">
      <div className="ctetS3MentorPresenceBandShell">
        <div className="ctetS3MentorPresenceBandMark" aria-hidden="true">
          <strong>VM</strong>
          <span>Mentor</span>
        </div>

        <div className="ctetS3MentorPresenceBandCopy">
          <span>MENTOR PRESENCE</span>
          <h2>{title}</h2>
          <p>{description}</p>
          <small>Dr. Varsha D. Maru • {dateLabel}</small>
        </div>

        <div className="ctetS3MentorPresenceBandActions">
          <button type="button" onClick={() => openRoute(primaryRoute, navigate)}>
            {primaryLabel} ›
          </button>
          <button type="button" className="isGhost" onClick={() => navigate?.("/ctet-tet/videos")}>
            Watch Classes ›
          </button>
        </div>
      </div>
    </section>
  );
}
