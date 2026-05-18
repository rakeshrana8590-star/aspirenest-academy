export default function MockTest({
    mockStarted,
    setMockStarted,
    showResult,
    currentQuestion,
    mockQuestions,
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
    return (
      <section className="mockPyq premiumMock" id="mocktest">
        <div className="mockIntro">
          <span className="badge">Free Practice Test</span>
  
          <h2>CTET Mock Test</h2>
  
          <p>
            Exam-style MCQs, instant scoring and smart practice experience.
          </p>
  
          {mockStarted && !showResult && (
            <div className="mockProgress">
              <div
                className="mockProgressFill"
                style={{
                  width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%`,
                }}
              ></div>
            </div>
          )}
  
          {mockStarted && !showResult && (
            <>
              <p className="mockTimer">
                ⏱️ Time Left: {timeLeft}s
              </p>
  
              <p className="mockCounter">
                Score: {score} / {mockQuestions.length}
              </p>
            </>
          )}
        </div>
  
        {mockQuestions.length === 0 && (
          <p className="sectionText">
            Loading mock questions...
          </p>
        )}
  
        <div className="subjectFilters">
          <button
            className="subjectBtn"
            onClick={() => {
              setSelectedSubject("CDP");
              loadMockQuestions("CDP");
            }}
          >
            CDP
          </button>
  
          <button
            className="subjectBtn"
            onClick={() => {
              setSelectedSubject("Maths");
              loadMockQuestions("Maths");
            }}
          >
            Maths
          </button>
  
          <button
            className="subjectBtn"
            onClick={() => {
              setSelectedSubject("EVS");
              loadMockQuestions("EVS");
            }}
          >
            EVS
          </button>
  
          <button
            className="subjectBtn"
            onClick={() => {
              setSelectedSubject("Language");
              loadMockQuestions("Language");
            }}
          >
            Language
          </button>
        </div>
  
        <div className="mockBox premiumMockBox">
          {!mockStarted ? (
            <>
              <h3>Ready to start?</h3>
  
              <p>3 demo questions se practice start karo.</p>
  
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
                Score: {score} / {mockQuestions.length}
              </p>
  
              <h4 className="performanceLevel">
                {performanceLevel}
              </h4>
  
              <p className="motivationalMessage">
                {motivationalMessage}
              </p>
  
              <button className="btnLink" onClick={restartMockTest}>
                Restart Test
              </button>
            </>
          ) : (
            <>
              <span className="questionTag">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </span>
  
              <h3>{mockQuestions[currentQuestion].question}</h3>
  
              <div className="options">
                {mockQuestions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    className={`optionBtn ${
                      showAnswer &&
                      option === mockQuestions[currentQuestion].answer
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