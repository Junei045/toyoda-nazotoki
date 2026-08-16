import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// CLAUDE.md の指定どおり日本語は Noto Sans JP。
// display: swap でフォント読込中も文字が消えないようにしている
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "とよだ謎とき | 見習い探偵と3つの謎を解こう",
  description:
    "見習い探偵のトヨタくんが1問ずつ謎を出題。3つのキーワードを集めて最終問題の答えをみちびく、スマホ向けの謎ときゲームです。",
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>{children}</body>
    </html>
  );
}
