import type { Sun } from "./score";

export type SkyPhase = "night" | "dawn" | "day" | "golden" | "dusk";

/** מצב השמיים לפי השעה העשרונית וזמני השמש של היום. */
export function skyPhase(t: number, sun: Sun): SkyPhase {
  if (t < sun.sunrise - 1 || t > sun.sunset + 1) return "night";
  if (t < sun.sunrise + 0.75) return "dawn";
  if (t < sun.sunset - 1.25) return "day";
  return t < sun.sunset + 0.25 ? "golden" : "dusk";
}

export interface SunEvent {
  kind: "sunrise" | "sunset";
  /** בעוד כמה שעות. */
  inHours: number;
}

export function nextSunEvent(t: number, sun: Sun, tomorrow?: Sun): SunEvent | null {
  if (t < sun.sunrise) return { kind: "sunrise", inHours: sun.sunrise - t };
  if (t < sun.sunset) return { kind: "sunset", inHours: sun.sunset - t };
  return tomorrow ? { kind: "sunrise", inHours: 24 - t + tomorrow.sunrise } : null;
}

/** החלק של היום שעבר, בין זריחה לשקיעה. מחוץ ליום: null. */
export function dayProgress(t: number, sun: Sun): number | null {
  if (t < sun.sunrise || t > sun.sunset) return null;
  return (t - sun.sunrise) / (sun.sunset - sun.sunrise);
}
