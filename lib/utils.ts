import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui 標準のクラス結合ヘルパー。後から shadcn のコンポーネントをそのまま入れられるようにしてある */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
