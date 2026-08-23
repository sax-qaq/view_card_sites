import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 日本国庆｜目的地候选",
  description: "名古屋到立山黑部中段的目的地独立筛选卡。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
