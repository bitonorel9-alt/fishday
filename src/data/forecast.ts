import { BEACHES } from "../domain/beaches";
import type { HourConditions, Sun } from "../domain/score";
import { hourOf } from "../domain/time";

export interface ForecastHour extends HourConditions {
  time: string;
  date: string;
  airTemp: number | null;
  waterTemp: number | null;
}

export interface ForecastDay {
  date: string;
  sun: Sun;
}

export interface Forecast {
  fetchedAt: number;
  days: ForecastDay[];
  hours: Record<string, ForecastHour[]>;
}

interface Hourly {
  time: string[];
  [variable: string]: (number | null)[] | string[];
}

interface ApiLocation {
  hourly: Hourly;
  daily?: { time: string[]; sunrise: string[]; sunset: string[] };
}

const num = (series: unknown, i: number): number | null => {
  const v = Array.isArray(series) ? series[i] : null;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

/** מאחד את שתי התשובות לפי חותמת זמן. ערך חסר נשאר null. */
export function parseForecast(marineJson: unknown, weatherJson: unknown, fetchedAt: number): Forecast {
  const marine = ([] as ApiLocation[]).concat(marineJson as ApiLocation);
  const weather = ([] as ApiLocation[]).concat(weatherJson as ApiLocation);
  if (marine.length !== BEACHES.length || weather.length !== BEACHES.length) {
    throw new Error("Unexpected forecast shape");
  }

  const daily = weather[0]?.daily;
  if (!daily) throw new Error("Forecast has no daily data");
  const days = daily.time.map((date, i) => ({
    date,
    sun: { sunrise: hourOf(daily.sunrise[i] ?? ""), sunset: hourOf(daily.sunset[i] ?? "") },
  }));

  const hours: Record<string, ForecastHour[]> = {};
  BEACHES.forEach((beach, b) => {
    const w = weather[b]!.hourly;
    const m = marine[b]!.hourly;
    const marineIndex = new Map(m.time.map((t, i) => [t, i]));
    hours[beach.id] = w.time.map((time, i) => {
      const j = marineIndex.get(time) ?? -1;
      return {
        time,
        date: time.slice(0, 10),
        hour: Math.floor(hourOf(time)),
        waveHeight: num(m.wave_height, j),
        wavePeriod: num(m.wave_period, j),
        waveDirection: num(m.wave_direction, j),
        waterTemp: num(m.sea_surface_temperature, j),
        windSpeed: num(w.wind_speed_10m, i),
        windGust: num(w.wind_gusts_10m, i),
        windDirection: num(w.wind_direction_10m, i),
        airTemp: num(w.temperature_2m, i),
      };
    });
  });

  return { fetchedAt, days, hours };
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Forecast request failed: ${res.status}`);
  return res.json();
}

export async function fetchForecast(): Promise<Forecast> {
  const lat = BEACHES.map((b) => b.lat).join(",");
  const lon = BEACHES.map((b) => b.lon).join(",");
  const q = `latitude=${lat}&longitude=${lon}&timezone=Asia%2FJerusalem&forecast_days=7`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20_000);
  try {
    const [marine, weather] = await Promise.all([
      getJson(`https://marine-api.open-meteo.com/v1/marine?${q}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature`, ctl.signal),
      getJson(`https://api.open-meteo.com/v1/forecast?${q}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,temperature_2m&daily=sunrise,sunset`, ctl.signal),
    ]);
    return parseForecast(marine, weather, Date.now());
  } finally {
    clearTimeout(timer);
  }
}
