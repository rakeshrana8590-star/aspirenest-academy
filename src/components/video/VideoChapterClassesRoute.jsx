import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import VideoAdminCard from "./VideoAdminCard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

export default function VideoChapterClassesRoute({ universalContent = [] }) {
  const navigate = useNavigate();

  const { subjectName = "", chapterName = "" } = useParams();

  const decodedSubject = decodeURIComponent(subjectName || "");
  const decodedChapter = decodeURIComponent(chapterName || "");

  const videoLibrary = useVideoLibrary(universalContent);

  const chapterItems = videoLibrary
    .allVideos
    .filter((video) => {
      const sameSubject =
        videoLibrary.normalizeText(video.subject) ===
        videoLibrary.normalizeText(decodedSubject);

      const sameChapter =
        videoLibrary.normalizeText(video.chapter) ===
        videoLibrary.normalizeText(decodedChapter);

      return sameSubject && sameChapter;
    });

  const recordedCount = chapterItems.filter(
    (item) => videoLibrary.getClassMode(item) === "RECORDED"
  ).length;

  const liveCount = chapterItems.filter(
    (item) => videoLibrary.getClassMode(item) === "LIVE"
  ).length;

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">CHAPTER CLASSES</span>

        <h1>{decodedChapter || "Chapter Classes"}</h1>

        <p>
          {decodedSubject || "Subject"} • Review all recorded lessons, live
          classes, and replays inside this chapter.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{chapterItems.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{recordedCount}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live</span>
          <strong>{liveCount}</strong>
        </div>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate(
                `/admin/content/videos/${encodeURIComponent(decodedSubject)}`
              )
            }
          >
            ← Back to Video Chapters
          </button>

          <button
            className="publishButton"
            onClick={() => navigate("/admin/content/videos/add")}
          >
            + Add Class
          </button>

          <button
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
            <h3>Classes in {decodedChapter}</h3>

            <p>
              Showing {chapterItems.length} classroom item
              {chapterItems.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="videoLibraryGrid">
          {chapterItems.length === 0 ? (
            <div className="contentStudioItem videoEmptyState">
              <strong>No classes found.</strong>

              <p>
                Add a recorded lesson or live class under this subject and
                chapter first.
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
            chapterItems.map((video) => (
              <VideoAdminCard
                key={video.id}
                video={video}
                onPreview={() =>
                  navigate(`/ctet-tet/videos/watch/${video.id}`)
                }
                onEdit={() =>
                  navigate(`/admin/content/videos/add?editId=${video.id}`)
                }
                onToggleStatus={null}
                onDelete={null}
                onOpenMenu={null}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}