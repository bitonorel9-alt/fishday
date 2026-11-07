/**
 * שלושת הסרטונים של היום: מה מופיע בכל אחד, מתי, והכיתוב לפוסט.
 * הנתונים מגיעים מאותה לוגיקה של האפליקציה, כך שהסרטון והאפליקציה תמיד מסכימים.
 */
import type { Image, SKRSContext2D } from "@napi-rs/canvas";
import type { Forecast } from "../../src/data/forecast";
import { FISH } from "../../src/content/fish";
import { FISH_PHOTOS } from "../../src/content/fishPhotos";
import { BREEDING_BANNED, BREEDING_SEASON, SEA_FISH, seasonState } from "../../src/content/rules";
import { TRIVIA } from "../../src/content/trivia";
import { hourAdvice } from "../../src/domain/advice";
import type { Beach } from "../../src/domain/beaches";
import { BEACHES } from "../../src/domain/beaches";
import type { ScoredForecast, ScoredHour } from "../../src/domain/insights";
import { nextWindow } from "../../src/domain/insights";
import { addDays, type LocalNow } from "../../src/domain/time";
import { TIER_LABEL, tierOf } from "../../src/ui/explain";
import { dayLabel, hourLabel, shortDate } from "../../src/ui/format";
import { background, brand, C, chipRow, clamp, cta, dani, easeInOut, enter, H, roundRect, text, W, waves, wrap } from "./draw";

export interface Assets {
  logo: Image;
  medal: (mood: "hello" | "recommend" | "great" | "warn" | "tip" | "night") => Image;
  photo: (id: string) => Image | null;
}

export interface Video {
  slug: string;
  title: string;
  seconds: number;
  caption: string;
  frame: (ctx: SKRSContext2D, t: number) => void;
}

const WEEKDAY = new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" });
const weekday = (date: string) => WEEKDAY.format(new Date(`${date}T12:00:00Z`));
const TAGS = "#דייג #דיגבחכה #דייגים #ישראל #FishDay";
const tag = (name: string) => `#${name.replace(/[\s–-]+/g, "")}`;

/** הציון הטוב ביותר של חוף בשעות האור ביום נתון. */
function bestDaylight(hours: ScoredHour[], date: string): ScoredHour | null {
  let best: ScoredHour | null = null;
  for (const h of hours) {
    if (h.date !== date || h.hour < 6 || h.hour > 18 || h.score === null) continue;
    if (!best || h.score > (best.score ?? 0)) best = h;
  }
  return best;
}

/** טבעת ציון: קשת זהב שמתמלאת, ומספר שעולה. */
function scoreRing(ctx: SKRSContext2D, score: number, cx: number, cy: number, t: number, start: number) {
  const p = easeInOut((t - start) / 1.4);
  const a = enter(t, start - 0.2, 0.4);
  const r = 170;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(63,186,182,0.22)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, "#f7e2a6");
  g.addColorStop(0.5, "#d9ad55");
  g.addColorStop(1, "#f1d58e");
  ctx.strokeStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (score / 10) * p);
  ctx.stroke();
  ctx.restore();
  text(ctx, (score * p).toFixed(1), cx, cy + 62, { size: 190, family: "Kar", color: C.goldLight, alpha: a });
}

// ---------- 1: החוף של היום ----------
export function beachOfDay(scored: ScoredForecast, now: LocalNow, a: Assets, forecast: Forecast): Video | null {
  const win = nextWindow(scored, now);
  if (!win) return null;
  const beach = win.beach;
  const hour = scored[beach.id]?.find((h) => h.date === win.date && h.hour === win.startHour);
  if (!hour) return null;
  const day = dayLabel(win.date, now);
  const sun = forecast.days.find((d) => d.date === win.date)?.sun ?? { sunrise: 6, sunset: 17 };
  const advice = hourAdvice(hour, beach, sun);
  const chips = [
    hour.waveHeight !== null ? `גלים ${hour.waveHeight.toFixed(1)} מ'` : null,
    hour.windSpeed !== null ? `רוח ${Math.round(hour.windSpeed)} קמ"ש` : null,
    hour.waterTemp !== null ? `מים ${Math.round(hour.waterTemp)}°` : null,
  ].filter((c): c is string => c !== null);
  const range = `מ-${hourLabel(win.startHour)} עד ${hourLabel(win.endHour)}`;

  return {
    slug: "beach",
    title: `החוף של היום: ${beach.name}`,
    seconds: 12,
    caption: [
      `🎣 החוף של ${day === "היום" ? "היום" : "מחר"}: ${beach.name}`,
      `ציון ${win.average.toFixed(1)} מתוך 10 · ${day} ${range}`,
      chips.join(" · "),
      `דני אומר: ${advice.text}`,
      "",
      "ציון לכל חוף, לכל שעה, מאכזיב עד זיקים. חינם באפליקציה, הקישור בביו.",
      `${TAGS} ${tag(beach.name)}`,
    ].join("\n"),
    frame(ctx, t) {
      background(ctx, t);
      waves(ctx, t);
      brand(ctx, a.logo, t);
      text(ctx, day === "היום" ? "איפה לדוג היום?" : `איפה לדוג ${day}?`, W / 2, 400 + (1 - enter(t, 0.3)) * 40, { size: 128, family: "Kar", alpha: enter(t, 0.3) });
      text(ctx, `${weekday(now.date)} · ${shortDate(now.date)}`, W / 2, 478, { size: 46, color: C.goldLight, alpha: enter(t, 0.6) });

      const b = enter(t, 1.3, 0.7);
      text(ctx, beach.name, W / 2, 690 + (1 - b) * 60, { size: 190, family: "Kar", alpha: b });
      text(ctx, beach.region, W / 2, 762, { size: 46, color: C.sand, alpha: enter(t, 1.7) });

      scoreRing(ctx, win.average, W / 2, 1010, t, 2.1);
      text(ctx, `${TIER_LABEL[tierOf(win.average)]} · ${day} ${range}`, W / 2, 1255, { size: 50, family: "PlexBold", color: C.goldLight, alpha: enter(t, 3.4) });

      chipRow(ctx, chips, 1365, t, 4.0);
      dani(ctx, a.medal(advice.mood), advice.text, 1455, t, 5.6);
      cta(ctx, t, 9.6);
    },
  };
}

