export default function ActionBar({
    isFirstQuestion,
    isLastQuestion,
    onPrevious,
    onClearResponse,
    onMarkForReviewAndNext,
    onSaveAndNext,
    onSubmit,
  }) {
    return (
      <div className="aspireExamActionBar">
        <button
          type="button"
          className="examControlBtn secondary"
          disabled={isFirstQuestion}
          onClick={onPrevious}
        >
          ← Previous
        </button>
  
        <button
          type="button"
          className="examControlBtn ghost"
          onClick={onClearResponse}
        >
          Clear Response
        </button>
  
        <button
          type="button"
          className="examControlBtn review"
          onClick={onMarkForReviewAndNext}
        >
          Mark for Review & Next
        </button>
  
        <button
          type="button"
          className="examControlBtn primary"
          onClick={isLastQuestion ? onSubmit : onSaveAndNext}
        >
          {isLastQuestion ? "Submit Test" : "Save & Next"}
        </button>
      </div>
    );
  }