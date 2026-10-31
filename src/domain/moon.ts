const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

const NAMES = ["מולד", "סהר מתמלא", "חצי ירח עולה", "ירח כמעט מלא", "ירח מלא", "ירח מתמעט", "חצי ירח יורד", "סהר מתמעט"];

export interface MoonPhase {
  /** 0 = מולד, 0.5 = מלא. */
  phase: number;
  illumination: number;
  name: string;
}

export function moonPhase(at: Date): MoonPhase {
  const days = (at.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const phase = (((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS) / SYNODIC_DAYS;
  const name = NAMES[Math.round(phase * 8) % 8] ?? "";
  return { phase, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2, name };
}
