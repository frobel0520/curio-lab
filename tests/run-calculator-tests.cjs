/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(__dirname, ".compiled");
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");

fs.rmSync(output, { recursive: true, force: true });

const compile = spawnSync(process.execPath, [
  tsc,
  "lib/calculator/types.ts",
  "lib/calculator/presets.tw.ts",
  "lib/calculator/calculate.ts",
  "--ignoreConfig",
  "--module", "Node16",
  "--moduleResolution", "Node16",
  "--target", "ES2020",
  "--outDir", output,
  "--skipLibCheck",
], { cwd: root, encoding: "utf8" });

if (compile.status !== 0) {
  process.stderr.write(compile.stdout + compile.stderr);
  process.exit(compile.status || 1);
}

try {
  const { calculateCatCost, resolveDaysTogether } = require(path.join(output, "calculate.js"));
  const base = {
    catName: "",
    yearsTogether: 1,
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

  assert.equal(Math.round(resolveDaysTogether({ ...base, yearsTogether: 0, monthsTogether: 1 })), 30);

  const recurring = calculateCatCost({ ...base, foodMonthly: 100 }, new Date("2026-01-01"));
  assert.equal(Math.round(recurring.estimatedHistoricalTotal), 1200);

  const mixed = calculateCatCost({
    ...base,
    yearsTogether: 5,
    foodMonthly: 1000,
    routineHealthAnnual: 2400,
    medicalOneOff: 5000,
    gearOneOff: 3000,
  });
  const categorySum = mixed.categoryTotals.reduce((sum, item) => sum + item.amount, 0);
  assert.ok(Math.abs(categorySum - mixed.estimatedHistoricalTotal) < 0.001);
  assert.equal(mixed.annualRunRate, 14400);

  const invalid = calculateCatCost({ ...base, yearsTogether: -2, foodMonthly: Number.NaN });
  assert.ok(Number.isFinite(invalid.estimatedHistoricalTotal));
  assert.ok(invalid.estimatedHistoricalTotal >= 0);

  console.log("calculator: 6 assertions passed");
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
