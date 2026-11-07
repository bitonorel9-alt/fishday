/** @jsxRuntime automatic */
/** @jsxImportSource preact */
/**
 * מכונת הסרטונים היומית: מושכת את התחזית, מציירת 3 סרטונים אנכיים ומקודדת ל-MP4.
 * הרצה: npx tsx scripts/social/render.tsx [תיקיית יעד] [--only=beach|tomorrow|rotating] [--frame=שניות]
 * הפלט: social/<n>-<slug>.mp4 ו-social/today.json עם כותרות וכיתובים.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import { render } from "preact-render-to-string";
import { fetchForecast } from "../../src/data/forecast";
import type { Mood } from "../../src/domain/advice";
import { scoreForecast } from "../../src/domain/insights";
import { israelNow } from "../../src/domain/time";
import { Mascot } from "../../src/ui/Mascot";
import { Logo } from "../../src/ui/parts";
import { FPS, H, W } from "./draw";
import { beachOfDay, rotating, tomorrow, type Assets, type Video } from "./videos";

const require = createRequire(import.meta.url);
const FFMPEG: string = require("ffmpeg-static");
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const args = process.argv.slice(2);
const outDir = resolve(args.find((a) => !a.startsWith("--")) ?? join(root, "dist", "social"));
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const still = args.find((a) => a.startsWith("--frame="))?.slice(8);

async function svgImage(svg: string): Promise<Image> {
  return loadImage(Buffer.from(svg));
}

async function loadAssets(): Promise<Assets> {
  const logo = await svgImage(render(<Logo size={300} />).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
  const moods: Mood[] = ["hello", "recommend", "great", "warn", "tip", "night"];
  const medals = new Map<Mood, Image>();
  for (const m of moods) medals.set(m, await svgImage(render(<Mascot mood={m} size={400} />).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')));
  const photos = new Map<string, Image | null>();
  const fs = await import("node:fs");
  for (const f of fs.readdirSync(join(root, "public", "fish"))) {
    if (f.endsWith(".webp")) photos.set(f.replace(".webp", ""), await loadImage(readFileSync(join(root, "public", "fish", f))).catch(() => null));
  }
  return { logo, medal: (m) => medals.get(m)!, photo: (id) => photos.get(id) ?? null };
}

/** מצייר כל פריים ומזרים אותו ל-ffmpeg, עם קול גלים שנכנס ויוצא בהדרגה. */
function encode(video: Video, file: string): Promise<void> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const frames = Math.round(video.seconds * FPS);
  const ff = spawn(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-ss", "2", "-t", String(video.seconds), "-i", join(root, "public", "sound", "waves.m4a"),
    "-filter:a", `volume=0.6,afade=t=in:d=0.8,afade=t=out:st=${video.seconds - 1.2}:d=1.2`,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart",
    file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  return new Promise((done, fail) => {
    ff.on("error", fail);
    ff.on("close", (code) => (code === 0 ? done() : fail(new Error(`ffmpeg ${code}`))));
    let i = 0;
    const pump = () => {
      while (i < frames) {
        video.frame(ctx, i / FPS);
        const ok = ff.stdin.write(Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer));
        i++;
        if (!ok) return void ff.stdin.once("drain", pump);
      }
      ff.stdin.end();
    };
    pump();
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const nowDate = new Date();
  const now = israelNow(nowDate);
  const forecast = await fetchForecast();
  const scored = scoreForecast(forecast);
  const assets = await loadAssets();

  const all: (Video | null)[] = [beachOfDay(scored, now, assets, forecast), tomorrow(scored, now, assets), rotating(now, assets)];
  const keys = ["beach", "tomorrow", "rotating"];
  const videos = all.map((v, i) => ({ v, key: keys[i]! })).filter((x): x is { v: Video; key: string } => x.v !== null && (!only || x.key === only));

  if (still !== undefined) {
    // תמונה אחת לבדיקת עיצוב, בלי לקודד סרטון
    for (const { v } of videos) {
      const canvas = createCanvas(W, H);
      v.frame(canvas.getContext("2d"), Number(still));
      writeFileSync(join(outDir, `${v.slug}-${still}s.png`), canvas.toBuffer("image/png"));
    }
    return;
  }

  const manifest = { date: now.date, createdAt: nowDate.toISOString(), videos: [] as { file: string; title: string; caption: string; seconds: number }[] };
  for (const [i, { v }] of videos.entries()) {
    const file = `${i + 1}-${v.slug}.mp4`;
    const started = Date.now();
    await encode(v, join(outDir, file));
    console.log(`${file}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
    manifest.videos.push({ file, title: v.title, caption: v.caption, seconds: v.seconds });
  }
  writeFileSync(join(outDir, "today.json"), JSON.stringify(manifest, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
