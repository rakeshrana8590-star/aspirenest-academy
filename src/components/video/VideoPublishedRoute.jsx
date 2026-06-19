import React from "react";
import { useNavigate } from "react-router-dom";

import VideoAdminCard from "./VideoAdminCard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";
import "../../styles/video/videoManageLibrary.css";

import {
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusLabel,
  isLiveClass,
  isRecordedClass,
  LIVE_CLASS_STATUS,
  normalizePlanType,
} from "./videoUtils.js";

const getTimeValue = (value) => {
  if (!value) return 0;

  if (value?.seconds) return value.seconds * 1000;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const PLAN_COPY = {
  FREE: {
    title: "Free Shelf",
    hint: "Open learning entry point",
    icon: "🎓",
  },
  BASIC: {
    title: "Basic Shelf",
    hint: "Structured classroom path",
    icon: "🔷",
  },
  PREMIUM: {
    title: "Premium Shelf",
    hint: "Premium recorded/replay classes",
    icon: "⭐",
  },
  MENTORSHIP: {
    title: "Mentorship Shelf",
    hint: "Mentor-led class system",
    icon: "👩‍🏫",
  },
};

const getSourceStateLabel = (item = {}) => {
  if (isLiveClass(item)) {
    const liveState = getLiveClassStatus(item);

    if (liveState === LIVE_CLASS_STATUS.CANCELLED) return "Cancelled";
    if (liveState === LIVE_CLASS_STATUS.JOIN_NOW) return "Live access";
    if (liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Replay linked";
    if (liveState === LIVE_CLASS_STATUS.ENDED) return "Replay pending";
    if (liveState === LIVE_CLASS_STATUS.UPCOMING) return "Scheduled";

    return "Live setup";
  }

  return getClassroomSourceUrl(item) ? "Classroom video" : "Source pending";
};

const getFeaturedItem = (items = []) => {
  const livePriority = items.find((item) => isLiveClass(item));
  const premiumPriority = items.find(
    (item) => normalizePlanType(item.planType) === "PREMIUM"
  );

  return livePriority || premiumPriority || items[0] || null;
};

export default function VideoPublishedRoute({ universalContent = [] }) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const publishedVideos = React.useMemo(
    () =>
      [...videoLibrary.publishedVideos].sort((a, b) => {
        const firstDate =
          getTimeValue(a.updatedAt) || getTimeValue(a.createdAt);

        const secondDate =
          getTimeValue(b.updatedAt) || getTimeValue(b.createdAt);

        return secondDate - firstDate;
      }),
    [videoLibrary.publishedVideos]
  );

  const featuredItem = getFeaturedItem(publishedVideos);

  const liveCount = publishedVideos.filter(isLiveClass).length;
  const recordedCount = publishedVideos.filter(isRecordedClass).length;

  const replayReadyCount = publishedVideos.filter((item) => {
    if (isRecordedClass(item)) return Boolean(getClassroomSourceUrl(item));

    return getLiveClassStatus(item) === LIVE_CLASS_STATUS.REPLAY_AVAILABLE;
  }).length;

  const sourcePendingCount = publishedVideos.filter(
    (item) => !getClassroomSourceUrl(item)
  ).length;

  const subjectsCount = new Set(
    publishedVideos.map((item) => item.subject).filter(Boolean)
  ).size;

  const chaptersCount = new Set(
    publishedVideos
      .map((item) => `${item.subject || ""}__${item.chapter || ""}`)
      .filter(Boolean)
  ).size;

  const planCards = PLAN_ORDER.map((plan) => {
    const items = publishedVideos.filter(
      (item) => normalizePlanType(item.planType) === plan
    );

    return {
      id: plan,
      ...(PLAN_COPY[plan] || PLAN_COPY.FREE),
      total: items.length,
      recorded: items.filter(isRecordedClass).length,
      live: items.filter(isLiveClass).length,
    };
  });

  const heroStats = [
    {
      label: "Published classes",
      value: publishedVideos.length,
    },
    {
      label: "Recorded lessons",
      value: recordedCount,
    },
    {
      label: "Live classrooms",
      value: liveCount,
    },
    {
      label: "Replay ready",
      value: replayReadyCount,
    },
  ];

  const healthStats = [
    {
      label: "Subjects",
      value: subjectsCount,
      hint: "Published subject shelves",
    },
    {
      label: "Chapters",
      value: chaptersCount,
      hint: "Connected chapter nodes",
    },
    {
      label: "Source pending",
      value: sourcePendingCount,
      hint: "Needs classroom URL",
    },
    {
      label: "Student visible",
      value: publishedVideos.length,
      hint: "Live on student side",
    },
  ];

  const openFeatured = () => {
    if (!featuredItem?.id) {
      navigate("/admin/content/videos/manage");
      return;
    }

    navigate(`/ctet-tet/videos/watch/${featuredItem.id}`);
  };

  return (
    <section className="coursePages videoPublishedPage">
      <div className="videoPublishedShell">
        <section className="videoPublishedHero">
          <div className="videoPublishedHeroCopy">
            <span className="videoPublishedKicker">PUBLISHED CLASSES</span>

            <h1>Published Video Classroom Command Center</h1>

            <p>
              Review every student-visible recorded lesson, live class, replay
              item, plan shelf, subject node, chapter connection, and classroom
              source from one premium admin workspace.
            </p>

            <div className="videoPublishedHeroActions">
              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/add")}
              >
                + Add Class
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos")}
              >
                ← Video Manager
              </button>
            </div>
          </div>

          <aside className="videoPublishedHeroPanel">
            <div className="videoPublishedPanelTop">
              <span>Publish Status</span>
              <strong>Student Live</strong>
            </div>

            <div className="videoPublishedPanelStats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="videoPublishedFlowLine">
              <span>Build</span>
              <i />
              <span>Publish</span>
              <i />
              <span>Student Watch</span>
            </div>
          </aside>
        </section>

        <section className="videoPublishedHealthGrid">
          {healthStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </article>
          ))}
        </section>

        <section className="videoPublishedFeatureDeck">
          <div className="videoPublishedFeatureCopy">
            <span>Featured Published Item</span>

            <h2>
              {featuredItem?.title || "No published classroom item selected"}
            </h2>

            <p>
              {featuredItem
                ? `${featuredItem.subject || "Subject"} • ${
                    featuredItem.chapter || "Chapter"
                  } • ${normalizePlanType(featuredItem.planType || "FREE")}`
                : "Publish a recorded lesson or live class to show it here."}
            </p>

            <div className="videoPublishedFeatureTags">
              <small>
                {featuredItem && isLiveClass(featuredItem)
                  ? getLiveStatusLabel(getLiveClassStatus(featuredItem))
                  : "Recorded Lesson"}
              </small>

              <small>
                {featuredItem
                  ? getSourceStateLabel(featuredItem)
                  : "Source pending"}
              </small>

              <small>
                {featuredItem?.mentorName || "AspireNest Mentor"}
              </small>
            </div>

            <button
              type="button"
              className="videoManagerPrimaryButton"
              onClick={openFeatured}
            >
              {featuredItem ? "Preview Classroom →" : "Open Manage Library →"}
            </button>
          </div>

          <div className="videoPublishedPlanDeck">
            {planCards.map((plan) => (
              <button
                type="button"
                key={plan.id}
                className="videoPublishedPlanMiniCard"
                onClick={() =>
                  navigate(`/ctet-tet/videos/plan/${plan.id}`)
                }
              >
                <span>{plan.icon}</span>

                <strong>{plan.title}</strong>

                <small>{plan.hint}</small>

                <em>
                  {plan.total} Classes • {plan.recorded} Recorded • {plan.live} Live
                </em>
              </button>
            ))}
          </div>
        </section>

        <section className="videoPublishedLibraryBlock">
          <div className="videoPublishedLibraryHeader">
            <div>
              <span>Student-visible classroom items</span>

              <h2>Published classroom library</h2>

              <p>
                Showing {publishedVideos.length} published class
                {publishedVideos.length === 1 ? "" : "es"} across recorded,
                live, replay, subject, chapter, and plan shelves.
              </p>
            </div>

            <div className="videoPublishedHeaderActions">
              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/ctet-tet/videos")}
              >
                Student View →
              </button>

              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <div className="videoPublishedGrid">
            {publishedVideos.length === 0 ? (
              <div className="contentStudioItem videoEmptyState videoPublishedEmptyState">
                <strong>No published classes found.</strong>

                <p>
                  Publish a recorded lesson or live class from Manage Library to
                  show it here.
                </p>

                <div className="contentStudioActions">
                  <button
                    type="button"
                    className="publishButton"
                    onClick={() => navigate("/admin/content/videos/manage")}
                  >
                    Open Manage Library
                  </button>
                </div>
              </div>
            ) : (
              publishedVideos.map((video) => (
                <VideoAdminCard
                  key={video.id}
                  video={video}
                  onPreview={() =>
                    navigate(`/ctet-tet/videos/watch/${video.id}`)
                  }
                  onEdit={() =>
                    navigate(`/admin/content/videos/add?editId=${video.id}`)
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}