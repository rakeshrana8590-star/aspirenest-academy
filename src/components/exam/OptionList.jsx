export default function OptionList({
    optionList,
    selectedAnswerKey,
    examFontScale,
    onSelectOption,
  }) {
    return (
      <div
        className="aspireOptionList"
        style={{ fontSize: `${examFontScale}em` }}
      >
        {optionList.map((option) => (
          <button
            type="button"
            key={option.key}
            className={[
              "aspireOption",
              selectedAnswerKey === option.key
                ? "selectedAspireOption"
                : "",
            ].join(" ")}
            aria-pressed={selectedAnswerKey === option.key}
            onClick={() => onSelectOption(option.key)}
          >
            <span>{option.label}</span>
            <p>{option.text}</p>
          </button>
        ))}
      </div>
    );
  }