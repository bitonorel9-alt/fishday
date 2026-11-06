import { useEffect, useRef, useState } from "preact/hooks";
import { FISH } from "../content/fish";
import { listCatches } from "../data/catchLog";
import type { Forecast } from "../data/forecast";
import { BOTTOM_LABEL, type Beach } from "../domain/beaches";
import { fishForBeach, logShares, type LogShare } from "../domain/fishMatch";
import { hourAt, type ScoredHour } from "../domain/insights";
import { moonPhase } from "../domain/moon";
import { GUST_WARNING_KMH, WAVE_WARNING_M } from "../domain/score";
import { formatHour, type LocalNow } from "../domain/time";
import { periodText, TIER_LABEL, tierOf, timeText, waveText, windText } from "../ui/explain";
import { dayLabel, hourLabel, shortDate } from "../ui/format";
import { ReportLink } from "./Feedback";
import { Attribution, ScoreBadge, ScoreCurve, Star } from "../ui/parts";
import { windLabel, windValue, type WindUnit } from "../ui/settings";

interface Props {
  beach: Beach;
  hours: ScoredHour[];
  forecast: Forecast;
  now: LocalNow;
  favorite: boolean;
  onToggleFavorite: () => void;
  windUnit: WindUnit;
}

export function BeachDetail({ beach, hours, forecast, now, favorite, onToggleFavorite, windUnit }: Props) {
  const days = forecast.days.filter((d) => d.date >= now.date);
  const [date, setDate] = useState(days[0]?.date ?? now.date);
  const dayHours = hours.filter((h) => h.date === date);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = dayHours.find((h) => h.time === picked) ?? (date === now.date ? hourAt(hours, now) : null) ?? dayHours[Math.floor(dayHours.length / 3)] ?? null;
  const day = forecast.days.find((d) => d.date === date);
  const moon = moonPhase(new Date(`${date}T12:00:00Z`));
  const stripRef = useRef<HTMLDivElement>(null);
  const popular = fishForBeach(FISH, beach.bottom, Number(date.slice(5, 7)));
  const [mine, setMine] = useState<LogShare[]>([]);

  useEffect(() => {
    listCatches().then((entries) => setMine(logShares(entries, beach.id))).catch(() => setMine([]));
  }, [beach.id]);

  useEffect(() => {
    stripRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [date]);

  return (
    <>
      <header class="detail-head">
        <a class="back" href="#/beaches" aria-label="חזרה לחופים">→</a>
        <div>
          <h1 class="page-title">{beach.name}</h1>
          <p class="muted small">{beach.area}</p>
        </div>
        <Star on={favorite} label={beach.name} onToggle={onToggleFavorite} />
      </header>

      {beach.legalNote && (
        <p class={beach.legal === "reserve" ? "alert" : "note"}>{beach.legalNote}</p>
      )}

      <div class="day-tabs" role="group" aria-label="בחירת יום">
        {days.map((d) => (
          <button type="button" key={d.date} aria-pressed={d.date === date} onClick={() => { setDate(d.date); setPicked(null); }}>
            <span>{dayLabel(d.date, now)}</span>
            <small>{shortDate(d.date)}</small>
          </button>
        ))}
      </div>

      <div class="hour-strip" role="group" aria-label="ציון לפי שעה" ref={stripRef} tabIndex={0}>
        <ScoreCurve
          hours={dayHours}
          selected={selected?.time ?? null}
          sunrise={day?.sun.sunrise ?? 6}
          sunset={day?.sun.sunset ?? 18}
          onSelect={setPicked}
          labelOf={(h) => ({ hour: hourLabel(h.hour), aria: `${hourLabel(h.hour)}, ${h.score === null ? TIER_LABEL.none : `ציון ${h.score}`}` })}
        />
      </div>

      {selected && (
        <section class="card factors" aria-live="polite">
          <div class="factors-head">
            <div>
              <p class="eyebrow">{dayLabel(selected.date, now)}, <span dir="ltr">{hourLabel(selected.hour)}</span></p>
              <strong>{TIER_LABEL[tierOf(selected.score)]}</strong>
            </div>
            <ScoreBadge score={selected.score} />
          </div>

          {selected.warnings.some((w) => w.kind === "waves") && <p class="alert">⚠ גלים מעל {WAVE_WARNING_M} מ'. לא לעלות על שוברי גלים.</p>}
          {selected.warnings.some((w) => w.kind === "gusts") && <p class="alert">⚠ משבי רוח מעל {GUST_WARNING_KMH} קמ"ש.</p>}

          <dl>
            <dt>גלים</dt>
            <dd>
              {selected.waveHeight === null ? "אין נתון." : (
                <>
                  <strong><bdi>{selected.waveHeight.toFixed(1)}</bdi> מ' בים הפתוח</strong>
                  {selected.effectiveWave !== null && <>, כ-<bdi>{selected.effectiveWave.toFixed(1)}</bdi> מ' בחוף. {waveText(selected.effectiveWave)}</>}
                  {selected.wavePeriod !== null && <> {periodText(selected.wavePeriod)}</>}
                </>
              )}
            </dd>
            <dt>רוח</dt>
            <dd>
              {selected.windSpeed === null || selected.windDirection === null ? "אין נתון." : (
                <>
                  <strong><bdi>{windValue(selected.windSpeed, windUnit)}</bdi> {windLabel(windUnit)}</strong>
                  {selected.windGust !== null && <>, משבים <bdi>{windValue(selected.windGust, windUnit)}</bdi></>}. {windText(selected.windSpeed, selected.windDirection, beach)}
                </>
              )}
            </dd>
            {day && (
              <>
                <dt>זמן</dt>
                <dd>{timeText(selected.hour, day.sun)}</dd>
              </>
            )}
            <dt>טמפ'</dt>
            <dd>
              אוויר <bdi>{selected.airTemp === null ? "–" : `${Math.round(selected.airTemp)}°`}</bdi> · מים <bdi>{selected.waterTemp === null ? "–" : `${Math.round(selected.waterTemp)}°`}</bdi>
            </dd>
          </dl>
        </section>
      )}

      <section class="card sky">
        {day && (
          <>
            <div><span class="muted small">זריחה</span><strong dir="ltr">{formatHour(day.sun.sunrise)}</strong></div>
            <div><span class="muted small">שקיעה</span><strong dir="ltr">{formatHour(day.sun.sunset)}</strong></div>
          </>
        )}
        <div><span class="muted small">ירח</span><strong>{moon.name}</strong></div>
      </section>

      <section class="card rule shore">
        <h2>החוף</h2>
        <p>{beach.shore}</p>
        <p class="muted small">קרקעית: {BOTTOM_LABEL[beach.bottom]}</p>
      </section>

      <section class="card rule">
        <h2>דגים פופולריים כאן</h2>
        <ul class="match-list">
          {popular.map(({ fish, match }) => (
            <li key={fish.id}>
              <a href={`#/fish/${fish.id}`}>{fish.name}</a>
              <span class="match-bar"><i style={{ width: `${match}%` }} /></span>
              <b><bdi>{match}%</bdi></b>
            </li>
          ))}
        </ul>
        <p class="muted small">אחוז התאמה הוא הערכה לפי סוג החוף, העונה ושכיחות הדג בישראל. אין נתוני שלל לכל חוף.</p>
        {mine.length > 0 && (
          <>
            <h3>מהיומן שלך</h3>
            <ul class="match-list">
              {mine.slice(0, 4).map((s) => (
                <li key={s.fish}>
                  <span>{s.fish}</span>
                  <span class="match-bar match-mine"><i style={{ width: `${s.percent}%` }} /></span>
                  <b><bdi>{s.percent}%</bdi></b>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {beach.tips.length > 0 && <section class="card rule">
        <h2>טיפים לדיג</h2>
        <ul class="plain">{beach.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>}

      {beach.sights.length > 0 && <section class="card rule">
        <h2>מקומות יפים</h2>
        <ul class="plain">{beach.sights.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>}

      <p class="muted small">הציון הוא הערכה לדיג בחכה מהחוף. הוא לא כולל זרמים, עכירות ולחץ ברומטרי.</p>
      <ReportLink kind="beach" label="ציון לא נכון או טעות בחוף? דווח לנו" />
      <Attribution />
    </>
  );
}
