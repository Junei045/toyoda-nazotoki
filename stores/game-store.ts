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
    },
  ),
);

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
