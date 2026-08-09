# Codex Handoff — 主子帳本 / 貓咪養成花費計算器

> 文件用途：這是交給 Codex 的「執行規格」，優先級高於早期討論稿。  
> 目標：讓 Codex 可以直接進入 repository 開發，不需要重新猜產品方向，也不要自行擴充 scope。  
> 狀態：產品邏輯已完成第二次審查，以下內容已整合審查修正。

---

## 0. Product Summary

產品暫名：**主子帳本**

核心問題：

> 「從這隻貓來到我家到現在，我大約已經為牠花了多少錢？」

這是一個 **mobile-first Web calculator**，不是記帳 App。

MVP 讓使用者：

1. 輸入貓咪基本資料。
2. 依不同支出類別選擇預設估算值，或自行輸入金額。
3. 得到「截至目前的估算累積花費」。
4. 看到平均每月 / 每日支出與類別占比。
5. 在有目前年齡時查看未來情境估算。
6. 產生可分享的結果卡。

核心體驗必須在 **2–4 分鐘內完成**。

---

# 1. Critical Product Interpretation

## 1.1 這是一個估算器，不是歷史記帳器

MVP 不要求使用者輸入每個歷史月份的真實帳單。

因此當使用者輸入：

- 現在每月伙食費 NT$3,000
- 已養 5 年

系統會用目前的消費水準回推：

`3000 × 60 months`

這代表：

> **「依照目前/代表性的消費模式估算，你到目前為止大約花了多少。」**

而不是：

> 「你過去真的精確花了多少。」

UI、結果頁、SEO 文案都必須使用：

- 約
- 估算
- 依目前消費模式
- 依你提供的資料推估

禁止使用「精確總支出」「真實花費紀錄」等語意。

---

## 1.2 Historical Cost Modes

每個 recurring category 必須支援：

### A. Preset estimate

使用者不知道實際支出，選一個生活方式 preset。

例如：

- 乾糧為主
- 乾濕混合
- 濕食為主

系統填入預設 monthly amount。

### B. Custom representative amount

使用者知道「大概每月多少」，自行填 monthly amount。

這仍然是代表性月支出，不是逐月帳本。

### C. Skip

非必要類別可以跳過，amount = 0。

---

# 2. Scope

## MVP 必做

- 單隻貓計算
- 無登入
- 無 DB
- LocalStorage
- 台灣繁體中文
- TWD
- 費用 preset
- Custom amount
- Review
- Result
- Share card
- SEO public pages
- Analytics abstraction
- AdSense-ready ad slots
- Consent integration boundary
- Unit tests
- E2E tests

## MVP 明確不做

- 帳號
- 會員
- 雲端同步
- 多隻貓保存
- 每月記帳
- 支出歷史 timeline
- 上傳帳單
- OCR
- AI 分析
- 即時商品價格
- 電商爬蟲
- 原生 App
- 社群 feed
- 後端 API
- Database
- 可重現結果的 share token
- 貓照片上傳
- Affiliate integration
- 付款 / 訂閱

除非 repo 已有必要基礎設施，否則不要自行加入任何上述功能。

---

# 3. User Flow

## Step 0 — Landing

內容：

- Hero
- 核心價值
- CTA：開始計算
- 簡短「怎麼算」
- Calculator methodology teaser
- FAQ teaser

主要 CTA：

**開始算主子身價**

---

## Step 1 — Cat Profile

欄位：

### catName

- optional
- 0–20 chars
- 空白時 UI 使用「你家主子」

### relationshipDuration

使用者必須提供「一起生活多久」。

優先 UX：

A. 到家日期  
或  
B. 不記得日期 → 直接填 X 年 X 個月

系統最後必須 normalize 為：

- `daysTogether`
- `monthsTogether`
- `yearsTogetherDecimal`

不要讓 calculation engine 同時理解兩種日期資料來源。

### catAge

optional。

若輸入：

- `catAgeYears`

用途只限 future scenario。

Validation：

- >= 0
- <= 30
- 若同時可推得 `yearsTogetherDecimal`，則：
  `catAgeYears >= yearsTogetherDecimal - tolerance`

避免出現：

> 貓咪 3 歲，但已跟主人住 5 年

若使用者填的是近似年齡，允許合理 tolerance。

---

# 4. Cost Categories

