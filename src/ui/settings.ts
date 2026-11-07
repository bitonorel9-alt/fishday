import { useCallback, useEffect, useState } from "preact/hooks";
import { readJson, writeJson } from "../data/storage";

export type ThemeChoice = "system" | "light" | "dark";
export type TextSize = "normal" | "large" | "xlarge";
export type WindUnit = "kmh" | "knots";

export interface Settings {
  theme: ThemeChoice;
  textSize: TextSize;
  seaScene: boolean;
  windUnit: WindUnit;
  homeBeach: string | null;
  oceanSound: boolean;
  clickSounds: boolean;
  tapFish: boolean;
  volume: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  textSize: "normal",
  seaScene: true,
  windUnit: "kmh",
  homeBeach: null,
  oceanSound: false,
  clickSounds: true,
  tapFish: true,
  volume: 0.6,
};

const KEY = "fishday.settings.v2";
const OLD_KEY = "fishday.settings.v1";

/** בגרסה 1 ברירת המחדל הייתה "אוטומטי". מי שלא בחר בהיר עובר לכהה, ושאר ההגדרות נשמרות. */
export function loadSettings(): Settings {
  const saved = readJson<Partial<Settings>>(KEY);
  if (saved) return { ...DEFAULT_SETTINGS, ...saved };
  const old = readJson<Partial<Settings>>(OLD_KEY);
  if (old?.theme === "system") delete old.theme;
  return { ...DEFAULT_SETTINGS, ...old };
}

function apply(s: Settings) {
  const root = document.documentElement;
  if (s.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.text = s.textSize;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  useEffect(() => apply(settings), [settings]);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      writeJson(KEY, next);
      return next;
    });
  }, []);
  return { settings, update };
}

const KMH_PER_KNOT = 1.852;

export function windValue(kmh: number, unit: WindUnit): number {
  return Math.round(unit === "knots" ? kmh / KMH_PER_KNOT : kmh);
}

export const windLabel = (unit: WindUnit) => (unit === "knots" ? "קשר" : 'קמ"ש');
