import type { CalculatorInput, StorageSchema } from "./types";

export const STORAGE_KEY = "curio-lab:cat-cost:v1";

export const EMPTY_INPUT: CalculatorInput = {
  catName: "",
  yearsTogether: 0,
  monthsTogether: 0,
  foodMonthly: 0,
  litterMonthly: 0,
  routineHealthAnnual: 0,
  careMonthly: 0,
  medicalOneOff: 0,
  toysTreatsMonthly: 0,
  gearOneOff: 0,
  servicesAnnual: 0,
};

export function saveInput(input: CalculatorInput) {
  if (typeof window === "undefined") return;
  const payload: StorageSchema = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    input,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadInput(): CalculatorInput | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<StorageSchema> | null;
    if (!parsed || parsed.schemaVersion !== 1 || !parsed.input) return null;
    return { ...EMPTY_INPUT, ...parsed.input };
  } catch {
    return null;
  }
}

export function clearInput() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}
