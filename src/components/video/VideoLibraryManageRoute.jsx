import React from "react";
import { useNavigate } from "react-router-dom";
import {
  createContentItemWithMirrors,
  deleteContentItemWithMirrors,
  updateContentItemWithMirrors,
} from "../../publicContentCatalogService";

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
  normalizePlanType,
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

const getSourceFilterState = (item = {}) => {
  if (isLiveClass(item)) {
    const liveSourceState = getLiveSourceState(item);

    if (liveSourceState === "SOURCE_LINKED") return "SOURCE_READY";
    if (liveSourceState === "REPLAY_PENDING") return "REPLAY_PENDING";
    if (liveSourceState === "SOURCE_PENDING") return "SOURCE_PENDING";

    return getClassroomSourceUrl(item) ? "SOURCE_READY" : "SOURCE_PENDING";
  }

  return getClassroomSourceUrl(item) ? "SOURCE_READY" : "SOURCE_PENDING";
};

const statusFilterOptions = [
  { value: "ALL", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "unpublished", label: "Unpublished" },
];

const classTypeFilterOptions = [
  { value: "ALL", label: "All Classes" },
  { value: "RECORDED", label: "Recorded Lessons" },
  { value: "LIVE", label: "Live Classes" },
];

const liveStateFilterOptions = [
  { value: "ALL", label: "All Live States" },
  { value: LIVE_CLASS_STATUS.UPCOMING, label: "Upcoming" },
  { value: LIVE_CLASS_STATUS.JOIN_NOW, label: "Join Now" },
  { value: LIVE_CLASS_STATUS.REPLAY_AVAILABLE, label: "Replay Available" },
  { value: LIVE_CLASS_STATUS.ENDED, label: "Ended" },
  { value: LIVE_CLASS_STATUS.CANCELLED, label: "Cancelled" },
];

const sourceFilterOptions = [
  { value: "ALL", label: "All Sources" },
  { value: "SOURCE_READY", label: "Source Ready" },
  { value: "SOURCE_PENDING", label: "Source Pending" },
  { value: "REPLAY_PENDING", label: "Replay Pending" },
];

const sortOptions = [
  { value: "LATEST", label: "Latest First" },
  { value: "OLDEST", label: "Oldest First" },
  { value: "TITLE_ASC", label: "Title A-Z" },
  { value: "TITLE_DESC", label: "Title Z-A" },
];

const planFilterOptions = [
  {
    value: "ALL",
    label: "All",
    getCount: (stats) => stats.total,
  },
  {
    value: "FREE",
    label: "Free",
    getCount: (stats) => stats.free,
  },
  {
    value: "BASIC",
    label: "Basic",
    getCount: (stats) => stats.basic,
  },
  {
    value: "PREMIUM",
    label: "Premium",
    getCount: (stats) => stats.premium,
  },
  {
    value: "MENTORSHIP",
    label: "Mentorship",
    getCount: (stats) => stats.mentorship,
  },
];

