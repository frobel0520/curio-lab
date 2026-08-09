/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(__dirname, ".compiled-personality");
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");

fs.rmSync(output, { recursive: true, force: true });

const compile = spawnSync(process.execPath, [
  tsc,
  "lib/cat-personality/types.ts",
  "lib/cat-personality/questions.ts",
  "lib/cat-personality/score.ts",
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
  const { QUIZ_QUESTIONS } = require(path.join(output, "questions.js"));
  const { scoreQuiz } = require(path.join(output, "score.js"));
  const codes = [
    "ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP",
    "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ",
  ];

  assert.equal(QUIZ_QUESTIONS.length, 20);
  assert.equal(new Set(QUIZ_QUESTIONS.map((question) => question.id)).size, 20);
  for (const question of QUIZ_QUESTIONS) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4);
  }

  for (const code of codes) {
    const answers = Object.fromEntries(QUIZ_QUESTIONS.map((question) => {
      const option = question.options.find((candidate) => candidate.scores.every((letter) => code.includes(letter)));
      assert.ok(option, `${question.id} must support ${code}`);
      return [question.id, option.id];
    }));
    const result = scoreQuiz(answers);
    assert.equal(result.code, code);
    for (const axis of result.axes) assert.equal(axis.leftScore + axis.rightScore, 9);
  }

  assert.throws(() => scoreQuiz({}), /Missing or invalid answer/);
  console.log("cat personality: 68 assertions passed");
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
