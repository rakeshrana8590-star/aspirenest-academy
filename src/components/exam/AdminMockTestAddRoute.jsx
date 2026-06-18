import React from "react";

const examTypeOptions = [
  "CTET",
  "TET",
  "CTET/TET",
  "SSC",
  "UPSC",
  "NEET",
  "REET",
  "GPSC",
  "Banking",
  "Railway",
  "Teaching Aptitude",
  "Current Affairs",
  "Mixed Test",
  "ALL SUBJECTS",
  "Custom Exam",
];

const testTypeOptions = [
  "Chapter Test",
  "Topic Test",
  "Unit Test",
  "Sectional Test",
  "Subject Test",
  "Full Mock Test",
  "Previous Year Paper",
  "Grand Test",
  "Practice Test",
  "Daily Quiz",
  "Weekly Test",
  "Monthly Test",
  "Live Exam",
  "Custom Test",
];

const overallTestTypes = [
  "Full Mock Test",
  "Grand Test",
  "Previous Year Paper",
  "Mixed Test",
  "Live Exam",
  "Custom Test",
];

const planOptions = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];
const difficultyOptions = ["Easy", "Medium", "Hard", "Mixed"];
const languageOptions = ["English", "Hindi", "Gujarati", "Bilingual"];

const questionTypeOptions = [
  "Single Correct",
  "Multiple Correct",
  "True False",
  "Assertion Reason",
  "Passage Based",
  "Image Based",
  "Match the Following",
  "Statement Based",
];

const leaderboardOptions = [
  { value: "disabled", label: "Disabled" },
  { value: "liveLeaderboard", label: "Live Leaderboard" },
  { value: "finalLeaderboard", label: "Final Leaderboard" },
  { value: "globalLeaderboard", label: "Global Leaderboard" },
  { value: "courseLeaderboard", label: "Course Leaderboard" },
  { value: "subjectLeaderboard", label: "Subject Leaderboard" },
  { value: "stateLeaderboard", label: "State Leaderboard" },
  { value: "batchLeaderboard", label: "Batch Leaderboard" },
];

function AdminMockField({ label, className = "", children }) {
  return (
    <div className={`adminMockAddField ${className}`.trim()}>
      {label ? <label>{label}</label> : null}
      {children}
    </div>
  );
}

