import AspireNestLogo from "../AspireNestLogo.jsx";

export default function ExamHeader({
  test,
  candidateName,
  isNoTimer,
  timerLabel,
  formattedTime,
  currentQuestionNumber,
  totalQuestions,
  answeredCount,
  onSubmit,
}) {
  return (
    <div className="premiumExamTop examHeaderCompact">
      <div className="premiumExamBrand">
        <AspireNestLogo />
      </div>

      <div className="examTitleBlock compactExamTitleBlock">
        <h1>{test.title}</h1>
        <p>
          {test.subject} · {test.chapter}
        </p>
      </div>

      <div className="examTopStats compactExamStats">
        <div className="candidateExamPanel">
          <span>Candidate</span>
          <strong>{candidateName}</strong>
        </div>

        {!isNoTimer && (
          <div className="timerStat">
            <span>{timerLabel}</span>
            <strong>⏱ {formattedTime}</strong>
          </div>
        )}

        <div>
          <span>Question</span>
          <strong>
            {currentQuestionNumber}/{totalQuestions}
          </strong>
        </div>

        <div>
          <span>Answered</span>
          <strong>{answeredCount}</strong>
        </div>

        <button
          type="button"
          className="examSubmitBtn"
          onClick={onSubmit}
        >
          Submit Test
        </button>
      </div>
    </div>
  );
}