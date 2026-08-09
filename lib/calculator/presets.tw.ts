import type { CostKey } from "./types";

export type CostPreset = {
  id: string;
  label: string;
  amount: number;
  unit: "month" | "year" | "one_off";
  sourceNote: "TODO_PRODUCT_REVIEW";
};

export const COST_LABELS: Record<CostKey, string> = {
  foodMonthly: "主食",
  litterMonthly: "貓砂",
  routineHealthAnnual: "例行健康",
  careMonthly: "日常照護",
  medicalOneOff: "重大醫療",
  toysTreatsMonthly: "玩具與零食",
  gearOneOff: "用品設備",
  servicesAnnual: "服務",
};

const preset = (
  id: string,
  label: string,
  amount: number,
  unit: CostPreset["unit"],
): CostPreset => ({ id, label, amount, unit, sourceNote: "TODO_PRODUCT_REVIEW" });

export const COST_PRESETS: Record<CostKey, CostPreset[]> = {
  foodMonthly: [
    preset("food-light", "簡單吃", 1200, "month"),
    preset("food-regular", "一般搭配", 2400, "month"),
    preset("food-premium", "比較講究", 4200, "month"),
  ],
  litterMonthly: [
    preset("litter-light", "省著用", 450, "month"),
    preset("litter-regular", "一般用量", 850, "month"),
    preset("litter-premium", "多貓砂盆", 1500, "month"),
  ],
  routineHealthAnnual: [
    preset("health-light", "基礎檢查", 2500, "year"),
    preset("health-regular", "定期健檢", 5500, "year"),
    preset("health-premium", "完整追蹤", 10000, "year"),
  ],
  careMonthly: [
    preset("care-light", "基礎照護", 300, "month"),
    preset("care-regular", "固定保養", 700, "month"),
    preset("care-premium", "照護較多", 1400, "month"),
  ],
  medicalOneOff: [
    preset("medical-none", "沒有／不計", 0, "one_off"),
    preset("medical-some", "曾有小手術", 15000, "one_off"),
    preset("medical-major", "曾有重大醫療", 50000, "one_off"),
  ],
  toysTreatsMonthly: [
    preset("fun-light", "偶爾買", 250, "month"),
    preset("fun-regular", "固定補貨", 600, "month"),
    preset("fun-premium", "很會寵", 1200, "month"),
  ],
  gearOneOff: [
    preset("gear-light", "基本用品", 5000, "one_off"),
    preset("gear-regular", "有些設備", 15000, "one_off"),
    preset("gear-premium", "設備齊全", 35000, "one_off"),
  ],
  servicesAnnual: [
    preset("service-none", "沒有／不計", 0, "year"),
    preset("service-some", "偶爾使用", 4000, "year"),
    preset("service-often", "固定使用", 12000, "year"),
  ],
};
