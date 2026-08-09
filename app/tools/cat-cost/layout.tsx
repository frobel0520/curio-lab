import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "主子帳本｜好奇一下 Curio Lab",
  description: "用每月日常花費，估算這些年你大約為主子花了多少。",
  openGraph: {
    title: "主子帳本｜這些年，你進貢了多少？",
    description: "不用翻收據，2–4 分鐘整理你和主子的生活花費。",
    type: "website",
  },
};

export default function CatCostLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