// ---------- 2: התחזית למחר ----------
export function tomorrow(scored: ScoredForecast, now: LocalNow, a: Assets): Video | null {
  const date = addDays(now.date, 1);
  const rows = BEACHES.filter((b) => b.legal !== "reserve")
    .map((beach) => ({ beach, hour: bestDaylight(scored[beach.id] ?? [], date) }))
    .filter((r): r is { beach: Beach; hour: ScoredHour } => r.hour !== null)
    .sort((x, y) => (y.hour.score ?? 0) - (x.hour.score ?? 0))
    .slice(0, 5);
  if (!rows.length) return null;
  const warn = BEACHES.some((b) => (scored[b.id] ?? []).some((h) => h.date === date && h.warnings.length > 0));
  const top = rows[0]!;
  const line = warn
    ? "מחר יש אזהרה בחלק מהחופים. לא עולים על שוברי גלים, ובודקים לפני שיוצאים."
    : `מחר הייתי הולך ל${top.beach.name} ב-${hourLabel(top.hour.hour)}. תכין את החכה מהערב.`;

  return {
    slug: "tomorrow",
    title: "התחזית למחר",
    seconds: 12,
    caption: [
      `🌊 התחזית למחר, ${weekday(date)} ${shortDate(date)}`,
      ...rows.slice(0, 3).map((r, i) => `${i + 1}. ${r.beach.name}: ${(r.hour.score ?? 0).toFixed(1)} ב-${hourLabel(r.hour.hour)}`),
      warn ? "⚠️ יש אזהרת גלים או רוח בחלק מהחופים." : "",
      "",
      "התחזית המלאה לכל שעה באפליקציה. חינם, הקישור בביו.",
      `${TAGS} #תחזית`,
    ].filter((l, i, all) => l !== "" || all[i - 1] !== "").join("\n"),
    frame(ctx, t) {
      background(ctx, t);
      waves(ctx, t);
      brand(ctx, a.logo, t);
      text(ctx, "התחזית למחר", W / 2, 400 + (1 - enter(t, 0.3)) * 40, { size: 132, family: "Kar", alpha: enter(t, 0.3) });
      text(ctx, `${weekday(date)} · ${shortDate(date)} · החופים המובילים`, W / 2, 478, { size: 44, color: C.goldLight, alpha: enter(t, 0.6) });

      const max = 10, barX = 110, barW = W - 220;
      rows.forEach((r, i) => {
        const y = 600 + i * 150;
        const p = easeInOut((t - 1.2 - i * 0.35) / 1.1);
        const al = enter(t, 1.1 + i * 0.35, 0.4);
        const score = r.hour.score ?? 0;
        ctx.save();
        ctx.globalAlpha = al;
        roundRect(ctx, barX, y, barW, 112, 30);
        ctx.fillStyle = "rgba(6,38,44,0.7)";
        ctx.fill();
        // הפס מתמלא מימין לשמאל
        const fw = (barW * score / max) * p;
        roundRect(ctx, barX + barW - fw, y, fw, 112, 30);
        const g = ctx.createLinearGradient(barX + barW, 0, barX, 0);
        g.addColorStop(0, i === 0 ? "rgba(241,213,142,0.55)" : "rgba(63,186,182,0.45)");
        g.addColorStop(1, i === 0 ? "rgba(217,173,85,0.25)" : "rgba(63,186,182,0.15)");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
        text(ctx, `${i + 1}. ${r.beach.name}`, barX + barW - 34, y + 74, { size: 58, family: "Kar", align: "right", alpha: al });
        text(ctx, hourLabel(r.hour.hour), barX + 200, y + 72, { size: 40, color: C.sand, align: "center", alpha: al });
        text(ctx, (score * clamp(p)).toFixed(1), barX + 70, y + 76, { size: 62, family: "Kar", color: C.goldLight, alpha: al });
      });

      dani(ctx, a.medal(warn ? "warn" : "recommend"), line, 1390, t, 4.6);
      cta(ctx, t, 9.6);
    },
  };
}

