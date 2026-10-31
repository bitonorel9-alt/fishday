import { useEffect, useMemo, useState } from "preact/hooks";
import { useForecast } from "./data/useForecast";
import { BEACHES } from "./domain/beaches";
import { scoreForecast } from "./domain/insights";
import { skyPhase } from "./domain/sky";
import { addDays, israelClock, israelNow } from "./domain/time";
import { Beaches } from "./screens/Beaches";
import { BeachDetail } from "./screens/BeachDetail";
import { Home } from "./screens/Home";
import { Log } from "./screens/Log";
import { Rules } from "./screens/Rules";
import { updatedAgo } from "./ui/format";
import { Hero } from "./ui/Hero";
import { Icon, Logo } from "./ui/parts";
import { useFavorites } from "./ui/useFavorites";

const TABS = [
  { href: "#/", label: "בית", icon: "home" },
  { href: "#/beaches", label: "חופים", icon: "beaches" },
  { href: "#/rules", label: "מה מותר", icon: "rules" },
  { href: "#/log", label: "יומן", icon: "log" },
] as const;

function useRoute() {
  const [hash, setHash] = useState(location.hash || "#/");
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash || "#/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function useClock() {
  const [ms, setMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setMs(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return ms;
}

export function App() {
  const hash = useRoute();
  const nowMs = useClock();
  const { forecast, status, refresh } = useForecast();
  const { favorites, toggle } = useFavorites();
  const scored = useMemo(() => (forecast ? scoreForecast(forecast) : null), [forecast]);
  const now = israelNow(new Date(nowMs));

  const beachId = hash.startsWith("#/beach/") ? hash.slice("#/beach/".length) : null;
  const beach = BEACHES.find((b) => b.id === beachId);
  const needsForecast = hash === "#/" || hash === "#/beaches" || beachId !== null;
  const clock = israelClock(new Date(nowMs));
  const todaySun = forecast?.days.find((d) => d.date === now.date)?.sun ?? null;
  const tomorrowSun = forecast?.days.find((d) => d.date === addDays(now.date, 1))?.sun ?? null;
  const phase = todaySun ? skyPhase(clock, todaySun) : "golden";
  const overHero = !beachId && hash !== "#/beaches" && hash !== "#/rules" && hash !== "#/log";

  useEffect(() => {
    document.documentElement.dataset.sky = phase;
  }, [phase]);

  let screen;
  if (hash === "#/rules") screen = <Rules now={now} />;
  else if (hash === "#/log") screen = <Log now={now} />;
  else if (!forecast || !scored) {
    screen = status === "failed" ? (
      <div class="empty">
        <p>אין חיבור ואין נתונים שמורים.</p>
        <button type="button" class="primary" onClick={() => void refresh()}>נסה שוב</button>
      </div>
    ) : (
      <>
        <Hero waveHeight={null}>
          <p class="hero-eyebrow" role="status">טוען נתוני ים…</p>
        </Hero>
        <div class="card skeleton" />
        <div class="card skeleton" />
        <div class="card skeleton" />
      </>
    );
  } else if (beach) {
    screen = <BeachDetail key={beach.id} beach={beach} hours={scored[beach.id] ?? []} forecast={forecast} now={now} favorite={favorites.includes(beach.id)} onToggleFavorite={() => toggle(beach.id)} />;
  } else if (hash === "#/beaches") {
    screen = <Beaches scored={scored} now={now} favorites={favorites} onToggleFavorite={toggle} />;
  } else {
    screen = <Home scored={scored} now={now} clock={clock} sun={todaySun} tomorrowSun={tomorrowSun} favorites={favorites} onToggleFavorite={toggle} />;
  }

  return (
    <>
      <header class={`topbar${overHero ? " topbar-over" : ""}`}>
        <a href="#/" class="brand" dir="ltr" aria-label="FishDay, דף הבית"><Logo /><b>Fish<span>Day</span></b></a>
        {needsForecast && forecast && (
          <span class="status small" role="status">
            {status === "failed" ? "אין חיבור · " : ""}{updatedAgo(forecast.fetchedAt, nowMs)}
          </span>
        )}
      </header>
      <main>{screen}</main>
      <nav class="tabbar" aria-label="ניווט ראשי">
        {TABS.map((t) => {
          const active = t.href === "#/" ? hash === "#/" : t.href === "#/beaches" ? hash === t.href || beachId !== null : hash === t.href;
          return (
            <a key={t.href} href={t.href} aria-current={active ? "page" : undefined}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
