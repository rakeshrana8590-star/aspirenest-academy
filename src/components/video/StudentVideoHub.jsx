import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";
import { LIVE_CLASS_STATUS } from "./videoConstants.js";
import { getLiveClassStatus } from "./videoUtils.js";

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

const getLiveTimeLabel = (item = {}) => {
  if (!item.liveStartTime) return "Time will be announced";

  if (item.liveEndTime) {
    return `${item.liveStartTime} - ${item.liveEndTime}`;
  }

  return item.liveStartTime;
};

const getLiveStateLabel = (state) => {
  if (state === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Now";
  if (state === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Replay Available";
  if (state === LIVE_CLASS_STATUS.ENDED) return "Ended";
  if (state === LIVE_CLASS_STATUS.CANCELLED) return "Cancelled";

  return "Upcoming";
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
    title: "Subject Shelves",
    text: "Plan → subject → chapter → classroom path stays connected.",
  },
];

export default function StudentVideoHub({ universalContent = [] }) {
  const navigate = useNavigate();
  const videoLibrary = useVideoLibrary(universalContent);

  const plans = videoLibrary.getPlans();
  const latestItems = videoLibrary.publishedVideos.slice(0, 6);
  const featuredClass = latestItems[0] || null;
  const todayKey = getLocalDateKey();

  const todayLiveClasses = videoLibrary.liveClasses
    .filter((item) => item.liveStartDate === todayKey)
    .sort((first, second) =>
      `${first.liveStartDate || ""}T${first.liveStartTime || "00:00"}`.localeCompare(
        `${second.liveStartDate || ""}T${second.liveStartTime || "00:00"}`
      )
    );
  
  const upcomingLiveClasses = videoLibrary.liveClasses
    .filter((item) => {
      const state = getLiveClassStatus(item);
  
      return (
        state === LIVE_CLASS_STATUS.JOIN_NOW ||
        state === LIVE_CLASS_STATUS.UPCOMING
      );
    })
    .sort((first, second) =>
      `${first.liveStartDate || ""}T${first.liveStartTime || "00:00"}`.localeCompare(
        `${second.liveStartDate || ""}T${second.liveStartTime || "00:00"}`
      )
    );
  
  const nextLiveClass = todayLiveClasses[0] || upcomingLiveClasses[0] || null;


  const totalClasses = videoLibrary.publishedVideos.length;
  const recordedCount = videoLibrary.recordedVideos.length;
  const liveCount = videoLibrary.liveClasses.length;
  const subjectCount = videoLibrary.getSubjects().length;

  const heroStats = [
    { value: totalClasses, label: "Published classes" },
    { value: recordedCount, label: "Recorded lessons" },
    { value: liveCount, label: "Live classes" },
    { value: subjectCount, label: "Subject shelves" },
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
              and chapter-wise CTET/TET learning stay connected in one clean
              AspireNest system.
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
              <span>✓ Replay-ready</span>
              <span>✓ Live class connected</span>
            </div>
          </div>

          <aside className="studentVideoLearningPanel">
            <div className="studentVideoPanelHeader">
              <span>Now Learning</span>
              <strong>Classroom ON</strong>
            </div>

            <div className="studentVideoNowCard">
              <span className="studentVideoNowIcon">
                {featuredClass &&
                videoLibrary.getClassMode(featuredClass) === "LIVE"
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
      <h2>Today’s live classes</h2>
      <p>
  See today’s live schedule, join-now classes, ended sessions, replay-ready
  classrooms, and cancelled updates in one place.
</p>
    </div>

    {nextLiveClass && (
      <button
        type="button"
        className="studentVideoSecondaryButton"
        onClick={() => navigate(`/ctet-tet/videos/watch/${nextLiveClass.id}`)}
      >
        Open Next Live →
      </button>
    )}
  </div>

  {todayLiveClasses.length === 0 ? (
    <div className="studentVideoTodayLiveEmpty">
      <span>📅</span>

      <div>
        <strong>No live class scheduled today.</strong>

        <p>
          {nextLiveClass
            ? `Next live: ${nextLiveClass.title || "AspireNest Live Class"} • ${
                nextLiveClass.liveStartDate || "Date pending"
              } • ${getLiveTimeLabel(nextLiveClass)}`
            : "Upcoming live classes will appear here when admin schedules them."}
        </p>
      </div>

      {nextLiveClass && (
        <button
          type="button"
          onClick={() => navigate(`/ctet-tet/videos/watch/${nextLiveClass.id}`)}
        >
          View Next Live →
        </button>
      )}
    </div>
  ) : (
    <div className="studentVideoTodayLiveGrid">
      {todayLiveClasses.map((item) => {
        const liveState = getLiveClassStatus(item);
        const stateLabel = getLiveStateLabel(liveState);

        return (
          <button
            type="button"
            className={`studentVideoTodayLiveCard studentVideoTodayLive-${liveState}`}
            key={item.id}
            onClick={() => navigate(`/ctet-tet/videos/watch/${item.id}`)}
          >
            <span className="studentVideoTodayLiveState">
              {stateLabel}
            </span>

            <strong>{item.title || "AspireNest Live Class"}</strong>

            <p>
              {item.subject || "Subject"} • {item.chapter || "Chapter"}
            </p>

            <div className="studentVideoTodayLiveMeta">
              <span>🕒 {getLiveTimeLabel(item)}</span>
              <span>🔐 {item.planType || "FREE"} access</span>
            </div>

            <em>
              {liveState === LIVE_CLASS_STATUS.JOIN_NOW
                ? "Join Now →"
                : liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
                ? "Watch Replay →"
                : liveState === LIVE_CLASS_STATUS.CANCELLED
                ? "View Details →"
                : "Open Live Room →"}
            </em>
          </button>
        );
      })}
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
              <span className="studentVideoMiniKicker">One App • One System</span>

              <h2>No random links. No broken learning flow.</h2>

              <p>
                Your classroom keeps plan shelf, subject, chapter, live status,
                replay, related learning, and continue learning connected in
                one premium student experience.
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
        Published recorded lessons and live classes will appear here after admin
        adds them.
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
              onClick={() => navigate(`/ctet-tet/videos/watch/${item.id}`)}
            >
              <span className="studentVideoLatestIcon">
                {mode === "LIVE" ? "🔴" : "▶️"}
              </span>

              <span className="studentVideoLatestCopy">
                <strong>{item.title || "AspireNest Class"}</strong>

                <small>
                  {item.subject || "Subject"} • {item.chapter || "Chapter"}
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