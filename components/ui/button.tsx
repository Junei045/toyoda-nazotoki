"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui の Button と同じ API・同じ実装方針で手書きしたもの。
 * shadcn の CLI はネットワーク制限で実行できなかったが、
 * 構造をそろえてあるので後から `npx shadcn add button` で置き換えられる。
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500",
        success:
          "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400",
        ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
      },
      size: {
        // 子どもが押しやすいよう、既定を大きめのタップ領域にしている
        default: "h-12 px-5",
        sm: "h-10 px-4 text-sm",
        full: "h-12 w-full px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
