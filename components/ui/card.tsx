import * as React from "react";
import { cn } from "@/lib/utils";

/** shadcn/ui の Card 相当。角丸と影だけの薄いラッパー */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200",
        className,
      )}
      {...props}
    />
  );
}