## 4.1 Food

Recurring monthly.

包含：

- 主食
- 乾糧
- 主食罐
- 鮮食
- 日常主要餵食成本

**不要包含零食。**

Data:

```ts
food: {
  mode: PresetMode | "custom" | "skip"
  monthly: number
}
```

---

## 4.2 Litter

Recurring monthly.

```ts
litter: {
  mode: PresetMode | "custom" | "skip"
  monthly: number
}
```

---

## 4.3 Routine Health

Recurring annual.

只包含：

- 定期健檢
- 疫苗
- 固定預防性醫療

**不包含驅蟲。**

```ts
healthRoutine: {
  annual: number
}
```

---

## 4.4 Parasite / Supplements / Care

Recurring monthly or annual，但 engine 必須 normalize 到 annual run-rate。

包含：

- 驅蟲
- 保健品
- 日常 grooming / care（若產品最後保留）

不可再由 Health 重複計入。

建議 domain：

```ts
care: {
  monthly: number
}
```

---

## 4.5 Major / One-off Medical

Historical one-off total.

這裡問的是：

> 「到目前為止，你記得額外花過多少重大/非例行醫療？」

例如：

- 急診
- 手術
- 住院
- 特殊檢查

```ts
medicalOneOff: number
```

MVP 不要求疾病名稱。

Future projection **不得線性外推這個數字**。

---

## 4.6 Toys & Treats

Recurring monthly.

包含：

- 零食
- 抓板
- 小型玩具
- 日常耗材型娛樂用品

**Food 不得再包含零食。**

---

## 4.7 Gear

Historical one-off total.

包含：

- 貓跳台
- 外出籠
- 飲水機
- 自動餵食器
- 大型用品

這個欄位語意是：

> 「截至目前，你大約已經花在大型用品上的總額。」

不是：

> 「你現在家裡設備重新買一次要多少。」

如果提供 preset UI，要讓使用者勾選已買用品並加總，而不是拿「單次標準配備價格」乘養貓年數。

---

## 4.8 Services

Recurring annual.

包含：

- 寵物旅館
- 保姆
- 固定交通等服務

問法：

> 「平均一年大約多少？」

不是歷史一次性總額。

---

# 5. Canonical Domain Model

建議：

```ts
type CalculatorInput = {
  version: string

  cat: {
    name?: string
    daysTogether: number
    monthsTogether: number
    yearsTogetherDecimal: number
    ageYears?: number
  }

  recurring: {
    foodMonthly: number
    litterMonthly: number
    careMonthly: number
    toysTreatsMonthly: number

    healthRoutineAnnual: number
    servicesAnnual: number
  }

  oneOffHistorical: {
    medical: number
    gear: number
  }
}
```

UI 可以保留 mode/preset metadata，但 calculation engine 應接收 normalized numeric input。

---

# 6. Calculation Engine

所有計算必須是 pure functions。

React component 不得自己計算 business totals。

## 6.1 Duration

選定一種 canonical 算法。

建議：

```ts
monthsTogether = daysTogether / 30.4375
yearsTogetherDecimal = daysTogether / 365.2425
```

整個產品只能採一種算法。

UI 顯示的「X 年 X 個月」可另外用 calendar-friendly formatting。

---

## 6.2 Historical recurring cost

```ts
monthlyRunRate =
  foodMonthly +
  litterMonthly +
  careMonthly +
  toysTreatsMonthly
```

```ts
annualRunRate =
  monthlyRunRate * 12 +
  healthRoutineAnnual +
  servicesAnnual
```

```ts
historicalRecurring =
  monthlyRunRate * monthsTogether +
  (healthRoutineAnnual + servicesAnnual) * yearsTogetherDecimal
```

---

## 6.3 One-off

```ts
historicalOneOff =
  medicalOneOff +
  gearOneOff
```

---

## 6.4 Estimated historical total

```ts
historicalTotal =
  historicalRecurring +
  historicalOneOff
```

名稱建議：

`estimatedHistoricalTotal`

避免工程層也誤認為是精確帳本資料。

---

## 6.5 Category totals

每一類 category total 必須使用與總額完全相同的時間基準。

例如：

```ts
foodTotal = foodMonthly * monthsTogether
healthRoutineTotal = healthRoutineAnnual * yearsTogetherDecimal
medicalOneOffTotal = medicalOneOff
```