// ---------- 3: מתחלף ----------
function dayOfYear(date: string): number {
  const d = new Date(`${date}T12:00:00Z`);
  return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000);
}

function fishVideo(n: number, a: Assets): Video {
  const withPhoto = FISH.filter((f) => FISH_PHOTOS[f.id]);
  const fish = withPhoto[n % withPhoto.length]!;
  const photo = a.photo(fish.id);
  const credit = FISH_PHOTOS[fish.id]!;
  const fact = fish.facts[n % fish.facts.length] ?? fish.facts[0]!;
  const min = fish.minCm ? `גודל מינימום: ${fish.minCm} ס"מ` : null;
  return {
    slug: "fish",
    title: `דג של היום: ${fish.name}`,
    seconds: 12,
    caption: [
      `🐟 הדג של היום: ${fish.name} (${fish.formal})`,
      fact,
      `פיתיון: ${fish.bait}`,
      min ?? "",
      `צילום: ${credit.author}, ${credit.license}`,
      "",
      "מדריך דגים, זיהוי דגים ויומן שלל באפליקציה. חינם, הקישור בביו.",
      `${TAGS} ${tag(fish.name)}`,
    ].filter(Boolean).join("\n"),
    frame(ctx, t) {
      background(ctx, t);
      waves(ctx, t);
      brand(ctx, a.logo, t);
      text(ctx, "הדג של היום", W / 2, 400 + (1 - enter(t, 0.3)) * 40, { size: 128, family: "Kar", alpha: enter(t, 0.3) });
      const pa = enter(t, 0.9, 0.8);
      if (photo) {
        const pw = 900, ph = Math.round((pw * photo.height) / photo.width);
        const zoom = 1 + 0.06 * clamp(t / 12);
        ctx.save();
        ctx.globalAlpha = pa;
        roundRect(ctx, (W - pw) / 2, 470, pw, Math.min(ph, 600), 40);
        ctx.clip();
        ctx.drawImage(photo, (W - pw * zoom) / 2, 470 - (ph * zoom - ph) / 2, pw * zoom, ph * zoom);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = pa;
        roundRect(ctx, (W - pw) / 2, 470, pw, Math.min(ph, 600), 40);
        ctx.strokeStyle = "rgba(241,213,142,0.5)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        text(ctx, `צילום: ${credit.author}, ${credit.license}`, W / 2, 470 + Math.min(ph, 600) + 40, { size: 26, color: "rgba(244,239,227,0.6)", alpha: pa });
      }
      const na = enter(t, 1.8, 0.6);
      text(ctx, fish.name, W / 2, 1210 + (1 - na) * 40, { size: 160, family: "Kar", color: C.goldLight, alpha: na });
      text(ctx, fish.formal, W / 2, 1275, { size: 44, color: C.sand, alpha: enter(t, 2.2) });
      chipRow(ctx, [fish.size, ...(min ? [min] : [])], 1370, t, 2.8);
      dani(ctx, a.medal("tip"), fact, 1460, t, 4.4);
      cta(ctx, t, 9.6);
    },
  };
}

