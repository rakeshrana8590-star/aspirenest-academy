import SummaryCards from "./SummaryCards.jsx";
import WarningCard from "./WarningCard.jsx";
import SubmitCard from "./SubmitCard.jsx";

export default function PalettePanel({
  totalQuestions,
  answeredCount,
  markedCount,
  notAnsweredCount,
  notVisitedCount,
  paletteRanges,
  finalPaletteRangeStart,
  paletteFilter,
  visiblePaletteIndexes,
  currentQuestionIndex,
  attemptState,
  isCalculatorAllowed,
  onRangeSelect,
  onQuestionSelect,
  onOpenStatus,
  onSubmit,
}) {
  const getPaletteStatusClass = (index) => {
    const isAnswered = Boolean(attemptState.answers?.[index]);
    const isMarked = Boolean(attemptState.marked?.[index]);
    const isVisited = Boolean(attemptState.visited?.[index]);

    if (isAnswered && isMarked) {
      return "paletteAnsweredReview";
    }

    if (!isAnswered && isMarked) {
      return "paletteMarked";
    }

    if (isAnswered && !isMarked) {
      return "paletteAnswered";
    }

    if (isVisited && !isAnswered) {
      return "paletteNotAnswered";
    }

    return "paletteNotVisited";
  };

  return (
    <aside className="premiumPalettePanel aspireExamSide">
      <div className="paletteHeader">
        <h3>Question Palette</h3>
        <p>
          {answeredCount}/{totalQuestions} answered
        </p>
      </div>

      <div className="paletteRanges">
        {paletteRanges.map((range) => (
          <button
            key={range.start}
            type="button"
            className={
              finalPaletteRangeStart === range.start &&
              paletteFilter === "all"
                ? "paletteRangeBtn active"
                : "paletteRangeBtn"
            }
            onClick={() => onRangeSelect(range.start)}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="premiumPaletteGrid">
        {visiblePaletteIndexes.map((index) => {
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              type="button"
              key={index}
              className={[
                "paletteNumber",
                getPaletteStatusClass(index),
                isCurrent ? "paletteCurrent" : "",
              ].join(" ")}
              onClick={() => onQuestionSelect(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <SummaryCards
        answeredCount={answeredCount}
        markedCount={markedCount}
        notAnsweredCount={notAnsweredCount}
        notVisitedCount={notVisitedCount}
        onOpenStatus={onOpenStatus}
      />

      <WarningCard
        tabSwitchCount={attemptState.violations?.tabSwitchCount}
        fullscreenExitCount={
          attemptState.violations?.fullscreenExitCount
        }
      />

      {isCalculatorAllowed && (
        <div className="examFinalBox">
          <h4>Calculator</h4>

          <p>Calculator is allowed for this mock test.</p>

          <button
            type="button"
            className="btnLink"
            onClick={() =>
              window.open(
                "https://www.google.com/search?q=calculator",
                "_blank"
              )
            }
          >
            Open Calculator
          </button>
        </div>
      )}

      <SubmitCard onSubmit={onSubmit} />
    </aside>
  );
}