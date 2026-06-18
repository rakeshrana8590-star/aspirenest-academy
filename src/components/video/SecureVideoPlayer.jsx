import React from "react";

const getYouTubeId = (url = "") => {
  if (!url) return "";

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube-nocookie\.com\/embed\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) return match[1];
  }

  return "";
};

const getDriveId = (url = "") => {
  if (!url) return "";

  const match =
    url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
    url.match(/[?&]id=([^&]+)/);

  return match?.[1] || "";
};

const getEmbedSource = (url = "") => {
  if (!url) {
    return {
      type: "EMPTY",
      embedUrl: "",
      externalUrl: "",
      label: "Source Pending",
    };
  }

  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return {
      type: "YOUTUBE",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`,
      externalUrl: "",
      label: "YouTube Classroom",
    };
  }

  const driveId = getDriveId(url);

  if (driveId) {
    return {
      type: "DRIVE",
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      externalUrl: "",
      label: "Drive Classroom",
    };
  }

  return {
    type: "EXTERNAL",
    embedUrl: "",
    externalUrl: url,
    label: "External Classroom",
  };
};

export default function SecureVideoPlayer({
  video = {},
  item = {},
  sourceUrl = "",
  url = "",
  videoUrl = "",
  title = "",
  viewerLabel = "",
}) {
  const classroomItem = video?.id ? video : item || {};

  const finalUrl =
    sourceUrl ||
    url ||
    videoUrl ||
    classroomItem.videoUrl ||
    classroomItem.fileUrl ||
    classroomItem.sourceUrl ||
    classroomItem.replayUrl ||
    classroomItem.joinUrl ||
    classroomItem.liveUrl ||
    "";

  const source = getEmbedSource(finalUrl);
  const finalTitle = title || classroomItem.title || "AspireNest Classroom";

  const blockInteraction = (event) => {
    event.preventDefault();
  };

  return (
    <div
      className="secureVideoPlayerShell secureVideoPlayerPremium"
      onContextMenu={blockInteraction}
      onCopy={blockInteraction}
      onCut={blockInteraction}
      onPaste={blockInteraction}
    >
      <div className="secureVideoPlayerTop">
        <span>{source.label}</span>
        <strong>Login + plan gated</strong>
      </div>

      <div className="secureVideoWatermark">
        <span>AspireNest Protected Classroom</span>
        {viewerLabel ? <strong>{viewerLabel}</strong> : null}
      </div>

      {source.embedUrl ? (
        <div className="secureVideoPlayerFrame">
          <iframe
            src={source.embedUrl}
            title={finalTitle}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : source.externalUrl ? (
        <div className="secureVideoPlayerExternal">
          <span>🔗</span>

          <h3>External classroom source</h3>

          <p>
            This class uses an external live or video platform. AspireNest
            protects access inside the app, but public platform links cannot be
            made impossible to share.
          </p>

          <button
            type="button"
            onClick={() =>
              window.open(source.externalUrl, "_blank", "noopener,noreferrer")
            }
          >
            Open Classroom →
          </button>
        </div>
      ) : (
        <div className="secureVideoPlayerExternal">
          <span>🎬</span>

          <h3>Classroom source pending</h3>

          <p>
            Admin has not added a playable video, replay, or live classroom link
            yet.
          </p>
        </div>
      )}

      <div className="secureVideoPlayerNotice">
        <span>🔐</span>

        <p>
          Protected by AspireNest login, plan access, unpublished lock, and
          guarded embed flow. For absolute anti-sharing protection, use a future
          signed private stream or DRM provider.
        </p>
      </div>
    </div>
  );
}