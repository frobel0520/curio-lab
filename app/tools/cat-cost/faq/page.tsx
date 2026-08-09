import Link from "next/link";

const questions = [
  ["一定要填得很準嗎？", "不用。選擇最接近的消費方式，就能得到適合回顧生活的估算輪廓。"],
  ["為什麼零食不放在主食？", "避免同一筆花費被重複計算；零食統一歸在「玩具與零食」。"],
  ["結果是財務建議嗎？", "不是。這是生活分析工具，不是記帳、預算或醫療建議。"],
  ["資料會上傳嗎？", "目前不會。資料只存在這台裝置的瀏覽器中，清除網站資料後就會消失。"],
];

export default function FaqPage() {
  return (
    <main className="content-page">
      <Link className="back-link" href="/tools/cat-cost">← 回到主子帳本</Link>
      <p className="eyebrow">常見問題</p>
      <h1>開始前，可能會想問的事。</h1>
      <div className="faq-list">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
