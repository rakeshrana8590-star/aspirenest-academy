import React from "react";

const getModeLabel = (video = {}) =>
  (video.classMode || "RECORDED").toString().toUpperCase();

const getStatusClass = (status = "") => {
  const finalStatus = status.toString().trim().toLowerCase();

  if (finalStatus === "published") return "videoStatusPublished";
  if (finalStatus === "draft") return "videoStatusDraft";
  if (finalStatus === "unpublished") return "videoStatusUnpublished";
  if (finalStatus === "archived") return "videoStatusArchived";

  return "videoStatusDraft";
};

export default function VideoAdminCard({
  video,
  onPreview,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenMenu,
}) {
  if (!video) return null;

  const modeLabel = getModeLabel(video);

  return (
    <article className="contentStudioItem videoAdminCard">
      <div className="videoAdminCardTop">
        <div>
          <span className={`videoModePill videoMode${modeLabel}`}>
            {modeLabel === "LIVE" ? "🔴 Live Class" : "🎬 Recorded Lesson"}
          </span>

          <strong>{video.title || "Untitled Class"}</strong>

          <p>
            {video.planType || "FREE"} • {video.subject || "No Subject"} •{" "}
            {video.chapter || "No Chapter"}
          </p>
        </div>

        <span className={`videoStatusPill ${getStatusClass(video.status)}`}>
          {video.status || "draft"}
        </span>
      </div>

      <div className="videoAdminMetaGrid">
        <span>👩‍🏫 {video.mentorName || "No mentor"}</span>

        <span>⏱ {video.duration || "No duration"}</span>

        <span>🎥 {video.sourceType || video.livePlatform || "Source"}</span>

        {modeLabel === "LIVE" ? (
          <span>
            🗓 {video.liveStartDate || "No date"}{" "}
            {video.liveStartTime || ""}
          </span>
        ) : (
          <span>📼 Replay-ready lesson</span>
        )}
      </div>

      <div className="contentStudioActions videoAdminActions">
        {onPreview && (
          <button
            type="button"
            className="publishButton"
            onClick={() => onPreview(video)}
          >
            Preview
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            className="backButton"
            onClick={() => onEdit(video)}
          >
            Edit
          </button>
        )}

        {onToggleStatus && (
          <button
            type="button"
            className="backButton"
            onClick={() => onToggleStatus(video)}
          >
            {video.status === "published" ? "Unpublish" : "Publish"}
          </button>
        )}

        {onOpenMenu && (
          <button
            type="button"
            className="backButton"
            onClick={(event) => onOpenMenu(event, video)}
          >
            Actions ▾
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="deleteContentButton"
            onClick={() => onDelete(video)}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}