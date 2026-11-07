/**
 * כלי ציור לסרטוני הסושיאל: רקע ים, דגי זהב, בועות, גלים, טקסט עברי ואנימציות.
 * כל פונקציה מקבלת את הזמן בשניות, כך שכל פריים מצויר מאפס.
 */
import { createRequire } from "node:module";
import { GlobalFonts, Path2D, type SKRSContext2D } from "@napi-rs/canvas";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  ivory: "#f4efe3",
  sand: "#e9dcbc",
  gold: "#e6c36f",
  goldLight: "#f1d58e",
  teal: "#3fbab6",
  deep: "#062a30",
  ink: "#04191d",
};

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => require.resolve(`@fontsource/${pkg}/files/${file}`);
GlobalFonts.registerFromPath(font("ibm-plex-sans-hebrew", "ibm-plex-sans-hebrew-hebrew-400-normal.woff2"), "PlexHe");
GlobalFonts.registerFromPath(font("ibm-plex-sans-hebrew", "ibm-plex-sans-hebrew-latin-400-normal.woff2"), "PlexLa");
GlobalFonts.registerFromPath(font("ibm-plex-sans-hebrew", "ibm-plex-sans-hebrew-hebrew-600-normal.woff2"), "PlexBoldHe");
GlobalFonts.registerFromPath(font("ibm-plex-sans-hebrew", "ibm-plex-sans-hebrew-latin-600-normal.woff2"), "PlexBoldLa");
GlobalFonts.registerFromPath(font("karantina", "karantina-hebrew-700-normal.woff2"), "KarHe");
GlobalFonts.registerFromPath(font("karantina", "karantina-latin-700-normal.woff2"), "KarLa");
GlobalFonts.registerFromPath(font("cormorant-garamond", "cormorant-garamond-latin-600-italic.woff2"), "Corm");

const FAMILY = {
  Plex: "PlexHe, PlexLa",
  PlexBold: "PlexBoldHe, PlexBoldLa",
  Kar: "KarHe, KarLa, PlexBoldLa",
  Corm: "Corm, PlexHe",
} as const;
export const fontOf = (family: keyof typeof FAMILY, size: number, italic = false) => `${italic ? "italic " : ""}${size}px ${FAMILY[family]}`;

