import type { ComponentChildren } from "preact";
import type { Beach } from "../domain/beaches";
import type { ScoredHour } from "../domain/insights";
import { hourAt } from "../domain/insights";
import type { LocalNow } from "../domain/time";
import { tierOf, TIER_LABEL } from "./explain";

const ICONS = {
  home: "M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z",
  beaches: "M3 16c2 0 2-1.6 4.5-1.6S10 16 12 16s2-1.6 4.5-1.6S19 16 21 16M3 20c2 0 2-1.6 4.5-1.6S10 20 12 20s2-1.6 4.5-1.6S19 20 21 20M12 3v8m0-8 5 5h-5",
  rules: "M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6zM9 12l2.2 2.2L15.5 10",
  log: "M6 3h12v18H6zM9.5 8h5M9.5 12h5M9.5 16h3",
} as const;

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function ScoreBadge({ score, big = false }: { score: number | null; big?: boolean }) {
  const tier = tierOf(score);
  return (
    <span class={`badge${big ? " badge-big" : ""}`} data-tier={tier} aria-label={score === null ? TIER_LABEL.none : `ציון ${score} מתוך 10, ${TIER_LABEL[tier]}`}>
      {score === null ? "–" : score.toFixed(1)}
    </span>
  );
}

/** קו מים: הגובה שלו משקף את גובה הגל האמיתי. */
export function WaveLine({ height }: { height: number | null }) {
  const amp = Math.min(20, Math.max(3, (height ?? 0.3) * 16));
  const path = (shift: number, a: number, base: number) => {
    let d = `M0 ${base}`;
    for (let x = 0; x <= 400; x += 10) {
      d += ` L${x} ${(base + Math.sin(x / 34 + shift) * a).toFixed(1)}`;
    }
    return `${d} L400 80 L0 80 Z`;
  };
  return (
    <svg class="waveline" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
      <path d={path(0, amp, 42)} opacity="0.35" />
      <path d={path(1.8, amp * 0.7, 54)} opacity="0.6" />
    </svg>
  );
}

export function Star({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" class="star" aria-pressed={on} aria-label={`${on ? "הסרה מהמועדפים" : "הוספה למועדפים"}: ${label}`} onClick={onToggle}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill={on ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
        <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
      </svg>
    </button>
  );
}

export function LegalTag({ beach }: { beach: Beach }) {
  if (beach.legal === "reserve") return <span class="tag tag-alert">שמורה</span>;
  return beach.legalNote ? <span class="tag">בדוק גבולות</span> : null;
}

function Spark({ hours, now }: { hours: ScoredHour[]; now: LocalNow }) {
  const current = hourAt(hours, now);
  const start = current ? hours.indexOf(current) : -1;
  if (start < 0) return null;
  return (
    <span class="spark" aria-hidden="true">
      {hours.slice(start, start + 12).map((h) => (
        <i key={h.time} data-tier={tierOf(h.score)} style={{ height: `${(h.score ?? 1) * 10}%` }} />
      ))}
    </span>
  );
}

export function BeachRow({ beach, hours, now, favorite, onToggle }: { beach: Beach; hours: ScoredHour[]; now: LocalNow; favorite: boolean; onToggle: () => void }) {
  const current = hourAt(hours, now);
  return (
    <li class="beach-row">
      <a href={`#/beach/${beach.id}`}>
        <ScoreBadge score={current?.score ?? null} />
        <span class="beach-row-text">
          <span class="beach-name">{beach.name} <LegalTag beach={beach} /></span>
          <span class="muted small">{beach.area}</span>
        </span>
        <Spark hours={hours} now={now} />
      </a>
      <Star on={favorite} label={beach.name} onToggle={onToggle} />
    </li>
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
