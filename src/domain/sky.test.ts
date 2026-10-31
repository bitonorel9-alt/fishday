import { describe, expect, it } from "vitest";
import { dayProgress, nextSunEvent, skyPhase } from "./sky";

const sun = { sunrise: 6, sunset: 17 };

describe("skyPhase", () => {
  it.each([
    [3, "night"],
    [5.5, "dawn"],
    [12, "day"],
    [16.5, "golden"],
    [17.5, "dusk"],
    [20, "night"],
  ])("%f = %s", (t, phase) => expect(skyPhase(t, sun)).toBe(phase));
});

describe("nextSunEvent", () => {
  it("לפני הזריחה", () => expect(nextSunEvent(4, sun)).toEqual({ kind: "sunrise", inHours: 2 }));
  it("אחרי הזריחה", () => expect(nextSunEvent(15, sun)).toEqual({ kind: "sunset", inHours: 2 }));
  it("בלילה: הזריחה של מחר", () => expect(nextSunEvent(22, sun, sun)).toEqual({ kind: "sunrise", inHours: 8 }));
  it("בלי נתוני מחר", () => expect(nextSunEvent(22, sun)).toBeNull());
});

describe("dayProgress", () => {
  it("אמצע היום", () => expect(dayProgress(11.5, sun)).toBeCloseTo(0.5));
  it("בלילה אין התקדמות", () => expect(dayProgress(20, sun)).toBeNull());
});
