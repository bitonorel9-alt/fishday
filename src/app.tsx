import { useEffect, useMemo, useState } from "preact/hooks";
import { trackPage } from "./data/analytics";
import { useForecast } from "./data/useForecast";
import { BEACHES } from "./domain/beaches";
import { scoreForecast } from "./domain/insights";
import { skyPhase } from "./domain/sky";
import { addDays, israelClock, israelNow } from "./domain/time";
import { Home } from "./screens/Home";
import { Join } from "./screens/Join";
import { joinSkipped, loadAccount, firstName, skipJoin, type Account } from "./data/account";
import { updatedAgo } from "./ui/format";
import { Hero } from "./ui/Hero";
import { Icon, Logo } from "./ui/parts";
import { useSettings, type Settings as AppSettings } from "./ui/settings";
import { clickSound, startOcean, stopOcean } from "./ui/sound";
import { jumpFish } from "./ui/tapFish";
import { Underwater } from "./ui/Underwater";
import { useFavorites } from "./ui/useFavorites";
import { lazy } from "./ui/lazy";

// מסכים שלא צריך במסך הבית נטענים רק כשנכנסים אליהם.
const Beaches = lazy(() => import("./screens/Beaches").then((m) => m.Beaches));
const BeachDetail = lazy(() => import("./screens/BeachDetail").then((m) => m.BeachDetail));
const Settings = lazy(() => import("./screens/Settings").then((m) => m.Settings));
const Admin = lazy(() => import("./screens/Admin").then((m) => m.Admin));
const Game = lazy(() => import("./screens/Game").then((m) => m.Game));
const Log = lazy(() => import("./screens/Log").then((m) => m.Log));
const Feedback = lazy(() => import("./screens/Feedback").then((m) => m.Feedback));
const Terms = lazy(() => import("./screens/Legal").then((m) => m.Terms));
const Accessibility = lazy(() => import("./screens/Legal").then((m) => m.Accessibility));
const Privacy = lazy(() => import("./screens/Privacy").then((m) => m.Privacy));
const Rules = lazy(() => import("./screens/Rules").then((m) => m.Rules));
const Widget = lazy(() => import("./screens/Widget").then((m) => m.Widget));
const FishScreen = lazy(() =>
  Promise.all([import("./screens/Fish"), import("./content/fish")]).then(([m, c]) => ({ id, month }: { id: string | null; month: number }) => {
    const fish = c.FISH.find((f) => f.id === id);
    return fish ? <m.FishDetail fish={fish} month={month} /> : <m.FishList />;
  }),
);
const GuideScreen = lazy(() =>
  Promise.all([import("./screens/Guide"), import("./content/guide")]).then(([m, c]) => ({ id }: { id: string | null }) => {
    const article = c.GUIDE.find((a) => a.id === id);
    return article ? <m.GuideArticleView article={article} /> : <m.GuideHome />;
  }),
);

const TABS = [
  { href: "#/", label: "בית", icon: "home" },
  { href: "#/beaches", label: "חופים", icon: "beaches" },
  { href: "#/guide", label: "מדריך", icon: "fish" },
  { href: "#/rules", label: "מה מותר", icon: "rules" },
  { href: "#/log", label: "יומן", icon: "log" },
] as const;

function useRoute() {
  const [hash, setHash] = useState(location.hash || "#/");
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash || "#/");
      window.scrollTo(0, 0);
      trackPage();
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

