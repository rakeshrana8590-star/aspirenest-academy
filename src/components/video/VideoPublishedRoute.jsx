import React from "react";
import { useNavigate } from "react-router-dom";

import VideoAdminCard from "./VideoAdminCard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

const getTimeValue = (value) => {
  if (!value) return 0;

  if (value?.seconds) return value.seconds * 1000;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  const liveCount = publishedVideos.filter(
    (item) => videoLibrary.getClassMode(item) === "LIVE"
  ).length;

  const recordedCount = publishedVideos.filter(
    (item) => videoLibrary.getClassMode(item) === "RECORDED"
  ).length;

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">PUBLISHED CLASSES</span>

        <h1>Published Video & Live Classes</h1>

        <p>
          Student-visible recorded lessons, live classes, and replay-ready
          classroom items.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Published Classes</span>
          <strong>{publishedVideos.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live Classes</span>
          <strong>{liveCount}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{recordedCount}</strong>
        </div>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            type="button"
            className="backButton"
            onClick={() => navigate("/admin/content/videos")}
          >
            ← Back to Video Manager
          </button>

          <button
            type="button"
            className="publishButton"
            onClick={() => navigate("/admin/content/videos/add")}
          >
            + Add Class
          </button>

          <button
            type="button"
            className="backButton"
            onClick={() => navigate("/admin/content/videos/manage")}
          >
            Manage Library
          </button>
        </div>
      </div>

      <div className="contentStudioList videoLibraryList">
        <div className="videoLibraryHeader">
          <div>
            <h3>Student-visible classroom items</h3>

            <p>
              Showing {publishedVideos.length} published class
              {publishedVideos.length === 1 ? "" : "es"}.
            </p>
          </div>
        </div>

        <div className="videoLibraryGrid">
          {publishedVideos.length === 0 ? (
            <div className="contentStudioItem videoEmptyState">
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
      </div>
    </section>
  );
}