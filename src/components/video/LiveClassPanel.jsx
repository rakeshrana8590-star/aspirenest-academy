import React from "react";
import { getLiveClassStatus, getLiveStatusLabel } from "./videoUtils.js";
import SecureVideoPlayer from "./SecureVideoPlayer.jsx";

export default function LiveClassPanel({ item }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);

  const liveSource = item.joinUrl || item.videoUrl || "";
  const replaySource = item.replayUrl || "";

  const canJoin =
    liveStatus === "JOIN_NOW" ||
    liveStatus === "LIVE_NOW" ||
    liveLabel?.toLowerCase?.().includes("join") ||
    liveLabel?.toLowerCase?.().includes("live");

  const canReplay =
    liveStatus === "REPLAY_AVAILABLE" ||
    liveLabel?.toLowerCase?.().includes("replay");

  return (
    <div className="liveClassPanel">
      <span className="liveStatusPill">{liveLabel}</span>

      <h3>{item.title || "Live Class"}</h3>

      <p>
        {item.liveStartDate || "Date not set"}{" "}
        {item.liveStartTime || ""} —{" "}
        {item.liveEndDate || item.liveStartDate || ""}{" "}
        {item.liveEndTime || ""}
      </p>

      <p>
        Mentor: {item.mentorName || "AspireNest Mentor"} •{" "}
        Platform: {item.livePlatform || item.sourceType || "Classroom"}
      </p>

      {item.liveInstructions && <p>{item.liveInstructions}</p>}

      {canJoin && liveSource && (
        <div style={{ marginTop: "18px" }}>
          <SecureVideoPlayer
            sourceUrl={liveSource}
            title={item.title || "AspireNest Live Class"}
          />
        </div>
      )}

      {canReplay && replaySource && (
        <div style={{ marginTop: "18px" }}>
          <SecureVideoPlayer
            sourceUrl={replaySource}
            title={`${item.title || "AspireNest Class"} Replay`}
          />
        </div>
      )}

      {!canJoin && !canReplay && (
        <div className="classroomInfoCard" style={{ marginTop: "18px" }}>
          <h3>Classroom will open at the scheduled time</h3>

          <p>
            Join button, live player, or replay will appear when this class is
            available.
          </p>
        </div>
      )}

      <div className="contentStudioActions" style={{ marginTop: "18px" }}>
        {canJoin && liveSource && (
          <button
            className="publishButton"
            onClick={() =>
              window.open(liveSource, "_blank", "noopener,noreferrer")
            }
          >
            Join Live Class →
          </button>
        )}

        {canReplay && replaySource && (
          <button
            className="backButton"
            onClick={() =>
              window.open(replaySource, "_blank", "noopener,noreferrer")
            }
          >
            Open Replay →
          </button>
        )}
      </div>
    </div>
  );
}