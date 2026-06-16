export default function SummaryCards({
  answeredCount,
  markedCount,
  notAnsweredCount,
  notVisitedCount,
  onOpenStatus,
}) {
  return (
    <div className="paletteSummaryCards" aria-label="Question status summary">
      <button
        type="button"
        className="paletteSummaryCard answeredQuickItem"
        onClick={() => onOpenStatus("answered")}
      >
        <span className="paletteSummaryDot paletteAnsweredDot"></span>
        <strong>{answeredCount}</strong>
        <small>Answered</small>
      </button>

      <button
        type="button"
        className="paletteSummaryCard reviewQuickItem"
        onClick={() => onOpenStatus("review")}
      >
        <span className="paletteSummaryDot paletteMarkedDot"></span>
        <strong>{markedCount}</strong>
        <small>Review</small>
      </button>

      <button
        type="button"
        className="paletteSummaryCard pendingQuickItem"
        onClick={() => onOpenStatus("notAnswered")}
      >
        <span className="paletteSummaryDot palettePendingDot"></span>
        <strong>{notAnsweredCount}</strong>
        <small>Not Answered</small>
      </button>

      <button
        type="button"
        className="paletteSummaryCard notVisitedQuickItem"
        onClick={() => onOpenStatus("notVisited")}
      >
        <span className="paletteSummaryDot paletteNotVisitedDot"></span>
        <strong>{notVisitedCount}</strong>
        <small>Not Visited</small>
      </button>
    </div>
  );
}