export default function VideoLibraryManageRoute({
  db,
  universalContent = [],
  reloadContent,
}) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [classTypeFilter, setClassTypeFilter] = React.useState("ALL");
  const [liveStateFilter, setLiveStateFilter] = React.useState("ALL");
  const [sourceFilter, setSourceFilter] = React.useState("ALL");
  const [sortMode, setSortMode] = React.useState("LATEST");
  const [selectedVideoIds, setSelectedVideoIds] = React.useState([]);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const [menuVideo, setMenuVideo] = React.useState(null);

  const allVideos = React.useMemo(
    () =>
      [...videoLibrary.allVideos].sort((first, second) => {
        const firstDate =
          getTimeValue(first.updatedAt) || getTimeValue(first.createdAt);

        const secondDate =
          getTimeValue(second.updatedAt) || getTimeValue(second.createdAt);

        return secondDate - firstDate;
      }),
    [videoLibrary.allVideos]
  );

  React.useEffect(() => {
    setSelectedVideoIds((previousIds) =>
      previousIds.filter((id) => allVideos.some((video) => video.id === id))
    );
  }, [allVideos]);

  const stats = React.useMemo(() => {
    const liveItems = allVideos.filter(isLiveClass);
    const sourcePendingItems = allVideos.filter((item) =>
      ["SOURCE_PENDING", "REPLAY_PENDING"].includes(getSourceFilterState(item))
    );

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
      sourcePending: sourcePendingItems.length,
      replayPending: liveItems.filter(
        (item) => getSourceFilterState(item) === "REPLAY_PENDING"
      ).length,
      draft: allVideos.filter(
        (item) => normalizeVideoStatus(item.status) === "draft"
      ).length,
      unpublished: allVideos.filter(
        (item) => normalizeVideoStatus(item.status) === "unpublished"
      ).length,
      free: allVideos.filter(
        (item) => normalizePlanType(item.planType || "FREE") === "FREE"
      ).length,
      basic: allVideos.filter(
        (item) => normalizePlanType(item.planType || "FREE") === "BASIC"
      ).length,
      premium: allVideos.filter(
        (item) => normalizePlanType(item.planType || "FREE") === "PREMIUM"
      ).length,
      mentorship: allVideos.filter(
        (item) =>
          normalizePlanType(item.planType || "FREE") === "MENTORSHIP"
      ).length,
    };
  }, [allVideos]);

  const liveStateCards = [
    {
      key: "JOIN_NOW",
      label: "Join Now",
      value: stats.joinNow,
      filter: LIVE_CLASS_STATUS.JOIN_NOW,
      hint: "Live window active",
    },
    {
      key: "UPCOMING",
      label: "Upcoming",
      value: stats.upcoming,
      filter: LIVE_CLASS_STATUS.UPCOMING,
      hint: "Scheduled ahead",
    },
    {
      key: "REPLAY_AVAILABLE",
      label: "Replay",
      value: stats.replay,
      filter: LIVE_CLASS_STATUS.REPLAY_AVAILABLE,
      hint: "Recording ready",
    },
    {
      key: "ENDED",
      label: "Ended",
      value: stats.ended,
      filter: LIVE_CLASS_STATUS.ENDED,
      hint: "Replay pending",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      value: stats.cancelled,
      filter: LIVE_CLASS_STATUS.CANCELLED,
      hint: "Student update",
    },
    {
      key: "SOURCE_PENDING",
      label: "Source Pending",
      value: stats.sourcePending,
      filter: "SOURCE_PENDING",
      hint: "Needs link",
    },
  ];

  const filteredVideos = React.useMemo(() => {
    const finalSearch = normalizeVideoText(searchText);

    const filteredItems = allVideos.filter((item) => {
      const status = normalizeVideoStatus(item.status);
      const planType = normalizePlanType(item.planType || "FREE");
      const bucket = getLibraryBucket(item);
      const sourceState = getSourceFilterState(item);
      const liveStatusLabel = isLiveClass(item)
        ? getLiveStatusLabel(bucket)
        : "Recorded Lesson";

      const searchableText = normalizeVideoText(
        [
          item.title,
          item.subject,
          item.chapter,
          item.mentorName,
          item.planType,
          item.sourceType,
          item.livePlatform,
          status,
          planType,
          liveStatusLabel,
          sourceState,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch =
        !finalSearch || searchableText.includes(finalSearch);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesPlan =
        planFilter === "ALL" || planType === planFilter;

      const matchesType =
        classTypeFilter === "ALL" ||
        (classTypeFilter === "RECORDED" && isRecordedClass(item)) ||
        (classTypeFilter === "LIVE" && isLiveClass(item));

      const matchesLiveState =
        liveStateFilter === "ALL" ||
        (isLiveClass(item) && bucket === liveStateFilter);

      const matchesSource =
        sourceFilter === "ALL" ||
        sourceState === sourceFilter ||
        (sourceFilter === "SOURCE_PENDING" &&
          sourceState === "REPLAY_PENDING");

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesType &&
        matchesLiveState &&
        matchesSource
      );
    });

    return filteredItems.sort((first, second) => {
      const firstDate =
        getTimeValue(first.updatedAt) || getTimeValue(first.createdAt);

      const secondDate =
        getTimeValue(second.updatedAt) || getTimeValue(second.createdAt);

      if (sortMode === "OLDEST") return firstDate - secondDate;
      if (sortMode === "TITLE_ASC") {
        return String(first.title || "").localeCompare(
          String(second.title || "")
        );
      }
      if (sortMode === "TITLE_DESC") {
        return String(second.title || "").localeCompare(
          String(first.title || "")
        );
      }

      return secondDate - firstDate;
    });
  }, [
    allVideos,
    classTypeFilter,
    liveStateFilter,
    planFilter,
    searchText,
    sortMode,
    sourceFilter,
    statusFilter,
  ]);

  const selectedVideos = React.useMemo(
    () =>
      allVideos.filter((video) => selectedVideoIds.includes(video.id)),
    [allVideos, selectedVideoIds]
  );

  const allVisibleSelected =
    filteredVideos.length > 0 &&
    filteredVideos.every((video) => selectedVideoIds.includes(video.id));

  const selectedVisibleCount = filteredVideos.filter((video) =>
    selectedVideoIds.includes(video.id)
  ).length;

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

    await updateContentItemWithMirrors(video.id, {
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

    await createContentItemWithMirrors({
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

    await deleteContentItemWithMirrors(video.id);

    await reloadContent?.();
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setPlanFilter("ALL");
    setClassTypeFilter("ALL");
    setLiveStateFilter("ALL");
    setSourceFilter("ALL");
    setSortMode("LATEST");
  };

  const clearSelection = () => {
    setSelectedVideoIds([]);
  };

  const toggleSelectVideo = (videoId) => {
    if (!videoId) return;

    setSelectedVideoIds((previousIds) =>
      previousIds.includes(videoId)
        ? previousIds.filter((id) => id !== videoId)
        : [...previousIds, videoId]
    );
  };

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedVideoIds((previousIds) =>
        previousIds.filter(
          (id) => !filteredVideos.some((video) => video.id === id)
        )
      );
      return;
    }

    setSelectedVideoIds((previousIds) => {
      const nextIds = new Set(previousIds);

      filteredVideos.forEach((video) => {
        if (video.id) nextIds.add(video.id);
      });

      return [...nextIds];
    });
  };

  const bulkUpdateStatus = async (nextStatus) => {
    if (selectedVideos.length === 0) return;

    const confirmUpdate = window.confirm(
      `${selectedVideos.length} selected classroom item${
        selectedVideos.length === 1 ? "" : "s"
      } ko ${nextStatus} karna hai?`
    );

    if (!confirmUpdate) return;

    await Promise.all(
      selectedVideos.map((video) =>
        updateContentItemWithMirrors(video.id, {
          status: nextStatus,
          updatedAt: new Date(),
        })
      )
    );

    clearSelection();
    await reloadContent?.();
  };

  const bulkDeleteSelected = async () => {
    if (selectedVideos.length === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedVideos.length} selected classroom item${
        selectedVideos.length === 1 ? "" : "s"
      } permanently?\n\nStudents may lose access.\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    await Promise.all(
      selectedVideos.map((video) => deleteContentItemWithMirrors(video.id))
    );

    clearSelection();
    await reloadContent?.();
  };

  const applyLiveCardFilter = (card) => {
    setClassTypeFilter("LIVE");

    if (card.key === "SOURCE_PENDING") {
      setSourceFilter("SOURCE_PENDING");
      setLiveStateFilter("ALL");
      return;
    }

    setSourceFilter("ALL");
    setLiveStateFilter(card.filter);
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
              publishing status, source readiness, bulk actions, and student
              classroom visibility from one protected admin workspace.
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
              <span>Search</span>
              <i />
              <span>Select</span>
              <i />
              <span>Publish</span>
            </div>
          </aside>
        </section>

        <section className="videoManageFilterBoard">
          <div className="videoManageFilterBoardHeader">
            <div>
              <span>Library Filters</span>
              <h2>Search · Filter · Bulk Control</h2>
              <p>
                Mock-test manage jaisa video classroom filter system: status,
                plan, type, live state, source readiness, sort, and selected
                action row.
              </p>
            </div>

            <button
              type="button"
              className="videoManagerSecondaryButton"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <div className="videoManageFilterInputGrid">
            <label>
              Search Library
              <input
                type="text"
                placeholder="Title, subject, chapter, mentor, plan, source..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusFilterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Class Type
              <select
                value={classTypeFilter}
                onChange={(event) => setClassTypeFilter(event.target.value)}
              >
                {classTypeFilterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Live State
              <select
                value={liveStateFilter}
                onChange={(event) => {
                  setLiveStateFilter(event.target.value);

                  if (event.target.value !== "ALL") {
                    setClassTypeFilter("LIVE");
                  }
                }}
              >
                {liveStateFilterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Source
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                {sourceFilterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="videoManagePlanPillRow">
            {planFilterOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`videoManagePlanPill ${
                  planFilter === option.value ? "isActive" : ""
                }`}
                onClick={() => setPlanFilter(option.value)}
              >
                <span>{option.label}</span>
                <strong>{option.getCount(stats)}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="videoManageStatsGrid">
          <article>
            <span>Filtered</span>
            <strong>{filteredVideos.length}</strong>
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
            <strong>{stats.sourcePending}</strong>
          </article>

          <article>
            <span>Selected</span>
            <strong>{selectedVideoIds.length}</strong>
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
                onClick={() => applyLiveCardFilter(card)}
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="videoManageBulkActionBar">
          <article>
            <span>Selected Classes</span>
            <strong>{selectedVideoIds.length}</strong>
            <small>
              {selectedVisibleCount} selected from current filtered view.
            </small>
          </article>

          <div className="videoManageBulkButtons">
            <button
              type="button"
              className="videoManagerSecondaryButton"
              onClick={toggleSelectVisible}
              disabled={filteredVideos.length === 0}
            >
              {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </button>

            <button
              type="button"
              className="videoManagerSecondaryButton"
              onClick={clearSelection}
              disabled={selectedVideoIds.length === 0}
            >
              Clear Selected
            </button>

            <button
              type="button"
              className="videoManagerPrimaryButton"
              onClick={() => bulkUpdateStatus("published")}
              disabled={selectedVideoIds.length === 0}
            >
              Publish
            </button>

            <button
              type="button"
              className="videoManagerSecondaryButton"
              onClick={() => bulkUpdateStatus("unpublished")}
              disabled={selectedVideoIds.length === 0}
            >
              Unpublish
            </button>

            <button
              type="button"
              className="deleteContentButton"
              onClick={bulkDeleteSelected}
              disabled={selectedVideoIds.length === 0}
            >
              Delete
            </button>
          </div>
        </section>

        <section className="videoManageWorkspace">
          <aside className="videoManageFilterRail">
            <div className="videoManageFilterHeader">
              <span>Control Panel</span>
              <strong>Current View</strong>
            </div>

            <div className="videoManageFilterSummary">
              <article>
                <span>Showing</span>
                <strong>
                  {filteredVideos.length} / {allVideos.length}
                </strong>
              </article>

              <article>
                <span>Plan</span>
                <strong>{planFilter === "ALL" ? "All" : planFilter}</strong>
              </article>

              <article>
                <span>Status</span>
                <strong>
                  {statusFilter === "ALL" ? "All" : statusFilter}
                </strong>
              </article>

              <article>
                <span>Selected</span>
                <strong>{selectedVideoIds.length}</strong>
              </article>
            </div>

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
                    Change filters or add your first recorded lesson / live
                    classroom from the Video Manager.
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
                filteredVideos.map((video) => {
                  const isSelected = selectedVideoIds.includes(video.id);

                  return (
                    <div
                      className={`videoManageSelectableCard ${
                        isSelected ? "isSelected" : ""
                      }`}
                      key={video.id}
                    >
                      <label className="videoManageSelectBox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVideo(video.id)}
                        />

                        <span>{isSelected ? "Selected" : "Select"}</span>
                      </label>

                      <VideoAdminCard
                        video={video}
                        onPreview={previewVideo}
                        onEdit={editVideo}
                        onToggleStatus={toggleStatus}
                        onDelete={deleteVideo}
                        onOpenMenu={openMenu}
                      />
                    </div>
                  );
                })
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