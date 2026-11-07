import { useState } from "preact/hooks";
import { readJson, writeJson } from "../data/storage";
import { greeting, homeAdvice } from "../domain/advice";
import { BEACHES } from "../domain/beaches";
import { bestNow, hasWarningSoon, nextWindow, spotsNow, type ScoredForecast } from "../domain/insights";
import type { Sun } from "../domain/score";
import { nextSunEvent } from "../domain/sky";
import type { LocalNow } from "../domain/time";
import { TIER_LABEL, tierOf } from "../ui/explain";
import { dayLabel, durationLabel, hourLabel } from "../ui/format";
import { windLabel, windValue, type WindUnit } from "../ui/settings";
import { Hero, SunArc } from "../ui/Hero";
import { Mascot, MascotSays } from "../ui/Mascot";
import { QuizBanner } from "../ui/QuizBanner";
import { Attribution, BeachRow, Logo, ScoreBadge } from "../ui/parts";

const WARN_KEY = "fishday.warning.hidden";

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
  const [hello] = useState(() => greeting(now.hour, Math.random()));
  // אזהרה שהוסתרה חוזרת למחרת, או כשמופיעה אזהרה מסוג אחר.
  const [hiddenWarning, setHiddenWarning] = useState(() => readJson<string>(WARN_KEY));
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
  const warningSig = warnings.waves || warnings.gusts ? `${now.date}:${warnings.waves ? "w" : ""}${warnings.gusts ? "g" : ""}` : null;
  const showWarning = warningSig !== null && hiddenWarning !== warningSig;
  const advice = homeAdvice({
    best: best && { name: best.beach.name, score: best.score },
    window: window && { name: window.beach.name, day: dayLabel(window.date, now), start: hourLabel(window.startHour) },
    waves: showWarning && warnings.waves,
    gusts: showWarning && warnings.gusts,
    night: sun !== null && (clock < sun.sunrise - 1 || clock > sun.sunset + 1),
  });

  return (
    <>
      <Hero
        waveHeight={best?.hour.waveHeight ?? null}
        top={
          <>
            <div class="hero-brand" dir="ltr">
              <Logo size={86} />
              <span class="hero-wordmark">Fish<span>Day</span></span>
            </div>
            <p class="hero-tagline">דיג בזמן הנכון</p>
            <div class="hero-hello">
              <Mascot mood="hello" size={46} />
              <p><b>דני</b> {hello}</p>
            </div>
          </>
        }
      >
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

      <MascotSays {...advice} onClose={showWarning ? () => { writeJson(WARN_KEY, warningSig); setHiddenWarning(warningSig); } : undefined} />

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

      <a class="card guide-promo" href="#/guide">
        <strong>מדריך הדיג</strong>
        <span class="muted small">איך דגים, איזו חכה לקנות, ועם מי לצאת</span>
      </a>

      <QuizBanner />

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
