"use client";

import { assetPath } from "@/lib/asset-path";

/**
 * 配布チラシ「消えた花の名前」を画面のいちばん上に置き、
 * ①②③の問題枠をタップするとその問題に飛べるようにする。
 *
 * 設計の理由：
 * - <map>/<area> は座標がピクセル固定で、画像を縮小すると当たり判定がずれる。
 *   スマホでは画像を画面幅に合わせて縮めるので使えない。
 *   画像の上に絶対配置したボタンを「％」で置けば、どの幅でも枠と一致する。
 * - 座標は元画像（2163 x 4781px）の枠の実測値から出した％。
 *   チラシを差し替えるときは HOTSPOTS の数値だけ直せばよい。
 * - webp と jpg を両方置き、<picture> で出しわける。
 *   webp のほうが4割軽いが、古い端末でも必ず表示されるよう jpg を残している。
 *   next/image は使っていない。static export では最適化が効かず、
 *   <picture> で切りかえるほうが素直なため。
 */

const FLYER = {
  webp: "/flyer.webp",
  jpg: "/flyer.jpg",
  width: 1080,
  height: 2387,
};

/** 元画像に対する問題枠の位置（％）。左上を 0,0 とする */
const HOTSPOTS = [
  { index: 0, label: "第1問", left: 1.3, width: 31.9 },
  { index: 1, label: "第2問", left: 33.9, width: 32.3 },
  { index: 2, label: "第3問", left: 66.9, width: 31.8 },
];

/** 3枠とも上下位置は同じ */
const HOTSPOT_TOP = 24.9;
const HOTSPOT_HEIGHT = 36.3;

interface PuzzleFlyerProps {
  /** 枠をタップしたときに呼ばれる。index は問題の並び順（0 始まり） */
  onSelect: (index: number) => void;
  /** キーワード獲得ずみの問題。枠に「クリア」を出す */
  keywords: (string | null)[];
  /** false のときは枠を押せなくする（結果画面など） */
  interactive?: boolean;
}

export function PuzzleFlyer({ onSelect, keywords, interactive = true }: PuzzleFlyerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <picture>
        <source srcSet={assetPath(FLYER.webp)} type="image/webp" />
        <img
          src={assetPath(FLYER.jpg)}
          width={FLYER.width}
          height={FLYER.height}
          alt="とよだ謎解き「消えた花の名前」の問題用紙。第1問 何と読む？、第2問 暗号を解読せよ！、第3問 ヒントを読み解け！の3問がならんでいる"
          className="block h-auto w-full"
          // チラシは画面のいちばん上に出るので、遅延せず先に読む
          fetchPriority="high"
        />
      </picture>

      {interactive &&
        HOTSPOTS.map((spot) => {
          const solved = keywords[spot.index] != null;
          return (
            <button
              key={spot.index}
              type="button"
              onClick={() => onSelect(spot.index)}
              // 位置は％。画像が縮んでも枠とずれない
              style={{
                left: `${spot.left}%`,
                width: `${spot.width}%`,
                top: `${HOTSPOT_TOP}%`,
                height: `${HOTSPOT_HEIGHT}%`,
              }}
              className="absolute flex items-end justify-center rounded-xl pb-[2%] ring-2 ring-transparent transition hover:bg-blue-500/10 hover:ring-blue-500 focus-visible:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-blue-500 active:bg-blue-500/20"
              aria-label={`${spot.label}にすすむ${solved ? "（クリアずみ）" : ""}`}
            >
              <span
                className={
                  solved
                    ? "rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                    : "rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-blue-200"
                }
              >
                {solved ? `${spot.label} クリア` : `${spot.label}へ`}
              </span>
            </button>
          );
        })}
    </div>
  );
}
