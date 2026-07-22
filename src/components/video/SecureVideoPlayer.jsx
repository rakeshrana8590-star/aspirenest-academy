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
  authorizationDecision = null,
  resourceId = "",
}) {
  const classroomItem = video?.id ? video : item || {};
  const expectedResourceId = String(
    resourceId ||
      classroomItem.id ||
      classroomItem.videoId ||
      classroomItem.classId ||
      ""
  ).trim();

  const verifiedWatch = Boolean(
    authorizationDecision?.allowed === true &&
      authorizationDecision?.canWatch === true &&
      authorizationDecision?.videoId === expectedResourceId
  );

  const finalUrl = verifiedWatch
    ? String(sourceUrl || url || videoUrl || "").trim()
    : "";

  const source = getEmbedSource(finalUrl);
  const finalTitle =
    title || classroomItem.title || "AspireNest Classroom";

  const blockInteraction = (event) => {
    event.preventDefault();
  };

  if (!verifiedWatch) {
    return (
      <div className="secureVideoPlayerShell secureVideoPlayerPremium">
        <div className="secureVideoPlayerExternal">
          <span>🔐</span>

          <h3>Verified WATCH access required</h3>

          <p>
            AspireNest kept this player closed because the current resource
            did not carry a matching authorization decision.
          </p>
        </div>
      </div>
    );
  }

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
        <strong>Verified WATCH access</strong>
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
            verifies access before exposing the link, but a public platform
            link cannot be made impossible to share.
          </p>

          <button
            type="button"
            onClick={() =>
              window.open(
                source.externalUrl,
                "_blank",
                "noopener,noreferrer"
              )
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
            The verified classroom does not currently have a playable video,
            replay, or live source.
          </p>
        </div>
      )}

      <div className="secureVideoPlayerNotice">
        <span>🔐</span>

        <p>
          Protected by AspireNest login, resource-bound WATCH authorization,
          unpublished lock, and guarded source resolution. Screen capture and
          external public links remain deterrence limits, not a false
          piracy-proof guarantee.
        </p>
      </div>
    </div>
  );
}
