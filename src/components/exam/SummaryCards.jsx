export default function SummaryCards({
    answeredCount,
    markedCount,
    notAnsweredCount,
    notVisitedCount,
    onOpenStatus,
  }) {
    return (
      <div className="paletteSummary examQuickSummary">
        <button
          type="button"
          className="examQuickItem"
          onClick={() => onOpenStatus("answered")}
        >
          <span className="dot answeredDot"></span>
          <strong>{answeredCount}</strong>
          <small>Answered</small>
        </button>
  
        <button
          type="button"
          className="examQuickItem"
          onClick={() => onOpenStatus("review")}
        >
          <span className="dot markedDot"></span>
          <strong>{markedCount}</strong>
          <small>Review</small>
        </button>
  
        <button
          type="button"
          className="examQuickItem"
          onClick={() => onOpenStatus("notAnswered")}
        >
          <span className="dot pendingDot"></span>
          <strong>{notAnsweredCount}</strong>
          <small>Not Answered</small>
        </button>
  
        <button
          type="button"
          className="examQuickItem"
          onClick={() => onOpenStatus("notVisited")}
        >
          <span className="dot notVisitedDot"></span>
          <strong>{notVisitedCount}</strong>
          <small>Not Visited</small>
        </button>
      </div>
    );
  }