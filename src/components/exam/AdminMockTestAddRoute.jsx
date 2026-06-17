export default function AdminMockTestAddRoute({
    editingMockTestId,
    mockTestForm,
    setMockTestForm,
    notesSubjectsList,
    notesChaptersList,
    mockTestQuestionsForm,
    setMockTestQuestionsForm,
    createEmptyMockQuestion,
    handleSaveMockTest,
    navigate,
  }) {
    return (
      <section className="coursePages">
              <div className="sectionHeader">
                <span className="badge">
                  {editingMockTestId
                    ? "EDIT EXAMINATION"
                    : "ADD EXAMINATION"}
                </span>
      
                <h1>
                  {editingMockTestId
                    ? "Edit Examination Test"
                    : "Create New Examination Test"}
                </h1>
      
                <p>
                  Build chapter tests, subject tests, full mocks, PYQ papers,
                  mixed tests, live exams, and custom exams without backend changes.
                </p>
              </div>
      
              <div className="contentStudioForm">
                <div className="sectionHeader">
                  <span className="badge">TEST CONFIGURATION</span>
      
                  <h2>Exam Setup</h2>
      
                  <p>
                    Define exam category, test type, access plan, subject,
                    chapter, duration, marking, and publish status.
                  </p>
                </div>
      
                <div className="contentStudioGrid">
                  <input
                    type="text"
                    placeholder="Test Title e.g. CTET Paper 1 Full Mock 01"
                    value={mockTestForm.title}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        title: e.target.value,
                      })
                    }
                  />
      
                  <select
                    value={mockTestForm.examType}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        examType: e.target.value,
                      })
                    }
                  >
           <option value="CTET">
        CTET
      </option>
      
      <option value="TET">
        TET
      </option>
      
      <option value="CTET/TET">
        CTET / TET
      </option>
      
      <option value="SSC">
        SSC
      </option>
      
      <option value="UPSC">
        UPSC
      </option>
      
      <option value="NEET">
        NEET
      </option>
      
      <option value="REET">
        REET
      </option>
      
      <option value="GPSC">
        GPSC
      </option>
      
      <option value="Banking">
        Banking
      </option>
      
      <option value="Railway">
        Railway
      </option>
      
      <option value="Teaching Aptitude">
        Teaching Aptitude
      </option>
      
      <option value="Current Affairs">
        Current Affairs
      </option>
      
      <option value="Mixed Test">
        Mixed Test
      </option>
      
      <option value="ALL SUBJECTS">
        ALL SUBJECTS
      </option>
      
      <option value="Custom Exam">
        Custom Exam
      </option>
                  </select>
      
                  <select
                    value={mockTestForm.testType}
                    onChange={(e) => {
                      const selectedType = e.target.value;
      
                      const isOverallTest =
                        selectedType === "Full Mock Test" ||
                        selectedType === "Grand Test" ||
                        selectedType === "Previous Year Paper" ||
                        selectedType === "Mixed Test" ||
                        selectedType === "Live Exam" ||
                        selectedType === "Custom Test";
      
                      setMockTestForm({
                        ...mockTestForm,
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
                 <option value="Chapter Test">
        Chapter Test
      </option>
      
      <option value="Topic Test">
        Topic Test
      </option>
      
      <option value="Unit Test">
        Unit Test
      </option>
      
      <option value="Sectional Test">
        Sectional Test
      </option>
      
      <option value="Subject Test">
        Subject Test
      </option>
      
      <option value="Full Mock Test">
        Full Mock Test
      </option>
      
      <option value="Previous Year Paper">
        Previous Year Paper
      </option>
      
      <option value="Grand Test">
        Grand Test
      </option>
      
      <option value="Practice Test">
        Practice Test
      </option>
      
      <option value="Daily Quiz">
        Daily Quiz
      </option>
      
      <option value="Weekly Test">
        Weekly Test
      </option>
      
      <option value="Monthly Test">
        Monthly Test
      </option>
      
      <option value="Live Exam">
        Live Exam
      </option>
      
      <option value="Custom Test">
        Custom Test
      </option>
                  </select>
      
                  <select
                    value={mockTestForm.planType}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        planType: e.target.value,
                      })
                    }
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="MENTORSHIP">MENTORSHIP</option>
                  </select>
      
                  <input
                    type="text"
                    list="mockSubjectSuggestions"
                    placeholder="Subject e.g. CDP / Maths / ALL SUBJECTS"
                    value={mockTestForm.subject}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        subject: e.target.value,
                        chapter:
                          e.target.value === "ALL SUBJECTS"
                            ? "Complete Paper"
                            : "",
                      })
                    }
                  />
      
                  <datalist id="mockSubjectSuggestions">
                    <option value="ALL SUBJECTS" />
      
                    {[
                      ...new Set([
                        ...notesSubjectsList
                          .map((subject) => subject.name)
                          .filter(Boolean),
      
                        ...universalContent
                          .map((item) => item.subject)
                          .filter(Boolean),
                      ]),
                    ]
                      .map((name) => name.trim())
                      .filter((name) => {
                        if (!name) return false;
                        if (name.length < 2) return false;
                        if (/^[a-zA-Z0-9]{15,}$/.test(name)) return false;
      
                        return true;
                      })
                      .filter(
                        (name, index, array) =>
                          array.findIndex(
                            (item) =>
                              item.toLowerCase() === name.toLowerCase()
                          ) === index
                      )
                      .map((name) => (
                        <option key={name} value={name} />
                      ))}
                  </datalist>
      
                  <input
                    type="text"
                    list="mockChapterSuggestions"
                    placeholder="Chapter / Topic e.g. Learning / Complete Paper"
                    value={mockTestForm.chapter}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        chapter: e.target.value,
                      })
                    }
                    disabled={!mockTestForm.subject}
                  />
      
                  <datalist id="mockChapterSuggestions">
                    <option value="Complete Paper" />
      
                    {notesChaptersList
                      .filter((chapter) => {
                        const selectedSubject =
                          mockTestForm.subject
                            ?.toString()
                            .trim()
                            .toLowerCase();
      
                        if (selectedSubject === "all subjects") {
                          return true;
                        }
      
                        const chapterSubjectName =
                          chapter.subjectName
                            ?.toString()
                            .trim()
                            .toLowerCase();
      
                        const chapterSubjectId =
                          chapter.subjectId
                            ?.toString()
                            .trim()
                            .toLowerCase();
      
                        return (
                          chapterSubjectName === selectedSubject ||
                          chapterSubjectId === selectedSubject
                        );
                      })
                      .map((chapter) => (
                        <option key={chapter.id} value={chapter.name} />
                      ))}
                  </datalist>
      
                  <div>
        <label>
          Exam Duration (Minutes)
        </label>
      
        <input
          type="number"
          min="1"
          placeholder="e.g. 150"
          value={mockTestForm.duration}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              duration: e.target.value,
            })
          }
        />
      </div>
      
      <div>
        <label>
          Default Marks Per Question
        </label>
      
        <input
          type="number"
          min="1"
          placeholder="e.g. 1 or 2"
          value={mockTestForm.marksPerQuestion}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              marksPerQuestion: e.target.value,
            })
          }
        />
      </div>
      
      <div>
        <label>
          Default Negative Marks
        </label>
      
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 0.25 or 0.50"
          value={mockTestForm.negativeMarks}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              negativeMarks: e.target.value,
            })
          }
        />
      </div>
      
      <div>
        <label>
          Passing Marks
        </label>
      
        <input
          type="number"
          min="0"
          placeholder="e.g. 60"
          value={mockTestForm.passingMarks}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              passingMarks: e.target.value,
            })
          }
        />
      </div>
      
      <div>
        <label>
          Exam Difficulty
        </label>
      
        <select
          value={mockTestForm.examDifficulty}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              examDifficulty: e.target.value,
            })
          }
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Mixed">Mixed</option>
        </select>
      </div>
      
      <div>
        <label>
          Exam Language
        </label>
      
        <select
          value={mockTestForm.examLanguage}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              examLanguage: e.target.value,
            })
          }
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Gujarati">Gujarati</option>
          <option value="Bilingual">Bilingual</option>
        </select>
      </div>
      
                  <select
                    value={mockTestForm.status}
                    onChange={(e) =>
                      setMockTestForm({
                        ...mockTestForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
      
                  <div>
        <label>
          Attempt Limit
        </label>
      
        <select
          value={mockTestForm.attemptLimit}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              attemptLimit: e.target.value,
            })
          }
        >
          <option value="unlimited">
            Unlimited
          </option>
      
          <option value="1">
            1 Attempt
          </option>
      
          <option value="2">
            2 Attempts
          </option>
      
          <option value="3">
            3 Attempts
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Result Publish Mode
        </label>
      
        <select
          value={mockTestForm.resultPublishMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              resultPublishMode: e.target.value,
            })
          }
        >
          <option value="instant">
            Instant Result
          </option>
      
          <option value="afterSubmission">
            After Submission
          </option>
      
          <option value="manual">
            Manual Publish
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Shuffle Questions
        </label>
      
        <select
          value={mockTestForm.shuffleQuestions}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              shuffleQuestions: e.target.value,
            })
          }
        >
          <option value="no">
            No
          </option>
      
          <option value="yes">
            Yes
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Shuffle Options
        </label>
      
        <select
          value={mockTestForm.shuffleOptions}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              shuffleOptions: e.target.value,
            })
          }
        >
          <option value="no">
            No
          </option>
      
          <option value="yes">
            Yes
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Navigation Mode
        </label>
      
        <select
          value={mockTestForm.navigationMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              navigationMode: e.target.value,
            })
          }
        >
          <option value="free">
            Free Navigation
          </option>
      
          <option value="sequential">
            Sequential Only
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Allow Pause
        </label>
      
        <select
          value={mockTestForm.allowPause}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              allowPause: e.target.value,
            })
          }
        >
          <option value="yes">
            Yes
          </option>
      
          <option value="no">
            No
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Calculator Allowed
        </label>
      
        <select
          value={mockTestForm.calculatorAllowed}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              calculatorAllowed: e.target.value,
            })
          }
        >
          <option value="no">
            No
          </option>
      
          <option value="yes">
            Yes
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Question Source
        </label>
      
        <select
          value={mockTestForm.questionSource}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              questionSource: e.target.value,
            })
          }
        >
          <option value="manual">
            Manual
          </option>
      
          <option value="questionBank">
            Question Bank
          </option>
      
          <option value="imported">
            Imported
          </option>
      
          <option value="aiGenerated">
            AI Generated
          </option>
      
          <option value="pyq">
            PYQ
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Fullscreen Mode
        </label>
      
        <select
          value={mockTestForm.fullscreenMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              fullscreenMode: e.target.value,
            })
          }
        >
          <option value="no">No</option>
          <option value="yes">Required</option>
        </select>
      </div>
      
      <div>
        <label>
          Tab Switch Detection
        </label>
      
        <select
          value={mockTestForm.tabSwitchDetection}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              tabSwitchDetection: e.target.value,
            })
          }
        >
          <option value="no">
        Disabled
      </option>
      
      <option value="yes">
        Enabled
      </option>
        </select>
      </div>
      
      <div>
        <label>
          Copy / Paste Protection
        </label>
      
        <select
          value={mockTestForm.copyPasteProtection}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              copyPasteProtection: e.target.value,
            })
          }
        >
          <option value="no">
            Disabled
          </option>
      
          <option value="yes">
            Enabled
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Auto Submit On Violation
        </label>
      
        <select
          value={mockTestForm.autoSubmitOnViolation}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              autoSubmitOnViolation: e.target.value,
            })
          }
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      
      <div>
        <label>
          Leaderboard Mode
        </label>
      
        <select
          value={mockTestForm.leaderboardMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              leaderboardMode: e.target.value,
            })
          }
        >
          <option value="disabled">
            Disabled
          </option>
      
          <option value="liveLeaderboard">
            Live Leaderboard
          </option>
      
          <option value="finalLeaderboard">
            Final Leaderboard
          </option>
      
          <option value="globalLeaderboard">
            Global Leaderboard
          </option>
      
          <option value="courseLeaderboard">
            Course Leaderboard
          </option>
      
          <option value="subjectLeaderboard">
            Subject Leaderboard
          </option>
      
          <option value="stateLeaderboard">
            State Leaderboard
          </option>
      
          <option value="batchLeaderboard">
            Batch Leaderboard
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Timer Mode
        </label>
      
        <select
          value={mockTestForm.timerMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              timerMode: e.target.value,
            })
          }
        >
          <option value="globalTimer">
            Global Timer
          </option>
      
          <option value="perQuestionTimer">
            Per Question Timer
          </option>
      
          <option value="noTimer">
            No Timer
          </option>
        </select>
      </div>
      {mockTestForm.timerMode === "perQuestionTimer" && (
        <>
          <div>
            <label>
              Time Value
            </label>
      
            <input
              type="number"
              min="1"
              value={mockTestForm.perQuestionTimeValue}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  perQuestionTimeValue: e.target.value,
                })
              }
            />
          </div>
      
          <div>
            <label>
              Time Unit
            </label>
      
            <select
              value={mockTestForm.perQuestionTimeUnit}
              onChange={(e) =>
                setMockTestForm({
                  ...mockTestForm,
                  perQuestionTimeUnit: e.target.value,
                })
              }
            >
              <option value="sec">
                Seconds
              </option>
      
              <option value="min">
                Minutes
              </option>
      
              <option value="hr">
                Hours
              </option>
            </select>
          </div>
        </>
      )}
      <div>
        <label>
          Auto Submit On Time Up
        </label>
      
        <select
          value={mockTestForm.autoSubmitOnTimeUp}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              autoSubmitOnTimeUp: e.target.value,
            })
          }
        >
          <option value="yes">
            Yes
          </option>
      
          <option value="no">
            No
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Schedule Type
        </label>
      
        <select
          value={mockTestForm.scheduleType}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              scheduleType: e.target.value,
            })
          }
        >
          <option value="alwaysAvailable">
            Always Available
          </option>
      
          <option value="dateOnly">
            Date Only
          </option>
      
          <option value="dateTime">
            Date + Time
          </option>
        </select>
      </div>
      
      {mockTestForm.scheduleType !== "alwaysAvailable" && (
        <div>
          <label>
            Exam Start Date
          </label>
      
          <input
            type={
              mockTestForm.scheduleType === "dateOnly"
                ? "date"
                : "datetime-local"
            }
            value={mockTestForm.examStartDate}
            onChange={(e) =>
              setMockTestForm({
                ...mockTestForm,
                examStartDate: e.target.value,
              })
            }
          />
        </div>
      )}
      
      {mockTestForm.scheduleType !== "alwaysAvailable" && (
        <div>
          <label>
            Exam End Date
          </label>
      
          <input
            type={
              mockTestForm.scheduleType === "dateOnly"
                ? "date"
                : "datetime-local"
            }
            value={mockTestForm.examEndDate}
            onChange={(e) =>
              setMockTestForm({
                ...mockTestForm,
                examEndDate: e.target.value,
              })
            }
          />
        </div>
      )}
      
      <div>
        <label>
          Recurring Mode
        </label>
      
        <select
          value={mockTestForm.recurringMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              recurringMode: e.target.value,
            })
          }
        >
          <option value="none">
            No Recurring
          </option>
      
          <option value="weekly">
            Weekly Test
          </option>
      
          <option value="monthly">
            Monthly Test
          </option>
        </select>
      </div>
      
      {mockTestForm.recurringMode === "weekly" && (
        <div>
          <label>
            Weekly Test Day
          </label>
      
          <select
            value={mockTestForm.weeklyTestDay}
            onChange={(e) =>
              setMockTestForm({
                ...mockTestForm,
                weeklyTestDay: e.target.value,
              })
            }
          >
            <option value="">
              Select Day
            </option>
      
            <option value="Sunday">
              Sunday
            </option>
      
            <option value="Monday">
              Monday
            </option>
      
            <option value="Tuesday">
              Tuesday
            </option>
      
            <option value="Wednesday">
              Wednesday
            </option>
      
            <option value="Thursday">
              Thursday
            </option>
      
            <option value="Friday">
              Friday
            </option>
      
            <option value="Saturday">
              Saturday
            </option>
          </select>
        </div>
      )}
      
      {mockTestForm.recurringMode === "monthly" && (
        
        <div>
          <label>
            Monthly Test Date
          </label>
      
          <input
            type="number"
            min="1"
            max="31"
            value={mockTestForm.monthlyTestDate}
            onChange={(e) =>
              setMockTestForm({
                ...mockTestForm,
                monthlyTestDate: e.target.value,
              })
            }
          />
        </div>
      )}
      
      <div>
        <label>
          Live Event Mode
        </label>
      
        <select
          value={mockTestForm.liveEventMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              liveEventMode: e.target.value,
            })
          }
        >
          <option value="no">
            Normal Test
          </option>
      
          <option value="yes">
            Live Event
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Scholarship Exam Mode
        </label>
      
        <select
          value={mockTestForm.scholarshipMode}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              scholarshipMode: e.target.value,
            })
          }
        >
          <option value="no">
            Disabled
          </option>
      
          <option value="yes">
            Enabled
          </option>
        </select>
      </div>
      
      <div>
        <label>
          Exam Instructions
        </label>
      
        <textarea
          placeholder="Write exam instructions shown before student starts the test"
          value={mockTestForm.examInstructions}
          onChange={(e) =>
            setMockTestForm({
              ...mockTestForm,
              examInstructions: e.target.value,
            })
          }
        />
      </div>
      
                </div>
      
                <div className="contentStudioList">
                  <div className="sectionHeader">
                    <span className="badge">QUESTION BUILDER</span>
      
                    <h2>Manual Question Entry</h2>
      
                    <p>
                      Add unlimited questions manually. Each question supports
                      options, answer key, explanation, difficulty, topic tag,
                      marks, negative marks, language, and status.
                    </p>
                  </div>
      
                  {mockTestQuestionsForm.map((questionItem, questionIndex) => (
                    <div className="contentStudioItem" key={questionIndex}>
                      <strong>Question {questionIndex + 1}</strong>
      
                      <div className="contentStudioGrid">
                        <textarea
                          placeholder="Enter Question"
                          value={questionItem.question}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].question =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <input
                          type="text"
                          placeholder="Option A"
                          value={questionItem.option1}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].option1 =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <input
                          type="text"
                          placeholder="Option B"
                          value={questionItem.option2}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].option2 =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <input
                          type="text"
                          placeholder="Option C"
                          value={questionItem.option3}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].option3 =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <input
                          type="text"
                          placeholder="Option D"
                          value={questionItem.option4}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].option4 =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <select
                          value={questionItem.answer}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].answer =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        >
                          <option value="">Correct Answer</option>
                          <option value="option1">Option A</option>
                          <option value="option2">Option B</option>
                          <option value="option3">Option C</option>
                          <option value="option4">Option D</option>
                        </select>
      
                        <textarea
                          placeholder="Explanation / Solution"
                          value={questionItem.explanation}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].explanation =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
                        <select
                          value={questionItem.level}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].level =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
      
                        <select
                          value={questionItem.questionType}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].questionType =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        >
                    <option value="Single Correct">
        Single Correct
      </option>
      
      <option value="Multiple Correct">
        Multiple Correct
      </option>
      
      <option value="True False">
        True / False
      </option>
      
      <option value="Assertion Reason">
        Assertion Reason
      </option>
      
      <option value="Passage Based">
        Passage Based
      </option>
      
      <option value="Image Based">
        Image Based
      </option>
      
      <option value="Match the Following">
        Match the Following
      </option>
      
      <option value="Statement Based">
        Statement Based
      </option>
                        </select>
      
                        <select
                          value={questionItem.language}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].language =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Gujarati">Gujarati</option>
                          <option value="Bilingual">Bilingual</option>
                        </select>
      
                        <input
                          type="text"
                          placeholder="Topic Tag e.g. Piaget / Learning / EVS"
                          value={questionItem.tag}
                          onChange={(e) => {
                            const updatedQuestions = [
                              ...mockTestQuestionsForm,
                            ];
      
                            updatedQuestions[questionIndex].tag =
                              e.target.value;
      
                            setMockTestQuestionsForm(updatedQuestions);
                          }}
                        />
      
      <div>
        <label>
          Question Marks
        </label>
      
        <input
          type="number"
          min="0"
          placeholder="e.g. 1"
          value={questionItem.positiveMarks}
          onChange={(e) => {
            const updatedQuestions = [
              ...mockTestQuestionsForm,
            ];
      
            updatedQuestions[questionIndex].positiveMarks =
              e.target.value;
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        />
      </div>
      
      <div>
        <label>
          Question Negative Marks
        </label>
      
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 0 or 0.25"
          value={questionItem.negativeMarks}
          onChange={(e) => {
            const updatedQuestions = [
              ...mockTestQuestionsForm,
            ];
      
            updatedQuestions[questionIndex].negativeMarks =
              e.target.value;
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        />
      </div>
      
      <div>
      
        <label>
          Question Status
        </label>
      
        <select
          value={questionItem.questionStatus}
          onChange={(e) => {
            const updatedQuestions = [
              ...mockTestQuestionsForm,
            ];
      
            updatedQuestions[questionIndex].questionStatus =
              e.target.value;
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        >
      
      
          <option value="draft">
            Draft
          </option>
      
          <option value="approved">
            Approved
          </option>
      
          <option value="published">
            Published
          </option>
        </select>
      
        <label>Save To Question Bank</label>
      
      <select
        value={questionItem.saveToQuestionBank}
        onChange={(e) => {
          const updatedQuestions = [
            ...mockTestQuestionsForm,
          ];
      
          updatedQuestions[questionIndex].saveToQuestionBank =
            e.target.value;
      
          setMockTestQuestionsForm(updatedQuestions);
        }}
      >
        <option value="yes">Save To Question Bank</option>
        <option value="no">Do Not Save To Question Bank</option>
      </select>
      
      
      </div>
      
                      </div>
      
                      <div className="contentStudioActions">
        <button
          className="backButton"
          disabled={questionIndex === 0}
          onClick={() => {
            const updatedQuestions = [...mockTestQuestionsForm];
            const currentQuestion = updatedQuestions[questionIndex];
      
            updatedQuestions[questionIndex] =
              updatedQuestions[questionIndex - 1];
      
            updatedQuestions[questionIndex - 1] = currentQuestion;
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        >
          ↑ Move Up
        </button>
      
        <button
          className="backButton"
          disabled={questionIndex === mockTestQuestionsForm.length - 1}
          onClick={() => {
            const updatedQuestions = [...mockTestQuestionsForm];
            const currentQuestion = updatedQuestions[questionIndex];
      
            updatedQuestions[questionIndex] =
              updatedQuestions[questionIndex + 1];
      
            updatedQuestions[questionIndex + 1] = currentQuestion;
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        >
          ↓ Move Down
        </button>
      
        <button
          className="backButton"
          onClick={() => {
            const duplicatedQuestion = {
              ...mockTestQuestionsForm[questionIndex],
              question: `${mockTestQuestionsForm[questionIndex].question || ""} Copy`,
              saveToQuestionBank: "no",
            };
      
            const updatedQuestions = [...mockTestQuestionsForm];
      
            updatedQuestions.splice(
              questionIndex + 1,
              0,
              duplicatedQuestion
            );
      
            setMockTestQuestionsForm(updatedQuestions);
          }}
        >
          Duplicate Question
        </button>
      
        {mockTestQuestionsForm.length > 1 && (
          <button
            className="deleteContentButton"
            onClick={() => {
              const updatedQuestions = mockTestQuestionsForm.filter(
                (_, index) => index !== questionIndex
              );
      
              setMockTestQuestionsForm(updatedQuestions);
            }}
          >
            Delete Question
          </button>
        )}
      </div>
                    </div>
                  ))}
      
                  <div className="contentStudioActions">
                  <button
        className="dangerButton"
        onClick={() => {
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
        }}
      >
        Clear All Questions
      </button>
      <button
        className="publishButton"
        onClick={() =>
          setMockTestQuestionsForm((prev) => [
            ...prev,
            {
              ...createEmptyMockQuestion(),
              positiveMarks: mockTestForm.marksPerQuestion || "1",
              negativeMarks: mockTestForm.negativeMarks || "0",
            },
          ])
        }
      >
        + Add Question
      </button>
      
                    <button
                      className="publishButton"
                      onClick={handleSaveMockTest}
                    >
                      {editingMockTestId
                        ? "Update Examination Test"
                        : "Save Examination Test"}
                    </button>
      
                    <button
                      className="backButton"
                      onClick={() =>
                        navigate("/admin/content/mock-tests")
                      }
                    >
                      ← Back to Examination Studio
                    </button>
                  </div>
                </div>
              </div>
            </section>
    );
  }
  