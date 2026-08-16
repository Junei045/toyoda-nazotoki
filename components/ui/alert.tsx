import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "error";

const TONE: Record<AlertTone, string> = {
  info: "bg-amber-50 text-amber-900 ring-amber-200",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  error: "bg-rose-50 text-rose-900 ring-rose-200",
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  heading?: string;
}

/** shadcn/ui の Alert 相当。role="status" で読み上げにも伝わるようにしている */
export function Alert({ tone = "info", heading, className, children, ...props }: AlertProps) {
  return (
    <div
      role="status"
      className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed ring-1", TONE[tone], className)}
      {...props}
    >
      {heading && <p className="mb-1 font-bold">{heading}</p>}
      {children}
    </div>
  );
}
