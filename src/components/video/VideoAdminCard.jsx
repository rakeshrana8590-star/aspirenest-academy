import React from "react";

import {
  getLiveClassStatus,
  getLiveStatusClassName,
  getLiveStatusLabel,
  isLiveClass,
  normalizeClassMode,
  normalizeVideoStatus,
} from "./videoUtils.js";

const getStatusClass = (status = "") => {
  const finalStatus = normalizeVideoStatus(status);

  if (finalStatus === "published") return "videoStatusPublished";
  if (finalStatus === "draft") return "videoStatusDraft";
  if (finalStatus === "unpublished") return "videoStatusUnpublished";
  if (finalStatus === "archived") return "videoStatusArchived";

  return "videoStatusDraft";
};

const getLiveScheduleLine = (video = {}) => {
  const startDate = video.liveStartDate || "No date";
  const startTime = video.liveStartTime || "No time";

  if (video.liveEndDate || video.liveEndTime) {
    return `${startDate} ${startTime} → ${
      video.liveEndDate || video.liveStartDate || ""
    } ${video.liveEndTime || ""}`.trim();
  }

  return `${startDate} • ${startTime}`;
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

  const modeLabel = normalizeClassMode(video.classMode || video.mode);
  const isLive = isLiveClass(video);
  const liveStatus = isLive ? getLiveClassStatus(video) : "";
  const liveStatusLabel = isLive ? getLiveStatusLabel(liveStatus) : "";
  const liveStatusClassName = isLive ? getLiveStatusClassName(liveStatus) : "";

  return (
    <article
      className={`contentStudioItem videoAdminCard ${
        isLive ? liveStatusClassName : "videoAdminRecorded"
      }`}
    >
      <div className="videoAdminCardTop">
        <div>
          <div className="videoAdminCardPills">
            <span className={`videoModePill videoMode${modeLabel}`}>
              {modeLabel === "LIVE" ? "🔴 Live Class" : "🎬 Recorded Lesson"}
            </span>

            {isLive && (
              <span className={`liveCardStatusPill ${liveStatusClassName}`}>
                {liveStatusLabel}
              </span>
            )}
          </div>

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

        <span>
          🎥 {isLive ? video.livePlatform || "Live platform" : video.sourceType || "Source"}
        </span>

        {isLive ? (
          <span>🗓 {getLiveScheduleLine(video)}</span>
        ) : (
          <span>📼 Replay-ready lesson</span>
        )}

        <span>🔐 {video.planType || "FREE"} access</span>

        <span>
          {isLive && video.replayUrl
            ? "🔁 Replay linked"
            : isLive
            ? "🔴 Live access"
            : "▶️ Classroom video"}
        </span>
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
            {normalizeVideoStatus(video.status) === "published"
              ? "Unpublish"
              : "Publish"}
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