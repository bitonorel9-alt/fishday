import { FISH } from "../content/fish";
import { FISH_ID } from "../content/fishId";
import { FISH_PHOTOS } from "../content/fishPhotos";
import { SEA_FISH } from "../content/rules";
import { TRIVIA } from "../content/trivia";

export type QuestionKind = "photo" | "size" | "trait" | "trivia";
export type GameMode = "mixed" | "photos";

export interface Question {
  kind: QuestionKind;
  prompt: string;
  photo?: string;
  options: string[];
  answer: string;
  explain: string;
  link: string;
}

export const ROUND_LENGTH = 10;

export type Rng = () => number;

/** מחולל אקראי עם seed, כדי שאפשר יהיה לבדוק סבבים. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const pick = <T>(items: T[], n: number, rng: Rng) => shuffle(items, rng).slice(0, n);

function withOptions(answer: string, pool: string[], rng: Rng): string[] {
  const wrong = pick([...new Set(pool.filter((p) => p !== answer))], 3, rng);
  return shuffle([answer, ...wrong], rng);
}

function photoQuestions(rng: Rng): Question[] {
  const names = FISH.map((f) => f.name);
  return FISH.filter((f) => FISH_PHOTOS[f.id]).map((f) => ({
    kind: "photo",
    prompt: "איזה דג זה?",
    photo: FISH_PHOTOS[f.id]!.file,
    options: withOptions(f.name, names, rng),
    answer: f.name,
    explain: FISH_ID[f.id]?.identify[0] ?? "",
    link: `#/fish/${f.id}`,
  }));
}

function sizeQuestions(rng: Rng): Question[] {
  const sizes = [...new Set(SEA_FISH.map((f) => `${f.minCm} ס"מ`))];
  // רוב הדגים בטבלה הם 11 ס"מ. דג אחד לכל גודל, כדי שהתשובה לא תהיה צפויה.
  const bySize = new Map<number, (typeof SEA_FISH)[number]>();
  for (const f of shuffle(SEA_FISH, rng)) if (!bySize.has(f.minCm)) bySize.set(f.minCm, f);
  return [...bySize.values()].map((f) => {
    const answer = `${f.minCm} ס"מ`;
    return {
      kind: "size",
      prompt: `מה גודל המינימום של ${f.name}${f.name === f.formal ? "" : ` (${f.formal})`}?`,
      options: withOptions(answer, sizes, rng),
      answer,
      explain: "דג קטן מהמינימום מחזירים למים מיד.",
      link: "#/rules",
    };
  });
}

function traitQuestions(rng: Rng): Question[] {
  const names = FISH.map((f) => f.name);
  return FISH.flatMap((f) => {
    const id = FISH_ID[f.id];
    const clue = id?.identify.find((t) => !t.includes("השם"));
    if (!clue) return [];
    return [{
      kind: "trait",
      prompt: `לאיזה דג מתאים הסימן: "${clue}"`,
      options: withOptions(f.name, names, rng),
      answer: f.name,
      explain: id?.lookalike ?? "בדף הדג יש עוד סימני זיהוי.",
      link: `#/fish/${f.id}`,
    } satisfies Question];
  });
}

function triviaQuestions(rng: Rng): Question[] {
  return TRIVIA.map((t) => ({
    kind: "trivia",
    prompt: t.question,
    options: shuffle([t.answer, ...t.wrong], rng),
    answer: t.answer,
    explain: t.explain,
    link: t.link,
  }));
}

const MIX: Record<GameMode, [QuestionKind, number][]> = {
  mixed: [["photo", 4], ["trivia", 3], ["size", 2], ["trait", 1]],
  photos: [["photo", 7], ["trait", 3]],
};

export function buildRound(mode: GameMode, rng: Rng): Question[] {
  const pools: Record<QuestionKind, Question[]> = {
    photo: photoQuestions(rng),
    size: sizeQuestions(rng),
    trait: traitQuestions(rng),
    trivia: triviaQuestions(rng),
  };
  const chosen = MIX[mode].flatMap(([kind, n]) => pick(pools[kind], n, rng));
  return shuffle(chosen, rng).slice(0, ROUND_LENGTH);
}

/** 10 נקודות לתשובה, ובונוס על רצף. */
export function pointsFor(correct: boolean, streak: number): number {
  return correct ? 10 + Math.min(streak - 1, 4) * 5 : 0;
}

export function rankFor(correct: number): string {
  if (correct >= 10) return "מלך הים";
  if (correct >= 8) return "רב-חובל";
  if (correct >= 5) return "דייג ותיק";
  return "דייג מתחיל";
}
