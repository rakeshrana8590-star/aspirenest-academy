import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import SecureVideoPlayer from "./SecureVideoPlayer.jsx";

import {
  getLiveClassStatus,
  isLiveClass,
  isRecordedClass,
  normalizeVideoStatus,
  normalizeVideoText,
} from "./videoUtils.js";

import { LIVE_CLASS_STATUS } from "./videoConstants.js";

const PLAN_ORDER = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
};

const toPlan = (value = "FREE") =>
  String(value || "FREE").trim().toUpperCase();

const toSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isVideoSection = (item = {}) => {
  const section = String(item.section || "").toLowerCase();
  const contentType = String(item.contentType || "").toLowerCase();

  return (
    section.includes("recordedvideo") ||
    section.includes("video") ||
    contentType.includes("video") ||
    Boolean(item.videoUrl || item.replayUrl || item.joinUrl)
  );
};

const isNotesSection = (item = {}) => {
  const section = String(item.section || "").toLowerCase();
  const contentType = String(item.contentType || "").toLowerCase();
  const sourceType = String(item.sourceType || "").toLowerCase();
  const type = String(item.type || "").toLowerCase();

  return (
    section === "notes" ||
    section.includes("notes") ||
    type === "note" ||
    type === "notes" ||
    contentType === "pdf" ||
    contentType === "document" ||
    contentType.includes("pdf") ||
    sourceType === "pdf"
  );
};

const getClassMode = (item = {}) => {
  if (isLiveClass(item)) return "LIVE";
  if (isRecordedClass(item)) return "RECORDED";

  const mode = String(item.classMode || item.videoMode || item.mode || "")
    .trim()
    .toUpperCase();

  return mode === "LIVE" ? "LIVE" : "RECORDED";
};

