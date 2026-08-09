# 好奇一下 Curio Lab

<p align="center">
  <img src="public/cat-personality/enfp.webp" alt="飛奔派對王貓格插圖" width="220" />
  <img src="public/cat-personality/intj.webp" alt="高台策士貓格插圖" width="220" />
  <img src="public/cat-personality/isfp.webp" alt="日光收藏家貓格插圖" width="220" />
</p>

<p align="center">
  把那些「一直有點想知道」的問題，做成簡單好玩的工具。
</p>

<p align="center">
  <a href="https://www.curio-lab.workers.dev"><strong>開啟正式網站</strong></a>
  ·
  <a href="https://www.curio-lab.workers.dev/tools/cat-cost">主子帳本</a>
  ·
  <a href="https://www.curio-lab.workers.dev/tools/cat-personality">16 型貓格</a>
</p>

Curio Lab 是一個以台灣繁體中文設計的互動工具實驗室。這裡的結果不一定是標準答案，更像是一個重新觀察生活的起點：用幾分鐘整理一個平常不容易算清楚、卻又忍不住想知道的問題。

## 現有工具

### 主子帳本

從貓咪來到家裡到現在，依目前的日常消費模式，估算一起生活期間的大約花費。

- 分步填寫相處時間與各類支出
- 提供台灣常見消費模式預設值
- 整理總額、每月平均、每日平均與支出占比
- 產生 1080 × 1350 結果圖卡與 QR Code

[開始計算](https://www.curio-lab.workers.dev/tools/cat-cost)

### 16 型貓格

用 20 個日常情境與四個具體行為選項，找出最接近家中貓咪的行為類型。

- 16 題雙向度題目加上 4 題校準題
- 每個向度都有奇數次判斷，不會出現平手
- 16 種貓格名稱、介紹與獨立手繪插圖
- 支援續答、結果圖卡與社群分享

[開始測驗](https://www.curio-lab.workers.dev/tools/cat-personality)

<table>
  <tr>
    <td align="center"><img src="public/cat-personality/entp.webp" alt="紙箱發明家" width="220" /><br /><strong>紙箱發明家</strong></td>
    <td align="center"><img src="public/cat-personality/infj.webp" alt="月光讀心師" width="220" /><br /><strong>月光讀心師</strong></td>
    <td align="center"><img src="public/cat-personality/esfj.webp" alt="客廳親善大使" width="220" /><br /><strong>客廳親善大使</strong></td>
    <td align="center"><img src="public/cat-personality/istp.webp" alt="靜音獵手" width="220" /><br /><strong>靜音獵手</strong></td>
  </tr>
</table>

## 技術組成

| 範圍 | 技術 |
|---|---|
| 前端 | Next.js 16、React 19、TypeScript 6 |
| 網站輸出 | Next.js static export |
| 圖卡 | Canvas API、QRCode |
| 分享 API | Cloudflare Workers |
| 儲存 | Workers KV、D1 |
| 測試 | Node.js 測試腳本、TypeScript、ESLint |

## 隱私

測驗答案與計算資料儲存在使用者的瀏覽器。只有在使用者主動按下分享結果時，圖卡與分享文案才會上傳，並建立最長 7 天的公開連結。
