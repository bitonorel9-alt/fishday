import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { BEACHES } from "../domain/beaches";
import { fetchForecast, type Forecast } from "./forecast";
import { readJson, writeJson } from "./storage";

const CACHE_KEY = "fishday.forecast.v1";
const MAX_AGE_MS = 60 * 60 * 1000;

/** תחזית שמורה ישנה מדי, או שנשמרה לפני שנוספו חופים, נטענת מחדש. */
export function needsRefresh(f: Forecast | null, now: number, ids: string[] = BEACHES.map((b) => b.id)): boolean {
  if (!f) return true;
  if (now - f.fetchedAt >= MAX_AGE_MS) return true;
  return ids.some((id) => !f.hours[id]?.length);
}

export type ForecastStatus = "loading" | "ready" | "failed";

export function useForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(() => readJson<Forecast>(CACHE_KEY));
  const [status, setStatus] = useState<ForecastStatus>("loading");
  const latest = useRef(forecast);
  latest.current = forecast;

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await fetchForecast();
      writeJson(CACHE_KEY, next);
      setForecast(next);
      setStatus("ready");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    const refreshIfOld = () => {
      if (needsRefresh(latest.current, Date.now())) void refresh();
      else setStatus("ready");
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfOld();
    };
    refreshIfOld();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refreshIfOld);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refreshIfOld);
    };
  }, [refresh]);

  return { forecast, status, refresh };
}
