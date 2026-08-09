"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { COST_LABELS, COST_PRESETS } from "@/lib/calculator/presets.tw";
import { EMPTY_INPUT, loadInput, saveInput } from "@/lib/calculator/storage";
import type { CalculatorInput, CostKey } from "@/lib/calculator/types";

const STEPS = [
  { eyebrow: "先從你們的故事開始", title: "你和主子，相處多久了？" },
  { eyebrow: "日常開銷 · 01", title: "每天吃進肚子的幸福。" },
  { eyebrow: "日常開銷 · 02", title: "貓砂，是生活裡的固定消耗。" },
  { eyebrow: "健康", title: "平常保養，和曾經的大筆醫療。" },
  { eyebrow: "照護", title: "驅蟲、保健品與日常照護。" },
  { eyebrow: "開心也很重要", title: "玩具與零食，大概花多少？" },
  { eyebrow: "最後兩項", title: "用品設備，以及偶爾需要的服務。" },
  { eyebrow: "確認一下", title: "這些數字，看起來像你們的生活嗎？" },
];

const currency = new Intl.NumberFormat("zh-TW");

function CostField({
  costKey,
  value,
  onChange,
}: {
  costKey: CostKey;
  value: number;
  onChange: (value: number) => void;
}) {
  const presets = COST_PRESETS[costKey];
  const unit = presets[0]?.unit;
  const unitLabel = unit === "month" ? "每月" : unit === "year" ? "每年" : "歷年合計";

  return (
    <fieldset className="cost-field">
      <legend>
        <span>{COST_LABELS[costKey]}</span>
        <small>{unitLabel}</small>
      </legend>
      <div className="preset-grid">
        {presets.map((item) => (
          <button
            className={value === item.amount ? "preset-option is-selected" : "preset-option"}
            key={item.id}
            type="button"
            aria-pressed={value === item.amount}
            onClick={() => onChange(item.amount)}
          >
            <span>{item.label}</span>
            <b>{item.amount === 0 ? "不計" : `NT$ ${currency.format(item.amount)}`}</b>
          </button>
        ))}
      </div>
      <label className="custom-cost">
        <span>或自行輸入</span>
        <div className="money-field">
          <b>NT$</b>
          <input
            aria-label={`${COST_LABELS[costKey]}${unitLabel}金額`}
            min="0"
            max="10000000"
            inputMode="numeric"
            type="number"
            value={value || ""}
            placeholder="0"
            onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
          />
        </div>
      </label>
    </fieldset>
  );
}

