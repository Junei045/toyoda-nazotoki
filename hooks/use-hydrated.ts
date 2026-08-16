"use client";

import { useEffect, useState } from "react";

/**
 * localStorage からの復元が終わったかを返す。
 *
 * なぜ必要か：
 * Next.js はサーバー側で一度描画するが、そこに localStorage は無い。
 * 復元前に描画すると「サーバーはイントロ／クライアントは第3問」となって
 * hydration mismatch のエラーになる。復元完了まで待つのが一番安全。
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
