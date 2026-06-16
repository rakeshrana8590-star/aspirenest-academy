import { useState } from "react";
import { createPortal } from "react-dom";
import SummaryCards from "./SummaryCards.jsx";
import WarningCard from "./WarningCard.jsx";
import { getPaletteStatusClass } from "./examUtils.js";

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
}) {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState("");

  const appendCalculatorValue = (value) => {
    setCalculatorValue((prev) =>
      prev === "Error" ? value : `${prev}${value}`
    );
  };

  const clearCalculatorValue = () => {
    setCalculatorValue("");
  };

  const removeLastCalculatorValue = () => {
    setCalculatorValue((prev) =>
      prev === "Error" ? "" : prev.slice(0, -1)
    );
  };

  const calculateCalculatorValue = () => {
    try {
      const expression = calculatorValue
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/%/g, "/100");

      const isSafeExpression =
        /^[0-9+\-*/().\s]+$/.test(expression);

      if (!isSafeExpression || !expression.trim()) {
        setCalculatorValue("Error");
        return;
      }

      const result = Function(
        `"use strict"; return (${expression})`
      )();

      if (!Number.isFinite(Number(result))) {
        setCalculatorValue("Error");
        return;
      }

      setCalculatorValue(String(result));
    } catch {
      setCalculatorValue("Error");
    }
  };

  const calculatorPanel =
    isCalculatorAllowed && isCalculatorOpen
      ? createPortal(
          <div className="paletteCalculatorFloatingPanel">
            <div className="paletteCalculatorFloatingHeader">
              <strong>Calculator</strong>

              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                aria-label="Close calculator"
              >
                ×
              </button>
            </div>

            <div className="paletteCalculatorDisplay">
              {calculatorValue || "0"}
            </div>

            <div className="paletteCalculatorKeys">
              <button type="button" onClick={clearCalculatorValue}>
                AC
              </button>

              <button
                type="button"
                onClick={removeLastCalculatorValue}
              >
                DEL
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("%")}
              >
                %
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("÷")}
              >
                ÷
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("7")}
              >
                7
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("8")}
              >
                8
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("9")}
              >
                9
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("×")}
              >
                ×
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("4")}
              >
                4
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("5")}
              >
                5
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("6")}
              >
                6
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("−")}
              >
                −
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("1")}
              >
                1
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("2")}
              >
                2
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("3")}
              >
                3
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("+")}
              >
                +
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("0")}
              >
                0
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue(".")}
              >
                .
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue("(")}
              >
                (
              </button>

              <button
                type="button"
                onClick={() => appendCalculatorValue(")")}
              >
                )
              </button>

              <button
                type="button"
                className="paletteCalculatorEquals"
                onClick={calculateCalculatorValue}
              >
                =
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <aside className="premiumPalettePanel aspireExamSide">
        <div className="paletteHeader">
          <h3>Question Palette</h3>
          <p>
            {answeredCount}/{totalQuestions} answered
          </p>
        </div>

        <div className="paletteRanges" aria-label="Question range selector">
          {paletteRanges.map((range) => {
            const isActive =
              finalPaletteRangeStart === range.start &&
              paletteFilter === "all";

            return (
              <button
                key={range.start}
                type="button"
                className={
                  isActive
                    ? "paletteRangeBtn active"
                    : "paletteRangeBtn"
                }
                aria-pressed={isActive}
                onClick={() => onRangeSelect(range.start)}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <div className="premiumPaletteGrid" aria-label="Question palette">
          {visiblePaletteIndexes.map((index) => {
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                type="button"
                key={index}
                className={[
                  "paletteNumber",
                  getPaletteStatusClass(attemptState, index),
                  isCurrent ? "paletteCurrent" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isCurrent ? "step" : undefined}
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
          <div className="paletteCalculatorBox">
            <div>
              <strong>Calculator</strong>
              <span>Allowed inside this exam</span>
            </div>

            <button
              type="button"
              className="paletteCalculatorToggle"
              onClick={() =>
                setIsCalculatorOpen((prev) => !prev)
              }
            >
              {isCalculatorOpen ? "Close" : "Open"}
            </button>
          </div>
        )}
      </aside>

      {calculatorPanel}
    </>
  );
}