Invariant:

```ts
sum(categoryTotals) ~= estimatedHistoricalTotal
```

round 前 tolerance 可設定極小浮點誤差。

---

## 6.6 Average metrics

### Lifetime average monthly

```ts
avgPerMonth =
  estimatedHistoricalTotal / max(monthsTogether, minimumMonthFraction)
```

UI 必須叫：

> 「相處期間平均每月」

不要叫：

> 「目前每月」

因為 one-off medical / gear 也會被攤進平均值。

### Lifetime average daily

```ts
avgPerDay =
  estimatedHistoricalTotal / max(daysTogether, 1)
```

UI：

> 「相處期間平均每天」

---

# 7. Future Scenario

只有在 `cat.ageYears` 存在時顯示。

不是壽命預測。

假設：

```ts
targetAge = 18
```

UI 文案：

> 「如果維持目前的日常消費模式，並以 18 歲作為情境試算……」

Calculation:

```ts
futureYears =
  max(targetAge - ageYears, 0)
```

```ts
futureProjected =
  annualRunRate * futureYears
```

注意：

**annualRunRate 只包含 recurring categories。**

不得包含：

- 過去重大醫療
- 過去 gear
- 任何歷史一次性費用

```ts
lifetimeScenario =
  estimatedHistoricalTotal +
  futureProjected
```

這仍然只是費用情境，不是壽命或醫療預測。

若 `ageYears >= targetAge`：

- 不顯示「還會花 0」
- 改成隱藏 future block，或提示使用者可自行設定情境年齡（後者不是 MVP 必要）。

MVP 建議：**直接隱藏 future projection。**

---

# 8. Important Calculation Caveats

## 8.1 Current-cost backcasting

目前 recurring amount 會套用到完整 relationship duration。

這是 MVP 刻意的近似。

不要自行建立 inflation model 或歷年價格模型。

---

## 8.2 First-year kitten costs

MVP 不自動替幼貓第一年加一組額外費用。

若需要初期用品 / 結紮等成本：

- 使用者可放入 medical one-off
- gear one-off

V1.1 再考慮 first-year model。

---

## 8.3 Inflation

MVP：

**不計通膨。**

未來 projection 使用 nominal current-cost scenario。

UI methodology 頁必須寫清楚。

---

# 9. Result Page

Hero：

> 你目前大約已經為 {catName} 花了

**NT$XXX,XXX**

Subtitle：

> 依你提供的資料與目前消費模式估算

Metrics：

- 一起生活 X 年 X 月
- 相處期間平均每月
- 相處期間平均每天
- 最大支出類別

Breakdown：

- Food
- Litter
- Routine Health
- Care
- Medical One-off
- Toys & Treats
- Gear
- Services

每項：

- amount
- percentage

Insight：

> 最大的進貢項目是伙食，占 42%。

不要寫帶羞辱或責備意味的文案。

---

# 10. Share Card

MVP share card 是主要分享物。

建議尺寸：

1080 × 1350 比例。

內容：

- brand
- catName
- estimated historical total
- years/months together
- avg/day
- largest category
- approved fun copy
- site domain

---

# 11. Sharing Semantics — Important Fix

MVP 沒有 backend/token。

因此：

**不能做一個「分享結果連結」並讓別人打開後看到相同結果。**

禁止讓 UI 暗示 copy link 可以重現結果。

MVP 分享方式：

1. Web Share API：優先分享生成的 PNG（平台支援 files 時）。
2. Download PNG。
3. 若 files share 不支援，可：
   - 分享圖片 fallback
   - 或複製「計算器首頁 URL」，文案明確叫：
     **「分享計算器」**
     而不是「分享我的結果」。

Result route 若沒有 LocalStorage state：

- redirect `/calculator`
- 不顯示不存在的 result。

---

# 12. LocalStorage

Storage 只做：

- unfinished session recovery
- latest local result recovery

Schema:

```ts
{
  schemaVersion: 1,
  updatedAt: string,
  input: ...
}
```

需求：

- invalid JSON fallback
- unknown schema fallback
- migration boundary
- reset clears all calculator keys

不要儲存任何 server-side data。

---

# 13. Analytics

Analytics 不傳：

- catName
- arrivalDate
- exact age
- exact custom amounts
- entire form
- localStorage contents