export default function CalculatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CalculatorInput>(EMPTY_INPUT);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadInput() ?? EMPTY_INPUT;
    queueMicrotask(() => {
      setInput(stored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) saveInput(input);
  }, [hydrated, input]);

  const update = <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const setCost = (key: CostKey, value: number) => update(key, value);

  const canAdvance = () => {
    if (step !== 0) return true;
    if (input.yearsTogether * 12 + input.monthsTogether <= 0) {
      setError("請填寫至少 1 個月的相處時間。");
      return false;
    }
    if (input.monthsTogether > 11) {
      setError("月份請填 0 到 11；超過一年請換算到年份。");
      return false;
    }
    return true;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdvance()) return;
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    saveInput(input);
    router.push("/tools/cat-cost/result");
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <p>不必翻收據，填一個最接近的時間就可以。名字只留在你的瀏覽器裡。</p>
            <label>
              <span>主子的名字 <small>選填</small></span>
              <input
                maxLength={20}
                type="text"
                value={input.catName}
                placeholder="例如：豆花"
                onChange={(event) => update("catName", event.target.value)}
              />
            </label>
            <div className="duration-grid">
              <label>
                <span>一起生活幾年？</span>
                <div className="number-field">
                  <input
                    min="0"
                    max="30"
                    inputMode="numeric"
                    type="number"
                    value={input.yearsTogether || ""}
                    placeholder="0"
                    onChange={(event) => update("yearsTogether", Math.max(0, Number(event.target.value)))}
                  />
                  <b>年</b>
                </div>
              </label>
              <label>
                <span>再加幾個月？</span>
                <div className="number-field">
                  <input
                    min="0"
                    max="11"
                    inputMode="numeric"
                    type="number"
                    value={input.monthsTogether || ""}
                    placeholder="0"
                    onChange={(event) => update("monthsTogether", Math.max(0, Number(event.target.value)))}
                  />
                  <b>月</b>
                </div>
              </label>
            </div>
          </>
        );
      case 1:
        return <><p>只算主食；零食會在後面另外填，避免重複。</p><CostField costKey="foodMonthly" value={input.foodMonthly} onChange={(value) => setCost("foodMonthly", value)} /></>;
      case 2:
        return <><p>包含平常使用的所有貓砂。多貓家庭可以直接填合計。</p><CostField costKey="litterMonthly" value={input.litterMonthly} onChange={(value) => setCost("litterMonthly", value)} /></>;
      case 3:
        return (
          <>
            <p>例行健康是每年的固定花費；重大醫療則只算已經發生過的總額。</p>
            <CostField costKey="routineHealthAnnual" value={input.routineHealthAnnual} onChange={(value) => setCost("routineHealthAnnual", value)} />
            <CostField costKey="medicalOneOff" value={input.medicalOneOff} onChange={(value) => setCost("medicalOneOff", value)} />
          </>
        );
      case 4:
        return <><p>包含驅蟲、保健品、清潔與其他固定照護；不重複計入健康檢查。</p><CostField costKey="careMonthly" value={input.careMonthly} onChange={(value) => setCost("careMonthly", value)} /></>;
      case 5:
        return <><p>這裡才放零食，也包含逗貓棒、抓板與其他小確幸。</p><CostField costKey="toysTreatsMonthly" value={input.toysTreatsMonthly} onChange={(value) => setCost("toysTreatsMonthly", value)} /></>;
      case 6:
        return (
          <>
            <p>用品是歷年買過的合計；美容、安親或住宿等服務則用每年估算。</p>
            <CostField costKey="gearOneOff" value={input.gearOneOff} onChange={(value) => setCost("gearOneOff", value)} />
            <CostField costKey="servicesAnnual" value={input.servicesAnnual} onChange={(value) => setCost("servicesAnnual", value)} />
          </>
        );
      default:
        return (
          <div className="review-list">
            <button type="button" onClick={() => setStep(0)}>
              <span>相處時間</span>
              <b>{input.yearsTogether} 年 {input.monthsTogether} 個月</b>
              <small>編輯</small>
            </button>
            {(Object.keys(COST_LABELS) as CostKey[]).map((key) => {
              const editStep: Record<CostKey, number> = {
                foodMonthly: 1,
                litterMonthly: 2,
                routineHealthAnnual: 3,
                medicalOneOff: 3,
                careMonthly: 4,
                toysTreatsMonthly: 5,
                gearOneOff: 6,
                servicesAnnual: 6,
              };
              return (
                <button key={key} type="button" onClick={() => setStep(editStep[key])}>
                  <span>{COST_LABELS[key]}</span>
                  <b>NT$ {currency.format(input[key])}</b>
                  <small>編輯</small>
                </button>
              );
            })}
            <p className="estimate-note">送出後會用目前金額回推相處期間；不計通膨，也不預測醫療事件。</p>
          </div>
        );
    }
  };

  return (
    <main className="calculator-page">
      <div className="calculator-shell">
        <div className="calculator-topline">
          <Link href="/tools/cat-cost">退出</Link>
          <span>主子帳本</span>
          <span>{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</span>
        </div>
        <div className="progress-track" aria-label={`進度：第 ${step + 1} 步，共 ${STEPS.length} 步`}>
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <form className="question-panel" onSubmit={submit}>
          <p className="eyebrow">{STEPS[step].eyebrow}</p>
          <h1>{STEPS[step].title}</h1>
          {renderStep()}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="wizard-actions">
            {step > 0 && <button className="secondary-action" type="button" onClick={() => setStep((current) => current - 1)}>← 上一步</button>}
            <button className="primary-action" type="submit">
              {step === STEPS.length - 1 ? "看結果" : "繼續"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
