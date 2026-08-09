import { COST_LABELS } from "./presets.tw";
import type { CalculatorInput, CalculatorResult, CategoryTotal, CostKey } from "./types";

const MONTH_DAYS = 30.4375;
const YEAR_DAYS = 365.2425;

const safe = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function resolveDaysTogether(input: CalculatorInput) {
  return Math.max(
    1,
    safe(input.yearsTogether) * YEAR_DAYS + safe(input.monthsTogether) * MONTH_DAYS,
  );
}

export function calculateCatCost(input: CalculatorInput): CalculatorResult {
  const daysTogether = resolveDaysTogether(input);
  const monthsTogether = daysTogether / MONTH_DAYS;
  const yearsTogetherDecimal = daysTogether / YEAR_DAYS;

  const monthlyKeys: CostKey[] = [
    "foodMonthly",
    "litterMonthly",
    "careMonthly",
    "toysTreatsMonthly",
  ];
  const annualKeys: CostKey[] = ["routineHealthAnnual", "servicesAnnual"];
  const oneOffKeys: CostKey[] = ["medicalOneOff", "gearOneOff"];

  const totals = {} as Record<CostKey, number>;
  monthlyKeys.forEach((key) => { totals[key] = safe(input[key]) * monthsTogether; });
  annualKeys.forEach((key) => { totals[key] = safe(input[key]) * yearsTogetherDecimal; });
  oneOffKeys.forEach((key) => { totals[key] = safe(input[key]); });

  const estimatedHistoricalTotal = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
  const categoryTotals: CategoryTotal[] = (Object.keys(COST_LABELS) as CostKey[])
    .map((key) => ({
      key,
      label: COST_LABELS[key],
      amount: totals[key],
      percentage: estimatedHistoricalTotal > 0 ? (totals[key] / estimatedHistoricalTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyRunRate = monthlyKeys.reduce((sum, key) => sum + safe(input[key]), 0);
  const annualRunRate = monthlyRunRate * 12
    + annualKeys.reduce((sum, key) => sum + safe(input[key]), 0);
  const largestCategory = categoryTotals[0];

  return {
    estimatedHistoricalTotal,
    avgPerMonth: estimatedHistoricalTotal / Math.max(monthsTogether, 1 / MONTH_DAYS),
    avgPerDay: estimatedHistoricalTotal / daysTogether,
    daysTogether,
    monthsTogether,
    yearsTogetherDecimal,
    annualRunRate,
    categoryTotals,
    largestCategory,
  };
}

export function formatDuration(months: number) {
  const totalMonths = Math.max(0, Math.round(months));
  const years = Math.floor(totalMonths / 12);
  const rest = totalMonths % 12;
  if (years === 0) return `${Math.max(rest, 1)} 個月`;
  if (rest === 0) return `${years} 年`;
  return `${years} 年 ${rest} 個月`;
}