Events：

```txt
calculator_start
step_view
step_complete
calculator_complete
result_view
share_click
share_success
restart
```

Allowed coarse dimensions：

- step_id
- input_mode
- months_bucket
- total_bucket
- largest_category
- share_method

`share_success`：

- Web Share Promise resolve → success
- download creation completed → success
- clipboard write completed → success

Cancelled share 不算 success。

---

# 14. Ads / Monetization Technical Rules

Ads are a **plug-in layer**, not part of the calculator logic.

第一版安全位置：

1. Landing content section
2. Result breakdown 後
3. Methodology / FAQ content page

Wizard 主流程預設：

**不放廣告。**

尤其禁止放在：

- Back
- Next
- Calculate
- Download
- Share
- form controls

附近。

原因是避免 accidental clicks 與破壞 completion rate。

`AdSlot`：

- fixed/min reserved size
- production only
- env gated
- never load live ads in localhost
- never load live ads in preview
- never load live ads in automated tests

不要加入：

- 「點廣告支持我們」
- ad click reward
- unlock result via standard AdSense click
- 自動點擊
- fake traffic

---

# 15. Consent / Privacy

架構需預留：

```ts
ConsentProvider
AnalyticsProvider
AdsProvider
```

不要把 privacy behavior hardcode 到 calculator components。

如果之後使用 Google CMP / Consent Mode，由 integration layer 處理。

Codex 不需要自行判斷法律義務，也不要自己做一個自創 CMP。

Privacy page 至少要能說明：

- calculator data 主要保存在 browser local storage
- analytics（若啟用）
- advertising（若啟用）
- cookies/local storage
- contact

實際政策文字在正式上線前再 final review。

---

# 16. SEO Architecture

Public/indexable：

```txt
/
 /methodology
 /faq
 /privacy
 /terms
 /about
```

Calculator：

```txt
/calculator
```

Result：

```txt
/result
```

Result 不需要 SEO 價值，可考慮 noindex。

Landing / methodology 必須有 server-readable content。

不要把所有核心內容只放在 JS wizard。

需要：

- metadata
- canonical
- sitemap
- robots
- OG
- WebApplication structured data（只有真正適用時）
- FAQ structured data 不要假設一定會得到 rich result

---

# 17. Recommended Tech

若 repo 尚未決定：

- Next.js App Router
- TypeScript
- React
- Tailwind **或** CSS Modules（只能選既有的一種）
- Zod（若 repo 已有）
- Vitest / Jest
- Playwright

Persistence：

- LocalStorage

Backend：

- none

Database：

- none

---

# 18. Suggested Repository Structure

```txt
app/
  page.tsx

  calculator/
    page.tsx

  result/
    page.tsx

  methodology/
    page.tsx

  faq/
    page.tsx

  privacy/
    page.tsx

  terms/
    page.tsx

  about/
    page.tsx

components/
  calculator/
  result/
  share/
  ads/
  ui/

lib/
  calculator/
    types.ts
    presets.tw.ts
    normalize.ts
    calculate.ts
    validation.ts
    storage.ts

  analytics/
  consent/
  share/

content/
  faq.ts
  methodology.ts
  result-copy.ts

tests/
  unit/
  e2e/

public/
  icons/
  ads.txt
```

`ads.txt` 在取得真實 publisher ID 前：

- 可以不存在
- 或保留開發說明

**不要提交假的 publisher ID。**

---

# 19. Preset Configuration

所有金額都放在：

```txt
lib/calculator/presets.tw.ts
```

Component 禁止 hardcode preset cost。

Config item 建議：

```ts
type CostPreset = {
  id: string
  label: string
  amount: number
  unit: "month" | "year" | "one_off"
  sourceNote?: string
  sourceUrl?: string
  reviewedAt?: string
}
```

目前可以先使用 `TODO_PRODUCT_REVIEW` placeholder。

但：

**正式 public launch 前必須由產品方確認台灣 preset 金額。**

Codex 不得自行搜尋一個價格後直接宣稱是台灣標準值。

---

# 20. Implementation Tasks

## T00 — Repository Audit

- read README
- read package.json
- inspect existing architecture
- inspect lint/test/build scripts
- do not rewrite repo unnecessarily
- create `IMPLEMENTATION_NOTES.md`
- create/update `.env.example`

