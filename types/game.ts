/**
 * ゲームの型定義。
 *
 * 「問題を後から追加・変更したい」「音声で出題したい」という要件があるため、
 * 問題は必ずデータとして表現できる形にしてある。
 * コンポーネント側は PuzzleVisual の kind で分岐するだけで、
 * 新しい図を足すときは kind を1つ増やせば済む。
 */

/** 問題に添える図。kind を増やすことで新しい出題形式に対応できる */
export type PuzzleVisual =
  | {
      /**
       * 漢字カード＋矢印。
       * 矢印は「漢字のどの位置にカタカナが隠れているか」を指す。
       * chars と arrows は同じ長さにする。
       */
      kind: "kanji-arrows";
      chars: string[];
      arrows: string[];
    }
  | {
      /** 文字グリッド＋アイコンヒント */
      kind: "cipher-grid";
      rows: string[];
      iconHints: { icon: string; label: string }[];
    }
  | {
      /** ことば＋分数のリスト */
      kind: "fraction-list";
      items: { word: string; frac: string }[];
    };

export interface Puzzle {
  /** 一意の ID。進捗保存とヒント数の記録に使う。問題を並べ替えても壊れないよう文字列にした */
  id: string;
  /** 「第1問」などのラベル */
  label: string;
  title: string;
  /** 出題時のキャラクターのセリフ */
  intro: string;
  /** 問題文 */
  question: string;
  visual?: PuzzleVisual;
  placeholder: string;
  /** ヒント3段階。段階が上がるほど答えに近づく */
  hints: [string, string, string];
  /** 正解として受け付ける答え（正規化して比較） */
  answers: string[];
  /** 正解で手に入るキーワード。最終問題には無い */
  keyword?: string;
  /** 正解時のキャラクターのセリフ */
  success: string;
  /**
   * 「途中までは合っている答え」への専用コメント（任意）。
   * 例：第2問でグリッドを消した直後の「たかはしあき」。
   * ただの不正解として扱うと、正しく解けているのに突き放されたように感じるため。
   */
  nearMiss?: {
    answers: string[];
    message: string;
  };
  /**
   * 正解したときの読み上げ文（任意）。
   * 未指定なら success を読む。
   */
  successSpeech?: string;
  /**
   * 読み上げ用テキスト。
   * 問題文には「↑」や「3/4」など読み上げに向かない記号が入るので、
   * 音声用の文面を別に持てるようにした（未指定なら question を読む）。
   */
  speech?: string;
}

export interface PuzzleSet {
  id: string;
  title: string;
  subtitle: string;
  /** キャラクター設定 */
  character: {
    name: string;
    imageSrc: string;
    /** 導入のあいさつ */
    greeting: string;
  };
  puzzles: Puzzle[];
  final: Puzzle;
  /**
   * 結果画面で明かす答えの解説。
   * 正解した瞬間ではなく結果画面まで取っておくことで、
   * 「答えを見る」という体験を1回にまとめている。
   */
  ending: {
    message: string;
    explanation: string;
  };
}

/** 画面フェーズ */
export type GamePhase = "intro" | "playing" | "final" | "result";

/** エンディングの評価 */
export interface GameRating {
  stars: number;
  totalHints: number;
  title: string;
  comment: string;
}
