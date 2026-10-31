import { BEACHES } from "../domain/beaches";
import { bestNow, hasWarningSoon, nextWindow, spotsNow, type ScoredForecast } from "../domain/insights";
import { GUST_WARNING_KMH, WAVE_WARNING_M } from "../domain/score";
import type { LocalNow } from "../domain/time";
import { TIER_LABEL, tierOf } from "../ui/explain";
import { dayLabel, hourLabel } from "../ui/format";
import { Attribution, BeachRow, ScoreBadge, WaveLine } from "../ui/parts";

interface Props {
  scored: ScoredForecast;
  now: LocalNow;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export function Home({ scored, now, favorites, onToggleFavorite }: Props) {
  const best = bestNow(scored, now);
  const window = nextWindow(scored, now);
  const warnings = hasWarningSoon(scored, now);
  const shown = favorites.length
    ? BEACHES.filter((b) => favorites.includes(b.id))
    : spotsNow(scored, now)
        .filter((s) => s.beach.legal !== "reserve")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3)
        .map((s) => s.beach);

  return (
    <>
      {warnings.waves && <p class="alert" role="alert">⚠ גלים מעל {WAVE_WARNING_M} מ' ב-24 השעות הקרובות. לא לעלות על שוברי גלים.</p>}
      {warnings.gusts && <p class="alert" role="alert">⚠ משבי רוח מעל {GUST_WARNING_KMH} קמ"ש ב-24 השעות הקרובות.</p>}

      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-body">
          <p class="eyebrow">הכי טוב עכשיו</p>
          {best ? (
            <>
              <h1 id="hero-title">
                <a href={`#/beach/${best.beach.id}`}>{best.beach.name}</a>
              </h1>
              <p class="hero-sub">
                {TIER_LABEL[tierOf(best.score)]} · גלים <bdi>{best.hour.waveHeight?.toFixed(1)}</bdi> מ' · רוח <bdi>{Math.round(best.hour.windSpeed ?? 0)}</bdi> קמ"ש
                {best.hour.waterTemp !== null && <> · מים <bdi>{Math.round(best.hour.waterTemp)}°</bdi></>}
              </p>
            </>
          ) : (
            <h1 id="hero-title">אין נתון לשעה הזו</h1>
          )}
        </div>
        <ScoreBadge score={best?.score ?? null} big />
        <WaveLine height={best?.hour.waveHeight ?? null} />
      </section>

      {window && (
        <section class="card window">
          <p class="eyebrow">החלון הבא הכי טוב</p>
          <a href={`#/beach/${window.beach.id}`}>
            <strong>{window.beach.name}</strong>, {dayLabel(window.date, now)}{" "}
            <span dir="ltr" class="nowrap">{hourLabel(window.startHour)}–{hourLabel(window.endHour)}</span>
          </a>
          <ScoreBadge score={window.average} />
        </section>
      )}

      <h2 class="section-title">{favorites.length ? "החופים שלי" : "חופים מובילים עכשיו"}</h2>
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
