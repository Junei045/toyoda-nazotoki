import { describe, it, expect } from "vitest";
import { checkAnswer, normalizeAnswer, DEFAULT_CHECK_OPTIONS } from "./answer-checker";
import { toyodaPuzzleSet } from "@/data/puzzles";

describe("normalizeAnswer", () => {
  it("前後の空白を落とす", () => {
    expect(normalizeAnswer("  とけい  ")).toBe("とけい");
  });

  it("カタカナをひらがなに揃える", () => {
    expect(normalizeAnswer("トケイ")).toBe("とけい");
  });

  it("半角カナを扱える", () => {
    expect(normalizeAnswer("ﾄｹｲ")).toBe("とけい");
  });

  it("全角英数を半角にする", () => {
    expect(normalizeAnswer("ＡＢＣ１２３")).toBe("abc123");
  });

  it("長音記号は残す（とうきょう と とーきょー を混同しないため）", () => {
    expect(normalizeAnswer("コーヒー")).toBe("こーひー");
  });
});

describe("checkAnswer", () => {
  it("表記ゆれを吸収して正解にする", () => {
    const answers = ["とけい", "時計"];
    for (const input of ["とけい", "トケイ", " 時計 ", "と けい", "ﾄｹｲ"]) {
      expect(checkAnswer(input, answers)).toBe(true);
    }
  });

  it("違う答えは不正解のまま", () => {
    expect(checkAnswer("ときい", ["とけい"])).toBe(false);
    expect(checkAnswer("とけいだい", ["とけい"])).toBe(false);
  });

  it("空文字は常に不正解", () => {
    expect(checkAnswer("", ["とけい"])).toBe(false);
    expect(checkAnswer("   ", ["とけい"])).toBe(false);
    expect(checkAnswer("", ["とけい"], { ...DEFAULT_CHECK_OPTIONS, mode: "partial" })).toBe(false);
  });

  it("partial モードでは部分一致で正解になる", () => {
    const options = { ...DEFAULT_CHECK_OPTIONS, mode: "partial" as const };
    expect(checkAnswer("こたえはとけいです", ["とけい"], options)).toBe(true);
    expect(checkAnswer("こたえはとけいです", ["とけい"])).toBe(false);
  });
});

describe("問題データの整合性", () => {
  const all = [...toyodaPuzzleSet.puzzles, toyodaPuzzleSet.final];

  it("キーワードは自分の問題の正解として通る", () => {
    for (const puzzle of toyodaPuzzleSet.puzzles) {
      expect(checkAnswer(puzzle.keyword!, puzzle.answers)).toBe(true);
    }
  });

  it("ヒントは全問3段階ある", () => {
    for (const puzzle of all) {
      expect(puzzle.hints).toHaveLength(3);
    }
  });

  it("問題 ID が重複していない", () => {
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("正解候補が空の問題はない", () => {
    for (const puzzle of all) {
      expect(puzzle.answers.length).toBeGreaterThan(0);
    }
  });

  it("実際の答えが表記ゆれでも通る", () => {
    expect(checkAnswer("サカエク", toyodaPuzzleSet.puzzles[0].answers)).toBe(true);
    expect(checkAnswer(" 栄区 ", toyodaPuzzleSet.puzzles[0].answers)).toBe(true);
    expect(checkAnswer("アキ", toyodaPuzzleSet.puzzles[1].answers)).toBe(true);
    expect(checkAnswer("ハナ", toyodaPuzzleSet.puzzles[2].answers)).toBe(true);
    expect(checkAnswer("キク", toyodaPuzzleSet.final.answers)).toBe(true);
    expect(checkAnswer("菊", toyodaPuzzleSet.final.answers)).toBe(true);
  });
});

describe("PDF 原稿との突きあわせ", () => {
  const [q1, q2, q3] = toyodaPuzzleSet.puzzles;

  it("第1問：矢印がさす位置に隠れたカタカナを並べると正解になる", () => {
    // 花の上=サ、加の左=カ、功の左=エ、久の左上=ク
    expect(checkAnswer("サカエク", q1.answers)).toBe(true);
    expect(q1.visual).toMatchObject({ kind: "kanji-arrows", chars: ["花", "加", "功", "久"] });
  });

  it("第1問：太陽（実際は答えの菊）は問題の図から外してある", () => {
    expect(q1.visual && "suns" in q1.visual).toBe(false);
  });

  it("第2問：め・が・ね・ば を消すと たかはしあき が残る", () => {
    const grid = (q2.visual as { rows: string[] }).rows.join("");
    const remaining = Array.from(grid)
      .filter((ch) => !["め", "が", "ね", "ば"].includes(ch))
      .join("");
    expect(remaining).toBe("たかはしあき");
    // そこから季節の2文字だけが正解
    expect(checkAnswer(remaining, q2.answers)).toBe(false);
    expect(checkAnswer("あき", q2.answers)).toBe(true);
  });

  it("第2問：途中までの答えは nearMiss として拾う", () => {
    expect(checkAnswer("たかはしあき", q2.nearMiss!.answers)).toBe(true);
  });

  it("第3問：よこはま の3文字め と なぞ の1文字め で はな になる", () => {
    const items = (q3.visual as { items: { word: string; frac: string }[] }).items;
    const picked = items
      .map(({ word, frac }) => {
        const [numerator, denominator] = frac.split("/").map(Number);
        if (!numerator) return "";
        // 分母は文字数、分子は何文字めかを表す
        if (denominator) expect(word.length).toBe(denominator);
        return word[numerator - 1];
      })
      .join("");
    expect(picked).toBe("はな");
    expect(checkAnswer(picked, q3.answers)).toBe(true);
  });
});

describe("読み上げ・ネタバレ防止", () => {
  const all = [...toyodaPuzzleSet.puzzles, toyodaPuzzleSet.final];

  it("読み上げ文に、読みまちがえやすい漢字を残していない", () => {
    // 読みが割れる語は、読み上げでまちがった方を選ばれることがある。
    // 「表」は「ひょう」ではなく「おもて」と読まれた実例がある。
    const risky = ["表", "下", "角", "方"];
    for (const puzzle of all) {
      const spoken = [puzzle.speech, puzzle.successSpeech].filter(Boolean).join("");
      for (const word of risky) {
        expect(spoken.includes(word), `${puzzle.id} の読み上げに「${word}」が残っている`).toBe(false);
      }
    }
  });

  it("最終問題の正解メッセージが答えを先に明かしていない", () => {
    const { final, ending } = toyodaPuzzleSet;
    for (const answer of final.answers) {
      expect(final.success.includes(answer)).toBe(false);
      expect((final.successSpeech ?? "").includes(answer)).toBe(false);
    }
    // 答えは結果画面でだけ明かす
    expect(ending.message).toContain("きく");
    expect(ending.explanation.length).toBeGreaterThan(0);
  });

  it("3つのキーワードすべてが答えの解説に出てくる", () => {
    for (const puzzle of toyodaPuzzleSet.puzzles) {
      expect(toyodaPuzzleSet.ending.explanation).toContain(puzzle.keyword!);
    }
  });
});
