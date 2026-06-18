import React from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import VideoAdminCard from "./VideoAdminCard.jsx";
import VideoActionMenu from "./VideoActionMenu.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

import {
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusLabel,
  isLiveClass,
  isRecordedClass,
  LIVE_CLASS_STATUS,
  normalizeVideoStatus,
  normalizeVideoText,
} from "./videoUtils.js";

const getTimeValue = (value) => {
  if (!value) return 0;

  if (value?.seconds) return value.seconds * 1000;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getLibraryBucket = (item = {}) => {
  if (isRecordedClass(item)) return "RECORDED";

  return getLiveClassStatus(item);
};

const getLiveSourceState = (item = {}) => {
  if (!isLiveClass(item)) return "RECORDED";

  const liveStatus = getLiveClassStatus(item);

  const hasJoinSource = Boolean(
    item.joinUrl || item.liveUrl || item.meetingUrl
  );

  const hasReplaySource = Boolean(
    item.replayUrl ||
      item.recordingUrl ||
      item.videoUrl ||
      item.fileUrl ||
      item.sourceUrl
  );

  if (liveStatus === LIVE_CLASS_STATUS.CANCELLED) {
    return "CANCELLED";
  }

  if (
    liveStatus === LIVE_CLASS_STATUS.UPCOMING ||
    liveStatus === LIVE_CLASS_STATUS.JOIN_NOW
  ) {
    return hasJoinSource ? "SOURCE_LINKED" : "SOURCE_PENDING";
  }

  if (liveStatus === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
    return hasReplaySource ? "SOURCE_LINKED" : "SOURCE_PENDING";
  }

  if (liveStatus === LIVE_CLASS_STATUS.ENDED) {
    return hasReplaySource ? "SOURCE_LINKED" : "REPLAY_PENDING";
  }

  return hasJoinSource || hasReplaySource ? "SOURCE_LINKED" : "SOURCE_PENDING";
};

const filterOptions = [
  { value: "ALL", label: "All Classes" },
  { value: "RECORDED", label: "Recorded Lessons" },
  { value: "LIVE", label: "All Live Classes" },
  { value: "UPCOMING", label: "Upcoming Live" },
  { value: "JOIN_NOW", label: "Join Now" },
  { value: "REPLAY_AVAILABLE", label: "Replay Available" },
  { value: "ENDED", label: "Ended Live" },
  { value: "CANCELLED", label: "Cancelled Live" },
  { value: "SOURCE_PENDING", label: "Source Pending" },
  { value: "REPLAY_PENDING", label: "Replay Pending" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNPUBLISHED", label: "Unpublished" },
];

export default function VideoLibraryManageRoute({
  db,
  universalContent = [],
  reloadContent,
}) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const [activeFilter, setActiveFilter] = React.useState("ALL");
  const [searchText, setSearchText] = React.useState("");
  const [menuPosition, setMenuPosition] = React.useState(null);
  const [menuVideo, setMenuVideo] = React.useState(null);

  const allVideos = React.useMemo(
    () =>
      [...videoLibrary.allVideos].sort((a, b) => {
        const firstDate =
          getTimeValue(a.updatedAt) || getTimeValue(a.createdAt);

        const secondDate =
          getTimeValue(b.updatedAt) || getTimeValue(b.createdAt);

        return secondDate - firstDate;
      }),
    [videoLibrary.allVideos]
  );

  const stats = React.useMemo(() => {
    const liveItems = allVideos.filter(isLiveClass);

    return {
      total: allVideos.length,
      published: allVideos.filter(
        (item) => normalizeVideoStatus(item.status) === "published"
      ).length,
      recorded: allVideos.filter(isRecordedClass).length,
      live: liveItems.length,
      joinNow: liveItems.filter(
        (item) => getLiveClassStatus(item) === LIVE_CLASS_STATUS.JOIN_NOW
      ).length,
      upcoming: liveItems.filter(
        (item) => getLiveClassStatus(item) === LIVE_CLASS_STATUS.UPCOMING
      ).length,
      replay: liveItems.filter(
        (item) =>
          getLiveClassStatus(item) === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      ).length,
      ended: liveItems.filter(
        (item) => getLiveClassStatus(item) === LIVE_CLASS_STATUS.ENDED
      ).length,
      cancelled: liveItems.filter(
        (item) => getLiveClassStatus(item) === LIVE_CLASS_STATUS.CANCELLED
      ).length,
      sourcePending: liveItems.filter(
        (item) => getLiveSourceState(item) === "SOURCE_PENDING"
      ).length,
      replayPending: liveItems.filter(
        (item) => getLiveSourceState(item) === "REPLAY_PENDING"
      ).length,
      draft: allVideos.filter(
        (item) => normalizeVideoStatus(item.status) === "draft"
      ).length,
      unpublished: allVideos.filter(
        (item) => normalizeVideoStatus(item.status) === "unpublished"
      ).length,
    };
  }, [allVideos]);

  const liveStateCards = [
    {
      key: "JOIN_NOW",
      label: "Join Now",
      value: stats.joinNow,
      filter: "JOIN_NOW",
      hint: "Live window active",
    },
    {
      key: "UPCOMING",
      label: "Upcoming",
      value: stats.upcoming,
      filter: "UPCOMING",
      hint: "Scheduled ahead",
    },
    {
      key: "REPLAY_AVAILABLE",
      label: "Replay",
      value: stats.replay,
      filter: "REPLAY_AVAILABLE",
      hint: "Recording ready",
    },
    {
      key: "ENDED",
      label: "Ended",
      value: stats.ended,
      filter: "ENDED",
      hint: "Replay pending",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      value: stats.cancelled,
      filter: "CANCELLED",
      hint: "Student update",
    },
    {
      key: "SOURCE_PENDING",
      label: "Source Pending",
      value: stats.sourcePending + stats.replayPending,
      filter: "SOURCE_PENDING",
      hint: "Needs link",
    },
  ];

  const filteredVideos = React.useMemo(() => {
    const finalSearch = normalizeVideoText(searchText);

    return allVideos.filter((item) => {
      const searchableText = normalizeVideoText(
        [
          item.title,
          item.subject,
          item.chapter,
          item.mentorName,
          item.planType,
          item.sourceType,
          item.livePlatform,
          getLiveStatusLabel(getLibraryBucket(item)),
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch =
        !finalSearch || searchableText.includes(finalSearch);

      const status = normalizeVideoStatus(item.status);
      const bucket = getLibraryBucket(item);
      const sourceState = getLiveSourceState(item);

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "RECORDED" && isRecordedClass(item)) ||
        (activeFilter === "LIVE" && isLiveClass(item)) ||
        (activeFilter === "UPCOMING" &&
          bucket === LIVE_CLASS_STATUS.UPCOMING) ||
        (activeFilter === "JOIN_NOW" &&
          bucket === LIVE_CLASS_STATUS.JOIN_NOW) ||
        (activeFilter === "REPLAY_AVAILABLE" &&
          bucket === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) ||
        (activeFilter === "ENDED" && bucket === LIVE_CLASS_STATUS.ENDED) ||
        (activeFilter === "CANCELLED" &&
          bucket === LIVE_CLASS_STATUS.CANCELLED) ||
        (activeFilter === "SOURCE_PENDING" &&
          sourceState === "SOURCE_PENDING") ||
        (activeFilter === "REPLAY_PENDING" &&
          sourceState === "REPLAY_PENDING") ||
        (activeFilter === "PUBLISHED" && status === "published") ||
        (activeFilter === "DRAFT" && status === "draft") ||
        (activeFilter === "UNPUBLISHED" && status === "unpublished");

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, allVideos, searchText]);

  const closeMenu = () => {
    setMenuPosition(null);
    setMenuVideo(null);
  };

  const openMenu = (event, video) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setMenuVideo(video);
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 250),
    });
  };

  const previewVideo = (video) => {
    if (!video?.id) return;

    navigate(`/ctet-tet/videos/watch/${video.id}`);
  };

  const editVideo = (video) => {
    if (!video?.id) return;

    navigate(`/admin/content/videos/add?editId=${video.id}`);
  };

  const toggleStatus = async (video) => {
    if (!video?.id) return;

    const currentStatus = normalizeVideoStatus(video.status);

    const nextStatus =
      currentStatus === "published" ? "unpublished" : "published";

    await updateDoc(doc(db, "contentItems", video.id), {
      status: nextStatus,
      updatedAt: new Date(),
    });

    await reloadContent?.();
  };

  const duplicateVideo = async (video) => {
    if (!video?.id) return;

    const confirmDuplicate = window.confirm(
      `Duplicate "${video.title || "this class"}" as Draft?`
    );

    if (!confirmDuplicate) return;

    const { id, createdAt, updatedAt, editedAt, ...safePayload } = video;

    await addDoc(collection(db, "contentItems"), {
      ...safePayload,
      title: `${video.title || "Class"} Copy`,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await reloadContent?.();
  };

  const deleteVideo = async (video) => {
    if (!video?.id) return;

    const confirmDelete = window.confirm(
      `Delete "${video.title || "this class"}" permanently?\n\nStudents may lose access to this classroom item.\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "contentItems", video.id));

    await reloadContent?.();
  };

  const clearFilters = () => {
    setSearchText("");
    setActiveFilter("ALL");
  };

  return (
    <section className="coursePages videoManagePage">
      <div className="videoManageShell">
        <section className="videoManageHero">
          <div className="videoManageHeroCopy">
            <span className="videoManageKicker">VIDEO LIBRARY CMS</span>

            <h1>Classroom Control Center</h1>

            <p>
              Manage recorded lessons, live sessions, replay links, plan access,
              publishing status, source readiness, and student classroom
              visibility from one protected admin workspace.
            </p>

            <div className="videoManageHeroActions">
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
                onClick={() => navigate("/admin/content/videos")}
              >
                ← Video Manager
              </button>
            </div>
          </div>

          <aside className="videoManageHeroPanel">
            <div className="videoManagePanelHeader">
              <span>Library Status</span>
              <strong>Admin ON</strong>
            </div>

            <div className="videoManagePanelGrid">
              <article>
                <strong>{filteredVideos.length}</strong>
                <span>Visible in current view</span>
              </article>

              <article>
                <strong>{stats.published}</strong>
                <span>Published classes</span>
              </article>

              <article>
                <strong>{stats.recorded}</strong>
                <span>Recorded lessons</span>
              </article>

              <article>
                <strong>{stats.live}</strong>
                <span>Live classes</span>
              </article>
            </div>

            <div className="videoManageFlowLine">
              <span>Edit</span>
              <i />
              <span>Publish</span>
              <i />
              <span>Preview</span>
            </div>
          </aside>
        </section>

        <section className="videoManageStatsGrid">
          <article>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>

          <article>
            <span>Published</span>
            <strong>{stats.published}</strong>
          </article>

          <article>
            <span>Recorded</span>
            <strong>{stats.recorded}</strong>
          </article>

          <article>
            <span>Live</span>
            <strong>{stats.live}</strong>
          </article>

          <article>
            <span>Join Now</span>
            <strong>{stats.joinNow}</strong>
          </article>

          <article>
            <span>Upcoming</span>
            <strong>{stats.upcoming}</strong>
          </article>

          <article>
            <span>Replay</span>
            <strong>{stats.replay}</strong>
          </article>

          <article>
            <span>Cancelled</span>
            <strong>{stats.cancelled}</strong>
          </article>

          <article>
            <span>Source Pending</span>
            <strong>{stats.sourcePending + stats.replayPending}</strong>
          </article>

          <article>
            <span>Draft</span>
            <strong>{stats.draft}</strong>
          </article>
        </section>

        <section className="videoManageLiveDashboard">
          <div className="videoManageListHeader">
            <div>
              <span>Live Engine</span>

              <h2>Live classroom state dashboard</h2>

              <p>
                These cards use the same status engine as the student video hub,
                chapter cards, and watch classroom.
              </p>
            </div>
          </div>

          <div className="videoManageLiveStateGrid">
            {liveStateCards.map((card) => (
              <button
                type="button"
                key={card.key}
                className={`videoManageLiveStateCard liveState-${card.key}`}
                onClick={() => setActiveFilter(card.filter)}
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="videoManageWorkspace">
          <aside className="videoManageFilterRail">
            <div className="videoManageFilterHeader">
              <span>Control Panel</span>
              <strong>Search · Filter · Publish</strong>
            </div>

            <label>
              Search Library
              <input
                type="text"
                placeholder="Title, subject, chapter, mentor, live state..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>

            <label>
              Library Filter
              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value)}
              >
                {filterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </aside>

          <div className="videoManageListPanel">
            <div className="videoManageListHeader">
              <div>
                <span>Saved Classes</span>

                <h2>Classroom Library</h2>

                <p>
                  Showing {filteredVideos.length} of {allVideos.length} video
                  and live class items.
                </p>
              </div>
            </div>

            <div className="videoManageGrid">
              {filteredVideos.length === 0 ? (
                <div className="contentStudioItem videoEmptyState videoManageEmptyState">
                  <strong>No video or live classes found.</strong>

                  <p>
                    Add your first recorded lesson or live class from the Video
                    Manager.
                  </p>

                  <div className="contentStudioActions">
                    <button
                      type="button"
                      className="publishButton"
                      onClick={() => navigate("/admin/content/videos/add")}
                    >
                      + Add Class
                    </button>
                  </div>
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <VideoAdminCard
                    key={video.id}
                    video={video}
                    onPreview={previewVideo}
                    onEdit={editVideo}
                    onToggleStatus={toggleStatus}
                    onDelete={deleteVideo}
                    onOpenMenu={openMenu}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <VideoActionMenu
        position={menuPosition}
        video={menuVideo}
        onClose={closeMenu}
        onPreview={previewVideo}
        onEdit={editVideo}
        onToggleStatus={toggleStatus}
        onDuplicate={duplicateVideo}
        onDelete={deleteVideo}
      />
    </section>
  );
}