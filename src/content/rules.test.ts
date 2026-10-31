import { describe, expect, it } from "vitest";
import { belowMinimum, findFish, seasonState } from "./rules";

describe("seasonState", () => {
  it("לפני", () => expect(seasonState("2026-04-30")).toBe("before"));
  it("יום ראשון", () => expect(seasonState("2026-05-01")).toBe("during"));
  it("יום אחרון", () => expect(seasonState("2026-06-30")).toBe("during"));
  it("אחרי", () => expect(seasonState("2026-07-01")).toBe("after"));
  it("שנה בלי הודעה: לא מנחשים", () => expect(seasonState("2027-05-10")).toBe("unknown"));
});

describe("findFish", () => {
  it("לפי שם עממי", () => expect(findFish("דניס")[0]?.minCm).toBe(15));
  it("לפי שם רשמי", () => expect(findFish("ספרוס זהוב")[0]?.name).toBe("דניס"));
  it("חיפוש ריק מחזיר הכל", () => expect(findFish(" ").length).toBeGreaterThan(30));
});

describe("belowMinimum", () => {
  it("דג קטן", () => expect(belowMinimum("דניס", 12)).toBe(15));
  it("דג בגודל מותר", () => expect(belowMinimum("דניס", 15)).toBeNull());
  it("דג לא מוכר", () => expect(belowMinimum("דג אחר", 1)).toBeNull());
});
