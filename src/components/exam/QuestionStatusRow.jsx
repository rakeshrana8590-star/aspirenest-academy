export default function QuestionStatusRow({
    currentQuestionNumber,
    totalQuestions,
    selectedAnswerKey,
    isMarked,
  }) {
    return (
      <div className="examRefStatusRow">
        <span className="examRefPill dark">
          Q{currentQuestionNumber} of {totalQuestions}
        </span>
  
        <span
          className={
            selectedAnswerKey
              ? "examRefPill success"
              : "examRefPill warning"
          }
        >
          {selectedAnswerKey ? "Answered" : "Not Answered"}
        </span>
  
        <span
          className={
            isMarked
              ? "examRefPill review"
              : "examRefPill neutral"
          }
        >
          {isMarked ? "Marked for Review" : "Not Marked"}
        </span>
  
        <span className="examRefPill neutral">
          Current Question
        </span>
      </div>
    );
  }