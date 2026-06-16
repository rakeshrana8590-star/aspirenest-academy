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

const normalizeStatus = (value = "published") =>
  value.toString().trim().toLowerCase();

const getMode = (item = {}) =>
  (item.classMode || "RECORDED").toString().trim().toUpperCase();

const isLiveItem = (item = {}) => getMode(item) === "LIVE";

const isRecordedItem = (item = {}) => getMode(item) === "RECORDED";

const getTimeValue = (value) => {
  if (!value) return 0;

  if (value?.seconds) return value.seconds * 1000;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getLiveBucket = (item = {}) => {
  if (!isLiveItem(item)) return "RECORDED";

  const now = new Date();

  const startDateTime =
    item.liveStartDate && item.liveStartTime
      ? new Date(`${item.liveStartDate}T${item.liveStartTime}`)
      : item.liveStartDate
      ? new Date(`${item.liveStartDate}T00:00`)
      : null;

  const endDateTime =
    item.liveEndDate && item.liveEndTime
      ? new Date(`${item.liveEndDate}T${item.liveEndTime}`)
      : item.liveEndDate
      ? new Date(`${item.liveEndDate}T23:59`)
      : null;

  if (startDateTime && now < startDateTime) {
    return "SCHEDULED";
  }

  if (
    startDateTime &&
    endDateTime &&
    now >= startDateTime &&
    now <= endDateTime
  ) {
    return "LIVE_NOW";
  }

  if (endDateTime && now > endDateTime && item.replayUrl) {
    return "REPLAY";
  }

  if (endDateTime && now > endDateTime) {
    return "ENDED";
  }

  return "LIVE";
};

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

  const stats = React.useMemo(
    () => ({
      total: allVideos.length,
      recorded: allVideos.filter(isRecordedItem).length,
      live: allVideos.filter(isLiveItem).length,
      published: allVideos.filter(
        (item) => normalizeStatus(item.status) === "published"
      ).length,
      draft: allVideos.filter(
        (item) => normalizeStatus(item.status) === "draft"
      ).length,
      replay: allVideos.filter((item) => getLiveBucket(item) === "REPLAY")
        .length,
    }),
    [allVideos]
  );

  const filteredVideos = React.useMemo(() => {
    const finalSearch = searchText.trim().toLowerCase();

    return allVideos.filter((item) => {
      const matchesSearch =
        !finalSearch ||
        item.title?.toLowerCase().includes(finalSearch) ||
        item.subject?.toLowerCase().includes(finalSearch) ||
        item.chapter?.toLowerCase().includes(finalSearch) ||
        item.mentorName?.toLowerCase().includes(finalSearch);

      const status = normalizeStatus(item.status);
      const bucket = getLiveBucket(item);

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "RECORDED" && isRecordedItem(item)) ||
        (activeFilter === "LIVE" && isLiveItem(item)) ||
        (activeFilter === "SCHEDULED" && bucket === "SCHEDULED") ||
        (activeFilter === "REPLAY" && bucket === "REPLAY") ||
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

    const currentStatus = normalizeStatus(video.status);

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

    const {
      id,
      createdAt,
      updatedAt,
      editedAt,
      ...safePayload
    } = video;

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

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">VIDEO LIBRARY</span>

        <h1>Manage Video & Live Classes</h1>

        <p>
          Review, edit, publish, unpublish, duplicate, delete, and preview
          recorded lessons, live classes, and replay-ready classroom content.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{stats.recorded}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live</span>
          <strong>{stats.live}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Published</span>
          <strong>{stats.published}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Draft</span>
          <strong>{stats.draft}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Replay</span>
          <strong>{stats.replay}</strong>
        </div>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioGrid">
          <input
            type="text"
            placeholder="Search title, subject, chapter, mentor..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="ALL">All Classes</option>
            <option value="RECORDED">Recorded Lessons</option>
            <option value="LIVE">Live Classes</option>
            <option value="SCHEDULED">Scheduled Live</option>
            <option value="REPLAY">Replay Available</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>

          <button
            className="publishButton"
            onClick={() => navigate("/admin/content/videos/add")}
          >
            + Add Class
          </button>

          <button
            className="backButton"
            onClick={() => navigate("/admin/content/videos")}
          >
            ← Back to Video Manager
          </button>
        </div>
      </div>

      <div className="contentStudioList videoLibraryList">
        <div className="videoLibraryHeader">
          <div>
            <h3>Saved Classes</h3>

            <p>
              Showing {filteredVideos.length} of {allVideos.length} classroom
              items.
            </p>
          </div>

          <button
            className="backButton"
            onClick={() => {
              setSearchText("");
              setActiveFilter("ALL");
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="videoLibraryGrid">
          {filteredVideos.length === 0 ? (
            <div className="contentStudioItem videoEmptyState">
              <strong>No video or live classes found.</strong>

              <p>
                Add your first recorded lesson or live class from the Video
                Manager.
              </p>

              <div className="contentStudioActions">
                <button
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