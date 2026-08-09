import type { QuizAnswers, QuizStorage } from "./types";

export const CAT_PERSONALITY_STORAGE_KEY = "curio-lab:cat-personality:v1";

export function saveQuizAnswers(answers: QuizAnswers) {
  if (typeof window === "undefined") return;
  const payload: QuizStorage = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    answers,
  };
  window.localStorage.setItem(CAT_PERSONALITY_STORAGE_KEY, JSON.stringify(payload));
}

export function loadQuizAnswers(): QuizAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CAT_PERSONALITY_STORAGE_KEY) ?? "null") as Partial<QuizStorage> | null;
    if (!parsed || parsed.schemaVersion !== 1 || !parsed.answers) return null;
    return parsed.answers;
  } catch {
    return null;
  }
}

export function clearQuizAnswers() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CAT_PERSONALITY_STORAGE_KEY);
}