function triviaVideo(n: number, a: Assets): Video {
  const q = TRIVIA[n % TRIVIA.length]!;
  // התשובה במקום קבוע לפי היום, כדי שלא תהיה תמיד ראשונה
  const options = [...q.wrong.slice(0, 2)];
  const pos = n % 3;
  options.splice(pos, 0, q.answer);
  return {
    slug: "trivia",
    title: "שאלת דייגים",
    seconds: 13,
    caption: [
      `❓ שאלת דייגים: ${q.question}`,
      options.map((o, i) => `${i + 1}. ${o}`).join("\n"),
      "",
      "כתבו בתגובות את התשובה שלכם 👇 התשובה בסוף הסרטון.",
      "עוד 10 שאלות במשחק באפליקציה. חינם, הקישור בביו.",
      `${TAGS} #טריוויה`,
    ].join("\n"),
    frame(ctx, t) {
      background(ctx, t);
      waves(ctx, t);
      brand(ctx, a.logo, t);
      text(ctx, "שאלת דייגים", W / 2, 400 + (1 - enter(t, 0.3)) * 40, { size: 128, family: "Kar", alpha: enter(t, 0.3) });
      const qa = enter(t, 0.9, 0.7);
      wrap(ctx, q.question, 64, "PlexBold", 900).forEach((l, i) => text(ctx, l, W / 2, 560 + i * 84, { size: 64, family: "PlexBold", alpha: qa }));

      const reveal = t >= 8.2;
      options.forEach((o, i) => {
        const y = 830 + i * 150;
        const al = enter(t, 1.8 + i * 0.3, 0.5);
        const right = i === pos;
        ctx.save();
        ctx.globalAlpha = al * (reveal && !right ? 0.35 : 1);
        roundRect(ctx, 110, y, W - 220, 116, 36);
        ctx.fillStyle = reveal && right ? "rgba(217,173,85,0.85)" : "rgba(6,38,44,0.8)";
        ctx.fill();
        ctx.strokeStyle = "rgba(241,213,142,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        text(ctx, `${i + 1}. ${o}`, W - 150, y + 76, { size: 50, align: "right", color: reveal && right ? "#2a1d05" : C.ivory, alpha: al * (reveal && !right ? 0.35 : 1) });
      });

      // ספירה לאחור לפני התשובה
      if (t >= 4.6 && t < 8.2) {
        const left = Math.ceil(8.2 - t);
        text(ctx, String(left), W / 2, 1420, { size: 170, family: "Kar", color: C.goldLight, alpha: 1 - ((8.2 - t) % 1) * 0.5 });
      }
      if (reveal) dani(ctx, a.medal("great"), q.explain, 1300, t, 8.4);
      cta(ctx, t, 11);
    },
  };
}

function ruleVideo(now: LocalNow, n: number, a: Assets): Video {
  const state = seasonState(now.date);
  const dm = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}`;
  const seasonOn = state === "during" || state === "before";
  const picks = [...SEA_FISH].sort((x, y) => x.name.localeCompare(y.name, "he"));
  const list = seasonOn ? BREEDING_BANNED.slice(0, 5) : Array.from({ length: 5 }, (_, i) => picks[(n * 5 + i) % picks.length]!).map((f) => `${f.name}: ${f.minCm} ס"מ`);
  const title = seasonOn ? `תקופת רבייה: ${dm(BREEDING_SEASON.start)}–${dm(BREEDING_SEASON.end)}` : "גודל מינימום";
  const line = seasonOn ? "בתקופת הרבייה המינים האלה חוזרים למים. ככה יהיו דגים גם בשנה הבאה." : "דג קטן מהמינימום חוזר למים מיד. מודדים מקצה הפה עד קצה הזנב.";
  return {
    slug: "rule",
    title: `מה מותר: ${title}`,
    seconds: 12,
    caption: [
      `📏 מה מותר? ${title}`,
      ...list.map((l) => `• ${l}`),
      "",
      line,
      "לפי משרד החקלאות. הרשימה המלאה והמקורות באפליקציה, חינם. הקישור בביו.",
      `${TAGS} #חוקידיג`,
    ].join("\n"),
    frame(ctx, t) {
      background(ctx, t);
      waves(ctx, t);
      brand(ctx, a.logo, t);
      text(ctx, "מה מותר?", W / 2, 400 + (1 - enter(t, 0.3)) * 40, { size: 132, family: "Kar", alpha: enter(t, 0.3) });
      text(ctx, title, W / 2, 490, { size: 54, family: "PlexBold", color: C.goldLight, alpha: enter(t, 0.7) });
      list.forEach((l, i) => {
        const y = 600 + i * 132;
        const al = enter(t, 1.3 + i * 0.3, 0.5);
        ctx.save();
        ctx.globalAlpha = al;
        roundRect(ctx, 110, y + (1 - al) * 20, W - 220, 104, 32);
        ctx.fillStyle = "rgba(6,38,44,0.8)";
        ctx.fill();
        ctx.restore();
        text(ctx, l, W - 150, y + 68 + (1 - al) * 20, { size: 48, align: "right", alpha: al });
      });
      dani(ctx, a.medal(seasonOn ? "warn" : "tip"), line, 1300, t, 4.4);
      cta(ctx, t, 9.6);
    },
  };
}

/** הסרטון השלישי מתחלף כל יום: דג, טריוויה, חוק. */
export function rotating(now: LocalNow, a: Assets): Video {
  const n = dayOfYear(now.date);
  const kind = n % 3;
  if (kind === 0) return fishVideo(Math.floor(n / 3), a);
  if (kind === 1) return triviaVideo(Math.floor(n / 3), a);
  return ruleVideo(now, Math.floor(n / 3), a);
}

export { H };
