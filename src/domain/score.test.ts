import { describe, expect, it } from "vitest";
import { BEACHES, type Beach } from "./beaches";
import {
  angleDiff,
  bestBeach,
  effectiveWave,
  isOffshore,
  isOnshore,
  periodAdjustment,
  scoreHour,
  timeScore,
  waveScore,
  windScore,
  type HourConditions,
} from "./score";

const beach = (id: string): Beach => BEACHES.find((b) => b.id === id)!;
const dado = beach("dado");
const batGalim = beach("bat-galim");
const sun = { sunrise: 6, sunset: 17 };
const calm: HourConditions = { hour: 6, waveHeight: 0.8, wavePeriod: 6, waveDirection: 280, windSpeed: 8, windGust: 15, windDirection: 90 };

describe("angleDiff", () => {
  it("עובר דרך הצפון", () => expect(angleDiff(350, 10)).toBe(20));
  it("סימטרי", () => expect(angleDiff(90, 270)).toBe(180));
});

describe("waveScore", () => {
  it.each([[0.1, 5], [0.3, 8], [0.7, 10], [1.0, 10], [1.2, 7], [1.7, 4], [2.5, 1]])("%f מ' = %i", (h, s) => {
    expect(waveScore(h)).toBe(s);
  });
});

describe("periodAdjustment", () => {
  it("גל רוח קצר מוריד", () => expect(periodAdjustment(3)).toBe(-0.5));
  it("גל ארוך מעלה", () => expect(periodAdjustment(8)).toBe(0.5));
  it("גל רגיל לא משנה", () => expect(periodAdjustment(5)).toBe(0));
});

describe("effectiveWave", () => {
  it("גל ישר לחוף חשוף נשאר כמו שהוא", () => expect(effectiveWave(1, 270, dado)).toBeCloseTo(1));
  it("יבשה חוסמת גל דרום-מערבי במפרץ", () => {
    const bay = beach("kiryat-haim");
    expect(effectiveWave(1, 240, bay)).toBeLessThan(effectiveWave(1, 300, bay) / 2);
  });
  it("אותו גל קטן יותר בחוף שפונה לכיוון אחר", () => {
    expect(effectiveWave(1, 230, batGalim)).toBeLessThan(effectiveWave(1, 230, dado));
  });
  it("גל מאחורי החוף לא מתאפס", () => expect(effectiveWave(1, 100, dado)).toBeCloseTo(0.3));
});

describe("רוח לפי כיוון החוף", () => {
  it("רוח צפונית היא רוח מהים בבת גלים, לא בדדו", () => {
    expect(isOnshore(0, batGalim)).toBe(true);
    expect(isOnshore(0, dado)).toBe(false);
  });
  it("רוח מזרחית היא רוח מהיבשה בדדו", () => expect(isOffshore(90, dado)).toBe(true));
  it("רוח מהים מעל 15 מורידה 1.5", () => expect(windScore(18, 280, dado)).toBe(6.5));
  it("רוח מהיבשה חלשה מוסיפה חצי, עד תקרה", () => expect(windScore(14, 90, dado)).toBe(8.5));
  it("רוח של 15 בדיוק מהים לא נענשת", () => expect(windScore(15, 280, dado)).toBe(8));
});

describe("timeScore", () => {
  it("זריחה", () => expect(timeScore(6, sun)).toBe(10));
  it("קרוב לזריחה", () => expect(timeScore(8, sun)).toBe(8));
  it("אמצע היום", () => expect(timeScore(12, sun)).toBe(4));
  it("לילה", () => expect(timeScore(23, sun)).toBe(5));
});

describe("scoreHour", () => {
  it("תנאים טובים נותנים ציון גבוה", () => {
    expect(scoreHour(calm, sun, dado).score).toBeGreaterThanOrEqual(9);
  });
  it.each(["waveHeight", "waveDirection", "windSpeed", "windDirection"] as const)("%s חסר: אין ציון", (key) => {
    expect(scoreHour({ ...calm, [key]: null }, sun, dado).score).toBeNull();
  });
  it("מחזור גל חסר לא מבטל ציון", () => {
    expect(scoreHour({ ...calm, wavePeriod: null }, sun, dado).score).not.toBeNull();
  });
  it("גלים מעל 2 מ' מוגבלים לציון 2", () => {
    expect(scoreHour({ ...calm, waveHeight: 2.2 }, sun, dado).score).toBeLessThanOrEqual(2);
  });
  it("חוף מוגן לא בורח מתקרת הסכנה", () => {
    expect(scoreHour({ ...calm, waveHeight: 2.2 }, sun, batGalim).score).toBeLessThanOrEqual(2);
  });
  it("משבים מעל 40 מורידים 1.5", () => {
    const a = scoreHour(calm, sun, dado).score!;
    const b = scoreHour({ ...calm, windGust: 45 }, sun, dado).score!;
    expect(a - b).toBeCloseTo(1.5);
  });
  it("אזהרת גלים לפי הים הפתוח, גם בחוף מוגן", () => {
    const r = scoreHour({ ...calm, waveHeight: 1.9, waveDirection: 230 }, sun, batGalim);
    expect(r.effectiveWave!).toBeLessThan(1.8);
    expect(r.warnings).toContainEqual({ kind: "waves" });
  });
  it("אזהרה נשארת גם בלי ציון", () => {
    const r = scoreHour({ ...calm, windSpeed: null, windGust: 50 }, sun, dado);
    expect(r.score).toBeNull();
    expect(r.warnings).toContainEqual({ kind: "gusts" });
  });
  it("אותו ים נותן ציון שונה בחופים שונים", () => {
    const sw = { ...calm, waveHeight: 1.3, waveDirection: 230 };
    expect(scoreHour(sw, sun, batGalim).score).not.toBe(scoreHour(sw, sun, dado).score);
  });
});

describe("bestBeach", () => {
  it("שמורה לא נבחרת גם עם הציון הכי גבוה", () => {
    const r = bestBeach([
      { beach: beach("dor-habonim"), score: 10 },
      { beach: dado, score: 7 },
    ]);
    expect(r?.beach.id).toBe("dado");
  });
  it("שעה בלי נתונים לא נבחרת", () => {
    expect(bestBeach([{ beach: dado, score: null }])).toBeNull();
  });
});
