import { FISH, type FishInfo } from "../content/fish";
import { BEACHES } from "../domain/beaches";
import { matchPercent } from "../domain/fishMatch";
import { Page } from "../ui/parts";

export function FishList() {
  return (
    <Page title="דגים">
      <p class="muted">הדגים הנפוצים בחכה מהחוף. האחוזים מסקר שלל ארצי מ-2023.</p>
      <ul class="fish-cards">
        {FISH.map((f) => (
          <li key={f.id}>
            <a class="card fish-card" href={`#/fish/${f.id}`}>
              <strong>{f.name}</strong>
              <span class="muted small">{f.share}</span>
              {f.warning && <span class="tag tag-alert">זהירות</span>}
            </a>
          </li>
        ))}
      </ul>
      <p class="muted small">שמות, גדלים ומזון: <a href="https://www.fishbase.se/" target="_blank" rel="noopener">FishBase</a>. שלל: <a href="https://doi.org/10.3390/fishes8020069" target="_blank" rel="noopener">Frid et al., Fishes 2023</a>. פיתיונות: דיווחי דייגים ומזון הדג בטבע.</p>
    </Page>
  );
}

export function FishDetail({ fish, month }: { fish: FishInfo; month: number }) {
  const ranked = BEACHES.map((b) => ({ beach: b, match: matchPercent(fish, b.bottom, month) })).sort((a, b) => b.match - a.match);
  return (
    <>
      <header class="detail-head">
        <a class="back" href="#/fish" aria-label="חזרה לדגים">→</a>
        <div>
          <h1 class="page-title">{fish.name}</h1>
          <p class="muted small">{fish.formal} · <span dir="ltr"><i>{fish.scientific}</i></span></p>
        </div>
      </header>

      {fish.warning && <p class="alert">{fish.warning}</p>}
      {fish.bannedInBreeding && <p class="note">אסור לדיג בתקופת הרבייה, 1.5–30.6.</p>}

      <section class="card facts-grid">
        <div><span class="muted small">בשלל מהחוף</span><strong>{fish.share}</strong></div>
        <div><span class="muted small">גודל</span><strong>{fish.size}</strong></div>
        <div><span class="muted small">גודל מינימום</span><strong>{fish.minCm ? `${fish.minCm} ס"מ` : "לא בטבלה"}</strong></div>
        <div><span class="muted small">אוכל</span><strong>{fish.food}</strong></div>
      </section>

      <section class="card rule">
        <h2>איפה הוא חי</h2>
        <p>{fish.where}</p>
        <p><strong>פיתיון:</strong> {fish.bait}</p>
      </section>

      <section class="card rule">
        <h2>כדאי לדעת</h2>
        <ul class="plain">{fish.facts.map((f) => <li key={f}>{f}</li>)}</ul>
      </section>

      <section class="card rule">
        <h2>התאמה לפי חוף</h2>
        <ul class="match-list">
          {ranked.map(({ beach, match }) => (
            <li key={beach.id}>
              <a href={`#/beach/${beach.id}`}>{beach.name}</a>
              <span class="match-bar"><i style={{ width: `${match}%` }} /></span>
              <b><bdi>{match}%</bdi></b>
            </li>
          ))}
        </ul>
        <p class="muted small">אחוז התאמה הוא הערכה לפי שכיחות הדג, סוג החוף והעונה. זה לא הסיכוי לתפוס דג, כי אין נתוני שלל לכל חוף.</p>
      </section>

      <p class="muted small"><a href={fish.fishbase} target="_blank" rel="noopener">הדף של {fish.name} ב-FishBase</a></p>
    </>
  );
}