Exit criteria:

- existing stack documented
- build works before changes
- architecture decision recorded

---

## T01 — Domain Types

Create:

- CalculatorInput
- NormalizedCalculatorInput
- CalculatorResult
- CategoryTotals
- Preset types
- Storage schema

Add validation boundaries.

---

## T02 — Preset Config

Create centralized TW preset config.

No costs inside components.

Placeholder values clearly marked.

---

## T03 — Normalization Layer

Implement:

- date → daysTogether
- direct years/months → approximate daysTogether
- normalized durations
- preset/custom/skip → numeric costs

UI layer ends here.

Calculator engine accepts numeric normalized domain.

---

## T04 — Calculation Engine

Implement pure functions:

- run rates
- category totals
- historical recurring
- historical one-off
- estimated historical total
- averages
- future scenario

No React imports.

---

## T05 — Unit Tests

Minimum cases:

### Duration

- 1 day
- 1 month
- 1 year
- leap-year crossing
- direct duration fallback

### Cost

- all zero
- recurring only
- annual only
- one-off only
- mixed
- 5 years
- less than one month

### Invariants

- category sum == total
- future excludes historical one-off
- future absent without age
- future absent when age >= target
- no negative totals
- no NaN / Infinity

### Double-count prevention

Explicit test:

- parasite cost appears only once
- treats cost appears only in Toys & Treats

---

## T06 — State + LocalStorage

Implement wizard state.

Requirements:

- reload recovery
- Back does not lose data
- edit from Review
- reset
- schema fallback

---

## T07 — Landing Page

Implement:

- Hero
- CTA
- explanation
- methodology teaser
- FAQ teaser
- SEO metadata

Do not add live ads yet.

---

## T08 — Wizard Shell

Implement:

- step registry
- progress
- Back
- Next
- mobile-first layout
- keyboard/accessibility
- validation

Decision:

Prefer one `/calculator` route with internal step state unless repo architecture strongly suggests otherwise.

Record decision in IMPLEMENTATION_NOTES.

---

## T09 — Cat Profile

Implement:

- cat name
- arrival date
- duration fallback
- age optional
- impossible age/duration validation

---

## T10 — Food

Implement:

- presets
- custom monthly
- skip
- estimate mode

Food excludes treats.

---

## T11 — Litter

Use reusable recurring cost pattern.

---

## T12 — Health Routine + Medical One-off

Two clearly separate concepts.

Routine:

- annual

Major medical:

- historical one-off

No disease data.

No parasite cost here.

---

## T13 — Care

Recurring.

Includes parasite prevention / supplements.

Ensure no duplicate with Health.

---

## T14 — Toys & Treats

Recurring monthly.

Treats live here, not Food.

---

## T15 — Gear

Historical one-off total.

If preset list exists, sum actual selected owned items.

Do not multiply gear by years.

---

## T16 — Services

Annual recurring.

---

## T17 — Review

Display normalized summary.

Each category has Edit action.

Copy must say estimate.

---

## T18 — Result

Implement:

- estimated total
- relationship duration
- lifetime-average month/day
- category breakdown
- largest category
- future scenario
- disclaimer

No misleading precision claims.

---

## T19 — Share Card

Implement fixed-ratio share card.

Prefer client-side generation.

Lazy-load image generation dependency.

Fallback:

- image download
- share calculator URL only with correct wording

---

## T20 — Content Pages

Implement:

- methodology
- FAQ
- privacy
- terms
- about/contact route or equivalent

Methodology explicitly says:

- current-cost backcasting
- no inflation
- no future medical prediction
- estimates only

---

## T21 — SEO

- sitemap
- robots
- canonical
- OG
- metadata
- indexable content
- result noindex if appropriate

---

## T22 — Analytics Abstraction

Implement `track()` abstraction.

Add event schema.

No PII.

---

## T23 — Consent Boundary

Implement provider/integration placeholder.

Do not invent legal logic.

---

## T24 — Ad Readiness

Create AdSlot.

No live IDs.

Rules:

- prod only
- env gated
- safe placement
- reserved height
- no live ads tests

---

## T25 — E2E

Scenarios:

1. preset happy path
2. all custom
3. optional fields skipped
4. back/edit
5. reload recovery
6. reset
7. future scenario with age
8. no age
9. result route with no state
10. share fallback
11. invalid localStorage recovery

