import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import LiveClassPanel from "./LiveClassPanel.jsx";
import SecureVideoPlayer from "./SecureVideoPlayer.jsx";
import VideoAccessGuard from "./VideoAccessGuard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

import {
  isLiveClass,
  isRecordedClass,
  isVideoContentItem,
} from "./videoUtils.js";

function RelatedLearningCard({
  icon = "🎬",
  title = "Class",
  subtitle = "",
  tag = "",
  buttonLabel = "Open",
  onClick,
}) {
  return (
    <article className="recordedLessonCard">
      <div className="videoCardTopIcon">{icon}</div>

      <div>
        <h3>{title}</h3>

        {subtitle && <p>{subtitle}</p>}
      </div>

      {tag && (
        <div className="videoCardMetaRow">
          <span>{tag}</span>
        </div>
      )}

      {onClick && (
        <div className="videoCardActions">
          <button className="publishButton" onClick={onClick}>
            {buttonLabel}
          </button>
        </div>
      )}
    </article>
  );
}

function StudentClassroomContent({
  classroomItem,
  universalContent = [],
}) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const isLive = isLiveClass(classroomItem);
  const isRecorded = isRecordedClass(classroomItem);

  const recordedSource =
    classroomItem?.videoUrl || classroomItem?.fileUrl || "";

  const relatedNotes = videoLibrary
    .getRelatedNotes(classroomItem)
    .slice(0, 4);

  const relatedVideos = videoLibrary
    .getRelatedVideos(classroomItem)
    .slice(0, 4);

  const continueLearning = videoLibrary
    .getRelatedVideos(classroomItem)
    .filter(
      (item) =>
        videoLibrary.normalizeText(item.subject) ===
        videoLibrary.normalizeText(classroomItem?.subject)
    )
    .slice(0, 3);

  const openPdf = (item) => {
    const pdfUrl =
      item.fileUrl || item.pdfUrl || item.pdf || item.url || "";

    if (!pdfUrl || pdfUrl === "#") {
      alert("PDF will be uploaded soon.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="studentClassroomPage">
      <div className="classroomHero">
        <div className="contentStudioActions">
          <button className="backButton" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <button
            className="backButton"
            onClick={() => navigate("/ctet-tet/videos")}
          >
            Classes & Recordings
          </button>
        </div>

        <span className="badge">
          {isLive ? "LIVE CLASSROOM" : "RECORDED CLASSROOM"}
        </span>

        <h1>{classroomItem?.title || "AspireNest Classroom"}</h1>

        <p>
          Learn inside AspireNest with plan lock, classroom guard, related
          notes, related videos, and continue learning flow.
        </p>

        <div className="classroomHeroMeta">
          <span>{classroomItem?.planType || "FREE"}</span>
          <span>{classroomItem?.subject || "Subject"}</span>
          <span>{classroomItem?.chapter || "Chapter"}</span>
          <span>{classroomItem?.mentorName || "AspireNest Mentor"}</span>
        </div>
      </div>

      {isRecorded && (
        <SecureVideoPlayer
          sourceUrl={recordedSource}
          title={classroomItem?.title || "AspireNest Recorded Lesson"}
        />
      )}

      {isLive && <LiveClassPanel item={classroomItem} />}

      <div className="classroomInfoGrid">
        <div className="classroomInfoCard">
          <h3>Lesson Details</h3>

          <p>
            {classroomItem?.title || "Current Class"} is part of{" "}
            {classroomItem?.subject || "this subject"} /{" "}
            {classroomItem?.chapter || "this chapter"}.
          </p>

          <p>
            Duration: {classroomItem?.duration || "Flexible duration"} •
            Source: {classroomItem?.sourceType || "AspireNest Classroom"}
          </p>
        </div>

        <div className="classroomSideStack">
          <div className="classroomInfoCard">
            <h3>Next Lecture</h3>

            {continueLearning[0] ? (
              <>
                <p>{continueLearning[0].title}</p>

                <button
                  className="publishButton classroomActionButton"
                  onClick={() =>
                    navigate(
                      `/ctet-tet/videos/watch/${continueLearning[0].id}`
                    )
                  }
                >
                  Continue →
                </button>
              </>
            ) : (
              <p>No next lecture linked yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>📄 Related Notes</h2>

          <span>{relatedNotes.length} Notes</span>
        </div>

        <div className="videoChapterShelf">
          {relatedNotes.length === 0 ? (
            <div className="videoChapterEmpty">
              Matching notes from this chapter will appear here.
            </div>
          ) : (
            relatedNotes.map((item) => (
              <RelatedLearningCard
                key={item.id}
                icon="📄"
                title={item.title || "Study Note"}
                subtitle={`${item.subject || "Subject"} • ${
                  item.chapter || "Chapter"
                }`}
                tag={item.planType || "FREE"}
                buttonLabel="Open Notes →"
                onClick={() => openPdf(item)}
              />
            ))
          )}
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>🎬 Related Videos</h2>

          <span>{relatedVideos.length} Videos</span>
        </div>

        <div className="videoChapterShelf">
          {relatedVideos.length === 0 ? (
            <div className="videoChapterEmpty">
              Related videos from this subject or chapter will appear here.
            </div>
          ) : (
            relatedVideos.map((item) => (
              <RelatedLearningCard
                key={item.id}
                icon={isLiveClass(item) ? "🔴" : "▶️"}
                title={item.title || "Related Class"}
                subtitle={`${item.subject || "Subject"} • ${
                  item.chapter || "Chapter"
                }`}
                tag={`${item.planType || "FREE"} • ${
                  isLiveClass(item) ? "LIVE" : "RECORDED"
                }`}
                buttonLabel="Open Classroom →"
                onClick={() =>
                  navigate(`/ctet-tet/videos/watch/${item.id}`)
                }
              />
            ))
          )}
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>▶ Continue Learning</h2>

          <span>{continueLearning.length} Items</span>
        </div>

        <div className="videoChapterShelf">
          {continueLearning.length === 0 ? (
            <div className="videoChapterEmpty">
              Continue learning items will appear after more classes are added.
            </div>
          ) : (
            continueLearning.map((item) => (
              <RelatedLearningCard
                key={item.id}
                icon="🎓"
                title={item.title || "Continue Learning"}
                subtitle={`${item.subject || "Subject"} • ${
                  item.chapter || "Next topic"
                }`}
                tag={item.planType || "FREE"}
                buttonLabel="Continue →"
                onClick={() =>
                  navigate(`/ctet-tet/videos/watch/${item.id}`)
                }
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function StudentClassroomRoute({
  universalContent = [],
  user,
  userPlanType = "FREE",
  isAdmin = false,
  hasPlanAccess,
}) {
  const { videoId } = useParams();

  const classroomItem = React.useMemo(
    () =>
      universalContent.find(
        (item) => item.id === videoId && isVideoContentItem(item)
      ),
    [universalContent, videoId]
  );

  return (
    <VideoAccessGuard
      item={classroomItem}
      user={user}
      userPlanType={userPlanType}
      isAdmin={isAdmin}
      hasPlanAccess={hasPlanAccess}
    >
      {classroomItem ? (
        <StudentClassroomContent
          classroomItem={classroomItem}
          universalContent={universalContent}
        />
      ) : null}
    </VideoAccessGuard>
  );
}