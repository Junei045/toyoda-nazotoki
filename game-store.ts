import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GamePhase, GameRating } from "@/types/game";
import { toyodaPuzzleSet } from "@/data/puzzles";
import {
  checkAnswer,
  DEFAULT_CHECK_OPTIONS,
  type CheckOptions,
} from "@/lib/answer-checker";

const set0 = toyodaPuzzleSet;

/**
 * ゲーム状態はここに集約する（複数箇所で状態を持たない）。
 * Cloudscape 版は useState をコンポーネント内に散らしていたため、
 * リロードで進捗が消えていた。store にまとめて persist をかけることで解決している。
 */
interface GameState {
  phase: GamePhase;
  currentIndex: number;
  /** 獲得済みキーワード。未獲得は null で「あと何個か」を見せられるようにしている */
  keywords: (string | null)[];
  /** 問題 ID ごとの使用ヒント数（0〜3） */
  hintLevels: Record<string, number>;
  /** 直前の回答が正解か */
  solved: boolean;
  /** 不正解の回数。セリフの出しわけに使う */
  missCount: number;
  /** 「途中までは合っている」答えだったか。専用コメントの表示に使う */
  nearMiss: boolean;
  checkOptions: CheckOptions;

  startGame: () => void;
  submitAnswer: (input: string) => boolean;
  goNext: () => void;
  useHint: (puzzleId: string) => void;
  resetGame: () => void;
  setCheckOptions: (options: Partial<CheckOptions>) => void;
}

const initialState = {
  phase: "intro" as GamePhase,
  currentIndex: 0,
  keywords: set0.puzzles.map(() => null) as (string | null)[],
  hintLevels: {} as Record<string, number>,
  solved: false,
  missCount: 0,
  nearMiss: false,
  checkOptions: DEFAULT_CHECK_OPTIONS,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startGame: () =>
        set({ phase: "playing", solved: false, missCount: 0, nearMiss: false }),

      submitAnswer: (input) => {
        const { phase, currentIndex, checkOptions } = get();
        const puzzle = phase === "final" ? set0.final : set0.puzzles[currentIndex];
        if (!puzzle) return false;

        const correct = checkAnswer(input, puzzle.answers, checkOptions);

        if (!correct) {
          // 途中までは合っている答えなら、専用コメントに切り替える
          const isNearMiss = Boolean(
            puzzle.nearMiss &&
              checkAnswer(input, puzzle.nearMiss.answers, checkOptions),
          );
          set((state) => ({
            solved: false,
            missCount: state.missCount + 1,
            nearMiss: isNearMiss,
          }));
          return false;
        }

        set((state) => {
          const keywords = [...state.keywords];
          if (phase === "playing" && puzzle.keyword) {
            keywords[currentIndex] = puzzle.keyword;
          }
          return { solved: true, nearMiss: false, keywords };
        });
        return true;
      },

      /** 正解後に次へ進む。「正解しないと進めない」ルールをここで担保している */
      goNext: () => {
        const { phase, currentIndex, solved } = get();
        if (!solved) return;

        if (phase === "playing") {
          if (currentIndex < set0.puzzles.length - 1) {
            set({
              currentIndex: currentIndex + 1,
              solved: false,
              missCount: 0,
              nearMiss: false,
            });
          } else {
            set({ phase: "final", solved: false, missCount: 0, nearMiss: false });
          }
        } else if (phase === "final") {
          set({ phase: "result" });
        }
      },

      useHint: (puzzleId) =>
        set((state) => {
          const current = state.hintLevels[puzzleId] ?? 0;
          if (current >= 3) return state;
          return { hintLevels: { ...state.hintLevels, [puzzleId]: current + 1 } };
        }),

      resetGame: () =>
        set({
          ...initialState,
          keywords: set0.puzzles.map(() => null),
          // 判定設定はプレイ内容ではないので、リセットしても残す
          checkOptions: get().checkOptions,
        }),

      setCheckOptions: (options) =>
        set((state) => ({ checkOptions: { ...state.checkOptions, ...options } })),
    }),
    {
      // 問題セットの ID を含める。問題を差し替えたときに古い進捗を引きずらない
      name: `nazotoki-progress:${set0.id}`,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phase: state.phase,
        currentIndex: state.currentIndex,
        keywords: state.keywords,
        hintLevels: state.hintLevels,
        solved: state.solved,
        checkOptions: state.checkOptions,
      }),
      // 問題データを差し替えたときに、合わない進捗を引きずらないようにする
      merge: (persisted, current) => {
        const saved = reconcileProgress(
          persisted as Parameters<typeof reconcileProgress>[0],
          set0.puzzles.length,
        );
        if (!saved) {
          return { ...current, ...initialState, keywords: set0.puzzles.map(() => null) };
        }
        return { ...current, ...saved };
      },
    },
  ),
);

