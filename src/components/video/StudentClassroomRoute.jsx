import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import SecureVideoPlayer from "./SecureVideoPlayer.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

import {
  createVideoSlug,
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusLabel,
  isLiveClass,
  isRecordedClass,
  LIVE_CLASS_STATUS,
  normalizePlanType,
} from "./videoUtils.js";

const safeDecodeRouteValue = (value = "") => {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
};

const getClassMode = (item = {}) => {
  if (isLiveClass(item)) return "LIVE";
  if (isRecordedClass(item)) return "RECORDED";

  const mode = String(item.classMode || item.videoMode || item.mode || "")
    .trim()
    .toUpperCase();

  return mode === "LIVE" ? "LIVE" : "RECORDED";
};

const getLiveTimeLabel = (item = {}) => {
  const date = item.liveStartDate || item.startDate || "";
  const start = item.liveStartTime || item.startTime || "";
  const endDate = item.liveEndDate || item.endDate || "";
  const end = item.liveEndTime || item.endTime || "";

  if (!date && !start) return "Schedule pending";
  if (date && start && endDate && end && endDate !== date) {
    return `${date} • ${start} - ${endDate} • ${end}`;
  }
  if (date && start && end) return `${date} • ${start} - ${end}`;
  if (date && start) return `${date} • ${start}`;
  if (date) return date;

  return start || "Schedule pending";
};

const getSafeClassroomSourceLabel = (item = {}) =>
  item.sourceType || item.livePlatform || item.platform || "Class source";

const getNoteUrl = (note = {}) =>
  note.fileUrl || note.pdfUrl || note.url || note.driveUrl || note.sourceUrl || "";

