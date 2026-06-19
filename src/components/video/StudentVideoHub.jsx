import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

import {
  getLiveClassStatus,
  getLiveStatusClassName,
  getLiveStatusLabel,
  LIVE_CLASS_STATUS,
} from "./videoUtils.js";

const PLAN_META = {
  FREE: {
    icon: "🎓",
    title: "Free Classroom",
    subtitle: "Start learning with open classes and free revision support.",
    tone: "free",
  },
  BASIC: {
    icon: "🔷",
    title: "Basic Classroom",
    subtitle: "Structured topic-wise videos for steady CTET/TET preparation.",
    tone: "basic",
  },
  PREMIUM: {
    icon: "⭐",
    title: "Premium Classroom",
    subtitle: "Premium lessons, replay access, and deeper exam preparation.",
    tone: "premium",
  },
  MENTORSHIP: {
    icon: "👩‍🏫",
    title: "Mentorship Classroom",
    subtitle: "Mentor-led learning, live support, and guided classroom flow.",
    tone: "mentorship",
  },
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLiveSortKey = (item = {}) =>
  `${item.liveStartDate || "9999-12-31"}T${item.liveStartTime || "23:59"}`;

const getLiveDateLabel = (item = {}, todayKey = getLocalDateKey()) => {
  const date = item.liveStartDate || item.startDate || item.classDate || "";

  if (!date) return "Date pending";
  if (date === todayKey) return "Today";

  return date;
};

const getLiveTimeLabel = (item = {}) => {
  const start = item.liveStartTime || item.startTime || "";
  const end = item.liveEndTime || item.endTime || "";

  if (!start) return "Time will be announced";
  if (end) return `${start} - ${end}`;

  return start;
};

const getLiveActionLabel = (state = "") => {
  if (state === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Now →";
  if (state === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Watch Replay →";
  if (state === LIVE_CLASS_STATUS.CANCELLED) return "View Update →";
  if (state === LIVE_CLASS_STATUS.ENDED) return "Replay Pending →";
  if (state === LIVE_CLASS_STATUS.NOT_SCHEDULED) return "View Details →";

  return "Open Schedule →";
};

const getLivePriority = (state = "") => {
  if (state === LIVE_CLASS_STATUS.JOIN_NOW) return 1;
  if (state === LIVE_CLASS_STATUS.UPCOMING) return 2;
  if (state === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return 3;
  if (state === LIVE_CLASS_STATUS.ENDED) return 4;
  if (state === LIVE_CLASS_STATUS.CANCELLED) return 5;

  return 6;
};

const uniqueLiveItems = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const id = item?.item?.id;

    if (!id || map.has(id)) return;

    map.set(id, item);
  });

  return [...map.values()];
};

const learningBenefits = [
  {
    icon: "🎬",
    title: "Recorded Lessons",
    text: "Watch topic-wise classes anytime for revision.",
  },
  {
    icon: "🔴",
    title: "Live Class Flow",
    text: "Upcoming, join-now, ended, and replay states stay clear.",
  },
  {
    icon: "🔁",
    title: "Replay Ready",
    text: "Missed classes can be watched later when replay is added.",
  },
  {
    icon: "📚",
    title: "Notes Connected",
    text: "Video, live class, notes, subject, and chapter stay in one node.",
  },
];

export default function StudentVideoHub({ universalContent = [] }) {
  const navigate = useNavigate();
  const videoLibrary = useVideoLibrary(universalContent);

  const plans = videoLibrary.getPlans();
  const latestItems = videoLibrary.publishedVideos.slice(0, 6);
  const todayKey = getLocalDateKey();

  const liveViewItems = React.useMemo(() => {
    return videoLibrary.liveClasses
      .map((item) => {
        const state = getLiveClassStatus(item);

        return {
          item,
          state,
          stateLabel: getLiveStatusLabel(state),
          statusClassName: getLiveStatusClassName(state),
          isToday: (item.liveStartDate || item.startDate || "") === todayKey,
          sortKey: getLiveSortKey(item),
        };
      })
      .sort((first, second) => {
        const priorityDiff =
          getLivePriority(first.state) - getLivePriority(second.state);

        if (priorityDiff !== 0) return priorityDiff;

        return first.sortKey.localeCompare(second.sortKey);
      });
  }, [videoLibrary, todayKey]);

  const joinNowLiveClasses = liveViewItems.filter(
    (live) => live.state === LIVE_CLASS_STATUS.JOIN_NOW
  );

  const todayLiveClasses = liveViewItems.filter((live) => live.isToday);

  const upcomingLiveClasses = liveViewItems.filter(
    (live) => live.state === LIVE_CLASS_STATUS.UPCOMING
  );

  const replayLiveClasses = liveViewItems.filter(
    (live) => live.state === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
  );

  const dashboardLiveItems = uniqueLiveItems([
    ...joinNowLiveClasses,
    ...todayLiveClasses,
    ...upcomingLiveClasses,
    ...replayLiveClasses,
    ...liveViewItems,
  ]).slice(0, 6);

  const nextLiveView =
    joinNowLiveClasses[0] ||
    todayLiveClasses[0] ||
    upcomingLiveClasses[0] ||
    replayLiveClasses[0] ||
    liveViewItems[0] ||
    null;

  const featuredClass = nextLiveView?.item || latestItems[0] || null;

  const totalClasses = videoLibrary.publishedVideos.length;
  const recordedCount = videoLibrary.recordedVideos.length;
  const liveCount = videoLibrary.liveClasses.length;
  const notesCount = videoLibrary.notes.length;

  const heroStats = [
    { value: totalClasses, label: "Published classes" },
    { value: recordedCount, label: "Recorded lessons" },
    { value: liveCount, label: "Live classrooms" },
    { value: notesCount, label: "Connected notes" },
  ];

  return (
    <section className="coursePages videoLibraryPage studentVideoHubPage">
      <div className="studentVideoHubShell">
        <section className="studentVideoHero studentVideoHeroPrime">
          <div className="studentVideoHeroCopy">
            <span className="studentVideoKicker">ASPIRENEST CLASSROOM</span>

            <h1>Learn inside one premium video classroom.</h1>

            <p>
              Recorded lessons, live classes, replay access, subject shelves,
              notes, and chapter-wise CTET/TET learning stay connected in one
              clean AspireNest system.
            </p>

            <div className="studentVideoHeroActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => navigate("/ctet-tet/videos/plan/FREE")}
              >
                Start Learning →
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() => navigate("/ctet-tet/pricing")}
              >
                Unlock Premium
              </button>
            </div>

            <div className="studentVideoTrustStrip">
              <span>✓ Plan protected</span>
              <span>✓ Subject-wise</span>
              <span>✓ Notes connected</span>
              <span>✓ Live + replay ready</span>
            </div>
          </div>

          <aside className="studentVideoLearningPanel">
            <div className="studentVideoPanelHeader">
              <span>Now Learning</span>
              <strong>One App • One System</strong>
            </div>

            <div className="studentVideoNowCard">
              <span className="studentVideoNowIcon">
                {featuredClass && videoLibrary.getClassMode(featuredClass) === "LIVE"
                  ? "🔴"
                  : "▶️"}
              </span>

              <div>
                <strong>
                  {featuredClass?.title || "Your next AspireNest class"}
                </strong>

                <p>
                  {featuredClass
                    ? `${featuredClass.subject || "Subject"} • ${
                        featuredClass.chapter || "Chapter"
                      }`
                    : "Published classes will appear here after admin adds them."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  featuredClass
                    ? navigate(`/ctet-tet/videos/watch/${featuredClass.id}`)
                    : navigate("/ctet-tet/videos/plan/FREE")
                }
              >
                {featuredClass ? "Open Class →" : "Browse Free →"}
              </button>
            </div>

            <div className="studentVideoHeroStats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="studentVideoFlowLine">
              <span>Plan</span>
              <i />
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Watch</span>
            </div>
          </aside>
        </section>

        <section className="studentVideoTodayLiveSection">
          <div className="studentVideoTodayLiveHeader">
            <div>
              <span>Live Classroom</span>

              <h2>Live classroom command center</h2>

              <p>
                Join-now classes, today’s schedule, upcoming live sessions,
                replay-ready classes, ended sessions, and cancelled updates stay
                in one connected student classroom.
              </p>
            </div>

            {nextLiveView ? (
              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() =>
                  navigate(`/ctet-tet/videos/watch/${nextLiveView.item.id}`)
                }
              >
              {getLiveActionLabel(nextLiveView.state)}
              </button>
            ) : null}
          </div>

          {dashboardLiveItems.length === 0 ? (
            <div className="studentVideoTodayLiveEmpty">
              <span>📅</span>

              <div>
                <strong>No live class scheduled yet.</strong>

                <p>
                  Upcoming, join-now, replay-ready, and cancelled live classroom
                  updates will appear here when admin schedules them.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/ctet-tet/videos/plan/FREE")}
              >
                Browse Recordings →
              </button>
            </div>
          ) : (
            <div className="studentVideoTodayLiveGrid">
              {dashboardLiveItems.map((live) => (
                <button
                  type="button"
                  className={`studentVideoTodayLiveCard studentVideoTodayLive-${live.state} ${live.statusClassName}`}
                  key={live.item.id}
                  onClick={() =>
                    navigate(`/ctet-tet/videos/watch/${live.item.id}`)
                  }
                >
                  <span className="studentVideoTodayLiveState">
                    {live.stateLabel}
                  </span>

                  <strong>
                    {live.item.title || "AspireNest Live Class"}
                  </strong>

                  <p>
                    {live.item.subject || "Subject"} •{" "}
                    {live.item.chapter || "Chapter"}
                  </p>

                  <div className="studentVideoTodayLiveMeta">
                    <span>
                      📅 {getLiveDateLabel(live.item, todayKey)}
                    </span>

                    <span>🕒 {getLiveTimeLabel(live.item)}</span>

                    <span>🔐 {live.item.planType || "FREE"} access</span>
                  </div>

                  <em>{getLiveActionLabel(live.state)}</em>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="studentVideoPlanSection studentVideoPlanPrime">
          <div className="studentVideoSectionTitle">
            <span>Classroom Shelves</span>

            <h2>Choose your learning path</h2>

            <p>
              Select a plan shelf and continue into subject-wise and
              chapter-wise classrooms.
            </p>
          </div>

          <div className="studentVideoPlanGrid">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.id] || PLAN_META.FREE;

              return (
                <button
                  type="button"
                  className={`studentVideoPlanCard studentVideoPlan-${meta.tone}`}
                  key={plan.id}
                  onClick={() => navigate(`/ctet-tet/videos/plan/${plan.id}`)}
                >
                  <span className="studentVideoPlanIcon">{meta.icon}</span>

                  <span className="studentVideoPlanMeta">
                    <strong>{meta.title}</strong>
                    <small>{meta.subtitle}</small>
                  </span>

                  <span className="studentVideoPlanCount">
                    {plan.count}
                    <small>Classes</small>
                  </span>

                  <span className="studentVideoPlanTag">
                    {plan.recordedCount} Recorded • {plan.liveCount} Live
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="studentVideoExperienceSection studentVideoExperiencePrime">
          <div className="studentVideoExperienceCard">
            <div>
              <span className="studentVideoMiniKicker">
                One App • One System
              </span>

              <h2>No random links. No broken learning flow.</h2>

              <p>
                Your classroom keeps plan shelf, subject, chapter, notes, live
                status, replay, related learning, and continue learning connected
                in one premium student experience.
              </p>
            </div>

            <div className="studentVideoBenefitCards">
              {learningBenefits.map((item) => (
                <article key={item.title}>
                  <span>{item.icon}</span>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="studentVideoLatestSection studentVideoLatestPrime">
          <div className="studentVideoSectionTitle studentVideoLatestHeaderPrime">
            <div>
              <span>Continue Learning</span>

              <h2>Latest classroom items</h2>

              <p>
                Open the newest published class directly, or continue from plan,
                subject, and chapter shelves.
              </p>
            </div>

            <button
              type="button"
              className="studentVideoSecondaryButton"
              onClick={() => navigate("/ctet-tet/videos/plan/FREE")}
            >
              Browse Free Shelf →
            </button>
          </div>

          {latestItems.length === 0 ? (
            <div className="studentVideoEmptyState">
              <strong>No published classes yet.</strong>

              <p>
                Published recorded lessons and live classes will appear here
                after admin adds them.
              </p>
            </div>
          ) : (
            <div className="studentVideoLatestPremiumLayout">
              <button
                type="button"
                className="studentVideoFeaturedLatestCard"
                onClick={() =>
                  navigate(`/ctet-tet/videos/watch/${latestItems[0].id}`)
                }
              >
                <span className="studentVideoFeaturedLatestBadge">
                  {videoLibrary.getClassMode(latestItems[0]) === "LIVE"
                    ? "🔴 Live Classroom"
                    : "▶️ Featured Recording"}
                </span>

                <strong>{latestItems[0].title || "AspireNest Class"}</strong>

                <p>
                  {latestItems[0].subject || "Subject"} •{" "}
                  {latestItems[0].chapter || "Chapter"}
                </p>

                <span className="studentVideoFeaturedLatestMeta">
                  {latestItems[0].planType || "FREE"} •{" "}
                  {videoLibrary.getClassMode(latestItems[0])}
                </span>

                <em>Open Class →</em>
              </button>

              <div className="studentVideoLatestStack">
                {latestItems.slice(1).map((item) => {
                  const mode = videoLibrary.getClassMode(item);

                  return (
                    <button
                      type="button"
                      className="studentVideoLatestCard"
                      key={item.id}
                      onClick={() =>
                        navigate(`/ctet-tet/videos/watch/${item.id}`)
                      }
                    >
                      <span className="studentVideoLatestIcon">
                        {mode === "LIVE" ? "🔴" : "▶️"}
                      </span>

                      <span className="studentVideoLatestCopy">
                        <strong>{item.title || "AspireNest Class"}</strong>

                        <small>
                          {item.subject || "Subject"} •{" "}
                          {item.chapter || "Chapter"}
                        </small>
                      </span>

                      <span className="studentVideoLatestTag">
                        {item.planType || "FREE"} • {mode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}