/**
 * localStorage から読み出した進捗が、いまの問題データと食いちがっていないか点検する。
 *
 * なぜ必要か：
 * 問題を追加・削除・差し替えたあと、前に遊んだ人のブラウザには古い進捗が残っている。
 * たとえば3問を2問に減らすと「3問目の途中」で保存された人は
 * puzzles[2] が存在せず、問題カードごと表示されなくなる。
 * 合わない進捗は黙って最初からにするのが、いちばん安全で分かりやすい。
 *
 * 問題文やヒントだけを直したときは問題数もIDも変わらないので、進捗は保たれる。
 */
export function reconcileProgress<T extends {
  currentIndex: number;
  keywords: (string | null)[];
  phase: GamePhase;
}>(saved: T | undefined, puzzleCount: number): T | null {
  if (!saved) return null;

  // 保存時より問題数が変わっている
  if (!Array.isArray(saved.keywords) || saved.keywords.length !== puzzleCount) return null;

  // 存在しない問題を指している
  if (
    typeof saved.currentIndex !== "number" ||
    saved.currentIndex < 0 ||
    saved.currentIndex >= puzzleCount
  ) {
    return null;
  }

  return saved;
}

/**
 * 進捗バーの表示状態を計算する。
 *
 * 「解けた数 = 獲得キーワードの数」で数えていたら、
 * キーワードを持たない最終問題がいつまでも未クリア扱いになり、
 * 正解しても青のまま・結果画面では灰色に戻る不具合になった。
 * 最終問題のクリアは keywords ではなく phase から判定する。
 *
 * コンポーネントの外に出してあるのは、この計算をテストで押さえるため。
 */
export function getProgress(params: {
  phase: GamePhase;
  currentIndex: number;
  keywords: (string | null)[];
  solved: boolean;
  totalPuzzles: number;
}): { solvedCount: number; currentStep: number } {
  const { phase, currentIndex, keywords, solved, totalPuzzles } = params;

  const keywordCount = keywords.filter((k) => k !== null).length;
  const finalSolved = phase === "result" || (phase === "final" && solved);
  const solvedCount = keywordCount + (finalSolved ? 1 : 0);

  // 結果画面では「今ここ」を指す必要がないので、範囲外を返して現在位置を出さない
  const currentStep =
    phase === "result"
      ? totalPuzzles + 1
      : phase === "final"
        ? totalPuzzles
        : currentIndex;

  return { solvedCount, currentStep };
}

/**
 * 星評価（3段階・減点方式）。
 * ヒントは全部で最大12回（4問×3段階）使える。
 * 「使った人が惨めにならない」ことを優先し、最低でも星1は残す設計にした。
 */
export function calculateRating(hintLevels: Record<string, number>): GameRating {
  const totalHints = Object.values(hintLevels).reduce((sum, n) => sum + n, 0);

  let stars: number;
  if (totalHints === 0) stars = 3;
  else if (totalHints <= 4) stars = 2;
  else stars = 1;

  const table: Record<number, { title: string; comment: string }> = {
    3: {
      title: "名たんてい",
      comment: "ヒントなしで ぜんぶ解いたね！ ぼくより するどいかもしれない。",
    },
    2: {
      title: "一人前のじょしゅ",
      comment: "手がかりの読みかたが しっかりしてる。次はもっといけるよ。",
    },
    1: {
      title: "みならいじょしゅ",
      comment:
        "さいごまで たどりついたのが 一番えらい！ 次は1問、ヒントなしで ちょうせんしてみよう。",
    },
  };

  return { stars, totalHints, ...table[stars] };
}
