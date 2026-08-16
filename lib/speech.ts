/**
 * 読み上げ（音声出題）。
 *
 * ブラウザ標準の Web Speech API を使う。サーバーも API キーも要らないので、
 * 地域向けに無料で配布するアプリと相性がよい。
 *
 * 注意点：
 * - iOS Safari は「ユーザーが操作したあと」でないと発話しない。
 *   そのため自動読み上げはせず、必ずボタンから呼ぶ設計にしている。
 * - 日本語の声が入っていない端末では読まれない。isSpeechSupported() で先に判定する。
 */

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 日本語の声をさがす。見つからなければ既定の声にまかせる */
function pickJapaneseVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "ja-JP") ?? voices.find((v) => v.lang.startsWith("ja"));
}

export interface SpeakOptions {
  /** 読み上げ速度。子ども向けなので既定はやや遅め */
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) return;

  // 連打されたときに音が重ならないよう、必ず止めてから読む
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1.1;

  const voice = pickJapaneseVoice();
  if (voice) utterance.voice = voice;

  if (options.onEnd) utterance.onend = options.onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