const getLiveActionLabel = (liveState = "") => {
  if (liveState === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Now →";
  if (liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Watch Replay →";
  if (liveState === LIVE_CLASS_STATUS.CANCELLED) return "Cancelled";
  if (liveState === LIVE_CLASS_STATUS.ENDED) return "Replay Pending";

  return "Schedule Pending";
};

const canOpenLiveAction = (item = {}, liveState = "", playbackUrl = "") => {
  if (liveState === LIVE_CLASS_STATUS.JOIN_NOW) {
    return Boolean(item.joinUrl || item.liveUrl || item.meetingUrl || playbackUrl);
  }

  if (liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
    return Boolean(item.replayUrl || item.recordingUrl || playbackUrl);
  }

  return false;
};

export default function StudentClassroomRoute({
  universalContent = [],
  user = null,
  isAdmin = false,
  hasPlanAccess,
}) {
  const navigate = useNavigate();
  const { videoId = "" } = useParams();
  const videoLibrary = useVideoLibrary(universalContent);

  const activeVideoId = safeDecodeRouteValue(videoId);

  const classroomItem = React.useMemo(
    () => videoLibrary.getVideoById(activeVideoId),
    [videoLibrary, activeVideoId]
  );

  const requiredPlan = normalizePlanType(classroomItem?.planType || "FREE");
  const classMode = getClassMode(classroomItem || {});

  const liveState =
    classroomItem && classMode === "LIVE"
      ? getLiveClassStatus(classroomItem)
      : "";

  const liveStateLabel =
    classMode === "LIVE" ? getLiveStatusLabel(liveState) : "Recorded Lesson";

  const playbackUrl = getClassroomSourceUrl(classroomItem || {});

  const canShowPlayer =
    Boolean(playbackUrl) &&
    (classMode === "RECORDED" ||
      liveState === LIVE_CLASS_STATUS.JOIN_NOW ||
      liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE);

  const relatedVideos = React.useMemo(() => {
    if (!classroomItem) return [];

    return videoLibrary.getRelatedVideos(classroomItem).slice(0, 6);
  }, [videoLibrary, classroomItem]);

  const relatedNotes = React.useMemo(() => {
    if (!classroomItem) return [];

    return videoLibrary.getRelatedNotes(classroomItem).slice(0, 4);
  }, [videoLibrary, classroomItem]);

  const nextClass = relatedVideos[0] || null;

  const playerSectionRef = React.useRef(null);
  const [playerFocusPulse, setPlayerFocusPulse] = React.useState(false);

  const focusClassroomPlayer = () => {
    setPlayerFocusPulse(true);

    playerSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      setPlayerFocusPulse(false);
    }, 1400);
  };

  const handleLiveRailAction = () => {
    focusClassroomPlayer();
  };

  React.useEffect(() => {
    if (!classroomItem?.id) return;

    try {
      localStorage.setItem(
        "aspireLastVideoClass",
        JSON.stringify({
          id: classroomItem.id,
          title: classroomItem.title || "AspireNest Class",
          subject: classroomItem.subject || "",
          chapter: classroomItem.chapter || "",
          planType: classroomItem.planType || "FREE",
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Optional local continue-learning save.
    }
  }, [classroomItem]);

  const openExternalUrl = (url = "") => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openNote = (note = {}) => {
    const rawNotePlan =
      note.accessPlan || note.planType || note.plan || note.type || "FREE";

    const normalizedNotePlan = String(rawNotePlan || "FREE")
      .trim()
      .toUpperCase();

    const knownPlanTypes = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];
    const isKnownPlan = knownPlanTypes.includes(normalizedNotePlan);
    const notePlan = isKnownPlan ? normalizedNotePlan : "PREMIUM";

    const noteAccessOptions = {
      module: "notes",
      itemType: "notesPdf",
      itemId: String(note.id || note.slug || note.title || ""),
    };

    if (!isAdmin) {
      const hasAccess =
        typeof hasPlanAccess === "function"
          ? hasPlanAccess(notePlan, noteAccessOptions)
          : notePlan === "FREE";

      if (!hasAccess) {
        navigate(user ? "/ctet-tet/pricing" : "/login");
        return;
      }
    }

    openExternalUrl(getNoteUrl(note));
  };
  const goBackToChapter = () => {
    if (!classroomItem) {
      navigate("/ctet-tet/videos");
      return;
    }

    navigate(
      `/ctet-tet/videos/plan/${requiredPlan}/${encodeURIComponent(
        createVideoSlug(classroomItem.subject || "")
      )}/${encodeURIComponent(createVideoSlug(classroomItem.chapter || ""))}`
    );
  };

  if (!classroomItem) {
    return (
      <section className="coursePages studentClassroomPage studentClassroomCinemaPage">
        <div className="studentClassroomShell">
          <section className="studentClassroomStateCard">
            <span>Classroom Not Found</span>

            <h1>This class is not available</h1>

            <p>
              This classroom may be loading, unpublished, deleted, or disconnected
              from the current route.
            </p>

            <div className="studentClassroomStateActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => navigate("/ctet-tet/videos")}
              >
                Back to Classes
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() => window.location.reload()}
              >
                Reload Classroom
              </button>
            </div>
          </section>
        </div>
      </section>
    );
  }

  const safeTitle = classroomItem.title || "AspireNest Classroom";
  const safeSubject = classroomItem.subject || "Subject";
  const safeChapter = classroomItem.chapter || "Chapter";
  const safeDuration = classroomItem.duration || "Duration pending";
  const safeMentor = classroomItem.mentorName || "AspireNest Mentor";
  const safeSource = getSafeClassroomSourceLabel(classroomItem);
  const liveActionEnabled = canOpenLiveAction(
    classroomItem,
    liveState,
    playbackUrl
  );

  return (
    <section
      className="coursePages studentClassroomPage studentClassroomCinemaPage"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
    >
      <div className="studentClassroomShell">
        <section className="studentClassroomCinemaHero">
          <div className="studentClassroomCinemaTop">
            <button
              type="button"
              className="studentClassroomBackButton"
              onClick={goBackToChapter}
            >
              ← Back to Chapter
            </button>

            <span className="studentClassroomCinemaBadge">
              {classMode === "LIVE" ? "Live Classroom" : "Recorded Classroom"}
            </span>

            <button
              type="button"
              className="studentClassroomBackButton"
              onClick={() => navigate("/ctet-tet/videos")}
            >
              All Classes
            </button>
          </div>

          <div className="studentClassroomCinemaTitle">
            <span>{requiredPlan} ACCESS</span>

            <h1>{safeTitle}</h1>

            <p>
              {safeSubject} • {safeChapter} • {liveStateLabel}
            </p>
          </div>

          <div className="studentClassroomCinemaGrid">
          <div
  className={`studentClassroomTheaterCard ${
    playerFocusPulse ? "studentClassroomTheaterFocus" : ""
  }`}
  ref={playerSectionRef}
>
              <div className="studentClassroomTheaterHeader">
                <div>
                  <span>
                    {classMode === "LIVE" ? liveStateLabel : "Watch Lesson"}
                  </span>

                  <strong>
                    {classMode === "LIVE"
                      ? "Live classroom access"
                      : "Premium lesson player"}
                  </strong>
                </div>

                <small>
                  {safeDuration} • {safeSource}
                </small>
              </div>

              {canShowPlayer ? (
                <SecureVideoPlayer
                  video={classroomItem}
                  item={classroomItem}
                  url={playbackUrl}
                  sourceUrl={playbackUrl}
                  videoUrl={playbackUrl}
                  title={safeTitle}
                  viewerLabel={user?.email || user?.displayName || ""}
                />
              ) : (
                <div className="studentClassroomWaitingCard">
                  <span>{classMode === "LIVE" ? "🔴" : "🎬"}</span>

                  <h3>
                    {classMode === "LIVE"
                      ? liveState === LIVE_CLASS_STATUS.CANCELLED
                        ? "Live class cancelled"
                        : liveState === LIVE_CLASS_STATUS.ENDED
                        ? "Replay is not available yet"
                        : "Live class not open yet"
                      : "Video source pending"}
                  </h3>

                  <p>
                    {classMode === "LIVE"
                      ? `Schedule: ${getLiveTimeLabel(classroomItem)}`
                      : "Admin will add a playable classroom source soon."}
                  </p>
                </div>
              )}

              <div className="studentClassroomCommandDeck">
                <article>
                  <span>Now Watching</span>

                  <strong>{safeTitle}</strong>

                  <p>
                    {safeSubject} • {safeChapter} • {requiredPlan} classroom
                  </p>
                </article>

                <article>
                  <span>Connected Node</span>

                  <strong>{safeSubject}</strong>

                  <p>
                    This class, related notes, and chapter classes are now
                    matched through one subject-chapter learning node.
                  </p>
                </article>

                <article>
                  <span>Next Step</span>

                  <strong>
                    {nextClass ? "Continue available" : "Chapter focus"}
                  </strong>

                  <p>
                    {nextClass
                      ? "A related class is ready from this chapter."
                      : relatedNotes.length
                      ? "Revise connected notes from this chapter."
                      : "Finish this class and revise connected notes when added."}
                  </p>
                </article>
              </div>
            </div>

            <aside className="studentClassroomLearningRail">
              <div className="studentClassroomRailCard studentClassroomRailStatus">
                <span>Classroom Status</span>

                <div className="studentClassroomRailStats">
                  <article>
                    <strong>{classMode}</strong>
                    <small>Class mode</small>
                  </article>

                  <article>
                    <strong>{requiredPlan}</strong>
                    <small>Plan access</small>
                  </article>

                  <article>
                    <strong>{safeDuration}</strong>
                    <small>Duration</small>
                  </article>

                  <article>
                    <strong>
                      {classMode === "LIVE" ? liveStateLabel : "Replay Ready"}
                    </strong>
                    <small>State</small>
                  </article>
                </div>
              </div>

              {classMode === "LIVE" ? (
                <div
                  className={`studentClassroomRailCard studentClassroomLivePanel liveState-${liveState}`}
                >
                  <span>{liveStateLabel}</span>

                  <h3>{safeTitle}</h3>

                  <p>{getLiveTimeLabel(classroomItem)}</p>

                  {classroomItem.liveInstructions ? (
                    <small>{classroomItem.liveInstructions}</small>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleLiveRailAction}
                    disabled={!liveActionEnabled}
                  >
                    {getLiveActionLabel(liveState)}
                  </button>
                </div>
              ) : null}

              <div className="studentClassroomRailCard">
                <span>Mentor</span>

                <h3>{safeMentor}</h3>

                <p>
                  Learn with one connected classroom: video, notes, related
                  classes, and next learning step in one place.
                </p>
              </div>

              <div className="studentClassroomRailCard studentClassroomProtectionCard">
                <span>Protection</span>

                <h3>Access protected</h3>

                <ul>
                  <li>Login required</li>
                  <li>Plan access checked</li>
                  <li>Unpublished class blocked</li>
                  <li>Raw source URL hidden from UI</li>
                </ul>

                <p>
                  Public platform URLs cannot be guaranteed 100% unshareable
                  without signed private streaming or DRM.
                </p>
              </div>

              {nextClass ? (
                <div className="studentClassroomRailCard studentClassroomNextCard">
                  <span>Continue Learning</span>

                  <h3>{nextClass.title || "Next Class"}</h3>

                  <p>
                    {nextClass.subject || safeSubject} •{" "}
                    {nextClass.chapter || safeChapter}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/ctet-tet/videos/watch/${nextClass.id}`)
                    }
                  >
                    Next Class →
                  </button>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="studentClassroomResourceGrid">
          <div className="studentClassroomResourceBlock">
            <div className="studentClassroomSectionTitle">
              <span>Related Notes</span>

              <h2>Study material for this chapter</h2>

              <p>
                Matching notes from the same subject and chapter stay connected
                with this classroom.
              </p>
            </div>

            <div className="studentClassroomMiniGrid">
              {relatedNotes.length === 0 ? (
                <div className="studentClassroomEmptyMini">
                  <strong>No related notes added yet.</strong>

                  <p>
                    When admin adds matching notes for this chapter, they will
                    appear here automatically.
                  </p>
                </div>
              ) : (
                relatedNotes.map((note) => (
                  <button
                    type="button"
                    className="studentClassroomMiniCard"
                    key={note.id}
                    onClick={() => openNote(note)}
                  >
                    <span>📄</span>

                    <strong>{note.title || "Chapter Notes"}</strong>

                    <small>
                      {note.planType || "FREE"} • {note.chapter || safeChapter}
                    </small>

                    <em>Open Notes →</em>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="studentClassroomResourceBlock">
            <div className="studentClassroomSectionTitle">
              <span>Related Classes</span>

              <h2>More from this chapter</h2>

              <p>
                Continue with recordings, live sessions, and replay-ready
                classes from the same chapter.
              </p>
            </div>

            <div className="studentClassroomMiniGrid">
              {relatedVideos.length === 0 ? (
                <div className="studentClassroomEmptyMini">
                  <strong>No related classes found yet.</strong>

                  <p>
                    More classes from this chapter will appear here after admin
                    publishes them.
                  </p>
                </div>
              ) : (
                relatedVideos.map((item) => (
                  <button
                    type="button"
                    className="studentClassroomMiniCard"
                    key={item.id}
                    onClick={() => navigate(`/ctet-tet/videos/watch/${item.id}`)}
                  >
                    <span>{getClassMode(item) === "LIVE" ? "🔴" : "▶️"}</span>

                    <strong>{item.title || "AspireNest Class"}</strong>

                    <small>
                      {item.planType || "FREE"} • {getClassMode(item)}
                    </small>

                    <em>Open Class →</em>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}