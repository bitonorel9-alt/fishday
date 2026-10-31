import { describe, expect, it } from "vitest";
import { FISH } from "../content/fish";
import { fishForBeach, isPeakMonth, logShares, matchPercent } from "./fishMatch";

const fish = (id: string) => FISH.find((f) => f.id === id)!;

describe("matchPercent", () => {
  it("סרגוס מתאים יותר לסלע מלחול", () => {
    expect(matchPercent(fish("sargus"), "rock", 11)).toBeGreaterThan(matchPercent(fish("sargus"), "sand", 11));
  });
  it("סילגו מתאים יותר לחול", () => {
    expect(matchPercent(fish("sillago"), "sand", 11)).toBeGreaterThan(matchPercent(fish("sillago"), "rock", 11));
  });
  it("העונה משפיעה", () => {
    expect(matchPercent(fish("sargus"), "rock", 11)).toBeGreaterThan(matchPercent(fish("sargus"), "rock", 7));
  });
  it("תמיד בין 0 ל-100", () => {
    for (const f of FISH) for (const b of ["rock", "sand", "mixed"] as const) {
      const m = matchPercent(f, b, 1);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(100);
    }
  });
});

describe("isPeakMonth", () => {
  it("נובמבר", () => expect(isPeakMonth(11)).toBe(true));
  it("פברואר", () => expect(isPeakMonth(2)).toBe(true));
  it("יולי", () => expect(isPeakMonth(7)).toBe(false));
});

describe("fishForBeach", () => {
  it("ממוין מהגבוה לנמוך", () => {
    const r = fishForBeach(FISH, "rock", 11);
    expect(r[0]!.match).toBeGreaterThanOrEqual(r[1]!.match);
  });
  it("בחוף סלעי מוביל דג סלע", () => expect(fishForBeach(FISH, "rock", 11)[0]!.fish.id).toMatch(/sargus|siganus/));
  it("בחוף חולי מוביל סילגו", () => expect(fishForBeach(FISH, "sand", 11)[0]!.fish.id).toBe("sillago"));
  it("דג רעיל לא מומלץ", () => {
    expect(fishForBeach(FISH, "rock", 11, 20).some((x) => x.fish.id === "puffer")).toBe(false);
  });
});

describe("logShares", () => {
  const log = [
    { beachId: "atlit", fish: "סרגוס" },
    { beachId: "atlit", fish: "סרגוס" },
    { beachId: "atlit", fish: "דניס" },
    { beachId: "dado", fish: "בורי" },
  ];
  it("אחוזים רק מאותו חוף", () => {
    expect(logShares(log, "atlit")).toEqual([
      { fish: "סרגוס", count: 2, percent: 67 },
      { fish: "דניס", count: 1, percent: 33 },
    ]);
  });
  it("חוף בלי שלל", () => expect(logShares(log, "neve-yam")).toEqual([]));
});
