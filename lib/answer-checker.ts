/**
 * 回答判定ロジック（ルールベース）。
 *
 * なぜ AI に判定させないか：
 * 謎解きは「正解が一意に決まること」がゲームの前提なので、
 * 判定がゆらぐと理不尽さに直結する。判定は必ずここで完結させる。
 *
 * なぜ正規化を挟むか：
 * 日本語入力は「トケイ / とけい / 時計 / ときい（誤変換）」のように
 * 表記ゆれが必ず起きる。漢字は機械的に読みへ変換できないため、
 * 漢字表記は puzzles.ts の answer 配列に列挙する方針とし、
 * 「かな種別・全角半角・空白・記号」のゆれだけをここで吸収する。
 */

export interface CheckOptions {
  /** exact: 正規化後に完全一致 / partial: 正解候補が入力に含まれていれば正解 */
  mode: "exact" | "partial";
  /** 空白（半角・全角）を無視する */
  ignoreSpaces: boolean;
  /** カタカナとひらがなを同一視する */
  kanaInsensitive: boolean;
  /** 句読点・中黒・記号を無視する */
  ignorePunctuation: boolean;
  /** 小書き文字（ゃゅょっ等）を大文字扱いにする。誤答を拾いすぎるため既定は false */
  ignoreSmallKana: boolean;
}

export const DEFAULT_CHECK_OPTIONS: CheckOptions = {
  mode: "exact",
  ignoreSpaces: true,
  kanaInsensitive: true,
  ignorePunctuation: true,
  ignoreSmallKana: false,
};

/** 無視する記号。長音記号「ー」は意図的に残す（とうきょう/とーきょー を潰さないため） */
const PUNCTUATION = /[、。，．・「」『』（）()!！?？~〜\-—_'"'"]/g;

const SMALL_KANA_MAP: Record<string, string> = {
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お",
  っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ",
};

/** カタカナ → ひらがな（半角カナは NFKC で全角化済みの前提） */
function katakanaToHiragana(input: string): string {
  return input.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

/**
 * 入力と正解候補の両方に同じ正規化をかける。
 * 片側だけに適用すると必ず取りこぼすので、必ず対で使うこと。
 */
export function normalizeAnswer(
  input: string,
  options: CheckOptions = DEFAULT_CHECK_OPTIONS,
): string {
  // NFKC で全角英数→半角、半角カナ→全角カナ、丸数字→数字までまとめて揃う
  let text = input.normalize("NFKC").trim().toLowerCase();

  if (options.ignoreSpaces) {
    text = text.replace(/\s+/g, "");
  }
  if (options.ignorePunctuation) {
    text = text.replace(PUNCTUATION, "");
  }
  if (options.kanaInsensitive) {
    text = katakanaToHiragana(text);
  }
  if (options.ignoreSmallKana) {
    text = text.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) => SMALL_KANA_MAP[c] ?? c);
  }
  return text;
}

/**
 * 回答が正解候補のいずれかに一致するか判定する。
 * 空文字は常に不正解（partial モードで全問正解になる事故を防ぐ）。
 */
export function checkAnswer(
  input: string,
  answers: string[],
  options: CheckOptions = DEFAULT_CHECK_OPTIONS,
): boolean {
  const normalizedInput = normalizeAnswer(input, options);
  if (normalizedInput.length === 0) return false;

  return answers.some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer, options);
    if (normalizedAnswer.length === 0) return false;

    return options.mode === "partial"
      ? normalizedInput.includes(normalizedAnswer)
      : normalizedInput === normalizedAnswer;
  });
}
