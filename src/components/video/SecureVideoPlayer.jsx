import React from "react";
import { buildSafeYouTubeEmbedUrl } from "./videoUtils.js";

export default function SecureVideoPlayer({
  sourceUrl = "",
  title = "AspireNest Classroom",
}) {
  const safeEmbedUrl = buildSafeYouTubeEmbedUrl(sourceUrl);

  if (!sourceUrl) {
    return (
      <div className="classroomPlayerShell">
        <div className="classroomPlayerFallback">
          <div>
            <strong>Class source not available</strong>

            <p>
              The video, live stream, or replay link has not been added yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!safeEmbedUrl) {
    return (
      <div className="classroomPlayerShell">
        <div className="classroomPlayerFallback">
          <div>
            <strong>Secure classroom source</strong>

            <p>
              This source cannot be embedded inside the AspireNest player.
              Open it through the secure classroom button.
            </p>

            <button
              className="publishButton"
              onClick={() =>
                window.open(sourceUrl, "_blank", "noopener,noreferrer")
              }
            >
              Open Secure Class →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classroomPlayerShell">
      <iframe
        className="classroomPlayerFrame"
        title={title}
        src={safeEmbedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}