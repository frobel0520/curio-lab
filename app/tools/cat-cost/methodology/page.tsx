import Link from "next/link";

export default function MethodologyPage() {
  return (
    <main className="content-page">
      <Link className="back-link" href="/tools/cat-cost">← 回到主子帳本</Link>
      <p className="eyebrow">計算方式</p>
      <h1>這是一張生活的速寫，不是精密帳本。</h1>
      <div className="prose">
        <h2>我們怎麼回推</h2>
        <p>每月花費會乘上相處月數，每年花費會乘上相處年數；重大醫療與用品設備則只加入一次。</p>
        <h2>目前金額代表過去</h2>
        <p>計算會假設你現在填寫的消費方式，也大致代表過去。這能快速得到輪廓，但不等於逐筆帳目。</p>
        <h2>刻意不做的事</h2>
        <p>不計通膨、不預測壽命，也不推估未來重大醫療。</p>
        <h2>資料放在哪裡</h2>
        <p>目前資料只保存在你的瀏覽器 LocalStorage，沒有帳號、後端或資料庫。</p>
      </div>
      <Link className="primary-action" href="/tools/cat-cost/calculator">回去計算 <span aria-hidden="true">→</span></Link>
    </main>
  );
}
