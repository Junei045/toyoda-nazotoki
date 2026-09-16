"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toyodaPuzzleSet } from "@/data/puzzles";
import { useGameStore, calculateRating, getProgress } from "@/stores/game-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/speech";
import { assetPath } from "@/lib/asset-path";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { DetectiveBubble } from "@/components/detective-bubble";
import { KeywordCollection } from "@/components/keyword-collection";
import { ProgressSteps } from "@/components/progress-steps";
import { PuzzleVisual, Chrysanthemum } from "@/components/puzzle-visual";
import { HintPanel } from "@/components/hint-panel";
import { PuzzleFlyer } from "@/components/puzzle-flyer";

const set = toyodaPuzzleSet;

/** 不正解が続いたときのセリフ。同じ言葉のくり返しは責められている感じが出るので変える */
const MISS_COMMENTS = [
  "うーん、ちがうみたい。ヒントを見て もう一度チャレンジ！",
  "おしい気がする。図をもう一回 よーく見てみよう。",
  "だいじょうぶ。こういうのは 見かたを変えると 急にわかるんだ。",
];

export function NazotokiGame() {
  const hydrated = useHydrated();
  const [answer, setAnswer] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  // チラシは縦に長いので、遊んでいる間はたたんでおけるようにする。
  // 最初（イントロ）は開いた状態で見せ、問題に入ったらたたむ。
  const [flyerOpen, setFlyerOpen] = useState(true);

  const {
    phase, currentIndex, keywords, hintLevels, solved, missCount, nearMiss,
    startGame, startAt, submitAnswer, goNext, useHint, resetGame,
  } = useGameStore();

  // 声の一覧は非同期に読み込まれるので、そろってから読み上げボタンを出す
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const update = () => setSpeechReady(window.speechSynthesis.getVoices().length > 0);
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      stopSpeaking();
    };
  }, []);

  // ブラウザを開きなおしたときは、かならず入口のチラシから始める。
  // localStorage に進みぐあいが残っているため、そのままだと
  // 前の人が解いた結果画面（＝答え）が最初に出てしまう。
  // 同じタブの中での再読みこみでは進みぐあいを残す。
  // あやまって更新したときに、解いたところまで消えるのを防ぐため
  useEffect(() => {
    if (!hydrated) return;
    try {
      const KEY = "nazotoki-session";
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
      resetGame();
    } catch {
      // プライベートモードなどで sessionStorage が使えないときは何もしない
    }
  }, [hydrated, resetGame]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-400">よみこみ中…</p>
      </div>
    );
  }

  const puzzle = phase === "final" ? set.final : set.puzzles[currentIndex];
  const hintLevel = puzzle ? (hintLevels[puzzle.id] ?? 0) : 0;
  const labels = [...set.puzzles.map((p) => p.label), set.final.label];
  const { solvedCount, currentStep } = getProgress({
    phase,
    currentIndex,
    keywords,
    solved,
    totalPuzzles: set.puzzles.length,
  });
  // 「次は最終問題か」は番号ではなく、残りのキーワードで判断する。
  // チラシから順番を飛ばして解けるため、末尾の問題＝最後とは限らない
  const goesToFinal =
    keywords.every((k, i) => k != null || i === currentIndex);

  const handleFlyerSelect = (index: number) => {
    setAnswer("");
    setEmptyError(false);
    stopSpeaking();
    setFlyerOpen(false);
    startAt(index);
  };

  const handleStart = () => {
    stopSpeaking();
    setFlyerOpen(false);
    startGame();
  };

  const handleSubmit = () => {
    if (answer.trim() === "") {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    stopSpeaking();
    submitAnswer(answer);
  };

  const handleNext = () => {
    setAnswer("");
    setEmptyError(false);
    stopSpeaking();
    goNext();
  };

  const handleRestart = () => {
    setAnswer("");
    setEmptyError(false);
    stopSpeaking();
    // もう一度あそぶときは、入口のチラシからやり直せるように開いて戻す
    setFlyerOpen(true);
    resetGame();
  };

  return (
    <div className="space-y-5">
      {/* 画面のいちばん上はチラシ。枠をタップするとその問題へ飛ぶ */}
      <div className="space-y-2">
        {flyerOpen && (
          <PuzzleFlyer onSelect={handleFlyerSelect} keywords={keywords} />
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {flyerOpen ? "問題の枠をタップすると、その問題にすすめるよ。" : "\u00a0"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFlyerOpen((open) => !open)}
            aria-expanded={flyerOpen}
          >
            {flyerOpen ? "▲ 問題用紙をたたむ" : "▼ 問題用紙をひらく"}
          </Button>
        </div>
      </div>

      {phase !== "intro" && (
        <Card className="p-4">
          <ProgressSteps labels={labels} currentIndex={currentStep} solvedCount={solvedCount} />
        </Card>
      )}

      {/* --- イントロ --- */}
      {phase === "intro" && (
        <Card>
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-blue-500 bg-white">
                <Image
                  src={assetPath(set.character.imageSrc)}
                  alt={`見習い探偵の${set.character.name}`}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{set.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{set.subtitle}</p>
            </div>

            <DetectiveBubble
              name={set.character.name}
              imageSrc={set.character.imageSrc}
              message={set.character.greeting}
              mood="happy"
              canSpeak={speechReady}
            />

            <Button size="full" onClick={handleStart}>
              謎ときをはじめる
            </Button>
          </div>
        </Card>
      )}

      {/* --- 問題（通常＋最終） --- */}
      {(phase === "playing" || phase === "final") && puzzle && (
        <>
          <DetectiveBubble
            name={set.character.name}
            imageSrc={set.character.imageSrc}
            mood={solved ? "happy" : "thinking"}
            message={solved ? puzzle.success : puzzle.intro}
            speech={solved ? (puzzle.successSpeech ?? puzzle.success) : puzzle.intro}
            canSpeak={speechReady}
          />

          <Card>
            <div className="space-y-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{puzzle.title}</h2>
                  <p className="text-xs text-slate-500">
                    {phase === "final"
                      ? "あつめたキーワードを つなげてみよう"
                      : `${puzzle.label} / 全${set.puzzles.length}問`}
                  </p>
                </div>
                {speechReady && (
                  <Button
                    variant="ghost"
                    size="sm"
                    // セリフは吹き出しのボタンで聞けるので、ここは問題文だけを読む
                    onClick={() => speak(puzzle.speech ?? puzzle.question)}
                    aria-label="問題を読み上げる"
                  >
                    🔊 問題をきく
                  </Button>
                )}
              </header>

              <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">
                {puzzle.question}
              </p>

              {puzzle.visual && <PuzzleVisual visual={puzzle.visual} />}

              {!solved && (
                <>
                  <div className="space-y-2">
                    <Input
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        if (emptyError) setEmptyError(false);
                      }}
                      onKeyDown={(e) => {
                        // 日本語変換の確定 Enter を送信と間違えないようにする
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSubmit();
                      }}
                      placeholder={puzzle.placeholder}
                      aria-label="答えを入力"
                      autoFocus
                    />
                    {emptyError && (
                      <p className="text-sm text-rose-600">答えを入力してね。</p>
                    )}
                    <Button size="full" onClick={handleSubmit}>
                      回答する
                    </Button>
                  </div>

                  {missCount > 0 && (
                    <Alert tone={nearMiss ? "info" : "error"}>
                      {nearMiss && puzzle.nearMiss
                        ? puzzle.nearMiss.message
                        : MISS_COMMENTS[(missCount - 1) % MISS_COMMENTS.length]}
                    </Alert>
                  )}

                  <HintPanel
                    hints={puzzle.hints}
                    level={hintLevel}
                    onUseHint={() => useHint(puzzle.id)}
                  />
                </>
              )}

              {solved && (
                <>
                  <Alert tone="success" heading="せいかい！">
                    {phase === "playing" && puzzle.keyword
                      ? `キーワード「${puzzle.keyword}」を手に入れた！`
                      : "3つの謎も、さいごの謎も 解ききった！"}
                  </Alert>
                  <Button variant="success" size="full" onClick={handleNext}>
                    {phase === "playing"
                      ? goesToFinal
                        ? "最終問題へ"
                        : "次の問題へ"
                      : "結果を見る"}
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <KeywordCollection keywords={keywords} />
          </Card>
        </>
      )}

      {/* --- 結果 --- */}
      {phase === "result" && (
        <ResultView onRestart={handleRestart} canSpeak={speechReady} />
      )}
    </div>
  );
}

function ResultView({
  onRestart,
  canSpeak,
}: {
  onRestart: () => void;
  canSpeak: boolean;
}) {
  const hintLevels = useGameStore((s) => s.hintLevels);
  const keywords = useGameStore((s) => s.keywords);
  const rating = calculateRating(hintLevels);

  return (
    <>
      <DetectiveBubble
        name={set.character.name}
        imageSrc={set.character.imageSrc}
        message={set.ending.message}
        mood="happy"
        speech={set.ending.speech}
        canSpeak={canSpeak}
      />

      <Card>
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest text-slate-400">謎ときクリア</p>
            <p className="mt-2 text-4xl" aria-label={`星 ${rating.stars} つ`}>
              <span className="text-amber-400">{"★".repeat(rating.stars)}</span>
              <span className="text-slate-200">{"★".repeat(3 - rating.stars)}</span>
            </p>
            <p className="mt-2 text-xl font-bold text-blue-600">{rating.title}</p>
            <p className="mt-1 text-sm text-slate-600">{rating.comment}</p>
          </div>

          <KeywordCollection keywords={keywords} />

          <div className="text-center">
            <p className="text-xs text-slate-500">3つのキーワードから みちびく答えは…</p>
            {/* 原稿の右下に描かれていた菊の花を、答えのところに添えている */}
            <div className="mt-2 flex items-center justify-center gap-3">
              <Chrysanthemum size={40} />
              <p className="text-3xl font-bold text-emerald-600">{set.final.answers[0]}</p>
              <Chrysanthemum size={40} />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold text-slate-500">なぜ「きく」？</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {set.ending.explanation}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <dt className="text-xs text-slate-500">つかったヒント</dt>
              <dd className="mt-0.5 text-lg font-bold text-slate-900">{rating.totalHints} 回</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <dt className="text-xs text-slate-500">といた問題</dt>
              <dd className="mt-0.5 text-lg font-bold text-slate-900">
                {set.puzzles.length + 1} 問
              </dd>
            </div>
          </dl>

          <Button variant="outline" size="full" onClick={onRestart}>
            もう一度あそぶ
          </Button>
        </div>
      </Card>
    </>
  );
}
