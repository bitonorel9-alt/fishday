export type Trait = "vertical-bars" | "tail-spot" | "gold-head" | "slim" | "long-stripes" | "gold-lines" | "scutes" | "puffy" | "feathery";

export const TRAITS: { id: Trait; label: string }[] = [
  { id: "vertical-bars", label: "פסים אנכיים" },
  { id: "tail-spot", label: "כתם שחור לפני הזנב" },
  { id: "gold-head", label: "פס זהב בין העיניים" },
  { id: "slim", label: "גוף ארוך ודק" },
  { id: "long-stripes", label: "פסים לאורך הגוף" },
  { id: "gold-lines", label: "קווים צהובים דקים" },
  { id: "scutes", label: "לוחיות קשות לפני הזנב" },
  { id: "puffy", label: "בטן לבנה שמתנפחת" },
  { id: "feathery", label: "סנפירים כמו נוצות" },
];

export interface FishId {
  identify: string[];
  lookalike?: string;
  traits: Trait[];
}

/** סימני זיהוי מ-FishBase, ויקיפדיה ו-IUCN. */
export const FISH_ID: Record<string, FishId> = {
  sillago: {
    identify: ["גוף ארוך ודק בצבע חול בהיר.", "ראש מחודד ופה קטן.", "חי ממש על החול, והצבע שלו מתמזג איתו."],
    traits: ["slim"],
  },
  siganus: {
    identify: ["גב אפור-ירקרק עד חום, ובטן בהירה.", "קווים צהובים דקים בחצי התחתון של הגוף.", "זנב מפוצל ופה קטן."],
    lookalike: "דומה לסיכן כהה, אבל לזה יש זנב ישר כמעט וצבע אחיד.",
    traits: ["gold-lines"],
  },
  sargus: {
    identify: ["כסוף, עם פסים כהים אנכיים.", "כתם שחור בולט ממש לפני הזנב.", "לזנב יש שוליים שחורים."],
    lookalike: "למרמיר יש פסים דומים, אבל בלי כתם שחור לפני הזנב.",
    traits: ["vertical-bars", "tail-spot"],
  },
  bori: {
    identify: ["גב ירוק-זית, צדדים כסופים ובטן לבנה.", "6–7 פסים אופקיים לאורך הגוף.", "שפתיים דקות ואין קו צד נראה לעין."],
    traits: ["long-stripes"],
  },
  mormyrus: {
    identify: ["כסוף, עם כ-14 פסים אנכיים כהים ודקים.", "גוף עמוק בינוני וראש מעט מקומר.", "אין כתם שחור לפני הזנב."],
    lookalike: "לסרגוס יש כתם שחור לפני הזנב.",
    traits: ["vertical-bars"],
  },
  denis: {
    identify: ["פס זהב בין העיניים. מכאן השם.", "כתם כהה גדול מאחורי העין.", "גב כחול-אפור וצדדים כסופים."],
    traits: ["gold-head"],
  },
  caranx: {
    identify: ["גב כחול-ירקרק עד זית, וצד כסוף-פליז.", "שורה של לוחיות קשות לאורך הגוף לפני הזנב.", "כתם כהה על מכסה הזימים, לפעמים לא ברור."],
    traits: ["scutes"],
  },
  palamida: {
    identify: ["גוף ארוך כמו טורפדו.", "עשרות קווים אנכיים דקים על הצדדים.", "גב כחול עז ובטן כסופה."],
    traits: ["slim", "vertical-bars"],
  },
  puffer: {
    identify: ["פס כסוף לאורך הצד.", "גב אפור-חום עם כתמים כהים, ובטן לבנה.", "מתנפח כשמוציאים אותו מהמים."],
    traits: ["puffy"],
  },
  lionfish: {
    identify: ["פסים אנכיים דקים על הראש והגוף.", "סנפיר גב עם קוצים ארוכים.", "סנפירי חזה רחבים כמו מניפות."],
    traits: ["feathery", "vertical-bars"],
  },
};

export interface IdMatch {
  id: string;
  hits: number;
}

/** מדרג דגים לפי הסימנים שנבחרו. */
export function identifyFish(selected: Trait[], ids: Record<string, FishId> = FISH_ID): IdMatch[] {
  if (!selected.length) return [];
  return Object.entries(ids)
    .map(([id, info]) => ({ id, hits: selected.filter((t) => info.traits.includes(t)).length }))
    .filter((m) => m.hits > 0)
    .sort((a, b) => b.hits - a.hits);
}
