import { describe, expect, it } from "vitest";
import { TRIVIA } from "../content/trivia";
import { buildRound, pointsFor, rankFor, ROUND_LENGTH, seededRng, shuffle } from "./game";

describe("buildRound", () => {
  for (const mode of ["mixed", "photos"] as const) {
    for (const seed of [1, 7, 42, 999, 2026]) {
      it(`${mode}, seed ${seed}: סבב תקין`, () => {
        const round = buildRound(mode, seededRng(seed));
        expect(round).toHaveLength(ROUND_LENGTH);
        for (const q of round) {
          expect(q.options).toHaveLength(4);
          expect(new Set(q.options).size).toBe(4);
          expect(q.options).toContain(q.answer);
          expect(q.prompt.length).toBeGreaterThan(5);
        }
        expect(new Set(round.map((q) => q.prompt + (q.photo ?? ""))).size).toBe(ROUND_LENGTH);
      });
    }
  }

  it("סבב משולב כולל את כל סוגי השאלות", () => {
    const kinds = new Set(buildRound("mixed", seededRng(3)).map((q) => q.kind));
    expect([...kinds].sort()).toEqual(["photo", "size", "trait", "trivia"]);
  });

  it("לשאלת תמונה יש תמונה", () => {
    for (const q of buildRound("photos", seededRng(5))) if (q.kind === "photo") expect(q.photo).toMatch(/^fish\//);
  });

  it("התשובה לא תמיד באותו מקום", () => {
    const places = new Set(buildRound("mixed", seededRng(11)).map((q) => q.options.indexOf(q.answer)));
    expect(places.size).toBeGreaterThan(1);
  });

  it("אותו seed נותן אותו סבב", () => {
    expect(buildRound("mixed", seededRng(8))).toEqual(buildRound("mixed", seededRng(8)));
  });
});

describe("טריוויה", () => {
  it.each(TRIVIA.map((t) => [t.question, t] as const))("%s: תשובות שונות זו מזו", (_, t) => {
    expect(new Set([t.answer, ...t.wrong]).size).toBe(4);
    expect(t.link.startsWith("#/")).toBe(true);
  });
});

describe("ניקוד", () => {
  it("תשובה ראשונה", () => expect(pointsFor(true, 1)).toBe(10));
  it("רצף מוסיף", () => expect(pointsFor(true, 3)).toBe(20));
  it("הבונוס מוגבל", () => expect(pointsFor(true, 20)).toBe(30));
  it("טעות לא מקבלת", () => expect(pointsFor(false, 5)).toBe(0));
  it("דרגות", () => {
    expect(rankFor(10)).toBe("מלך הים");
    expect(rankFor(8)).toBe("רב-חובל");
    expect(rankFor(5)).toBe("דייג ותיק");
    expect(rankFor(2)).toBe("דייג מתחיל");
  });
});

describe("shuffle", () => {
  it("שומר על כל הפריטים", () => expect(shuffle([1, 2, 3, 4, 5], seededRng(1)).sort()).toEqual([1, 2, 3, 4, 5]));
});

describe("שאלות גודל", () => {
  it("בסבב אין שתי שאלות גודל עם אותה תשובה", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const sizes = buildRound("mixed", seededRng(seed)).filter((q) => q.kind === "size").map((q) => q.answer);
      expect(new Set(sizes).size).toBe(sizes.length);
    }
  });
});
