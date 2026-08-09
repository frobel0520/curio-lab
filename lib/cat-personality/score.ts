import { QUIZ_QUESTIONS } from "./questions";
import type { AxisLetter, AxisScore, PersonalityCode, QuizAnswers, QuizResult } from "./types";

const AXES: ReadonlyArray<readonly [AxisLetter, AxisLetter]> = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
];

const EMPTY_SCORES: Record<AxisLetter, number> = {
  E: 0,
  I: 0,
  S: 0,
  N: 0,
  T: 0,
  F: 0,
  J: 0,
  P: 0,
};

export function scoreQuiz(answers: QuizAnswers): QuizResult {
  const scores = { ...EMPTY_SCORES };

  for (const question of QUIZ_QUESTIONS) {
    const optionId = answers[question.id];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option) throw new Error(`Missing or invalid answer for ${question.id}`);
    for (const letter of option.scores) scores[letter] += 1;
  }

  const axes: AxisScore[] = AXES.map(([left, right]) => {
    if (scores[left] === scores[right]) throw new Error(`Tied score for ${left}/${right}`);
    return {
      left,
      right,
      leftScore: scores[left],
      rightScore: scores[right],
      preferred: scores[left] > scores[right] ? left : right,
    };
  });

  return {
    code: axes.map((axis) => axis.preferred).join("") as PersonalityCode,
    scores,
    axes,
  };
}
