"use client";

interface KeywordCollectionProps {
  keywords: (string | null)[];
}

/**
 * 獲得キーワード表示。
 * 未獲得を空白にせず「？」の枠で見せる。あと何個かが一目でわかると途中でやめにくい。
 */
export function KeywordCollection({ keywords }: KeywordCollectionProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">あつめたキーワード</p>
      <div className="flex gap-2" aria-label="あつめたキーワード">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            className={
              keyword
                ? "flex h-11 flex-1 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white"
                : "flex h-11 flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-300"
            }
          >
            {keyword ?? "？"}
          </div>
        ))}
      </div>
    </div>
  );
}
