"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/asset-path";

type Mood = "happy" | "thinking";

interface DetectiveBubbleProps {
  name: string;
  imageSrc: string;
  message: string;
  mood?: Mood;
}

/** キャラクターの吹き出し。表情はまだ1枚絵なので、枠の色で気分を出している */
export function DetectiveBubble({ name, imageSrc, message, mood = "thinking" }: DetectiveBubbleProps) {
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
        <p className="mb-1 text-xs font-medium text-slate-500">{name}</p>
        <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
          {message}
        </div>
      </div>
    </div>
  );
}