/** תקתוק ללחיצות, והפעלת רעש הים בלחיצה הראשונה: דפדפן לא מנגן בלי מגע. */
function useSoundEffects(settings: AppSettings) {
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (settings.oceanSound) startOcean(settings.volume);
      const target = e.target as Element | null;
      if (settings.clickSounds && target?.closest("a, button, input, select")) clickSound(settings.volume);
      if (settings.tapFish && !target?.closest("input, select")) jumpFish(e.clientX, e.clientY);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stopOcean();
    };
    document.addEventListener("pointerup", onPointer);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("pointerup", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [settings.oceanSound, settings.clickSounds, settings.tapFish, settings.volume]);
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
  const { settings, update } = useSettings();
  const [account, setAccount] = useState<Account | null>(loadAccount);
  // ההרשמה מופיעה פעם אחת בכניסה הראשונה, ובכל פעם שנכנסים ל-#/join.
  const [welcome, setWelcome] = useState(() => !loadAccount() && !joinSkipped());
  useSoundEffects(settings);
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
  const fishId = hash.startsWith("#/fish/") ? hash.slice("#/fish/".length) : null;
  const overHero = hash === "#/";

  useEffect(() => {
    document.documentElement.dataset.sky = phase;
  }, [phase]);

  let screen;
  if (hash === "#/game") screen = <Game />;
  else if (hash === "#/admin") screen = <Admin />;
  else if (hash === "#/privacy") screen = <Privacy />;
  else if (hash === "#/terms") screen = <Terms />;
  else if (hash === "#/accessibility") screen = <Accessibility />;
  else if (hash.startsWith("#/feedback")) screen = <Feedback key={hash} route={hash} />;
  else if (hash === "#/settings") screen = <Settings settings={settings} update={update} account={account} onAccountChange={setAccount} />;
  else if (hash === "#/widget") screen = <Widget />;
  else if (hash === "#/rules") screen = <Rules now={now} />;
  else if (hash === "#/log") screen = <Log now={now} />;
  else if (hash.startsWith("#/fish")) screen = <FishScreen key={hash} id={fishId} month={Number(now.date.slice(5, 7))} />;
  else if (hash.startsWith("#/guide/")) screen = <GuideScreen key={hash} id={hash.slice("#/guide/".length)} />;
  else if (hash.startsWith("#/guide")) screen = <GuideScreen key="guide" id={null} />;
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
    screen = <BeachDetail key={beach.id} beach={beach} hours={scored[beach.id] ?? []} forecast={forecast} now={now} favorite={favorites.includes(beach.id)} onToggleFavorite={() => toggle(beach.id)} windUnit={settings.windUnit} />;
  } else if (hash === "#/beaches") {
    screen = <Beaches scored={scored} now={now} favorites={favorites} onToggleFavorite={toggle} />;
  } else {
    screen = <Home scored={scored} now={now} clock={clock} sun={todaySun} tomorrowSun={tomorrowSun} favorites={favorites} onToggleFavorite={toggle} windUnit={settings.windUnit} homeBeach={settings.homeBeach} name={firstName(account)} />;
  }

  const legalPage = hash === "#/privacy" || hash === "#/terms" || hash === "#/accessibility" || hash === "#/admin";
  const showJoin = hash === "#/join" || (welcome && !account && !legalPage);
  const closeJoin = () => {
    setWelcome(false);
    if (hash === "#/join") location.hash = "#/settings";
  };

  // בזמן מסך ההרשמה לא מציירים את האפליקציה מאחוריו: ממילא לא רואים אותה, וזה מאט את הטעינה הראשונה.
  if (showJoin) {
    return (
      <Join
        onDone={(a) => { setAccount(a); closeJoin(); }}
        onLater={() => { skipJoin(); closeJoin(); }}
      />
    );
  }

  return (
    <>
      <Underwater animated={settings.seaScene} />
      <header class={`topbar${overHero ? " topbar-over" : ""}`}>
        <a href="#/" class="brand" dir="ltr" aria-label="FishDay, דף הבית"><Logo /><b>Fish<span>Day</span></b></a>
        <div class="topbar-actions">
          {needsForecast && forecast && (
            <span class="status small" role="status">
              {status === "failed" ? "אין חיבור · " : ""}{updatedAgo(forecast.fetchedAt, nowMs)}
            </span>
          )}
          <button type="button" class="icon-btn" aria-pressed={settings.oceanSound} aria-label="רעש ים"
            onClick={() => {
              const oceanSound = !settings.oceanSound;
              update({ oceanSound });
              if (oceanSound) startOcean(settings.volume);
              else stopOcean();
            }}>
            <Icon name={settings.oceanSound ? "sound" : "mute"} />
          </button>
          <a class="icon-btn" href="#/settings" aria-label="הגדרות"><Icon name="settings" /></a>
        </div>
      </header>
      <main>
        {screen}
        <footer class="site-footer small">
          <a href="#/accessibility">נגישות</a>
          <a href="#/terms">תנאי שימוש</a>
          <a href="#/privacy">פרטיות</a>
          <a href="#/feedback">דווח על טעות</a>
        </footer>
      </main>
      <nav class="tabbar" aria-label="ניווט ראשי">
        {TABS.map((t) => {
          const active = t.href === "#/" ? hash === "#/" : t.href === "#/beaches" ? hash === t.href || beachId !== null : t.href === "#/guide" ? hash.startsWith("#/guide") || hash.startsWith("#/fish") || hash === "#/game" : hash.startsWith(t.href);
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
