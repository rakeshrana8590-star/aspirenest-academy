const OPTION_KEYS = ["option1", "option2", "option3", "option4"];

const normalizeComparableText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getOptionKeyFromLabel = (value = "") => {
  const normalized = normalizeComparableText(value)
    .replace(/[.():_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const directKeyMatch = normalized.match(/^option\s*([1-4])$/);

  if (directKeyMatch) {
    return `option${directKeyMatch[1]}`;
  }

  const letterMatch = normalized.match(/^(?:option\s*)?([a-d])$/);

  if (letterMatch) {
    return `option${letterMatch[1].charCodeAt(0) - 96}`;
  }

  const numberMatch = normalized.match(/^([1-4])$/);

  if (numberMatch) {
    return `option${numberMatch[1]}`;
  }

  return "";
};

export const normalizeExamAnswerKey = (
  answerValue = "",
  question = {}
) => {
  if (
    answerValue === null ||
    answerValue === undefined ||
    answerValue === ""
  ) {
    return "";
  }

  const rawValue = String(answerValue).trim();

  if (!rawValue) return "";

  const labelKey = getOptionKeyFromLabel(rawValue);

  if (labelKey) return labelKey;

  const comparableAnswer = normalizeComparableText(rawValue);

  const matchingOptionKey = OPTION_KEYS.find(
    (optionKey) =>
      normalizeComparableText(question?.[optionKey]) === comparableAnswer
  );

  return matchingOptionKey || rawValue;
};

export const normalizeExamQuestion = (question = {}) => {
  const rawAnswer =
    question.answer ??
    question.correctAnswer ??
    question.correctOption ??
    question.answerKey ??
    "";

  return {
    ...question,
    answer: normalizeExamAnswerKey(rawAnswer, question),
  };
};

export const isExamAnswerCorrect = (
  selectedAnswer = "",
  correctAnswer = "",
  question = {}
) => {
  const selectedKey = normalizeExamAnswerKey(
    selectedAnswer,
    question
  );
  const correctKey = normalizeExamAnswerKey(
    correctAnswer,
    question
  );

  return Boolean(selectedKey) && selectedKey === correctKey;
};

export const getExamAnswerLabel = (
  answerValue = "",
  question = {}
) => {
  const normalizedKey = normalizeExamAnswerKey(
    answerValue,
    question
  );

  const labels = {
    option1: "A",
    option2: "B",
    option3: "C",
    option4: "D",
  };

  return labels[normalizedKey] || normalizedKey || "—";
};
