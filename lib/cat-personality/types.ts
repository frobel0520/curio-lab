export type AxisLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type PersonalityCode = `${"E" | "I"}${"S" | "N"}${"T" | "F"}${"J" | "P"}`;

export type QuizOption = {
  id: string;
  text: string;
  scores: AxisLetter[];
};

export type QuizQuestion = {
  id: string;
  title: string;
  prompt: string;
  options: QuizOption[];
};

export type QuizAnswers = Record<string, string>;

export type QuizStorage = {
  schemaVersion: 1;
  updatedAt: string;
  answers: QuizAnswers;
};

export type AxisScore = {
  left: AxisLetter;
  right: AxisLetter;
  leftScore: number;
  rightScore: number;
  preferred: AxisLetter;
};

export type QuizResult = {
  code: PersonalityCode;
  scores: Record<AxisLetter, number>;
  axes: AxisScore[];
};

export type CatPersonality = {
  code: PersonalityCode;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
};
