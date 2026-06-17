import React from "react";
import { deleteDoc, doc } from "firebase/firestore";

export default function AdminMockTestQuestionBankRoute({
  db,
  questionBankItems,
  questionBankSearch,
  setQuestionBankSearch,
  questionBankSubjectFilter,
  setQuestionBankSubjectFilter,
  questionBankChapterFilter,
  setQuestionBankChapterFilter,
  questionBankDifficultyFilter,
  setQuestionBankDifficultyFilter,
  selectedQuestionBankIds,
  setSelectedQuestionBankIds,
  setEditingQuestionBankId,
  loadQuestionBankFromFirestore,
  navigate,
}) {
  const filteredQuestionBank = questionBankItems.filter((question) => {
    const searchText = questionBankSearch.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      question.question?.toLowerCase().includes(searchText) ||
      question.tag?.toLowerCase().includes(searchText);

    const matchesSubject =
      questionBankSubjectFilter === "ALL" ||
      question.sourceSubject === questionBankSubjectFilter ||
      question.subject === questionBankSubjectFilter;

    const matchesChapter =
      questionBankChapterFilter === "ALL" ||
      question.sourceChapter === questionBankChapterFilter ||
      question.chapter === questionBankChapterFilter;

    const matchesDifficulty =
      questionBankDifficultyFilter === "ALL" ||
      question.level === questionBankDifficultyFilter;

    return (
      matchesSearch &&
      matchesSubject &&
      matchesChapter &&
      matchesDifficulty
    );
  });

  const downloadJson = (payload, fileName) => {
    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const downloadUrl = URL.createObjectURL(jsonBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  };

  const buildReusableQuestionPayload = (question, saveToQuestionBank) => ({
    question: question.question || "",
    option1: question.option1 || "",
    option2: question.option2 || "",
    option3: question.option3 || "",
    option4: question.option4 || "",
    answer: question.answer || "",
    explanation: question.explanation || "",
    level: question.level || "Easy",
    questionType: question.questionType || "Single Correct",
    language: question.language || "English",
    tag: question.tag || "",
    positiveMarks: question.positiveMarks || "1",
    negativeMarks: question.negativeMarks || "0",
    questionStatus: "published",
    saveToQuestionBank,
  });

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">QUESTION BANK</span>

        <h1>Examination Question Bank</h1>

        <p>
          Search, filter, review, export, and reuse saved examination questions
          from one professional question bank.
        </p>
      </div>

      <div className="mockManageStatsGrid">
        <div className="mockManageStatCard">
          <span>Total Questions</span>
          <strong>{questionBankItems.length}</strong>
        </div>

        <div className="mockManageStatCard">
          <span>Easy</span>
          <strong>
            {questionBankItems.filter((q) => q.level === "Easy").length}
          </strong>
        </div>

        <div className="mockManageStatCard">
          <span>Medium</span>
          <strong>
            {questionBankItems.filter((q) => q.level === "Medium").length}
          </strong>
        </div>

        <div className="mockManageStatCard">
          <span>Hard</span>
          <strong>
            {questionBankItems.filter((q) => q.level === "Hard").length}
          </strong>
        </div>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioGrid">
          <input
            type="text"
            placeholder="Search by question or tag"
            value={questionBankSearch}
            onChange={(e) => setQuestionBankSearch(e.target.value)}
          />

          <select
            value={questionBankSubjectFilter}
            onChange={(e) => setQuestionBankSubjectFilter(e.target.value)}
          >
            <option value="ALL">All Subjects</option>

            {[
              ...new Set(
                questionBankItems.map(
                  (item) => item.sourceSubject || item.subject
                )
              ),
            ]
              .filter(Boolean)
              .sort()
              .map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
          </select>

          <select
            value={questionBankChapterFilter}
            onChange={(e) => setQuestionBankChapterFilter(e.target.value)}
          >
            <option value="ALL">All Chapters</option>

            {[
              ...new Set(
                questionBankItems.map(
                  (item) => item.sourceChapter || item.chapter
                )
              ),
            ]
              .filter(Boolean)
              .sort()
              .map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
          </select>

          <select
            value={questionBankDifficultyFilter}
            onChange={(e) => setQuestionBankDifficultyFilter(e.target.value)}
          >
            <option value="ALL">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            className="backButton"
            onClick={() => {
              setQuestionBankSearch("");
              setQuestionBankSubjectFilter("ALL");
              setQuestionBankChapterFilter("ALL");
              setQuestionBankDifficultyFilter("ALL");
            }}
          >
            Clear Filters
          </button>

          <button
            className="publishButton"
            onClick={() => {
              const exportPayload = filteredQuestionBank.map((question) => ({
                ...question,
                exportedAt: new Date().toISOString(),
              }));

              downloadJson(exportPayload, "question-bank-export.json");
            }}
          >
            Export JSON
          </button>

          <button
            className="backButton"
            onClick={() => {
              setSelectedQuestionBankIds(
                filteredQuestionBank.map((question) => question.id)
              );
            }}
          >
            Select All
          </button>

          <button
            className="backButton"
            onClick={() => {
              setSelectedQuestionBankIds([]);
            }}
          >
            Clear Selected
          </button>

          <button
            className="dangerButton"
            onClick={async () => {
              if (selectedQuestionBankIds.length === 0) {
                alert("Please select at least one question");
                return;
              }

              const confirmDelete = window.confirm(
                `Delete ${selectedQuestionBankIds.length} selected question(s)?`
              );

              if (!confirmDelete) return;

              for (const questionId of selectedQuestionBankIds) {
                await deleteDoc(doc(db, "questionBank", questionId));
              }

              await loadQuestionBankFromFirestore();

              setSelectedQuestionBankIds([]);

              alert("Selected questions deleted ✅");
            }}
          >
            Bulk Delete
          </button>

          <button
            className="publishButton"
            onClick={() => {
              if (selectedQuestionBankIds.length === 0) {
                alert("Please select at least one question");
                return;
              }

              const selectedQuestions = questionBankItems.filter((question) =>
                selectedQuestionBankIds.includes(question.id)
              );

              const exportPayload = selectedQuestions.map((question) => ({
                ...question,
                exportedAt: new Date().toISOString(),
              }));

              downloadJson(
                exportPayload,
                "selected-question-bank-export.json"
              );
            }}
          >
            Bulk Export
          </button>
        </div>
      </div>

      <div className="contentStudioList questionBankList">
        <h3>Saved Questions</h3>

        {filteredQuestionBank.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No questions found.</strong>
            <p>Add questions from Add Examination Test first.</p>
          </div>
        ) : (
          filteredQuestionBank.map((question) => (
            <div
              className="contentStudioItem questionBankCard"
              key={question.id}
            >
              <input
                type="checkbox"
                checked={selectedQuestionBankIds.includes(question.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedQuestionBankIds([
                      ...selectedQuestionBankIds,
                      question.id,
                    ]);
                  } else {
                    setSelectedQuestionBankIds(
                      selectedQuestionBankIds.filter(
                        (id) => id !== question.id
                      )
                    );
                  }
                }}
              />

              <div className="questionBankTopRow">
                <span className="questionBankPill">
                  {question.level || "Easy"}
                </span>

                <span className="questionBankPill">
                  {question.questionType || "Single Correct"}
                </span>

                <span className="questionBankPill">
                  {question.language || "English"}
                </span>
              </div>

              <strong>{question.question || "Untitled Question"}</strong>

              <div className="questionBankMetaGrid">
                <span>📝 {question.sourceExamType || "Exam"}</span>

                <span>
                  📚 {question.sourceSubject || question.subject || "Subject"}
                </span>

                <span>
                  📖 {question.sourceChapter || question.chapter || "Chapter"}
                </span>

                {question.tag && <span>🏷 {question.tag}</span>}
              </div>

              <div className="questionOptionGrid">
                <div>A. {question.option1 || "-"}</div>
                <div>B. {question.option2 || "-"}</div>
                <div>C. {question.option3 || "-"}</div>
                <div>D. {question.option4 || "-"}</div>
              </div>

              <div className="questionBankAnswerBox">
                <strong>
                  Answer:{" "}
                  {question.answer === "option1"
                    ? `A. ${question.option1 || "-"}`
                    : question.answer === "option2"
                    ? `B. ${question.option2 || "-"}`
                    : question.answer === "option3"
                    ? `C. ${question.option3 || "-"}`
                    : question.answer === "option4"
                    ? `D. ${question.option4 || "-"}`
                    : question.answer || "Not set"}
                </strong>

                <p>{question.explanation || "No explanation added yet."}</p>
              </div>

              <div className="contentStudioActions">
                <button
                  className="backButton"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      JSON.stringify(question, null, 2)
                    )
                  }
                >
                  Copy JSON
                </button>

                <button
                  className="backButton"
                  onClick={() => {
                    setEditingQuestionBankId(question.id);

                    localStorage.setItem(
                      "reusedQuestionForMockTest",
                      JSON.stringify({
                        ...buildReusableQuestionPayload(question, "yes"),
                        editingQuestionBankId: question.id,
                      })
                    );

                    navigate("/admin/content/mock-tests/add");
                  }}
                >
                  Edit Question
                </button>

                <button
                  className="backButton"
                  onClick={() => {
                    localStorage.setItem(
                      "reusedQuestionForMockTest",
                      JSON.stringify(buildReusableQuestionPayload(question, "no"))
                    );

                    navigate("/admin/content/mock-tests/add");
                  }}
                >
                  Reuse Question
                </button>

                <button
                  className="dangerButton"
                  onClick={async () => {
                    const confirmDelete = window.confirm(
                      "Delete this question permanently from Question Bank?"
                    );

                    if (!confirmDelete) return;

                    await deleteDoc(doc(db, "questionBank", question.id));

                    await loadQuestionBankFromFirestore();

                    alert("Question deleted from Question Bank ✅");
                  }}
                >
                  Delete Question
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="contentStudioActions">
        <button
          className="publishButton"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Examination Test
        </button>

        <button
          className="backButton"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          ← Back to Manage Tests
        </button>
      </div>
    </section>
  );
}
