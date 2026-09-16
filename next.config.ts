import type { NextConfig } from "next";

/**
 * GitHub Pages（静的ホスティング）向けの設定。
 *
 * basePath はリポジトリ名によって変わる（https://junei045.github.io/<リポジトリ名>/）。
 * ハードコードするとリポジトリ名を変えたときに壊れるので、
 * GitHub Actions 側で NEXT_PUBLIC_BASE_PATH に自動で入れている。
 * ローカルの `npm run dev` では空文字なので、これまでどおり / で動く。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // サーバーを持たない静的 HTML として書き出す
  output: "export",

  basePath,
  assetPrefix: basePath || undefined,

  // GitHub Pages には Next.js の画像最適化サーバーが無いので、最適化を切る
  images: { unoptimized: true },

  // /nazotoki/ のようにスラッシュ付きで開かれても index.html が引けるようにする
  trailingSlash: true,
};

export default nextConfig;
