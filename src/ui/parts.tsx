import type { ComponentChildren } from "preact";
import type { Beach } from "../domain/beaches";
import type { ScoredHour } from "../domain/insights";
import { hourAt } from "../domain/insights";
import type { LocalNow } from "../domain/time";
import { tierOf, TIER_LABEL } from "./explain";

const ICONS = {
  home: "M12 4v2M5.6 7.6 7 9M18.4 7.6 17 9M7.5 14a4.5 4.5 0 0 1 9 0M3 14h18M3 18c2 0 2-1.4 4.5-1.4S10 18 12 18s2-1.4 4.5-1.4S19 18 21 18",
  beaches: "M3 15c2 0 2-1.6 4.5-1.6S10 15 12 15s2-1.6 4.5-1.6S19 15 21 15M3 19.5c2 0 2-1.6 4.5-1.6s2.500 1.6 4.500 1.6 2-1.600 4.500-1.600 2.500 1.600 4.500 1.600M12 4v7m0-7 5 4.500h-5",
  rules: "M12 3 5 6v5.500c0 4.300 2.900 7.600 7 9.500 4.100-1.900 7-5.200 7-9.500V6zM9 12l2.200 2.200L15.500 10",
  fish: "M4.500 12c2.500-3.500 5.500-5 9-5 2 0 4 .9 6 2.500V14.500c-2 1.600-4 2.500-6 2.500-3.500 0-6.500-1.500-9-5ZM2.500 8.500 4.500 12l-2 3.500M15.500 11h.01",
  log: "M6 3h12v18H6zM9.500 8h5M9.500 12h5M9.500 16h3",
} as const;

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** הלוגו: שמש שוקעת שחתוכה בגלים, וקרס שיורד ממנה אל הים. */
export function Logo() {
  return (
    <svg class="logo-mark" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
      <defs>
        <linearGradient id="logo-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd36b" />
          <stop offset=".55" stop-color="#ff8a3c" />
          <stop offset="1" stop-color="#f2545b" />
        </linearGradient>
        <mask id="logo-cut">
          <rect width="48" height="48" fill="#fff" />
          <path d="M0 27c4 0 4-2.200 8-2.200s4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200" fill="none" stroke="#000" stroke-width="2.400" />
          <path d="M0 34c4 0 4-2.200 8-2.200s4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200" fill="none" stroke="#000" stroke-width="3" />
          <path d="M0 40.500c4 0 4-2.200 8-2.200s4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200 4-2.200 8-2.200 4 2.200 8 2.200" fill="none" stroke="#000" stroke-width="3.600" />
          <path d="M24 9v12.500c0 6 7.500 6 7.500 0" fill="none" stroke="#000" stroke-width="3.200" stroke-linecap="round" />
        </mask>
      </defs>
      <circle cx="24" cy="24" r="21" fill="url(#logo-sun)" mask="url(#logo-cut)" />
    </svg>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  const tier = tierOf(score);
  return (
    <span class="badge" data-tier={tier} aria-label={score === null ? TIER_LABEL.none : `ציון ${score} מתוך 10, ${TIER_LABEL[tier]}`}>
      {score === null ? "–" : score.toFixed(1)}
    </span>
  );
}

export function Star({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" class="star" aria-pressed={on} aria-label={`${on ? "הסרה מהמועדפים" : "הוספה למועדפים"}: ${label}`} onClick={onToggle}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill={on ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
        <path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.900-5.200-2.800-5.200 2.800 1-5.900L3.500 9.700l5.900-.8z" />
      </svg>
    </button>
  );
}

export function LegalTag({ beach }: { beach: Beach }) {
  if (beach.legal === "reserve") return <span class="tag tag-alert">שמורה</span>;
  return beach.legal === "near" ? <span class="tag">ליד שמורה</span> : null;
}

function smoothPath(points: [number, number][]): string {
  const first = points[0];
  if (!first) return "";
  let d = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i]!;
    const [nx, ny] = points[i + 1]!;
    d += ` Q${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  const last = points[points.length - 1]!;
  return `${d} L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

/** הטווח של העקומה: נצמד לציוני היום, כדי שההבדלים בין השעות ייראו. */
function scoreRange(hours: ScoredHour[]): [number, number] {
  const scores = hours.flatMap((h) => (h.score === null ? [] : [h.score]));
  if (!scores.length) return [1, 10];
  const max = Math.max(...scores);
  return [Math.min(Math.min(...scores), max - 3), max];
}

function scoreY(score: number | null, [min, max]: [number, number], top: number, height: number): number {
  return top + height * (1 - ((score ?? min) - min) / (max - min || 1));
}

/** עקומה קטנה של 12 השעות הבאות. בעברית הזמן זז מימין לשמאל. */
function MiniCurve({ hours, now }: { hours: ScoredHour[]; now: LocalNow }) {
  const current = hourAt(hours, now);
  const start = current ? hours.indexOf(current) : -1;
  if (start < 0) return null;
  const next = hours.slice(start, start + 12);
  const W = 76;
  const range = scoreRange(next);
  const points = next.map((h, i): [number, number] => [W - 2 - (i * (W - 4)) / (next.length - 1 || 1), scoreY(h.score, range, 3, 24)]);
  return (
    <svg class="mini-curve" viewBox={`0 0 ${W} 30`} width={W} height="30" aria-hidden="true">
      <path d={smoothPath(points)} fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" />
      {points[0] && <circle cx={points[0][0]} cy={points[0][1]} r="3" fill="currentColor" />}
    </svg>
  );
}

export function BeachRow({ beach, hours, now, favorite, onToggle }: { beach: Beach; hours: ScoredHour[]; now: LocalNow; favorite: boolean; onToggle: () => void }) {
  const current = hourAt(hours, now);
  return (
    <li class="beach-row">
      <a href={`#/beach/${beach.id}`}>
        <ScoreBadge score={current?.score ?? null} />
        <span class="beach-row-text">
          <span class="beach-name">{beach.name}</span>
          <span class="muted small">{beach.area} <LegalTag beach={beach} /></span>
        </span>
        <MiniCurve hours={hours} now={now} />
      </a>
      <Star on={favorite} label={beach.name} onToggle={onToggle} />
    </li>
  );
}

/** עקומת ציון ל-24 שעות, בצבעי השמיים של אותו יום. */
export function ScoreCurve({ hours, selected, sunrise, sunset, onSelect, labelOf }: {
  hours: ScoredHour[];
  selected: string | null;
  sunrise: number;
  sunset: number;
  onSelect: (time: string) => void;
  labelOf: (h: ScoredHour) => { hour: string; aria: string };
}) {
  const STEP = 44;
  const H = 118;
  const W = hours.length * STEP;
  const x = (i: number) => W - STEP / 2 - i * STEP;
  const range = scoreRange(hours);
  const points = hours.map((h, i): [number, number] => [x(i), scoreY(h.score, range, 16, H - 44)]);
  const line = smoothPath(points);
  const firstX = points[0]?.[0] ?? 0;
  const lastX = points[points.length - 1]?.[0] ?? 0;
  const pct = (hour: number) => `${Math.min(100, Math.max(0, (hour / 24) * 100)).toFixed(1)}%`;
  const picked = hours.findIndex((h) => h.time === selected);
  const dot = points[picked];

  return (
    <div class="curve" style={{ width: `${W}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <defs>
          <linearGradient id="curve-sky" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stop-color="#6d7fd1" />
            <stop offset={pct(sunrise - 1)} stop-color="#6d7fd1" />
            <stop offset={pct(sunrise)} stop-color="#f2545b" />
            <stop offset={pct(sunrise + 1.5)} stop-color="#ffb23e" />
            <stop offset={pct((sunrise + sunset) / 2)} stop-color="#2fc4b2" />
            <stop offset={pct(sunset - 1.5)} stop-color="#ffb23e" />
            <stop offset={pct(sunset)} stop-color="#ff6a3c" />
            <stop offset={pct(sunset + 1)} stop-color="#6d7fd1" />
            <stop offset="1" stop-color="#6d7fd1" />
          </linearGradient>
        </defs>
        <path d={`${line} L${lastX} ${H} L${firstX} ${H} Z`} fill="url(#curve-sky)" opacity=".2" />
        <path d={line} fill="none" stroke="url(#curve-sky)" stroke-width="3.500" stroke-linecap="round" />
        {dot && (
          <>
            <line x1={dot[0]} x2={dot[0]} y1={dot[1]} y2={H} stroke="currentColor" stroke-dasharray="2 4" opacity=".5" />
            <circle cx={dot[0]} cy={dot[1]} r="11" fill="#ffb23e" opacity=".25" />
            <circle cx={dot[0]} cy={dot[1]} r="5.500" fill="#ffb23e" />
          </>
        )}
      </svg>
      <div class="curve-hits">
        {hours.map((h) => {
          const label = labelOf(h);
          return (
            <button type="button" key={h.time} aria-pressed={h.time === selected} aria-label={label.aria} onClick={() => onSelect(h.time)}>
              <small dir="ltr">{label.hour}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Attribution() {
  return (
    <p class="muted small attribution">
      נתוני ים ומזג אוויר: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0). הדיוק ליד החוף מוגבל, והנתונים לא מיועדים לניווט.
    </p>
  );
}

export function Page({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <>
      <h1 class="page-title">{title}</h1>
      {children}
    </>
  );
}
