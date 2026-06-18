import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestSubjectRoute({
  universalContent = [],
  navigate,
}) {
  const { subjectName = "" } = useParams();
  const activeSubject = decodeURIComponent(subjectName || "");

  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest" && item.subject === activeSubject
  );

  const chapters = Array.from(
    new Set(mockTests.map((test) => test.chapter).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const publishedTests = mockTests.filter(
    (test) => test.status === "published"
  );

  const draftTests = mockTests.filter((test) => test.status !== "published");

  const totalQuestions = mockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const planTypes = Array.from(
    new Set(
      mockTests
        .map((test) => test.planType || "FREE")
        .filter(Boolean)
    )
  );

  const averageDuration = mockTests.length
    ? Math.round(
        mockTests.reduce(
          (total, test) => total + Number(test.duration || 0),
          0
        ) / mockTests.length
      )
    : 0;

  const getChapterStats = (chapterName) => {
    const chapterTests = mockTests.filter(
      (test) => test.chapter === chapterName
    );

    const chapterPublished = chapterTests.filter(
      (test) => test.status === "published"
    );

    const chapterDrafts = chapterTests.filter(
      (test) => test.status !== "published"
    );

    const chapterQuestions = chapterTests.reduce(
      (total, test) => total + (test.questions?.length || 0),
      0
    );

    const chapterPlans = Array.from(
      new Set(
        chapterTests
          .map((test) => test.planType || "FREE")
          .filter(Boolean)
      )
    );

    const chapterDuration = chapterTests.length
      ? Math.round(
          chapterTests.reduce(
            (total, test) => total + Number(test.duration || 0),
            0
          ) / chapterTests.length
        )
      : 0;

    return {
      tests: chapterTests.length,
      published: chapterPublished.length,
      drafts: chapterDrafts.length,
      questions: chapterQuestions,
      plans: chapterPlans,
      duration: chapterDuration,
      readiness:
        chapterPublished.length > 0 && chapterQuestions > 0
          ? "Live Ready"
          : chapterTests.length > 0
          ? "Build Mode"
          : "Empty",
    };
  };

  return (
    <section className="coursePages adminMockSubjectPage">
      <div className="adminMockSubjectHero">
        <div className="adminMockSubjectHeroCopy">
          <span className="badge">MOCK TEST SUBJECT</span>

          <h1>{activeSubject || "Subject Detail"}</h1>

          <p>
            Premium subject command page for chapter-wise mock test control.
            Track chapter coverage, published exams, draft workload, question
            depth, duration, and plan access in one clean admin system.
          </p>

          <div className="adminMockSubjectHeroActions">
            <button
              type="button"
              className="adminMockSubjectPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockSubjectGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/subjects")}
            >
              ← Back to Subjects
            </button>

            <button
              type="button"
              className="adminMockSubjectGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>
          </div>
        </div>

        <div className="adminMockSubjectSystemCard">
          <div className="adminMockSubjectSystemTop">
            <span>SUBJECT ENGINE</span>
            <strong>
              {publishedTests.length > 0 ? "Active" : "Build Mode"}
            </strong>
          </div>

          <div className="adminMockSubjectSystemGrid">
            <div>
              <strong>{chapters.length}</strong>
              <span>Chapters</span>
            </div>

            <div>
              <strong>{mockTests.length}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{publishedTests.length}</strong>
              <span>Published</span>
            </div>

            <div>
              <strong>{totalQuestions}</strong>
              <span>Questions</span>
            </div>
          </div>

          <div className="adminMockSubjectFlow">
            <span>Subject</span>
            <i />
            <span>Chapter</span>
            <i />
            <span>Test</span>
          </div>
        </div>
      </div>

      <div className="adminMockSubjectKpiGrid">
        <div className="adminMockSubjectKpiCard">
          <span>Total Tests</span>
          <strong>{mockTests.length}</strong>
          <p>All exams inside this subject</p>
        </div>

        <div className="adminMockSubjectKpiCard">
          <span>Published</span>
          <strong>{publishedTests.length}</strong>
          <p>Student-visible mock tests</p>
        </div>

        <div className="adminMockSubjectKpiCard">
          <span>Draft / Review</span>
          <strong>{draftTests.length}</strong>
          <p>Needs admin attention</p>
        </div>

        <div className="adminMockSubjectKpiCard">
          <span>Avg Duration</span>
          <strong>{averageDuration}</strong>
          <p>Minutes per test average</p>
        </div>
      </div>

      <div className="adminMockSubjectControlStrip">
        <div>
          <span>PLAN COVERAGE</span>

          <div className="adminMockSubjectPlanPills">
            {planTypes.length === 0 ? (
              <strong>No plan mapped</strong>
            ) : (
              planTypes.map((planName) => (
                <strong key={planName}>{planName}</strong>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          className="adminMockSubjectPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/chapters")}
        >
          Open Chapter Library
        </button>
      </div>

      <div className="adminMockSubjectPanel">
        <div className="adminMockSubjectPanelHeader">
          <div>
            <span>CHAPTER COMMAND</span>
            <h2>Chapters in {activeSubject || "this subject"}</h2>
          </div>

          <small>{chapters.length} active</small>
        </div>

        {chapters.length === 0 ? (
          <div className="adminMockSubjectEmpty">
            <strong>No chapters found.</strong>
            <p>Add mock tests under this subject first.</p>

            <button
              type="button"
              className="adminMockSubjectPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add First Chapter Test
            </button>
          </div>
        ) : (
          <div className="adminMockSubjectChapterGrid">
            {chapters.map((chapterName) => {
              const stats = getChapterStats(chapterName);

              return (
                <article
                  className="adminMockSubjectChapterCard"
                  key={chapterName}
                >
                  <div className="adminMockSubjectChapterTop">
                    <div>
                      <span>{stats.readiness}</span>
                      <h3>{chapterName}</h3>
                    </div>

                    <strong>{stats.tests}</strong>
                  </div>

                  <div className="adminMockSubjectChapterMeta">
                    <div>
                      <strong>{stats.published}</strong>
                      <span>Published</span>
                    </div>

                    <div>
                      <strong>{stats.drafts}</strong>
                      <span>Draft</span>
                    </div>

                    <div>
                      <strong>{stats.questions}</strong>
                      <span>Questions</span>
                    </div>

                    <div>
                      <strong>{stats.duration}</strong>
                      <span>Avg min</span>
                    </div>
                  </div>

                  <div className="adminMockSubjectChapterPlans">
                    {stats.plans.length === 0 ? (
                      <span>NO PLAN</span>
                    ) : (
                      stats.plans.map((planName) => (
                        <span key={planName}>{planName}</span>
                      ))
                    )}
                  </div>

                  <div className="adminMockSubjectChapterActions">
                    <button
                      type="button"
                      className="adminMockSubjectPrimaryBtn"
                      onClick={() =>
                        navigate(
                          `/admin/content/mock-tests/${encodeURIComponent(
                            activeSubject
                          )}/${encodeURIComponent(chapterName)}`
                        )
                      }
                    >
                      Open Chapter
                    </button>

                    <button
                      type="button"
                      className="adminMockSubjectGhostBtn"
                      onClick={() => navigate("/admin/content/mock-tests/add")}
                    >
                      Add Test
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}