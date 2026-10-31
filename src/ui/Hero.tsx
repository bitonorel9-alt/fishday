import type { ComponentChildren } from "preact";
import { dayProgress } from "../domain/sky";
import type { Sun } from "../domain/score";
import { formatHour } from "../domain/time";

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

export function Hero({ waveHeight, children }: { waveHeight: number | null; children: ComponentChildren }) {
  return (
    <section class="hero">
      <img class="hero-photo" src={PHOTO} alt="שקיעה בחוף עתלית, עם המבצר והמזח" width="819" height="1456" fetchpriority="high" decoding="async" />
      <div class="hero-sun" aria-hidden="true" />
      <div class="hero-content">{children}</div>
      <Waves height={waveHeight} />
    </section>
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
