export default function MockTest({
  mockStarted,
  setMockStarted,
  showResult,
  currentQuestion,
  mockQuestions = [],
  timeLeft,
  setTimeLeft,
  score,
  selectedSubject,
  setSelectedSubject,
  loadMockQuestions,
  percentage,
  performanceLevel,
  motivationalMessage,
  restartMockTest,
  selectedAnswer,
  setSelectedAnswer,
  showAnswer,
  handleAnswerSubmit,
}) {
  const safeQuestions = mockQuestions || [];
  const currentMockQuestion = safeQuestions[currentQuestion];

  return (
    <section className="mockPyq premiumMock" id="mock-tests">
      <div className="mockIntro">
        <span className="badge">Free Practice Test</span>

        <h2>CTET Mock Test</h2>

        <p>
          Exam-style MCQs, instant scoring and smart practice experience.
        </p>

        {mockStarted && !showResult && safeQuestions.length > 0 && (
          <div className="mockProgress">
            <div
              className="mockProgressFill"
              style={{
                width: `${((currentQuestion + 1) / safeQuestions.length) * 100}%`,
              }}
            ></div>
          </div>
        )}

        {mockStarted && !showResult && (
          <>
            <p className="mockTimer">⏱️ Time Left: {timeLeft}s</p>

            <p className="mockCounter">
              Score: {score} / {safeQuestions.length}
            </p>
          </>
        )}
      </div>

      {safeQuestions.length === 0 && (
        <p className="sectionText">Loading mock questions...</p>
      )}

      <div className="subjectFilters">
        {["CDP", "Maths", "EVS", "Language"].map((subject) => (
          <button
            key={subject}
            className={
              selectedSubject === subject
                ? "subjectBtn activeSubject"
                : "subjectBtn"
            }
            onClick={() => {
              setSelectedSubject(subject);
              loadMockQuestions(subject);
            }}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="mockBox premiumMockBox">
        {!mockStarted ? (
          <>
            <h3>Ready to start?</h3>

            <p>Practice test start karo aur instant score dekho.</p>

            <button
              className="btnLink"
              onClick={() => {
                setMockStarted(true);
                setTimeLeft(60);
              }}
            >
              Start Mock Test
            </button>
          </>
        ) : showResult ? (
          <>
            <h3>Test Completed 🎉</h3>

            <div className="resultCircle">
              <span>{percentage}%</span>
            </div>

            <p className="resultScore">
              Score: {score} / {safeQuestions.length}
            </p>

            <h4 className="performanceLevel">{performanceLevel}</h4>

            <p className="motivationalMessage">{motivationalMessage}</p>

            <button className="btnLink" onClick={restartMockTest}>
              Restart Test
            </button>
          </>
        ) : !currentMockQuestion ? (
          <p className="sectionText">Questions loading...</p>
        ) : (
          <>
            <span className="questionTag">
              Question {currentQuestion + 1} of {safeQuestions.length}
            </span>

            <h3>{currentMockQuestion.question}</h3>

            <div className="options">
              {currentMockQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`optionBtn ${
                    showAnswer && option === currentMockQuestion.answer
                      ? "correctOption"
                      : showAnswer && option === selectedAnswer
                      ? "wrongOption"
                      : selectedAnswer === option
                      ? "activeOption"
                      : ""
                  }`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <button className="btnLink" onClick={handleAnswerSubmit}>
              Submit Answer
            </button>
          </>
        )}
      </div>
    </section>
  );
}