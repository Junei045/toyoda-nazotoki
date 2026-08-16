"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/asset-path";
import { speak } from "@/lib/speech";

type Mood = "happy" | "thinking";

interface DetectiveBubbleProps {
  name: string;
  imageSrc: string;
  message: string;
  mood?: Mood;
  /**
   * 読み上げ用の文。省略すると message をそのまま読む。
   * 漢字の読みまちがいを避けたいときに指定する。
   */
  speech?: string;
  /** 読み上げボタンを出すか（端末に日本語音声があるときだけ true にする） */
  canSpeak?: boolean;
}

/**
 * キャラクターの吹き出し。表情はまだ1枚絵なので、枠の色で気分を出している。
 *
 * 読み上げボタンをここに置いているのは、
 * 問題文とセリフを別々に聞けるようにするため。
 * イントロから結果画面まで、トヨタくんの話だけを追いかけられる。
 */
export function DetectiveBubble({
  name,
  imageSrc,
  message,
  mood = "thinking",
  speech,
  canSpeak,
}: DetectiveBubbleProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 bg-white",
          mood === "happy" ? "border-emerald-400" : "border-blue-400",
        )}
      >
        <Image src={assetPath(imageSrc)} alt={name} fill sizes="56px" className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xs font-medium text-slate-500">{name}</p>
          {canSpeak && (
            <button
              type="button"
              onClick={() => speak(speech ?? message)}
              aria-label={`${name}のセリフを読み上げる`}
              className="rounded-full px-2 py-0.5 text-xs text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            >
              🔊 きく
            </button>
          )}
        </div>
        <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
          {message}
        </div>
      </div>
    </div>
  );
}
