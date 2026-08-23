import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 日本国庆｜目的地候选",
  description: "名古屋到立山黑部中段的目的地独立筛选卡。",
  openGraph: {
    title: "2026 日本国庆｜目的地候选",
    description: "名古屋到立山黑部中段的目的地独立筛选卡。",
    url: "https://japan-2026-destinations.chenbei229.chatgpt.site",
    siteName: "2026 日本国庆｜目的地候选",
    images: [{ url: "https://japan-2026-destinations.chenbei229.chatgpt.site/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 日本国庆｜目的地候选",
    description: "名古屋到立山黑部中段的目的地独立筛选卡。",
    images: ["https://japan-2026-destinations.chenbei229.chatgpt.site/og.png"],
  },
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
