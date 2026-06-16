import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

export default function VideoSubjectsRoute({ universalContent = [] }) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const subjects = videoLibrary.getSubjects();

  const totalClasses = videoLibrary.allVideos.length;
  const publishedClasses = videoLibrary.publishedVideos.length;
  const liveClasses = videoLibrary.liveClasses.length;
  const recordedClasses = videoLibrary.recordedVideos.length;

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">VIDEO SUBJECTS</span>

        <h1>Video Subject Library</h1>

        <p>
          Browse all subjects connected with recorded lessons, live classes,
          and classroom replays.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{totalClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Published</span>
          <strong>{publishedClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live</span>
          <strong>{liveClasses}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{recordedClasses}</strong>
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
            <h3>Subjects</h3>

            <p>
              {subjects.length} subject
              {subjects.length === 1 ? "" : "s"} found in video classroom.
            </p>
          </div>
        </div>

        <div className="videoSubjectGrid">
          {subjects.length === 0 ? (
            <div className="contentStudioItem videoEmptyState">
              <strong>No video subjects found.</strong>

              <p>
                Add a recorded lesson or live class first. Subject shelves will
                appear here automatically.
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
            subjects.map((subject) => (
              <button
                type="button"
                className="videoLibraryCard"
                key={subject.id}
                onClick={() =>
                  navigate(
                    `/admin/content/videos/${encodeURIComponent(
                      subject.name
                    )}`
                  )
                }
              >
                <div className="videoLibraryCardIcon">📚</div>

                <h3>{subject.title}</h3>

                <p>
                  Open chapter-wise recorded lessons, live classes, and replay
                  sessions for this subject.
                </p>

                <span className="videoLibraryCardTag">
                  {subject.count} Classes • {subject.liveCount} Live •{" "}
                  {subject.recordedCount} Recorded
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}