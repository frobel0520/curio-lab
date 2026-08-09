import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="home-hero">
        <p className="eyebrow">Curiosity, made useful.</p>
        <h1>
          好奇一下，
          <em>就有點答案。</em>
        </h1>
        <a className="primary-action" href="#tools">
          看看有什麼
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="tool-library" id="tools" aria-labelledby="tools-title">
        <div className="section-heading">
          <p className="eyebrow">001 / 工具收藏</p>
          <h2 id="tools-title">今天想好奇什麼？</h2>
        </div>

        <Link className="featured-tool" href="/tools/cat-cost">
          <div className="tool-index" aria-hidden="true">01</div>
          <div className="tool-copy">
            <p className="tool-kicker">生活計算 · 約 2–4 分鐘</p>
            <h3>主子帳本</h3>
            <p>從牠來到你家到現在，你大約已經進貢了多少？</p>
          </div>
          <div className="tool-preview" aria-label="結果卡預覽">
            <span>相處期間估算</span>
          </div>
          <span className="tool-arrow" aria-hidden="true">↗</span>
        </Link>

        <Link className="featured-tool" href="/tools/cat-personality">
          <div className="tool-index" aria-hidden="true">02</div>
          <div className="tool-copy">
            <p className="tool-kicker">趣味測驗 · 約 3 分鐘</p>
            <h3>16 型貓格</h3>
            <p>從日常行為看看，你家主子是哪一種貓格？</p>
          </div>
          <div className="tool-preview" aria-label="結果卡預覽">
            <span>20 個日常情境</span>
          </div>
          <span className="tool-arrow" aria-hidden="true">↗</span>
        </Link>
      </section>

    </main>
  );
}
