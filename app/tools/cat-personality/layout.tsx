import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "16 型貓格測驗｜好奇一下 Curio Lab",
  description: "從 20 個日常情境，看看你家主子屬於哪一種貓格。",
  openGraph: {
    title: "16 型貓格測驗｜你家主子是哪一型？",
    description: "用日常觀察，找出牠最接近的 16 型貓格。",
    type: "website",
  },
};

export default function CatPersonalityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
