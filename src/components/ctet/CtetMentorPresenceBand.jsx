import React, { useMemo } from "react";

import {
  getExperienceEventPresentation,
} from "../../experience/experienceEventPresentation";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "Schedule pending";

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
    // Use the safe fallback below.
  }

  if (route.startsWith("/")) return route;
  if (/^https?:\/\//i.test(route)) return route;

  return fallback;
}

function openRoute(route, navigate, fallback) {
  const target = routeOf(route, fallback);

  if (/^https?:\/\//i.test(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  navigate?.(target);
}

function hasMentorPresenceOwnership(event = {}) {
  return Boolean(
    event.mentorPresence ?? event.raw?.mentorPresence
  );
}

function getStatusRank(status = "") {
  const ranks = {
    live: 0,
    scheduled: 1,
    published: 2,
  };

  return ranks[clean(status).toLowerCase()] ?? 3;
}

function getSortTime(item = {}) {
  const presentation = item.presentation || {};
  const startAt =
    presentation.timing?.startAt ||
    item.event?.startAt ||
    item.event?.scheduleAt;

  return toDate(startAt)?.getTime() ?? null;
}

function sortMentorItems(left, right) {
  const leftRank = getStatusRank(left.presentation.status);
  const rightRank = getStatusRank(right.presentation.status);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftTime = getSortTime(left);
  const rightTime = getSortTime(right);

  if (leftRank <= 1) {
    return (
      (leftTime ?? Number.MAX_SAFE_INTEGER) -
      (rightTime ?? Number.MAX_SAFE_INTEGER)
    );
  }

  return (rightTime ?? 0) - (leftTime ?? 0);
}

export default function CtetMentorPresenceBand({
  events = [],
  navigate,
}) {
  const mentorItem = useMemo(() => {
    return (Array.isArray(events) ? events : [])
      .filter(hasMentorPresenceOwnership)
      .map((event) => ({
        event,
        presentation:
          getExperienceEventPresentation(event),
      }))
      .sort(sortMentorItems)[0] || null;
  }, [events]);

  const mentorEvent =
    mentorItem?.presentation?.event ||
    mentorItem?.event ||
    null;

  const presentation = mentorItem?.presentation || null;

  const title =
    mentorEvent?.title ||
    "This Week's Mentor Focus";

  const description =
    mentorEvent?.description ||
    "Complete one roadmap task, revise your weakest chapter, and attempt one focused mock before the next class.";

  const primaryCta = presentation?.primaryCta || {
    label: "Start Mentor Plan",
    route: "/ctet-tet/roadmaps",
  };

  const secondaryCta = presentation?.secondaryCta || {
    label: "Watch Classes",
    route: "/ctet-tet/videos",
  };

  const scheduleAt =
    presentation?.timing?.scheduleAt ||
    presentation?.timing?.startAt ||
    mentorEvent?.startAt ||
    mentorEvent?.scheduleAt;

  const scheduleLabel = mentorEvent
    ? presentation?.timing?.scheduleLabel || "Starts"
    : "Latest mentor guidance";

  const mentorName =
    clean(mentorEvent?.mentorName) ||
    "Dr. Varsha D. Maru";

  return (
    <section
      className="ctetS3MentorPresenceBand"
      aria-label="Latest mentor presence message"
    >
      <div className="ctetS3MentorPresenceBandShell">
        <div
          className="ctetS3MentorPresenceBandMark"
          aria-hidden="true"
        >
          <strong>VM</strong>
          <span>Mentor</span>
        </div>

        <div className="ctetS3MentorPresenceBandCopy">
          <span>MENTOR PRESENCE</span>
          <h2>{title}</h2>
          <p>{description}</p>
          <small>
            {mentorName} {"\u2022"}{" "}
            {mentorEvent
              ? `${scheduleLabel} ${formatDate(scheduleAt)}`
              : scheduleLabel}
          </small>
        </div>

        <div className="ctetS3MentorPresenceBandActions">
          <button
            type="button"
            onClick={() =>
              openRoute(
                primaryCta.route,
                navigate,
                "/ctet-tet/roadmaps"
              )
            }
          >
            {primaryCta.label} {"\u203A"}
          </button>

          <button
            type="button"
            className="isGhost"
            onClick={() =>
              openRoute(
                secondaryCta.route,
                navigate,
                "/ctet-tet/videos"
              )
            }
          >
            {secondaryCta.label} {"\u203A"}
          </button>
        </div>
      </div>
    </section>
  );
}
