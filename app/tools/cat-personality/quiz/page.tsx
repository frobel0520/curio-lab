"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { QUIZ_QUESTIONS } from "@/lib/cat-personality/questions";
import { loadQuizAnswers, saveQuizAnswers } from "@/lib/cat-personality/storage";
import type { QuizAnswers } from "@/lib/cat-personality/types";

export default function CatPersonalityQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadQuizAnswers() ?? {};
    const firstUnanswered = QUIZ_QUESTIONS.findIndex((question) => !stored[question.id]);
    queueMicrotask(() => {
      setAnswers(stored);
      setStep(firstUnanswered === -1 ? 0 : firstUnanswered);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) saveQuizAnswers(answers);
  }, [answers, hydrated]);

  const question = QUIZ_QUESTIONS[step];
  const selected = answers[question.id];

  const choose = (optionId: string) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setError("");
  };

  const moveTo = (nextStep: number) => {
    setStep(nextStep);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      setError("請先選一個最像牠的行為。");
      return;
    }
    if (step < QUIZ_QUESTIONS.length - 1) {
      moveTo(step + 1);
      return;
    }
    saveQuizAnswers(answers);
    router.push("/tools/cat-personality/result");
  };

  return (
    <main className="personality-quiz-page">
      <div className="personality-quiz-shell">
        <div className="calculator-topline">
          <Link href="/tools/cat-personality">退出</Link>
          <span>16 型貓格</span>
          <span>{String(step + 1).padStart(2, "0")} / {String(QUIZ_QUESTIONS.length).padStart(2, "0")}</span>
        </div>
        <div className="progress-track" aria-label={`進度：第 ${step + 1} 題，共 ${QUIZ_QUESTIONS.length} 題`}>
          <span style={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>

        <form className="personality-question" onSubmit={submit}>
          <p className="eyebrow">日常觀察 · {String(step + 1).padStart(2, "0")}</p>
          <h1>{question.title}</h1>
          <p className="personality-prompt">{question.prompt}</p>

          <div className="personality-options" role="radiogroup" aria-label={question.prompt}>
            {question.options.map((option, index) => (
              <button
                className={selected === option.id ? "personality-option is-selected" : "personality-option"}
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected === option.id}
                onClick={() => choose(option.id)}
              >
                <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                <b>{option.text}</b>
              </button>
            ))}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="wizard-actions personality-actions">
            {step > 0 && (
              <button className="secondary-action" type="button" onClick={() => moveTo(step - 1)}>
                ← 上一題
              </button>
            )}
            <button className="primary-action" type="submit">
              {step === QUIZ_QUESTIONS.length - 1 ? "看貓格結果" : "下一題"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
