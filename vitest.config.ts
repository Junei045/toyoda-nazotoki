import { defineConfig } from "vitest/config";
import path from "path";

/**
 * テストはロジックとデータの検証だけで、コンポーネントの描画はしない。
 * そのため jsdom（ブラウザ環境の再現）も React プラグインも要らない。
 *
 * jsdom を入れていたときは Node 22 以上が必須になり、
 * GitHub Actions の Node 20 でテストが起動できなかった。
 * 使わない依存を外して、環境の要求をゆるくしてある。
 */
export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
