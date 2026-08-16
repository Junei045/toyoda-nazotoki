/**
 * 画像などの静的ファイルのパスに basePath を付ける。
 *
 * なぜ必要か：
 * GitHub Pages ではサイトが /<リポジトリ名>/ の下に置かれる。
 * next/image は basePath を自動で付けてくれるが、
 * `images.unoptimized: true` のときは src をそのまま使う実装になっている。
 * 静的書き出しでは unoptimized が必須なので、ここで自分で付ける。
 *
 * NEXT_PUBLIC_ で始まる環境変数はビルド時に埋め込まれるため、ブラウザ側でも読める。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return `${basePath}${path}`;
}