// ---- זמן ותנועה ----
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const easeOut = (p: number) => 1 - (1 - clamp(p)) ** 3;
export const easeInOut = (p: number) => { const x = clamp(p); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
/** התקדמות של אנימציה שמתחילה ב-start ונמשכת dur שניות. */
export const enter = (t: number, start: number, dur = 0.6) => easeOut((t - start) / dur);

// ---- רקע ----
const rand = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const BUBBLES = Array.from({ length: 22 }, (_, i) => ({ x: rand(i) * W, r: 5 + rand(i + 50) * 12, speed: 60 + rand(i + 99) * 90, off: rand(i + 7) * H }));
const FISH_PATH = new Path2D("M140 6C128-40 74-78 4-76C-50-74-92-50-112-22L-150-58C-144-30-140-14-134 2C-140 18-144 34-150 62L-112 28C-90 56-46 76 6 74C70 72 122 46 140 6Z");
const GILL_PATH = new Path2D("M78-52C92-20 92 22 78 52");
const SWIMMERS = [
  { y: 0.2, s: 0.55, speed: 70, dir: -1, a: 0.16, off: 0 },
  { y: 0.36, s: 0.3, speed: 110, dir: 1, a: 0.22, off: 500 },
  { y: 0.62, s: 0.8, speed: 50, dir: -1, a: 0.1, off: 300 },
  { y: 0.78, s: 0.4, speed: 90, dir: 1, a: 0.18, off: 900 },
];

/** דג זהב בקו, כמו בלוגו. dir=-1 פונה שמאלה. */
export function goldFish(ctx: SKRSContext2D, x: number, y: number, s: number, dir: number, alpha: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * -dir, s);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(FISH_PATH);
  ctx.stroke(GILL_PATH);
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(104, -22, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function background(ctx: SKRSContext2D, t: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.15, 40, W / 2, H * 0.35, H * 0.95);
  g.addColorStop(0, "#155f67");
  g.addColorStop(0.5, "#08333a");
  g.addColorStop(1, C.ink);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // קרני אור מלמעלה, נעות לאט
  ctx.save();
  ctx.translate(W / 2, -120);
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22 + Math.sin(t * 0.3 + i) * 0.03;
    ctx.rotate(0);
    ctx.save();
    ctx.rotate(a);
    const lg = ctx.createLinearGradient(0, 0, 0, H * 0.9);
    lg.addColorStop(0, "rgba(241,213,142,0.05)");
    lg.addColorStop(1, "rgba(241,213,142,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(70, H * 0.9);
    ctx.lineTo(-70, H * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  for (const f of SWIMMERS) {
    const span = W + 500;
    const p = ((t * f.speed + f.off) % span) - 250;
    const x = f.dir < 0 ? W - p : p;
    goldFish(ctx, x, H * f.y + Math.sin(t * 1.3 + f.off) * 12, f.s, f.dir, f.a);
  }

  ctx.strokeStyle = "rgba(241,213,142,0.32)";
  ctx.lineWidth = 2.5;
  for (const b of BUBBLES) {
    const y = H + 40 - ((t * b.speed + b.off) % (H + 80));
    ctx.beginPath();
    ctx.arc(b.x + Math.sin(t * 2 + b.off) * 8, y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** גלים בתחתית המסך. */
export function waves(ctx: SKRSContext2D, t: number, top = H - 210) {
  const layers = [
    { amp: 22, len: 360, speed: 60, color: "rgba(63,186,182,0.35)", dy: 0 },
    { amp: 16, len: 280, speed: -90, color: "rgba(6,42,48,0.92)", dy: 40 },
  ];
  for (const l of layers) {
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, top + l.dy + Math.sin((x + t * l.speed) / l.len * Math.PI * 2) * l.amp);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
}

// ---- טקסט ----
export interface TextStyle {
  size: number;
  family?: "Kar" | "Plex" | "PlexBold" | "Corm";
  color?: string;
  align?: CanvasTextAlign;
  alpha?: number;
  italic?: boolean;
}

export function text(ctx: SKRSContext2D, str: string, x: number, y: number, s: TextStyle) {
  ctx.save();
  ctx.globalAlpha = s.alpha ?? 1;
  ctx.direction = "rtl";
  ctx.textAlign = s.align ?? "center";
  ctx.fillStyle = s.color ?? C.ivory;
  const family = s.family ?? "Plex";
  ctx.font = fontOf(family, s.size, s.italic);
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** שבירת שורות לפי רוחב, בלי לשבור מילים. */
export function wrap(ctx: SKRSContext2D, str: string, size: number, family: keyof typeof FAMILY, maxWidth: number): string[] {
  ctx.font = fontOf(family, size);
  const lines: string[] = [];
  let line = "";
  for (const word of str.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** גלולה עם טקסט, כמו התגיות באפליקציה. */
export function chip(ctx: SKRSContext2D, label: string, cx: number, cy: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = fontOf("Plex", 44);
  const w = ctx.measureText(label).width + 64;
  roundRect(ctx, cx - w / 2, cy - 42, w, 84, 42);
  ctx.fillStyle = "rgba(6,38,44,0.75)";
  ctx.fill();
  ctx.strokeStyle = "rgba(241,213,142,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, label, cx, cy + 15, { size: 44, alpha });
}

/** שורה של גלולות, ממורכזת. */
export function chipRow(ctx: SKRSContext2D, labels: string[], cy: number, t: number, start: number) {
  ctx.font = fontOf("Plex", 44);
  const widths = labels.map((l) => ctx.measureText(l).width + 64);
  const gap = 22;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  // מימין לשמאל, כמו בעברית
  let x = W / 2 + total / 2;
  labels.forEach((l, i) => {
    const a = enter(t, start + i * 0.18, 0.5);
    chip(ctx, l, x - widths[i]! / 2, cy + (1 - a) * 30, a);
    x -= widths[i]! + gap;
  });
}

/** כותרת המותג: סמל הזהב והשם. */
export function brand(ctx: SKRSContext2D, logo: import("@napi-rs/canvas").Image, t: number, y = 150) {
  const a = enter(t, 0, 0.7);
  ctx.save();
  ctx.globalAlpha = a;
  const lw = 150, lh = 118;
  ctx.font = fontOf("Corm", 96, true);
  const word = ctx.measureText("FishDay").width;
  const total = lw + 14 + word;
  const x0 = W / 2 - total / 2;
  ctx.drawImage(logo, x0, y - lh / 2 - 10, lw, lh);
  const g = ctx.createLinearGradient(x0 + lw, 0, x0 + total, 0);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.42, "#ffffff");
  g.addColorStop(0.43, "#f1d58e");
  g.addColorStop(1, "#d9ad55");
  ctx.fillStyle = g;
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText("FishDay", x0 + lw + 14, y + 30);
  ctx.restore();
}

/** דני: מדליון ובועת דיבור. */
export function dani(ctx: SKRSContext2D, medal: import("@napi-rs/canvas").Image, line: string, y: number, t: number, start: number) {
  const a = enter(t, start, 0.6);
  if (a <= 0) return;
  const size = 190;
  const pop = 0.7 + 0.3 * a;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W - 70 - size / 2, y + size / 2);
  ctx.scale(pop, pop);
  ctx.drawImage(medal, -size / 2, -size / 2, size, size);
  ctx.restore();

  const lines = wrap(ctx, line, 42, "Plex", 640);
  const bw = 720, bh = 74 + lines.length * 56;
  const bx = W - 70 - size - 24 - bw, by = y + size / 2 - bh / 2;
  ctx.save();
  ctx.globalAlpha = a;
  roundRect(ctx, bx, by, bw, bh, 32);
  ctx.fillStyle = "rgba(241,213,142,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(241,213,142,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, "דני", bx + bw - 34, by + 52, { size: 40, family: "Corm", italic: true, color: C.goldLight, align: "right", alpha: a });
  // הטקסט מופיע מילה אחרי מילה, כאילו הוא מדבר
  const words = line.split(/\s+/).length;
  const shown = Math.floor(clamp((t - start - 0.3) / 2.2) * words);
  let count = 0;
  lines.forEach((l, i) => {
    const parts = l.split(/\s+/);
    const visible = parts.slice(0, Math.max(0, shown - count)).join(" ");
    count += parts.length;
    if (visible) text(ctx, visible, bx + bw - 34, by + 108 + i * 56, { size: 42, align: "right", alpha: a });
  });
}

/** סיום: קריאה לפעולה. */
export function cta(ctx: SKRSContext2D, t: number, start: number) {
  const a = enter(t, start, 0.6);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  roundRect(ctx, W / 2 - 330, H - 300 + (1 - a) * 40, 660, 110, 55);
  const g = ctx.createLinearGradient(W / 2 - 330, 0, W / 2 + 330, 0);
  g.addColorStop(0, "#f7e2a6");
  g.addColorStop(0.55, "#d9ad55");
  g.addColorStop(1, "#c4943f");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  text(ctx, "חינם באפליקציה · הקישור בביו", W / 2, H - 228 + (1 - a) * 40, { size: 46, family: "PlexBold", color: "#2a1d05", alpha: a });
}
