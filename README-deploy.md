# GitHub Pages で公開する手順

公開先は `https://junei045.github.io/<リポジトリ名>/` になります。
以下は `nazotoki` というリポジトリ名で作る場合の例です。

---

## 1. リポジトリを作る

GitHub で新しいリポジトリを作ります（**Public**）。
README や .gitignore は追加しないでください（この ZIP に入っています）。

## 2. コードを push する

ZIP を展開したフォルダで:

```bash
cd nazotoki-tw
git init
git add .
git commit -m "とよだ謎とき 初版"
git branch -M main
git remote add origin https://github.com/junei045/nazotoki.git
git push -u origin main
```

## 3. Pages を有効にする

リポジトリの **Settings → Pages** を開き、
**Build and deployment → Source** を **GitHub Actions** に変更します。

> ここを「Deploy from a branch」のままにすると動きません。
> `.github/workflows/deploy.yml` から配信する方式なので、必ず **GitHub Actions** を選んでください。

## 4. 自動でデプロイされる

push すると Actions が動きます。**Actions** タブで進行状況が見られます。

1. `npm ci` で依存をインストール
2. `npx vitest run` でテスト（19 件）
3. `npm run build` で静的書き出し
4. Pages へデプロイ

**テストが落ちるとデプロイされません。** 問題データを壊したまま公開してしまう事故を防ぐためです。

数分待つと `https://junei045.github.io/nazotoki/` が開きます。

## 5. 更新のしかた

問題を直したら push するだけです。

```bash
git add .
git commit -m "第2問のヒントを修正"
git push
```

手動で実行したいときは Actions タブ → Deploy to GitHub Pages → **Run workflow**。

---

## 静的公開のために入れた設定

| 設定 | 場所 | 理由 |
|---|---|---|
| `output: "export"` | `next.config.ts` | GitHub Pages にはサーバーが無いので、静的 HTML として書き出す |
| `basePath` を環境変数から | `next.config.ts` | 公開 URL が `/<リポジトリ名>/` の下になる。リポジトリ名を変えても壊れないよう、Actions 側が自動で入れる |
| `images.unoptimized: true` | `next.config.ts` | Next.js の画像最適化サーバーが使えないため |
| `assetPath()` | `lib/asset-path.ts` | `unoptimized: true` のとき `next/image` は basePath を付けない仕様。画像だけ 404 になるのを防ぐため自分で付けている |
| `trailingSlash: true` | `next.config.ts` | `/nazotoki/` で開かれても index.html が引けるように |
| `public/.nojekyll` | ファイル | GitHub Pages の Jekyll が `_next` のようなアンダースコア始まりのフォルダを無視してしまうため |

ローカルの `npm run dev` では basePath が空なので、これまでどおり `http://localhost:3000` で動きます。

---

## 公開前に知っておいてほしいこと

### アクセス制限はありません

URL を知っている人なら誰でも遊べます。合言葉やログインは置いていません。

**リンクを渡した相手だけに遊んでほしい場合は、これで十分です。**
逆に「絶対に外部の人に見せたくない」という用途には向きません。
ブラウザだけで動くアプリでは、URL を知られた時点で誰でも開けるためです。

### 答えがソースに入っています

`/data/puzzles.ts` に正解が書いてあります。
Public リポジトリなので、その気になれば答えを先に見られます。

地域向けの遊びとしては問題ないと思いますが、
「絶対にネタバレさせたくない」場合は Public 公開に向きません。
