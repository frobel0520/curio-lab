import Link from "next/link";

export default function CatPersonalityLandingPage() {
  return (
    <main className="tool-page personality-tool-page">
      <section className="tool-hero personality-tool-hero">
        <div className="tool-hero-copy">
          <Link className="back-link" href="/">← 回到工具收藏</Link>
          <p className="eyebrow">趣味測驗 · 16 型貓格</p>
          <h1>
            牠不是難懂，
            <em>只是很有貓格。</em>
          </h1>
          <p>從 20 個日常情境，找出最接近你家主子的行為類型。</p>
          <div className="hero-actions">
            <Link className="primary-action" href="/tools/cat-personality/quiz">
              開始觀察主子
              <span aria-hidden="true">→</span>
            </Link>
            <span>約 3 分鐘 · 不需登入</span>
          </div>
        </div>

        <aside className="personality-teaser" aria-label="測驗結果預覽">
          <span>16 TYPE CAT PROFILE</span>
          <p>牠是哪一種貓格？</p>
        </aside>
      </section>
    </main>
  );
}
