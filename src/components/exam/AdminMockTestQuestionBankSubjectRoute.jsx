import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestQuestionBankSubjectRoute({
  universalContent,
  navigate,
}) {
  const { subjectName } = useParams();
  const activeSubject = decodeURIComponent(subjectName || "");

  const normalize = (value = "") =>
    value.toString().trim().toLowerCase();

  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest"
  );

  const subjectTests = mockTests.filter(
    (test) => normalize(test.subject) === normalize(activeSubject)
  );

  const chapters = [
    ...new Set(
      subjectTests.map((test) => test.chapter).filter(Boolean)
    ),
  ];

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">QUESTION BANK SUBJECT</span>

        <h1>{activeSubject}</h1>

        <p>Browse chapters and question pools inside this subject.</p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/question-bank")
            }
          >
            ← Back to Question Bank
          </button>
        </div>
      </div>

      <div className="contentStudioList">
        <h3>Chapters in {activeSubject}</h3>

        {chapters.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No chapters found.</strong>
            <p>Add mock tests with questions under this subject first.</p>
          </div>
        ) : (
          <div className="contentStudioGrid">
            {chapters.map((chapterName) => {
              const questionCount = subjectTests
                .filter(
                  (test) =>
                    normalize(test.chapter) === normalize(chapterName)
                )
                .reduce(
                  (total, test) =>
                    total + (test.questions?.length || 0),
                  0
                );

              return (
                <button
                  key={chapterName}
                  className="publishButton"
                  onClick={() =>
                    navigate(
                      `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                        activeSubject
                      )}/${encodeURIComponent(chapterName)}`
                    )
                  }
                >
                  {chapterName}
                  <br />
                  <small>{questionCount} Questions</small>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
