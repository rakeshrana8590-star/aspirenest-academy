import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

import "../../styles/video/videoManageLibrary.css";

import {
  getClassroomSourceUrl,
  isLiveClass,
  isRecordedClass,
  normalizePlanType,
} from "./videoUtils.js";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const PLAN_BADGE = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM: "Premium",
  MENTORSHIP: "Mentorship",
};

const buildChapterPlanSummary = (items = []) =>
  PLAN_ORDER.map((plan) => {
    const planItems = items.filter(
      (item) => normalizePlanType(item.planType || "FREE") === plan
    );

    return {
      id: plan,
      label: PLAN_BADGE[plan] || plan,
      count: planItems.length,
    };
  }).filter((plan) => plan.count > 0);

const getFeaturedChapter = (chapters = []) => {
  return [...chapters].sort((first, second) => {
    if (second.count !== first.count) return second.count - first.count;
    if (second.recordedCount !== first.recordedCount) {
      return second.recordedCount - first.recordedCount;
    }

    return first.name.localeCompare(second.name);
  })[0];
};

export default function VideoChaptersRoute({ universalContent = [] }) {
  const navigate = useNavigate();
  const { subjectName = "" } = useParams();

  const videoLibrary = useVideoLibrary(universalContent);

  const decodedSubject = decodeURIComponent(subjectName || "");
  const activeSubject =
    videoLibrary.getSubjectNameFromRoute(decodedSubject) || decodedSubject;

  const chapters = videoLibrary.getChapters({
    subjectId: activeSubject,
  });

  const subjectItems = videoLibrary.getChapterItems({
    subjectId: activeSubject,
  }).all;

  const chapterCards = chapters.map((chapter) => {
    const chapterItems = videoLibrary.getChapterItems({
      subjectId: activeSubject,
      chapterId: chapter.name,
    }).all;

    return {
      ...chapter,
      items: chapterItems,
      planSummary: buildChapterPlanSummary(chapterItems),
      sourcePending: chapterItems.filter((item) => !getClassroomSourceUrl(item))
        .length,
    };
  });

  const featuredChapter = getFeaturedChapter(chapterCards);

  const totalClasses = subjectItems.length;
  const recordedCount = subjectItems.filter(isRecordedClass).length;
  const liveCount = subjectItems.filter(isLiveClass).length;
  const sourcePending = subjectItems.filter(
    (item) => !getClassroomSourceUrl(item)
  ).length;

  const heroStats = [
    {
      label: "Chapters",
      value: chapters.length,
    },
    {
      label: "Subject classes",
      value: totalClasses,
    },
    {
      label: "Recorded lessons",
      value: recordedCount,
    },
    {
      label: "Live classrooms",
      value: liveCount,
    },
  ];

  const healthStats = [
    {
      label: "Total classes",
      value: totalClasses,
      hint: "Inside this subject",
    },
    {
      label: "Source pending",
      value: sourcePending,
      hint: "Needs classroom URL",
    },
    {
      label: "Recorded",
      value: recordedCount,
      hint: "Published recordings",
    },
    {
      label: "Live",
      value: liveCount,
      hint: "Published live classes",
    },
  ];

  const openChapter = (chapterName = "") => {
    navigate(
      `/admin/content/videos/${encodeURIComponent(
        activeSubject
      )}/${encodeURIComponent(chapterName)}`
    );
  };

  return (
    <section className="coursePages videoAdminChaptersPage">
      <div className="videoAdminChaptersShell">
        <section className="videoAdminChaptersHero">
          <div className="videoAdminChaptersHeroCopy">
            <span className="videoAdminChaptersKicker">VIDEO CHAPTERS</span>

            <h1>{activeSubject || "Subject Chapter Command Center"}</h1>

            <p>
              Manage every chapter connected with this subject, verify published
              recorded lessons, live sessions, replay readiness, source status,
              and plan shelves before students enter the classroom.
            </p>

            <div className="videoAdminChaptersHeroActions">
              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/add")}
              >
                + Add Class
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos/subjects")}
              >
                ← Back to Subjects
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <aside className="videoAdminChaptersHeroPanel">
            <div className="videoAdminChaptersPanelTop">
              <span>Chapter Status</span>
              <strong>Subject ON</strong>
            </div>

            <div className="videoAdminChaptersPanelStats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="videoAdminChaptersFlowLine">
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Class</span>
            </div>
          </aside>
        </section>

        <section className="videoAdminChaptersHealthGrid">
          {healthStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </article>
          ))}
        </section>

        <section className="videoAdminChaptersFeatureDeck">
          <div className="videoAdminChaptersFeatureCopy">
            <span>Featured Chapter</span>

            <h2>{featuredChapter?.title || "No chapter published yet"}</h2>

            <p>
              {featuredChapter
                ? `${featuredChapter.count} classes • ${featuredChapter.recordedCount} recorded • ${featuredChapter.liveCount} live`
                : "Add a recorded lesson or live class to create chapter shelves automatically."}
            </p>

            <div className="videoAdminChaptersFeatureTags">
              <small>{featuredChapter?.recordedCount || 0} Recorded</small>

              <small>{featuredChapter?.liveCount || 0} Live</small>

              <small>
                {featuredChapter
                  ? `${featuredChapter.planSummary.length} Plan shelves`
                  : "0 Plan shelves"}
              </small>
            </div>

            <button
              type="button"
              className="videoManagerPrimaryButton"
              onClick={() =>
                featuredChapter
                  ? openChapter(featuredChapter.name)
                  : navigate("/admin/content/videos/add")
              }
            >
              {featuredChapter ? "Open Chapter →" : "+ Add Class"}
            </button>
          </div>

          <div className="videoAdminChaptersPlanRail">
            {chapterCards.slice(0, 4).map((chapter) => (
              <button
                type="button"
                key={chapter.id}
                className="videoAdminChaptersMiniCard"
                onClick={() => openChapter(chapter.name)}
              >
                <span>📘</span>

                <strong>{chapter.title}</strong>

                <small>
                  {chapter.count} classes • {chapter.recordedCount} recorded •{" "}
                  {chapter.liveCount} live
                </small>

                <em>
                  {chapter.sourcePending === 0
                    ? "Sources ready"
                    : `${chapter.sourcePending} source pending`}
                </em>
              </button>
            ))}
          </div>
        </section>

        <section className="videoAdminChaptersLibraryBlock">
          <div className="videoAdminChaptersLibraryHeader">
            <div>
              <span>Published chapter shelves</span>

              <h2>Chapters</h2>

              <p>
                {chapters.length} chapter{chapters.length === 1 ? "" : "s"}{" "}
                found inside {activeSubject || "this subject"}.
              </p>
            </div>

            <div className="videoAdminChaptersHeaderActions">
              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() =>
                  navigate(
                    `/ctet-tet/videos/plan/FREE/${encodeURIComponent(
                      activeSubject
                    )}`
                  )
                }
              >
                Student View →
              </button>

              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <div className="videoAdminChaptersGrid">
            {chapterCards.length === 0 ? (
              <div className="contentStudioItem videoEmptyState videoAdminChaptersEmptyState">
                <strong>No video chapters found.</strong>

                <p>
                  Add a recorded lesson or live class under this subject first.
                  Chapter shelves will appear here automatically after publish.
                </p>

                <div className="contentStudioActions">
                  <button
                    type="button"
                    className="publishButton"
                    onClick={() => navigate("/admin/content/videos/add")}
                  >
                    + Add Class
                  </button>
                </div>
              </div>
            ) : (
              chapterCards.map((chapter) => (
                <button
                  type="button"
                  className="videoAdminChapterCard"
                  key={chapter.id}
                  onClick={() => openChapter(chapter.name)}
                >
                  <div className="videoAdminChapterCardTop">
                    <span className="videoAdminChapterIcon">📘</span>

                    <span className="videoAdminChapterStatus">
                      {chapter.sourcePending === 0
                        ? "Source Ready"
                        : "Needs Source"}
                    </span>
                  </div>

                  <h3>{chapter.title}</h3>

                  <p>
                    Open recorded lessons, live classes, replay sessions, and
                    student-visible classroom items inside this chapter.
                  </p>

                  <div className="videoAdminChapterStats">
                    <article>
                      <strong>{chapter.count}</strong>
                      <span>Classes</span>
                    </article>

                    <article>
                      <strong>{chapter.recordedCount}</strong>
                      <span>Recorded</span>
                    </article>

                    <article>
                      <strong>{chapter.liveCount}</strong>
                      <span>Live</span>
                    </article>
                  </div>

                  <div className="videoAdminChapterPlans">
                    {chapter.planSummary.length === 0 ? (
                      <small>No plan shelf</small>
                    ) : (
                      chapter.planSummary.map((plan) => (
                        <small key={plan.id}>
                          {plan.label}: {plan.count}
                        </small>
                      ))
                    )}
                  </div>

                  <em>Open Classes →</em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}