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
  const safeCandidateName = candidateName || "Student";
  const isEmailCandidate = safeCandidateName.includes("@");

  const [candidateLocalPart, candidateDomainPart] = isEmailCandidate
    ? safeCandidateName.split("@")
    : [safeCandidateName, ""];

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
        <div
          className="candidateExamPanel"
          title={safeCandidateName}
        >
          <span>Candidate</span>

          <strong>
            {isEmailCandidate
              ? candidateLocalPart
              : safeCandidateName}
          </strong>

          {isEmailCandidate && (
            <small className="candidateEmailDomain">
              @{candidateDomainPart}
            </small>
          )}
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