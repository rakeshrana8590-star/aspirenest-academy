import React from "react";
import { useNavigate } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";

import "../../styles/video/videoManageLibrary.css";

import {
  createVideoSlug,
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

const normalizeSubjectKey = (value = "") => createVideoSlug(value || "");

const getSubjectItems = (items = [], subjectName = "") => {
  const subjectKey = normalizeSubjectKey(subjectName);

  return items.filter(
    (item) => normalizeSubjectKey(item.subject || "") === subjectKey
  );
};

const getFeaturedSubject = (subjects = []) => {
  return [...subjects].sort((first, second) => {
    if (second.count !== first.count) return second.count - first.count;
    if (second.recordedCount !== first.recordedCount) {
      return second.recordedCount - first.recordedCount;
    }

    return first.name.localeCompare(second.name);
  })[0];
};

const buildSubjectPlanSummary = (items = []) =>
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

export default function VideoSubjectsRoute({ universalContent = [] }) {
  const navigate = useNavigate();

  const videoLibrary = useVideoLibrary(universalContent);

  const subjects = videoLibrary.getSubjects();
  const featuredSubject = getFeaturedSubject(subjects);

  const publishedVideos = videoLibrary.publishedVideos || [];
  const recordedClasses = publishedVideos.filter(isRecordedClass).length;
  const liveClasses = publishedVideos.filter(isLiveClass).length;
  const sourcePending = publishedVideos.filter(
    (item) => !getClassroomSourceUrl(item)
  ).length;

  const subjectCards = subjects.map((subject) => {
    const items = getSubjectItems(publishedVideos, subject.name);
    const planSummary = buildSubjectPlanSummary(items);

    return {
      ...subject,
      items,
      planSummary,
      sourcePending: items.filter((item) => !getClassroomSourceUrl(item)).length,
    };
  });

  const heroStats = [
    {
      label: "Subjects",
      value: subjects.length,
    },
    {
      label: "Published classes",
      value: publishedVideos.length,
    },
    {
      label: "Recorded lessons",
      value: recordedClasses,
    },
    {
      label: "Live classrooms",
      value: liveClasses,
    },
  ];

  const healthStats = [
    {
      label: "Total classes",
      value: publishedVideos.length,
      hint: "Student-visible classes",
    },
    {
      label: "Source pending",
      value: sourcePending,
      hint: "Needs classroom URL",
    },
    {
      label: "Recorded",
      value: recordedClasses,
      hint: "Published recordings",
    },
    {
      label: "Live",
      value: liveClasses,
      hint: "Published live classes",
    },
  ];

  const openSubject = (subjectName = "") => {
    navigate(`/admin/content/videos/${encodeURIComponent(createVideoSlug(subjectName))}`);
  };

  return (
    <section className="coursePages videoAdminSubjectsPage">
      <div className="videoAdminSubjectsShell">
        <section className="videoAdminSubjectsHero">
          <div className="videoAdminSubjectsHeroCopy">
            <span className="videoAdminSubjectsKicker">VIDEO SUBJECTS</span>

            <h1>Video Subject Library Command Center</h1>

            <p>
              Browse every published video subject, verify recorded/live split,
              plan shelves, source readiness, and chapter coverage from one
              premium admin classroom workspace.
            </p>

            <div className="videoAdminSubjectsHeroActions">
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
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos")}
              >
                ← Video Manager
              </button>
            </div>
          </div>

          <aside className="videoAdminSubjectsHeroPanel">
            <div className="videoAdminSubjectsPanelTop">
              <span>Subject Status</span>
              <strong>Classroom ON</strong>
            </div>

            <div className="videoAdminSubjectsPanelStats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="videoAdminSubjectsFlowLine">
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Classroom</span>
            </div>
          </aside>
        </section>

        <section className="videoAdminSubjectsHealthGrid">
          {healthStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </article>
          ))}
        </section>

        <section className="videoAdminSubjectsFeatureDeck">
          <div className="videoAdminSubjectsFeatureCopy">
            <span>Featured Subject</span>

            <h2>{featuredSubject?.title || "No subject published yet"}</h2>

            <p>
              {featuredSubject
                ? `${featuredSubject.count} classes • ${featuredSubject.recordedCount} recorded • ${featuredSubject.liveCount} live`
                : "Add a published video or live class to create subject shelves automatically."}
            </p>

            <div className="videoAdminSubjectsFeatureTags">
              <small>
                {featuredSubject?.recordedCount || 0} Recorded
              </small>

              <small>{featuredSubject?.liveCount || 0} Live</small>

              <small>
                {featuredSubject
                  ? `${buildSubjectPlanSummary(
                      getSubjectItems(publishedVideos, featuredSubject.name)
                    ).length} Plan shelves`
                  : "0 Plan shelves"}
              </small>
            </div>

            <button
              type="button"
              className="videoManagerPrimaryButton"
              onClick={() =>
                featuredSubject
                  ? openSubject(featuredSubject.name)
                  : navigate("/admin/content/videos/add")
              }
            >
              {featuredSubject ? "Open Subject →" : "+ Add Class"}
            </button>
          </div>

          <div className="videoAdminSubjectsPlanRail">
            {subjectCards.slice(0, 4).map((subject) => (
              <button
                type="button"
                key={subject.id}
                className="videoAdminSubjectsMiniCard"
                onClick={() => openSubject(subject.name)}
              >
                <span>📚</span>

                <strong>{subject.title}</strong>

                <small>
                  {subject.count} classes • {subject.recordedCount} recorded •{" "}
                  {subject.liveCount} live
                </small>

                <em>
                  {subject.sourcePending === 0
                    ? "Sources ready"
                    : `${subject.sourcePending} source pending`}
                </em>
              </button>
            ))}
          </div>
        </section>

        <section className="videoAdminSubjectsLibraryBlock">
          <div className="videoAdminSubjectsLibraryHeader">
            <div>
              <span>Published subject shelves</span>

              <h2>Subjects</h2>

              <p>
                {subjects.length} subject{subjects.length === 1 ? "" : "s"}{" "}
                found in the published video classroom library.
              </p>
            </div>

            <div className="videoAdminSubjectsHeaderActions">
              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/ctet-tet/videos")}
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

          <div className="videoAdminSubjectsGrid">
            {subjectCards.length === 0 ? (
              <div className="contentStudioItem videoEmptyState videoAdminSubjectsEmptyState">
                <strong>No video subjects found.</strong>

                <p>
                  Add a recorded lesson or live class first. Subject shelves
                  will appear here automatically after publishing.
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
              subjectCards.map((subject) => (
                <button
                  type="button"
                  className="videoAdminSubjectCard"
                  key={subject.id}
                  onClick={() => openSubject(subject.name)}
                >
                  <div className="videoAdminSubjectCardTop">
                    <span className="videoAdminSubjectIcon">📚</span>

                    <span className="videoAdminSubjectStatus">
                      {subject.sourcePending === 0
                        ? "Source Ready"
                        : "Needs Source"}
                    </span>
                  </div>

                  <h3>{subject.title}</h3>

                  <p>
                    Open chapter-wise recorded lessons, live classes, replay
                    sessions, and plan shelves for this subject.
                  </p>

                  <div className="videoAdminSubjectStats">
                    <article>
                      <strong>{subject.count}</strong>
                      <span>Classes</span>
                    </article>

                    <article>
                      <strong>{subject.recordedCount}</strong>
                      <span>Recorded</span>
                    </article>

                    <article>
                      <strong>{subject.liveCount}</strong>
                      <span>Live</span>
                    </article>
                  </div>

                  <div className="videoAdminSubjectPlans">
                    {subject.planSummary.length === 0 ? (
                      <small>No plan shelf</small>
                    ) : (
                      subject.planSummary.map((plan) => (
                        <small key={plan.id}>
                          {plan.label}: {plan.count}
                        </small>
                      ))
                    )}
                  </div>

                  <em>Open Chapters →</em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}