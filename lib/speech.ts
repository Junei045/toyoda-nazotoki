/**
 * 読み上げ（音声出題・キャラクターのセリフ）。
 *
 * ブラウザ標準の Web Speech API を使う。サーバーも API キーも要らないので、
 * 地域向けに無料で配布するアプリと相性がよい。
 *
 * 注意点：
 * - iOS Safari は「ユーザーが操作したあと」でないと発話しない。
 *   そのため自動読み上げはせず、必ずボタンから呼ぶ設計にしている。
 * - 日本語の声が入っていない端末では読まれない。isSpeechSupported() で先に判定する。
 * - 声の品質は端末と OS で決まる。こちらで選べるのは「入っている声のうちどれを使うか」だけ。
 */

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * 声に点数をつけて、いちばん自然なものを選ぶ。
 *
 * なぜ点数式にするか：
 * 端末には複数の日本語音声が入っていることが多く、
 * 最初に見つかった声（多くは古い機械音声）を使うと かなりぎこちない。
 * 新しいニューラル音声やクラウド音声があれば、そちらが明らかに自然に聞こえる。
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;

  // Natural / Neural と名のつく声は新世代の合成方式で、いちばん自然
  if (/natural|neural/.test(name)) score += 8;
  // 端末内蔵ではなくネット経由の声は品質が高いことが多い
  if (!voice.localService) score += 4;
  if (/google/.test(name)) score += 3;
  // 各 OS の標準的な日本語話者名
  if (/nanami|ayumi|kyoko|otoya|keita|haruka|o-ren/.test(name)) score += 1;

  return score;
}

function pickJapaneseVoice(): SpeechSynthesisVoice | undefined {
  const japanese = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ja"));

  if (japanese.length === 0) return undefined;

  return [...japanese].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

/** いま使われる声の名前。設定画面などで見せたいとき用 */
export function getVoiceName(): string | undefined {
  if (!isSpeechSupported()) return undefined;
  return pickJapaneseVoice()?.name;
}

/**
 * 読み上げ用にテキストを整える。
 *
 * 画面表示のための改行や、読みやすさのために入れた半角スペースが
 * そのままだと不自然な間になる。句読点は残し、それ以外の空白は詰める。
 */
export function normalizeSpeechText(text: string): string {
  return text
    .replace(/\r?\n+/g, "、") // 改行は軽い区切りとして読ませる
    .replace(/[ \u3000]+/g, "") // 表示用のスペースは間の原因になるので取る
    .replace(/、{2,}/g, "、")
    .replace(/、。/g, "。")
    .trim();
}

export interface SpeakOptions {
  /** 読み上げ速度。子ども向けなのでやや遅め */
  rate?: number;
  /** 声の高さ。上げすぎると合成くさくなるので既定は等倍 */
  pitch?: number;
  onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) return;

  // 連打されたときに音が重ならないよう、必ず止めてから読む
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
  utterance.lang = "ja-JP";
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.0;

  const voice = pickJapaneseVoice();
  if (voice) utterance.voice = voice;

  if (options.onEnd) utterance.onend = options.onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
