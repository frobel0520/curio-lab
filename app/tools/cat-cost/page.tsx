import Link from "next/link";

export default function CatCostLandingPage() {
  return (
    <main className="tool-page">
      <section className="tool-hero">
        <div className="tool-hero-copy">
          <Link className="back-link" href="/">← 回到工具收藏</Link>
          <p className="eyebrow">生活計算 · 主子帳本</p>
          <h1>
            這些年，
            <em>你進貢了多少？</em>
          </h1>
          <p>
            用現在的日常消費模式，回推你和主子一起生活以來的大約花費。
            不是記帳，也不需要翻出每張收據。
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/tools/cat-cost/calculator">
              開始算主子身價
              <span aria-hidden="true">→</span>
            </Link>
            <span>約 2–4 分鐘 · 不需登入</span>
          </div>
        </div>

        <aside className="result-teaser" aria-label="結果內容預覽">
          <p>你會得到</p>
          <div className="teaser-total">
            <span>相處期間估算總額</span>
          </div>
          <ul>
            <li><span>平均每月</span><b>分析</b></li>
            <li><span>最大支出</span><b>比較</b></li>
            <li><span>分享結果</span><b>圖片</b></li>
          </ul>
        </aside>
      </section>

      <section className="how-it-works" aria-labelledby="how-title">
        <p className="eyebrow">怎麼估算</p>
        <h2 id="how-title">不用精確，也能得到有用的輪廓。</h2>
        <ol>
          <li><span>01</span><h3>說說你們相處多久</h3><p>用到家日期，或直接填年與月。</p></li>
          <li><span>02</span><h3>選擇日常消費模式</h3><p>不知道金額也沒關係，可以用生活方式估算。</p></li>
          <li><span>03</span><h3>看看錢都去了哪裡</h3><p>總額、每日平均與各類別占比一次整理。</p></li>
        </ol>
      </section>

      <section className="method-note">
        <div>
          <p className="eyebrow">先說清楚</p>
          <h2>這是一張生活的速寫，不是精密帳本。</h2>
        </div>
        <div className="method-copy">
          <p>
            結果會以你現在提供的代表性花費回推，不計通膨，也不預測未來醫療。
            所有數字都會明確標示為估算。
          </p>
          <div>
            <Link href="/tools/cat-cost/methodology">計算方式 →</Link>
            <Link href="/tools/cat-cost/faq">常見問題 →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