const getLiveStateLabel = (state) => {
  if (state === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Now";
  if (state === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Replay Available";
  if (state === LIVE_CLASS_STATUS.ENDED) return "Ended";
  if (state === LIVE_CLASS_STATUS.CANCELLED) return "Cancelled";

  return "Upcoming";
};

const getLiveTimeLabel = (item = {}) => {
  const date = item.liveStartDate || item.startDate || "";
  const start = item.liveStartTime || item.startTime || "";
  const end = item.liveEndTime || item.endTime || "";

  if (!date && !start) return "Schedule pending";
  if (date && start && end) return `${date} • ${start} - ${end}`;
  if (date && start) return `${date} • ${start}`;
  if (date) return date;

  return start || "Schedule pending";
};

const getPlaybackUrl = (item = {}, classMode = "RECORDED", liveState = "") => {
  if (classMode === "LIVE") {
    if (liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
      return (
        item.replayUrl ||
        item.videoUrl ||
        item.fileUrl ||
        item.joinUrl ||
        item.liveUrl ||
        ""
      );
    }

    if (liveState === LIVE_CLASS_STATUS.JOIN_NOW) {
      return (
        item.joinUrl ||
        item.liveUrl ||
        item.videoUrl ||
        item.fileUrl ||
        item.replayUrl ||
        ""
      );
    }

    return item.replayUrl || item.videoUrl || item.fileUrl || "";
  }

  return item.videoUrl || item.fileUrl || item.sourceUrl || item.replayUrl || "";
};

const buildAccessStatus = ({
  item,
  user,
  isAdmin,
  userPlanType,
  hasPlanAccess,
  universalContent,
}) => {
  if (!item) {
    return universalContent.length === 0 ? "LOADING" : "NOT_FOUND";
  }

  const status = normalizeVideoStatus(item.status || "published");

  if (status !== "published" && !isAdmin) {
    return "UNPUBLISHED";
  }

  if (!user && !isAdmin) {
    return "LOGIN_REQUIRED";
  }

  const requiredPlan = toPlan(item.planType || "FREE");
  const currentPlan = toPlan(userPlanType || "FREE");

  if (isAdmin || requiredPlan === "FREE") {
    return "AVAILABLE";
  }

  if (typeof hasPlanAccess === "function") {
    return hasPlanAccess(requiredPlan) ? "AVAILABLE" : "PLAN_LOCKED";
  }

  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan]
    ? "AVAILABLE"
    : "PLAN_LOCKED";
};

const getStateCardCopy = (status, requiredPlan = "FREE") => {
  if (status === "LOADING") {
    return {
      label: "Preparing Classroom",
      title: "Loading classroom",
      message:
        "AspireNest is preparing this classroom. If it does not open, reload or go back to Classes & Recordings.",
      primaryLabel: "Reload Classroom",
      secondaryLabel: "Back to Classes",
    };
  }

  if (status === "UNPUBLISHED") {
    return {
      label: "Class Unavailable",
      title: "This class is not published yet",
      message:
        "Admin has not published this classroom for students. Published video classes will appear in the classroom library.",
      primaryLabel: "Back to Classes",
      secondaryLabel: "View Video Hub",
    };
  }

  if (status === "LOGIN_REQUIRED") {
    return {
      label: "Login Required",
      title: "Login required to watch",
      message:
        "Please login to open this AspireNest classroom and continue learning.",
      primaryLabel: "Login to Continue",
      secondaryLabel: "Back to Classes",
    };
  }

  if (status === "PLAN_LOCKED") {
    return {
      label: `${requiredPlan} Access Required`,
      title: `${requiredPlan} classroom locked`,
      message:
        "This classroom is protected by plan access. Upgrade your plan to watch this class, replay, or live session.",
      primaryLabel: "View Plans",
      secondaryLabel: "Back to Classes",
    };
  }

  return {
    label: "Class Not Found",
    title: "Classroom not found",
    message:
      "This video or live class is not available. It may have been deleted, unpublished, or disconnected from this route.",
    primaryLabel: "Back to Classes",
    secondaryLabel: "Reload Classroom",
  };
};

export default function StudentClassroomRoute({
  universalContent = [],
  user = null,
  userPlanType = "FREE",
  isAdmin = false,
  hasPlanAccess,
}) {
  const navigate = useNavigate();
  const { videoId = "" } = useParams();

  const activeVideoId = decodeURIComponent(videoId || "");

  const classroomItem = React.useMemo(() => {
    return (
      universalContent.find(
        (item) =>
          item?.id === activeVideoId ||
          item?.videoId === activeVideoId ||
          item?.classId === activeVideoId
      ) || null
    );
  }, [universalContent, activeVideoId]);

  const requiredPlan = toPlan(classroomItem?.planType || "FREE");

  const accessStatus = buildAccessStatus({
    item: classroomItem,
    user,
    isAdmin,
    userPlanType,
    hasPlanAccess,
    universalContent,
  });

  const classMode = getClassMode(classroomItem || {});
  const liveState =
    classroomItem && classMode === "LIVE"
      ? getLiveClassStatus(classroomItem)
      : "";

  const liveStateLabel = getLiveStateLabel(liveState);
  const playbackUrl = getPlaybackUrl(classroomItem || {}, classMode, liveState);

  const canShowPlayer =
    Boolean(playbackUrl) &&
    (classMode === "RECORDED" ||
      liveState === LIVE_CLASS_STATUS.JOIN_NOW ||
      liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE ||
      liveState === LIVE_CLASS_STATUS.ENDED);

  const subjectKey = normalizeVideoText(classroomItem?.subject || "");
  const chapterKey = normalizeVideoText(classroomItem?.chapter || "");

  const relatedVideos = React.useMemo(() => {
    if (!classroomItem) return [];

    return universalContent
      .filter((item) => item?.id !== classroomItem.id)
      .filter(isVideoSection)
      .filter(
        (item) =>
          normalizeVideoStatus(item.status || "published") === "published"
      )
      .filter((item) => normalizeVideoText(item.subject) === subjectKey)
      .filter((item) => normalizeVideoText(item.chapter) === chapterKey)
      .slice(0, 6);
  }, [universalContent, classroomItem, subjectKey, chapterKey]);

  const relatedNotes = React.useMemo(() => {
    if (!classroomItem) return [];

    return universalContent
      .filter(isNotesSection)
      .filter((item) => !isVideoSection(item))
      .filter(
        (item) =>
          normalizeVideoStatus(item.status || "published") === "published"
      )
      .filter((item) => normalizeVideoText(item.subject) === subjectKey)
      .filter((item) => normalizeVideoText(item.chapter) === chapterKey)
      .slice(0, 4);
  }, [universalContent, classroomItem, subjectKey, chapterKey]);

  const nextClass = relatedVideos[0] || null;

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
    const notePlan = toPlan(note.planType || "FREE");

    if (!isAdmin && notePlan !== "FREE") {
      const hasAccess =
        typeof hasPlanAccess === "function"
          ? hasPlanAccess(notePlan)
          : PLAN_ORDER[toPlan(userPlanType)] >= PLAN_ORDER[notePlan];

      if (!hasAccess) {
        navigate("/ctet-tet/pricing");
        return;
      }
    }

    const noteUrl = note.fileUrl || note.pdfUrl || note.url || note.driveUrl;

    if (noteUrl) {
      openExternalUrl(noteUrl);
    }
  };

  const goBackToChapter = () => {
    if (!classroomItem) {
      navigate("/ctet-tet/videos");
      return;
    }

    navigate(
      `/ctet-tet/videos/plan/${requiredPlan}/${encodeURIComponent(
        toSlug(classroomItem.subject || "")
      )}/${encodeURIComponent(toSlug(classroomItem.chapter || ""))}`
    );
  };

  if (accessStatus !== "AVAILABLE") {
    const stateCopy = getStateCardCopy(accessStatus, requiredPlan);

    const handlePrimaryAction = () => {
      if (accessStatus === "LOADING") {
        window.location.reload();
        return;
      }

      if (accessStatus === "LOGIN_REQUIRED") {
        navigate("/login");
        return;
      }

      if (accessStatus === "PLAN_LOCKED") {
        navigate("/ctet-tet/pricing");
        return;
      }

      navigate("/ctet-tet/videos");
    };

    const handleSecondaryAction = () => {
      if (accessStatus === "NOT_FOUND" || accessStatus === "LOADING") {
        window.location.reload();
        return;
      }

      navigate("/ctet-tet/videos");
    };

    return (
      <section className="coursePages studentClassroomPage studentClassroomCinemaPage">
        <div className="studentClassroomShell">
          <section className="studentClassroomStateCard">
            <span>{stateCopy.label}</span>

            <h1>{stateCopy.title}</h1>

            <p>{stateCopy.message}</p>

            <div className="studentClassroomStateActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={handlePrimaryAction}
              >
                {stateCopy.primaryLabel}
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={handleSecondaryAction}
              >
                {stateCopy.secondaryLabel}
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
  const safeSource =
    classroomItem.sourceType || classroomItem.livePlatform || "Class source";

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
              {safeSubject} • {safeChapter} •{" "}
              {classMode === "LIVE" ? liveStateLabel : "Recorded Lesson"}
            </p>
          </div>

          <div className="studentClassroomCinemaGrid">
            <div className="studentClassroomTheaterCard">
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
                  <span>Class Source</span>

                  <strong>{safeSource}</strong>

                  <p>
                    Protected embed is shown inside AspireNest. Raw source URL
                    stays hidden from the student interface.
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
                    onClick={() =>
                      openExternalUrl(
                        liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
                          ? classroomItem.replayUrl || playbackUrl
                          : classroomItem.joinUrl ||
                              classroomItem.liveUrl ||
                              playbackUrl
                      )
                    }
                    disabled={!playbackUrl}
                  >
                    {liveState === LIVE_CLASS_STATUS.JOIN_NOW
                      ? "Join Now →"
                      : liveState === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
                      ? "Watch Replay →"
                      : "Open Details →"}
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