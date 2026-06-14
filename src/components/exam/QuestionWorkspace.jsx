import QuestionStatusRow from "./QuestionStatusRow.jsx";
import OptionList from "./OptionList.jsx";
import ActionBar from "./ActionBar.jsx";

export default function QuestionWorkspace({
  questions,
  currentQuestion,
  currentQuestionIndex,
  selectedAnswerKey,
  isMarked,
  optionList,
  examFontScale,
  onDecreaseFont,
  onResetFont,
  onIncreaseFont,
  onSelectOption,
  isFirstQuestion,
  isLastQuestion,
  onPrevious,
  onClearResponse,
  onMarkForReviewAndNext,
  onSaveAndNext,
  onSubmit,
}) {
  return (
    <main className="premiumQuestionWorkspace aspireExamMain">
      {questions.length === 0 ? (
        <div className="examEmptyState">
          <h2>No Questions Found</h2>
          <p>This mock test does not have questions yet.</p>
        </div>
      ) : (
        <div className="examAttemptCardPro">
          <QuestionStatusRow
            currentQuestionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            selectedAnswerKey={selectedAnswerKey}
            isMarked={isMarked}
          />

          <div className="examZoomControls">
            <span>Text Size</span>

            <button type="button" onClick={onDecreaseFont}>
              A-
            </button>

            <button type="button" onClick={onResetFont}>
              A
            </button>

            <button type="button" onClick={onIncreaseFont}>
              A+
            </button>
          </div>

          <div
            className="examQuestionBlockPro"
            style={{ fontSize: `${examFontScale}em` }}
          >
            <div className="examQuestionNoPro">
              {currentQuestionIndex + 1}
            </div>

            <h2>{currentQuestion?.question}</h2>
          </div>

          <OptionList
            optionList={optionList}
            selectedAnswerKey={selectedAnswerKey}
            examFontScale={examFontScale}
            onSelectOption={onSelectOption}
          />

          <ActionBar
            isFirstQuestion={isFirstQuestion}
            isLastQuestion={isLastQuestion}
            onPrevious={onPrevious}
            onClearResponse={onClearResponse}
            onMarkForReviewAndNext={onMarkForReviewAndNext}
            onSaveAndNext={onSaveAndNext}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </main>
  );
}