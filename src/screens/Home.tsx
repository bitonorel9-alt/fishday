import { BEACHES } from "../domain/beaches";
import { bestNow, hasWarningSoon, nextWindow, spotsNow, type ScoredForecast } from "../domain/insights";
import { GUST_WARNING_KMH, WAVE_WARNING_M, type Sun } from "../domain/score";
import { nextSunEvent } from "../domain/sky";
import type { LocalNow } from "../domain/time";
import { TIER_LABEL, tierOf } from "../ui/explain";
import { dayLabel, durationLabel, hourLabel } from "../ui/format";
import { windLabel, windValue, type WindUnit } from "../ui/settings";
import { Hero, SunArc } from "../ui/Hero";
import { Attribution, BeachRow, ScoreBadge } from "../ui/parts";

interface Props {
  scored: ScoredForecast;
  now: LocalNow;
  clock: number;
  sun: Sun | null;
  tomorrowSun: Sun | null;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  windUnit: WindUnit;
  homeBeach: string | null;
}

export function Home({ scored, now, clock, sun, tomorrowSun, favorites, onToggleFavorite, windUnit, homeBeach }: Props) {
  const best = bestNow(scored, now);
  const window = nextWindow(scored, now);
  const warnings = hasWarningSoon(scored, now);
  const event = sun ? nextSunEvent(clock, sun, tomorrowSun ?? undefined) : null;
  const base = favorites.length
    ? BEACHES.filter((b) => favorites.includes(b.id))
    : spotsNow(scored, now)
        .filter((s) => s.beach.legal !== "reserve")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3)
        .map((s) => s.beach);
  const mine = BEACHES.find((b) => b.id === homeBeach);
  const shown = mine ? [mine, ...base.filter((b) => b.id !== mine.id)] : base;

  return (
    <>
      <Hero waveHeight={best?.hour.waveHeight ?? null}>
        {warnings.waves && <p class="alert" role="alert">⚠ גלים מעל {WAVE_WARNING_M} מ' ב-24 השעות הקרובות. לא לעלות על שוברי גלים.</p>}
        {warnings.gusts && <p class="alert" role="alert">⚠ משבי רוח מעל {GUST_WARNING_KMH} קמ"ש ב-24 השעות הקרובות.</p>}

        <p class="hero-eyebrow">הכי טוב עכשיו</p>
        {best ? (
          <>
            <div class="hero-main">
              <h1><a href={`#/beach/${best.beach.id}`}>{best.beach.name}</a></h1>
              <p class="hero-score" data-tier={tierOf(best.score)} aria-label={`ציון ${best.score} מתוך 10`}>{best.score?.toFixed(1)}</p>
            </div>
            <ul class="chips">
              <li>{TIER_LABEL[tierOf(best.score)]}</li>
              {best.hour.waveHeight !== null && <li>גלים <bdi>{best.hour.waveHeight.toFixed(1)}</bdi> מ'</li>}
              {best.hour.windSpeed !== null && <li>רוח <bdi>{windValue(best.hour.windSpeed, windUnit)}</bdi> {windLabel(windUnit)}</li>}
              {best.hour.waterTemp !== null && <li>מים <bdi>{Math.round(best.hour.waterTemp)}°</bdi></li>}
            </ul>
          </>
        ) : (
          <h1>אין נתון לשעה הזו</h1>
        )}
        {sun && <SunArc t={clock} sun={sun} next={event && `${event.kind === "sunset" ? "שקיעה" : "זריחה"} בעוד ${durationLabel(event.inHours)}`} />}
      </Hero>

      {window && (
        <a class="window" href={`#/beach/${window.beach.id}`}>
          <span>
            <span class="eyebrow">החלון הבא</span>
            <strong>{window.beach.name}</strong>
            <span class="window-time">{dayLabel(window.date, now)} <span dir="ltr" class="nowrap">{hourLabel(window.startHour)}–{hourLabel(window.endHour)}</span></span>
          </span>
          <ScoreBadge score={window.average} />
        </a>
      )}

      <h2 class="section-title">{favorites.length ? "החופים שלי" : "מובילים עכשיו"}</h2>
      <ul class="beach-list">
        {shown.map((beach) => (
          <BeachRow key={beach.id} beach={beach} hours={scored[beach.id] ?? []} now={now} favorite={favorites.includes(beach.id)} onToggle={() => onToggleFavorite(beach.id)} />
        ))}
      </ul>
      {favorites.length === 0 && <p class="muted small">סמן כוכב בחוף כדי להציג כאן את החופים שלך.</p>}
      <Attribution />
    </>
  );
}