export default function AdminMockTestAddRoute({
  editingMockTestId,
  mockTestForm = {},
  setMockTestForm,
  notesSubjectsList = [],
  notesChaptersList = [],
  mockTestQuestionsForm = [],
  setMockTestQuestionsForm,
  createEmptyMockQuestion,
  handleSaveMockTest,
  navigate,
  universalContent = [],
}) {
  const updateMockForm = (updates) => {
    setMockTestForm({
      ...mockTestForm,
      ...updates,
    });
  };

  const updateQuestion = (questionIndex, updates) => {
    const updatedQuestions = [...mockTestQuestionsForm];

    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    };

    setMockTestQuestionsForm(updatedQuestions);
  };

  const moveQuestion = (questionIndex, direction) => {
    const targetIndex = questionIndex + direction;

    if (targetIndex < 0 || targetIndex >= mockTestQuestionsForm.length) {
      return;
    }

    const updatedQuestions = [...mockTestQuestionsForm];
    const currentQuestion = updatedQuestions[questionIndex];

    updatedQuestions[questionIndex] = updatedQuestions[targetIndex];
    updatedQuestions[targetIndex] = currentQuestion;

    setMockTestQuestionsForm(updatedQuestions);
  };

  const duplicateQuestion = (questionIndex) => {
    const duplicatedQuestion = {
      ...mockTestQuestionsForm[questionIndex],
      question: `${mockTestQuestionsForm[questionIndex].question || ""} Copy`,
      saveToQuestionBank: "no",
    };

    const updatedQuestions = [...mockTestQuestionsForm];
    updatedQuestions.splice(questionIndex + 1, 0, duplicatedQuestion);
    setMockTestQuestionsForm(updatedQuestions);
  };

  const deleteQuestion = (questionIndex) => {
    const updatedQuestions = mockTestQuestionsForm.filter(
      (_, index) => index !== questionIndex
    );

    setMockTestQuestionsForm(updatedQuestions);
  };

  const resetQuestions = () => {
    const confirmClear = window.confirm(
      "Clear all questions and start again?"
    );

    if (!confirmClear) return;

    setMockTestQuestionsForm([
      {
        ...createEmptyMockQuestion(),
        positiveMarks: mockTestForm.marksPerQuestion || "1",
        negativeMarks: mockTestForm.negativeMarks || "0",
      },
    ]);
  };

  const addQuestion = () => {
    setMockTestQuestionsForm((prev) => [
      ...prev,
      {
        ...createEmptyMockQuestion(),
        positiveMarks: mockTestForm.marksPerQuestion || "1",
        negativeMarks: mockTestForm.negativeMarks || "0",
      },
    ]);
  };

  const subjectSuggestions = [
    ...new Set([
      "ALL SUBJECTS",
      ...notesSubjectsList.map((subject) => subject.name).filter(Boolean),
      ...universalContent.map((item) => item.subject).filter(Boolean),
    ]),
  ]
    .map((name) => name.toString().trim())
    .filter((name) => {
      if (!name) return false;
      if (name.length < 2) return false;
      if (/^[a-zA-Z0-9]{15,}$/.test(name)) return false;

      return true;
    })
    .filter(
      (name, index, array) =>
        array.findIndex((item) => item.toLowerCase() === name.toLowerCase()) ===
        index
    )
    .sort();

  const chapterSuggestions = notesChaptersList.filter((chapter) => {
    const selectedSubject = mockTestForm.subject
      ?.toString()
      .trim()
      .toLowerCase();

    if (!selectedSubject) return false;

    if (selectedSubject === "all subjects") {
      return true;
    }

    const chapterSubjectName = chapter.subjectName
      ?.toString()
      .trim()
      .toLowerCase();

    const chapterSubjectId = chapter.subjectId
      ?.toString()
      .trim()
      .toLowerCase();

    return (
      chapterSubjectName === selectedSubject ||
      chapterSubjectId === selectedSubject
    );
  });

  return (
    <section className="coursePages adminMockAddFormPage">
   <div className="adminMockAddCommandHero">
  <div className="adminMockAddHeroCopy">
    <span className="badge">
      {editingMockTestId ? "EDIT EXAMINATION" : "ADD EXAMINATION"}
    </span>

    <h1>
      {editingMockTestId
        ? "Edit Examination Test"
        : "Create New Examination Test"}
    </h1>

    <p>
      Build chapter tests, subject tests, full mocks, PYQ papers, mixed
      tests, live exams, and custom exams from one premium examination
      builder.
    </p>

    <div className="adminMockAddHeroActions">
      <button
        type="button"
        className="publishButton"
        onClick={() =>
          document
            .querySelector(".adminMockAddSetupConsole")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        Start Exam Setup
      </button>

      <button
        type="button"
        className="backButton"
        onClick={() => navigate("/admin/content/mock-tests/manage")}
      >
        Manage Tests
      </button>

      <button
        type="button"
        className="backButton"
        onClick={() => navigate("/admin/content/mock-tests")}
      >
        ← Back
      </button>
    </div>
  </div>

  <div className="adminMockAddSystemCard">
    <div className="adminMockAddSystemTop">
      <span>BUILDER STATUS</span>
      <strong>{editingMockTestId ? "Edit" : "New"}</strong>
    </div>

    <div className="adminMockAddSystemGrid">
      <div>
        <strong>{mockTestForm.planType || "FREE"}</strong>
        <span>Plan shelf</span>
      </div>

      <div>
        <strong>{mockTestForm.testType || "Chapter Test"}</strong>
        <span>Test type</span>
      </div>

      <div>
        <strong>{mockTestQuestionsForm.length}</strong>
        <span>Questions</span>
      </div>

      <div>
        <strong>{mockTestForm.status || "draft"}</strong>
        <span>Publish state</span>
      </div>
    </div>

    <div className="adminMockAddFlow">
      <span>Setup</span>
      <i />
      <span>Questions</span>
      <i />
      <span>Publish</span>
    </div>
  </div>
</div>

      <div className="contentStudioForm adminMockAddSetupConsole">
        <div className="sectionHeader adminMockAddSectionHeader">
          <span className="badge">TEST CONFIGURATION</span>

          <h2>Exam Setup</h2>

          <p>
            Define exam category, test type, access plan, subject, chapter,
            duration, marking, rules, security, schedule, and publish status.
          </p>
        </div>

        <div className="contentStudioGrid adminMockAddSetupGrid">
          <AdminMockField className="adminMockAddTitleField">
            <input
              type="text"
              placeholder="Test Title e.g. CTET Paper 1 Full Mock 01"
              value={mockTestForm.title || ""}
              onChange={(e) => updateMockForm({ title: e.target.value })}
            />
          </AdminMockField>

          <AdminMockField label="Exam Type">
            <select
              value={mockTestForm.examType || "CTET"}
              onChange={(e) => updateMockForm({ examType: e.target.value })}
            >
              {examTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Test Type">
            <select
              value={mockTestForm.testType || "Chapter Test"}
              onChange={(e) => {
                const selectedType = e.target.value;
                const isOverallTest = overallTestTypes.includes(selectedType);

                updateMockForm({
                  testType: selectedType,
                  subject: isOverallTest
                    ? "ALL SUBJECTS"
                    : mockTestForm.subject,
                  chapter: isOverallTest
                    ? "Complete Paper"
                    : mockTestForm.chapter,
                });
              }}
            >
              {testTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Plan Shelf">
            <select
              value={mockTestForm.planType || "FREE"}
              onChange={(e) => updateMockForm({ planType: e.target.value })}
            >
              {planOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Subject">
            <input
              type="text"
              list="mockSubjectSuggestions"
              placeholder="Subject e.g. CDP / Maths / ALL SUBJECTS"
              value={mockTestForm.subject || ""}
              onChange={(e) =>
                updateMockForm({
                  subject: e.target.value,
                  chapter:
                    e.target.value === "ALL SUBJECTS" ? "Complete Paper" : "",
                })
              }
            />

            <datalist id="mockSubjectSuggestions">
              {subjectSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </AdminMockField>

          <AdminMockField label="Chapter / Topic">
            <input
              type="text"
              list="mockChapterSuggestions"
              placeholder="Chapter / Topic e.g. Learning / Complete Paper"
              value={mockTestForm.chapter || ""}
              onChange={(e) => updateMockForm({ chapter: e.target.value })}
              disabled={!mockTestForm.subject}
            />

            <datalist id="mockChapterSuggestions">
              <option value="Complete Paper" />

              {chapterSuggestions.map((chapter) => (
                <option key={chapter.id || chapter.name} value={chapter.name} />
              ))}
            </datalist>
          </AdminMockField>

          <AdminMockField label="Exam Duration (Minutes)">
            <input
              type="number"
              min="1"
              placeholder="e.g. 150"
              value={mockTestForm.duration || ""}
              onChange={(e) => updateMockForm({ duration: e.target.value })}
            />
          </AdminMockField>

          <AdminMockField label="Default Marks Per Question">
            <input
              type="number"
              min="1"
              placeholder="e.g. 1 or 2"
              value={mockTestForm.marksPerQuestion || ""}
              onChange={(e) =>
                updateMockForm({ marksPerQuestion: e.target.value })
              }
            />
          </AdminMockField>

          <AdminMockField label="Default Negative Marks">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 0.25 or 0.50"
              value={mockTestForm.negativeMarks || ""}
              onChange={(e) =>
                updateMockForm({ negativeMarks: e.target.value })
              }
            />
          </AdminMockField>

          <AdminMockField label="Passing Marks">
            <input
              type="number"
              min="0"
              placeholder="e.g. 60"
              value={mockTestForm.passingMarks || ""}
              onChange={(e) => updateMockForm({ passingMarks: e.target.value })}
            />
          </AdminMockField>

          <AdminMockField label="Exam Difficulty">
            <select
              value={mockTestForm.examDifficulty || "Mixed"}
              onChange={(e) =>
                updateMockForm({ examDifficulty: e.target.value })
              }
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Exam Language">
            <select
              value={mockTestForm.examLanguage || "English"}
              onChange={(e) =>
                updateMockForm({ examLanguage: e.target.value })
              }
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Publish Status">
            <select
              value={mockTestForm.status || "published"}
              onChange={(e) => updateMockForm({ status: e.target.value })}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Attempt Limit">
            <select
              value={mockTestForm.attemptLimit || "unlimited"}
              onChange={(e) => updateMockForm({ attemptLimit: e.target.value })}
            >
              <option value="unlimited">Unlimited</option>
              <option value="1">1 Attempt</option>
              <option value="2">2 Attempts</option>
              <option value="3">3 Attempts</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Result Publish Mode">
            <select
              value={mockTestForm.resultPublishMode || "instant"}
              onChange={(e) =>
                updateMockForm({ resultPublishMode: e.target.value })
              }
            >
              <option value="instant">Instant Result</option>
              <option value="afterSubmission">After Submission</option>
              <option value="manual">Manual Publish</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Shuffle Questions">
            <select
              value={mockTestForm.shuffleQuestions || "no"}
              onChange={(e) =>
                updateMockForm({ shuffleQuestions: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Shuffle Options">
            <select
              value={mockTestForm.shuffleOptions || "no"}
              onChange={(e) =>
                updateMockForm({ shuffleOptions: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Navigation Mode">
            <select
              value={mockTestForm.navigationMode || "free"}
              onChange={(e) =>
                updateMockForm({ navigationMode: e.target.value })
              }
            >
              <option value="free">Free Navigation</option>
              <option value="sequential">Sequential Only</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Allow Pause">
            <select
              value={mockTestForm.allowPause || "yes"}
              onChange={(e) => updateMockForm({ allowPause: e.target.value })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Calculator Allowed">
            <select
              value={mockTestForm.calculatorAllowed || "no"}
              onChange={(e) =>
                updateMockForm({ calculatorAllowed: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Question Source">
            <select
              value={mockTestForm.questionSource || "manual"}
              onChange={(e) =>
                updateMockForm({ questionSource: e.target.value })
              }
            >
              <option value="manual">Manual</option>
              <option value="questionBank">Question Bank</option>
              <option value="imported">Imported</option>
              <option value="aiGenerated">AI Generated</option>
              <option value="pyq">PYQ</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Fullscreen Mode">
            <select
              value={mockTestForm.fullscreenMode || "no"}
              onChange={(e) => updateMockForm({ fullscreenMode: e.target.value })}
            >
              <option value="no">No</option>
              <option value="yes">Required</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Tab Switch Detection">
            <select
              value={mockTestForm.tabSwitchDetection || "no"}
              onChange={(e) =>
                updateMockForm({ tabSwitchDetection: e.target.value })
              }
            >
              <option value="no">Disabled</option>
              <option value="yes">Enabled</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Copy / Paste Protection">
            <select
              value={mockTestForm.copyPasteProtection || "no"}
              onChange={(e) =>
                updateMockForm({ copyPasteProtection: e.target.value })
              }
            >
              <option value="no">Disabled</option>
              <option value="yes">Enabled</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Auto Submit On Violation">
            <select
              value={mockTestForm.autoSubmitOnViolation || "no"}
              onChange={(e) =>
                updateMockForm({ autoSubmitOnViolation: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Leaderboard Mode">
            <select
              value={mockTestForm.leaderboardMode || "disabled"}
              onChange={(e) => updateMockForm({ leaderboardMode: e.target.value })}
            >
              {leaderboardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminMockField>

          <AdminMockField label="Timer Mode">
            <select
              value={mockTestForm.timerMode || "globalTimer"}
              onChange={(e) => updateMockForm({ timerMode: e.target.value })}
            >
              <option value="globalTimer">Global Timer</option>
              <option value="perQuestionTimer">Per Question Timer</option>
              <option value="noTimer">No Timer</option>
            </select>
          </AdminMockField>

          {mockTestForm.timerMode === "perQuestionTimer" && (
            <>
              <AdminMockField label="Time Value">
                <input
                  type="number"
                  min="1"
                  value={mockTestForm.perQuestionTimeValue || ""}
                  onChange={(e) =>
                    updateMockForm({ perQuestionTimeValue: e.target.value })
                  }
                />
              </AdminMockField>

              <AdminMockField label="Time Unit">
                <select
                  value={mockTestForm.perQuestionTimeUnit || "sec"}
                  onChange={(e) =>
                    updateMockForm({ perQuestionTimeUnit: e.target.value })
                  }
                >
                  <option value="sec">Seconds</option>
                  <option value="min">Minutes</option>
                  <option value="hr">Hours</option>
                </select>
              </AdminMockField>
            </>
          )}

          <AdminMockField label="Auto Submit On Time Up">
            <select
              value={mockTestForm.autoSubmitOnTimeUp || "yes"}
              onChange={(e) =>
                updateMockForm({ autoSubmitOnTimeUp: e.target.value })
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Schedule Type">
            <select
              value={mockTestForm.scheduleType || "alwaysAvailable"}
              onChange={(e) => updateMockForm({ scheduleType: e.target.value })}
            >
              <option value="alwaysAvailable">Always Available</option>
              <option value="dateOnly">Date Only</option>
              <option value="dateTime">Date + Time</option>
            </select>
          </AdminMockField>

          {mockTestForm.scheduleType !== "alwaysAvailable" && (
            <AdminMockField label="Exam Start Date">
              <input
                type={
                  mockTestForm.scheduleType === "dateOnly"
                    ? "date"
                    : "datetime-local"
                }
                value={mockTestForm.examStartDate || ""}
                onChange={(e) =>
                  updateMockForm({ examStartDate: e.target.value })
                }
              />
            </AdminMockField>
          )}

          {mockTestForm.scheduleType !== "alwaysAvailable" && (
            <AdminMockField label="Exam End Date">
              <input
                type={
                  mockTestForm.scheduleType === "dateOnly"
                    ? "date"
                    : "datetime-local"
                }
                value={mockTestForm.examEndDate || ""}
                onChange={(e) =>
                  updateMockForm({ examEndDate: e.target.value })
                }
              />
            </AdminMockField>
          )}

          <AdminMockField label="Recurring Mode">
            <select
              value={mockTestForm.recurringMode || "none"}
              onChange={(e) => updateMockForm({ recurringMode: e.target.value })}
            >
              <option value="none">No Recurring</option>
              <option value="weekly">Weekly Test</option>
              <option value="monthly">Monthly Test</option>
            </select>
          </AdminMockField>

          {mockTestForm.recurringMode === "weekly" && (
            <AdminMockField label="Weekly Test Day">
              <select
                value={mockTestForm.weeklyTestDay || ""}
                onChange={(e) =>
                  updateMockForm({ weeklyTestDay: e.target.value })
                }
              >
                <option value="">Select Day</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </AdminMockField>
          )}

          {mockTestForm.recurringMode === "monthly" && (
            <AdminMockField label="Monthly Test Date">
              <input
                type="number"
                min="1"
                max="31"
                value={mockTestForm.monthlyTestDate || ""}
                onChange={(e) =>
                  updateMockForm({ monthlyTestDate: e.target.value })
                }
              />
            </AdminMockField>
          )}

          <AdminMockField label="Live Event Mode">
            <select
              value={mockTestForm.liveEventMode || "no"}
              onChange={(e) => updateMockForm({ liveEventMode: e.target.value })}
            >
              <option value="no">Normal Test</option>
              <option value="yes">Live Event</option>
            </select>
          </AdminMockField>

          <AdminMockField label="Scholarship Exam Mode">
            <select
              value={mockTestForm.scholarshipMode || "no"}
              onChange={(e) => updateMockForm({ scholarshipMode: e.target.value })}
            >
              <option value="no">Disabled</option>
              <option value="yes">Enabled</option>
            </select>
          </AdminMockField>

          <AdminMockField
            label="Exam Instructions"
            className="adminMockAddInstructionsField"
          >
            <textarea
              placeholder="Write exam instructions shown before student starts the test"
              value={mockTestForm.examInstructions || ""}
              onChange={(e) =>
                updateMockForm({ examInstructions: e.target.value })
              }
            />
          </AdminMockField>
        </div>

        <div className="contentStudioList adminMockAddQuestionBuilderConsole">
          <div className="sectionHeader adminMockAddSectionHeader">
            <span className="badge">QUESTION BUILDER</span>

            <h2>Manual Question Entry</h2>

            <p>
              Add unlimited questions manually. Each question supports options,
              answer key, explanation, difficulty, topic tag, marks, negative
              marks, language, and status.
            </p>
          </div>

          {mockTestQuestionsForm.map((questionItem, questionIndex) => (
            <div
              className="contentStudioItem adminMockAddQuestionCard"
              key={questionIndex}
            >
              <strong>Question {questionIndex + 1}</strong>

              <div className="contentStudioGrid adminMockAddQuestionGrid">
                <textarea
                  className="adminMockAddQuestionTextarea"
                  placeholder="Enter Question"
                  value={questionItem.question || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { question: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Option A"
                  value={questionItem.option1 || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { option1: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Option B"
                  value={questionItem.option2 || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { option2: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Option C"
                  value={questionItem.option3 || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { option3: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Option D"
                  value={questionItem.option4 || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { option4: e.target.value })
                  }
                />

                <select
                  value={questionItem.answer || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { answer: e.target.value })
                  }
                >
                  <option value="">Correct Answer</option>
                  <option value="option1">Option A</option>
                  <option value="option2">Option B</option>
                  <option value="option3">Option C</option>
                  <option value="option4">Option D</option>
                </select>

                <textarea
                  className="adminMockAddExplanationTextarea"
                  placeholder="Explanation / Solution"
                  value={questionItem.explanation || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      explanation: e.target.value,
                    })
                  }
                />

                <select
                  value={questionItem.level || "Easy"}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { level: e.target.value })
                  }
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={questionItem.questionType || "Single Correct"}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      questionType: e.target.value,
                    })
                  }
                >
                  {questionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={questionItem.language || "English"}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { language: e.target.value })
                  }
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Topic Tag e.g. Piaget / Learning / EVS"
                  value={questionItem.tag || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { tag: e.target.value })
                  }
                />

                <AdminMockField label="Question Marks">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1"
                    value={questionItem.positiveMarks || ""}
                    onChange={(e) =>
                      updateQuestion(questionIndex, {
                        positiveMarks: e.target.value,
                      })
                    }
                  />
                </AdminMockField>

                <AdminMockField label="Question Negative Marks">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 0 or 0.25"
                    value={questionItem.negativeMarks || ""}
                    onChange={(e) =>
                      updateQuestion(questionIndex, {
                        negativeMarks: e.target.value,
                      })
                    }
                  />
                </AdminMockField>

                <div className="adminMockAddQuestionBankSettings">
                  <AdminMockField label="Question Status">
                    <select
                      value={questionItem.questionStatus || "published"}
                      onChange={(e) =>
                        updateQuestion(questionIndex, {
                          questionStatus: e.target.value,
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </select>
                  </AdminMockField>

                  <AdminMockField label="Save To Question Bank">
                    <select
                      value={questionItem.saveToQuestionBank || "yes"}
                      onChange={(e) =>
                        updateQuestion(questionIndex, {
                          saveToQuestionBank: e.target.value,
                        })
                      }
                    >
                      <option value="yes">Save To Question Bank</option>
                      <option value="no">Do Not Save To Question Bank</option>
                    </select>
                  </AdminMockField>
                </div>
              </div>

              <div className="contentStudioActions adminMockAddQuestionCardActions">
                <button
                  type="button"
                  className="backButton"
                  disabled={questionIndex === 0}
                  onClick={() => moveQuestion(questionIndex, -1)}
                >
                  ↑ Move Up
                </button>

                <button
                  type="button"
                  className="backButton"
                  disabled={questionIndex === mockTestQuestionsForm.length - 1}
                  onClick={() => moveQuestion(questionIndex, 1)}
                >
                  ↓ Move Down
                </button>

                <button
                  type="button"
                  className="backButton"
                  onClick={() => duplicateQuestion(questionIndex)}
                >
                  Duplicate Question
                </button>

                {mockTestQuestionsForm.length > 1 && (
                  <button
                    type="button"
                    className="deleteContentButton"
                    onClick={() => deleteQuestion(questionIndex)}
                  >
                    Delete Question
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="contentStudioActions adminMockAddFinalActions">
            <button
              type="button"
              className="dangerButton"
              onClick={resetQuestions}
            >
              Clear All Questions
            </button>

            <button type="button" className="publishButton" onClick={addQuestion}>
              + Add Question
            </button>

            <button
              type="button"
              className="publishButton"
              onClick={handleSaveMockTest}
            >
              {editingMockTestId
                ? "Update Examination Test"
                : "Save Examination Test"}
            </button>

            <button
              type="button"
              className="backButton"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back to Examination Studio
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
