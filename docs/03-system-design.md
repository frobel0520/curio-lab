# Curio Lab 系統設計（精簡版）

| 文件項目 | 內容 |
|---|---|
| 文件版本 | 1.0 |
| 文件日期 | 2026-11-14 |
| 狀態 | 依現況盤點補齊 |
| 專案級別 | 公開級 |
| 依據 | Harbor `standards/DevelopmentStandards.md`、`standards/DeploymentHandbook.md` |

## 1. 設計限制

- **零月費**：前端與分享 API 皆使用 Cloudflare Workers 免費方案；明確不採用需綁卡且有超額計費風險的 R2，改以 Workers KV + D1 搭配程式端硬配額替代（詳見 [`IMPLEMENTATION_NOTES.md`](../IMPLEMENTATION_NOTES.md)）。
- **預設本機隱私**：測驗作答與試算草稿只存於瀏覽器 `localStorage`，僅在使用者主動點擊產生雲端分享連結時，才將去敏結果圖卡上傳至短期暫存（7 天 TTL）。
- **靜態匯出與安全標頭**：Next.js 採 `output: "export"` 產出純靜態檔案（`out/`），搭配 `public/_headers` 強制安全標頭；建置後 `scripts/security-headers.mjs` 以各頁內嵌 script 的 SHA-256 補上 CSP `script-src`（只放行同源與 Harbor 維護外掛，不用 `'unsafe-inline'`）。

## 2. 架構總覽

```text
GitHub repo（main）
  └─ GitHub Actions（validate.yml / publish-site.yml / published-headers.yml）
       ├─ lint（oxlint）→ typecheck（app + worker）→ test → next build（out/）
       └─ wrangler deploy --config wrangler.site.jsonc
            └─ Cloudflare Workers Static Assets（www.curio-lab.workers.dev）
                 ├─ 純前端工具（Next.js 靜態頁面 + localStorage + Canvas 1080×1350）
                 └─ 選用雲端分享（POST /v1/share-cards）
                      └─ Share Worker（api.curio-lab.workers.dev）
                           ├─ KV（SHARE_CARDS，7 天 TTL 存放 PNG）
                           └─ D1（curio-lab-share，追蹤配額與每日清理）
```

## 3. 目錄結構

```text
app/                    Next.js App Router 頁面（首頁、/privacy、/tools/cat-cost/*、/tools/cat-personality/*）
lib/
  calculator/           主子帳本計算引擎、台灣預設參數（presets.tw.ts）、Canvas 圖卡與 localStorage
  cat-personality/      20 題題庫、計分邏輯、16 型結果與 Canvas 圖卡
  share/cloud.ts        雲端分享 API 呼叫與失敗降級
public/
  _headers              CSP（script-src 於建置時補上）、X-Frame-Options: DENY、nosniff、Referrer-Policy、Permissions-Policy、COOP same-origin
  cat-personality/      16 張預優化 WebP 插畫
worker/
  src/index.ts          Share Worker 路由（/health、/v1/status、/v1/share-cards、/i/:id.png、/s/:id、Threads OAuth）
  src/quota.ts          KV/D1 免費額度守門員與雜湊 IP 限流
  migrations/           D1 schema（0001_init.sql、0002_kv_quota.sql）
scripts/                安全發布與正式站標頭稽核腳本（publish-site-ci.mjs、published-header-audit.mjs）
tests/                  計算機、貓格計分與 Worker 配額測試
```

## 4. 資料流與配額防護

### 4.1 核心流程

1. **主子帳本**：8 步驟表單寫入 `localStorage` → `lib/calculator/calculate.ts` 計算終身／月均／日均與分類佔比 → Canvas 繪製 1080 × 1350 圖卡（含 QR Code）。
2. **16 型貓格**：20 題作答（奇數配分避免同分）寫入 `localStorage` → `lib/cat-personality/score.ts` 產出四軸代碼 → 載入對應 WebP 插畫與 Canvas 圖卡。
3. **選用雲端分享**：前端送出圖卡 PNG（上限 1.5 MB）至 `POST /v1/share-cards` → Worker 檢查配額與限流 → 寫入 KV（7 天 TTL）與 D1 計數 → 回傳 `/s/:id` 供社群預覽。

### 4.2 零月費配額護欄（`worker/src/quota.ts`）

| 限制項目 | 硬上限 |
|---|---|
| 每日／每月上傳次數 | 500 次/日、10,000 次/月 |
| 每日／每月圖片讀取 | 50,000 次/日、1,000,000 次/月 |
| 上傳總量／存活空間 | 1 GB/月、500 MB 存活上限 |
| 單一來源限流 | 雜湊 IP 每日最多 5 次上傳（不存原始 IP） |
| 自動清理與降級 | Cron（`17 3 * * *`）每日清理過期紀錄；配額滿或 API 不可用時自動退回本機下載／Web Share |

## 5. 效能與品質驗證

- **靜態資源優化**：16 張插畫預先壓縮為 WebP，圖卡渲染完全於瀏覽器端 Canvas 執行，不耗用伺服器 CPU。
- **CI 自動驗證（`.github/workflows/validate.yml`）**：`npm audit --audit-level=high`、`oxlint`、`tsc --noEmit`（含 `worker/tsconfig.json`）、單元與配額測試、`next build`，並確認 `out/_headers` 除 CSP 補上 `script-src` 外與 `public/_headers` 相同。
- **正式站標頭稽核（`published-header-audit.mjs`）**：部署後實際請求正式站驗證 CSP（含 script-src 限制）、Permissions-Policy、COOP 與其他安全標頭。
- **效能驗收紀錄**：正式站頁面載入分位數（p50/p95）與真實裝置量測尚未獨立記錄（待補）。