---

## T26 — Accessibility / Responsive

Widths:

- 360
- 390
- 430
- desktop

Check:

- labels
- focus
- keyboard
- reduced motion
- aria errors
- contrast
- no horizontal overflow

---

## T27 — Performance

- Lighthouse mobile
- share library lazy
- no oversized client bundles
- ad reserved space
- no unnecessary hydration

---

## T28 — Release Docs

Update README:

- install
- dev
- test
- build
- deploy
- env
- ads disabled behavior

Create:

`RELEASE_CHECKLIST.md`

---

# 21. Task Execution Rules for Codex

After every task:

1. Run relevant tests.
2. Run lint.
3. Run typecheck if available.
4. Run build when architecture changes.
5. Update `IMPLEMENTATION_NOTES.md`.
6. Commit only if user workflow asks for commits.

If spec is incomplete:

- record `ASSUMPTION`
- choose simplest reversible implementation

Only stop and ask user if ambiguity changes:

- calculation meaning
- required user flow
- public data/privacy behavior
- architecture scope

Do not stop for minor styling decisions.

---

# 22. Non-negotiables

1. No backend in MVP.
2. No DB in MVP.
3. No login.
4. No multi-cat account system.
5. No historical ledger.
6. No fake precision.
7. No duplicated cost category.
8. No hardcoded preset prices in UI.
9. No calculation logic inside React components.
10. No exact personal form data in analytics.
11. No live AdSense on local/preview/test.
12. No ads beside interaction buttons.
13. No fake publisher ID.
14. No result-sharing URL that cannot reproduce the result.
15. No future medical extrapolation.
16. No automatic inflation model.
17. No arbitrary dependency additions if native/simple solution exists.
18. Do not redesign product scope without explicit user request.

---

# 23. Definition of Done — MVP

MVP is complete when:

- [ ] A new mobile user can complete calculator in 2–4 minutes.
- [ ] Preset/custom/skip all work.
- [ ] Duration normalizes consistently.
- [ ] Results clearly say estimate.
- [ ] Cost categories cannot double-count by default.
- [ ] Calculation engine has unit tests.
- [ ] Category totals reconcile to overall total.
- [ ] Future scenario excludes historical one-off costs.
- [ ] Future scenario is hidden without usable age.
- [ ] Back/edit/reload do not lose current session.
- [ ] Reset clears calculator local data.
- [ ] Result card can be downloaded/shared with fallback.
- [ ] Shared calculator URL is not mislabeled as shared result.
- [ ] SEO landing/methodology content is crawlable.
- [ ] Analytics sends no exact form data.
- [ ] AdSense integration is disabled by default until configured.
- [ ] No live ads in non-production.
- [ ] Responsive checks pass.
- [ ] Accessibility smoke checks pass.
- [ ] Build/lint/tests pass.
- [ ] README and IMPLEMENTATION_NOTES are current.

---

# 24. Launch Gates

## Gate A — Functional prototype

T00–T18.

No ads required.

Goal:

> Does the calculator feel fast and produce believable results?

---

## Gate B — Shareable MVP

T19–T22.

Goal:

> Do users complete and share?

Primary metrics:

- Calculator Start Rate
- Completion Rate
- Result View
- Share Rate

---

## Gate C — Monetization-ready

T23–T28.

Goal:

> Site is technically ready for consent + AdSense integration without damaging UX.

Do not optimize ad revenue before real traffic exists.

---

# 25. Product Questions Intentionally Left Open

These are product decisions, not Codex decisions:

1. Final brand name.
2. Domain.
3. Taiwan preset price values.
4. Result-page approved joke/copy pool.
5. Whether target future age stays 18.
6. Exact AdSense slot density.
7. Whether Auto Ads will be enabled.
8. Affiliate partners.
9. V1.1「準備養貓預算」mode.

Codex should not block MVP architecture on these.

---

# 26. Final Instruction to Codex

Start with **T00**.

Before writing product code:

1. inspect the repository,
2. document existing stack,
3. run the current build/tests,
4. create `IMPLEMENTATION_NOTES.md`.

Then implement tasks in order.

The source of truth for calculator semantics is this handoff document.

When older notes conflict with this document, **this document wins**.
