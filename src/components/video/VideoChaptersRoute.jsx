import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import useVideoLibrary from "./useVideoLibrary.js";

export default function VideoChaptersRoute({ universalContent = [] }) {
  const navigate = useNavigate();
  const { subjectName = "" } = useParams();

  const videoLibrary = useVideoLibrary(universalContent);

  const decodedSubject = decodeURIComponent(subjectName || "");
  const chapters = videoLibrary.getChapters({
    subjectId: decodedSubject,
  });

  return (
    <section className="coursePages videoManagerPage">
      <div className="sectionHeader">
        <span className="badge">VIDEO CHAPTERS</span>

        <h1>{decodedSubject || "Subject Chapters"}</h1>

        <p>
          Manage recorded lessons, live classes, and replays chapter-wise
          inside this subject.
        </p>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/videos/subjects")}
          >
            ← Back to Subjects
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

      <div className="contentStudioList videoChapterList">
        <h3>Chapters in {decodedSubject}</h3>

        {chapters.length === 0 ? (
          <div className="contentStudioItem videoEmptyState">
            <strong>No chapters found.</strong>

            <p>
              Add a recorded lesson or live class under this subject first.
            </p>
          </div>
        ) : (
          <div className="contentStudioGrid videoChapterGrid">
            {chapters.map((chapter) => (
              <button
                type="button"
                className="publishButton videoChapterButton"
                key={chapter.id}
                onClick={() =>
                  navigate(
                    `/admin/content/videos/${encodeURIComponent(
                      decodedSubject
                    )}/${encodeURIComponent(chapter.name)}`
                  )
                }
              >
                <span>📚 {chapter.name}</span>

                <small>
                  {chapter.count} Classes • {chapter.liveCount} Live •{" "}
                  {chapter.recordedCount} Recorded
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}