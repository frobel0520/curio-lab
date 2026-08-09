import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "好奇一下 Curio Lab",
    template: "%s｜好奇一下",
  },
  description: "把生活裡的小好奇，變成一個看得懂、願意分享的答案。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="好奇一下首頁">
            好奇一下<span>CURIO LAB</span>
          </Link>
          <nav aria-label="主要導覽">
            <Link href="/#tools">探索</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <Link href="/privacy">隱私</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
