"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface HintPanelProps {
  hints: readonly string[];
  /** 開放済みのヒント数 */
  level: number;
  onUseHint: () => void;
}

/**
 * 3段階ヒント。
 * 一度開いたヒントは閉じない（押し直すと使用数が増えたように見えて不安になるため）。
 * 星が減ることをボタンに書いておき、「押すとどうなるか」を先に伝える。
 */
export function HintPanel({ hints, level, onUseHint }: HintPanelProps) {
  const remaining = hints.length - level;

  return (
    <div className="space-y-2">
      {hints.slice(0, level).map((hint, index) => (
        <Alert key={index} tone="info" heading={`ヒント ${index + 1}`}>
          {hint}
        </Alert>
      ))}

      {remaining > 0 && (
        <Button variant="outline" size="full" onClick={onUseHint}>
          ヒントを見る（のこり {remaining} 回・星がへります）
        </Button>
      )}

      {remaining === 0 && (
        <p className="text-center text-xs text-slate-400">ヒントはぜんぶ出したよ</p>
      )}
    </div>
  );
}
