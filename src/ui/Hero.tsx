import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { dayProgress } from "../domain/sky";
import type { Sun } from "../domain/score";
import { formatHour } from "../domain/time";
import { SHARK } from "./Underwater";

const PHOTO = `${import.meta.env.BASE_URL}atlit-sunset.webp`;

function wavePath(amp: number, base: number, shift: number): string {
  let d = `M0 ${base}`;
  for (let x = 0; x <= 800; x += 10) {
    d += ` L${x} ${(base + Math.sin((x / 200) * 2 * Math.PI + shift) * amp).toFixed(1)}`;
  }
  return `${d} L800 90 L0 90 Z`;
}

/** גלים נעים. הגובה שלהם נגזר מגובה הגל האמיתי. */
function Waves({ height }: { height: number | null }) {
  const amp = Math.min(16, Math.max(4, (height ?? 0.4) * 12));
  return (
    <div class="waves" aria-hidden="true">
      <svg class="wave wave-back" viewBox="0 0 800 90" preserveAspectRatio="none"><path d={wavePath(amp, 42, 1.4)} /></svg>
      <svg class="wave wave-front" viewBox="0 0 800 90" preserveAspectRatio="none"><path d={wavePath(amp * 0.75, 58, 0)} /></svg>
    </div>
  );
}

const smooth = (p: number) => p * p * (3 - 2 * p);

/**
 * הצלילה. בדפדפן שתומך באנימציית גלילה (Chrome 115, Safari 26), הדפדפן מזיז הכל בעצמו בלי JavaScript בכל פריים.
 * בדפדפן ישן, הגלילה מניעה transform ו-opacity דרך requestAnimationFrame.
 */
function useDive() {
  const wrap = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const water = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLButtonElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const native = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");
    if (native) wrap.current?.classList.add("dive-css");
    let distance = 1;
    let queued = false;
    let covered: boolean | null = null;
    const paint = () => {
      queued = false;
      const p = Math.min(1, Math.max(0, window.scrollY / distance));
      // משנים את המחלקה רק כשהמצב מתחלף, לא בכל פריים.
      const nowCovered = p < 0.98;
      if (nowCovered !== covered) {
        covered = nowCovered;
        document.documentElement.classList.toggle("hero-active", nowCovered);
      }
      if (native) return;
      const e = smooth(p);
      if (photo.current) photo.current.style.transform = `translate3d(0,0,0) scale(${(1 + e * 0.9).toFixed(4)})`;
      if (sun.current) sun.current.style.opacity = String(Math.max(0, 1 - p * 3));
      if (content.current) {
        content.current.style.opacity = String(Math.max(0, 1 - p * 2.6));
        content.current.style.transform = `translate3d(0,${(-70 * p).toFixed(1)}px,0)`;
      }
      if (water.current) water.current.style.transform = `translate3d(0,${(66 - 84 * e).toFixed(2)}%,0)`;
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 7));
      if (top.current) {
        top.current.style.opacity = String(Math.max(0, 1 - p * 3.4));
        top.current.style.transform = `translate3d(0,${(-90 * p).toFixed(1)}px,0)`;
      }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };
    const measure = () => {
      const el = wrap.current;
      distance = el ? Math.max(1, el.offsetHeight - window.innerHeight) : 1;
      paint();
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.documentElement.classList.remove("hero-active");
    };
  }, []);

  return { wrap, photo, sun, content, water, hint, top };
}

export function Hero({ waveHeight, top: topContent, children }: { waveHeight: number | null; top?: ComponentChildren; children: ComponentChildren }) {
  const { wrap, photo, sun, content, water, hint, top } = useDive();
  const dive = () => {
    const el = wrap.current;
    if (el) window.scrollTo({ top: el.offsetHeight - window.innerHeight, behavior: "smooth" });
  };
  return (
    <div class="dive" ref={wrap}>
      <section class="hero">
        <img ref={photo} class="hero-photo" src={PHOTO} alt="שקיעה בחוף עתלית, עם המבצר והמזח" width="819" height="1456" fetchpriority="high" decoding="sync" />
        <div ref={sun} class="hero-sun" aria-hidden="true" />
        <div ref={water} class="dive-water" aria-hidden="true">
          <Waves height={waveHeight} />
          <div class="dive-fill">
            <svg class="dive-shark" viewBox="0 0 200 92"><path d={SHARK} /></svg>
            <i /><i /><i /><i /><i />
          </div>
        </div>
        {topContent && <div ref={top} class="hero-top">{topContent}</div>}
        <div ref={content} class="hero-content">{children}</div>
        <button ref={hint} type="button" class="dive-hint" onClick={dive} aria-label="צלילה אל התוכן">
          <span>גלול לצלילה</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </section>
    </div>
  );
}

/** קשת השמש של היום: איפה השמש עכשיו בין הזריחה לשקיעה. */
export function SunArc({ t, sun, next }: { t: number; sun: Sun; next: string | null }) {
  const W = 320;
  const p = dayProgress(t, sun);
  // בעברית היום זז מימין לשמאל.
  const bezier = (u: number) => {
    const x0 = W - 8, x1 = W / 2, x2 = 8, y0 = 46, y1 = -30, y2 = 46;
    const a = (1 - u) ** 2, b = 2 * (1 - u) * u, c = u ** 2;
    return [a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2] as const;
  };
  const at = p === null ? null : bezier(p);
  return (
    <div class="sun-arc">
      <svg viewBox={`0 0 ${W} 54`} preserveAspectRatio="none" aria-hidden="true">
        <path d={`M${W - 8} 46 Q${W / 2} -30 8 46`} fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.500" stroke-dasharray="3 5" />
        <line x1="0" x2={W} y1="46" y2="46" stroke="#fff" stroke-opacity=".35" />
        {at && (
          <>
            <circle class="sun-glow" cx={at[0]} cy={at[1]} r="14" fill="#ffb23e" opacity=".3" />
            <circle cx={at[0]} cy={at[1]} r="6.500" fill="#ffd36b" />
          </>
        )}
      </svg>
      <div class="sun-arc-labels small">
        <span>זריחה <b dir="ltr">{formatHour(sun.sunrise)}</b></span>
        {next && <span class="sun-next">{next}</span>}
        <span>שקיעה <b dir="ltr">{formatHour(sun.sunset)}</b></span>
      </div>
    </div>
  );
}
