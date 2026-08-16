"use client";

import type { PuzzleVisual as PuzzleVisualType } from "@/types/game";

/**
 * 問題に添える図。Cloudscape 版の見た目をそのまま Tailwind に移植した。
 * 新しい出題形式を足すときは、types/game.ts の kind を増やして
 * ここに分岐を1つ追加すればよい。
 */
export function PuzzleVisual({ visual }: { visual: PuzzleVisualType }) {
  if (visual.kind === "kanji-arrows") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-100 p-4">
        <div
          className="flex flex-wrap justify-center gap-2.5"
          aria-label={visual.chars
            .map((c, i) => `${c} は ${ARROW_LABEL[visual.arrows[i]] ?? "指定なし"}`)
            .join("、")}
        >
          {visual.chars.map((char, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-blue-500 bg-white text-3xl font-bold text-slate-900">
                {char}
              </div>
              <div className="flex h-6 items-center">
                {visual.arrows[i] ? (
                  <ArrowIcon glyph={visual.arrows[i]} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.kind === "cipher-grid") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-100 p-4">
          {visual.rows.map((row, ri) => (
            <div key={ri} className="flex gap-1.5">
              {Array.from(row).map((char, ci) => (
                <div
                  key={ci}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-semibold text-slate-900"
                >
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {visual.iconHints.map((hint) => (
            <span
              key={hint.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
            >
              <span aria-hidden="true">{hint.icon}</span>
              {hint.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-100 p-4">
      {visual.items.map((item) => (
        <div
          key={item.word}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5"
        >
          <span className="text-lg font-semibold text-slate-900">{item.word}</span>
          <span className="min-w-11 text-right text-xl font-bold text-blue-600">
            {item.frac}
          </span>
        </div>
      ))}
      <p className="text-center text-xs text-slate-500">ことば と 分数</p>
    </div>
  );
}

/**
 * 矢印が指す「漢字の中の位置」。
 * 読み上げ環境では矢印の向きが伝わらないため、言葉でも持っておく。
 */
const ARROW_LABEL: Record<string, string> = {
  "↑": "上", "↗": "右上", "→": "右", "↘": "右下",
  "↓": "下", "↙": "左下", "←": "左", "↖": "左上",
};

/** 矢印グリフを回転角度に変換して1つの SVG を使いまわす */
const ARROW_ANGLE: Record<string, number> = {
  "↑": 0, "↗": 45, "→": 90, "↘": 135,
  "↓": 180, "↙": 225, "←": 270, "↖": 315,
};

function ArrowIcon({ glyph }: { glyph: string }) {
  const angle = ARROW_ANGLE[glyph] ?? 0;
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${ARROW_LABEL[glyph] ?? glyph} をさす矢印`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <g
        fill="none"
        stroke="currentColor"
        className="text-blue-600"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="20" x2="12" y2="4" />
        <polyline points="6,10 12,4 18,10" />
      </g>
    </svg>
  );
}

/**
 * 菊の花。原稿の右下に2輪 描かれていた、答えのイラスト。
 * 結果画面で「きく」が出るところに添える。
 */
export function Chrysanthemum({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="菊の花">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI) / 6;
        return (
          <ellipse
            key={i}
            cx={24 + Math.cos(angle) * 13}
            cy={24 + Math.sin(angle) * 13}
            rx="7"
            ry="3.5"
            fill="#fbbf24"
            transform={`rotate(${(i * 180) / 6} ${24 + Math.cos(angle) * 13} ${24 + Math.sin(angle) * 13})`}
          />
        );
      })}
      <circle cx="24" cy="24" r="7" fill="#f59e0b" />
    </svg>
  );
}
