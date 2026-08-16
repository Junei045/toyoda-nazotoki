"use client";

interface ProgressStepsProps {
  labels: string[];
  currentIndex: number;
  solvedCount: number;
}

/** 進捗バー。今どこにいて、あと何問あるかを常に見せる */
export function ProgressSteps({ labels, currentIndex, solvedCount }: ProgressStepsProps) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="進捗">
      {labels.map((label, index) => {
        const state =
          index < solvedCount ? "done" : index === currentIndex ? "current" : "locked";
        return (
          <li key={label} className="flex-1">
            <div
              className={
                state === "done"
                  ? "h-1.5 rounded-full bg-emerald-500"
                  : state === "current"
                    ? "h-1.5 rounded-full bg-blue-500"
                    : "h-1.5 rounded-full bg-slate-200"
              }
            />
            <p
              className={
                state === "locked"
                  ? "mt-1 text-center text-[10px] text-slate-400"
                  : "mt-1 text-center text-[10px] font-medium text-slate-600"
              }
            >
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
