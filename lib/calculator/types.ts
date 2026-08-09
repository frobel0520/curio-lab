export type CostKey =
  | "foodMonthly"
  | "litterMonthly"
  | "routineHealthAnnual"
  | "careMonthly"
  | "medicalOneOff"
  | "toysTreatsMonthly"
  | "gearOneOff"
  | "servicesAnnual";

export type CalculatorInput = {
  catName: string;
  yearsTogether: number;
  monthsTogether: number;
} & Record<CostKey, number>;

export type CategoryTotal = {
  key: CostKey;
  label: string;
  amount: number;
  percentage: number;
};

export type CalculatorResult = {
  estimatedHistoricalTotal: number;
  avgPerMonth: number;
  avgPerDay: number;
  daysTogether: number;
  monthsTogether: number;
  yearsTogetherDecimal: number;
  annualRunRate: number;
  categoryTotals: CategoryTotal[];
  largestCategory: CategoryTotal;
};

export type StorageSchema = {
  schemaVersion: 1;
  updatedAt: string;
  input: CalculatorInput;
};
