"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** shadcn/ui の Input 相当。文字サイズを 16px 以上にして iOS の自動ズームを防いでいる */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
