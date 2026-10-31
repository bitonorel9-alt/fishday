import { useState } from "preact/hooks";
import { FISH, type FishInfo } from "../content/fish";
import { FISH_ID, identifyFish, TRAITS, type Trait } from "../content/fishId";
import { FISH_PHOTOS } from "../content/fishPhotos";
import { BEACHES } from "../domain/beaches";
import { matchPercent } from "../domain/fishMatch";
import { Page } from "../ui/parts";

const BASE = import.meta.env.BASE_URL;

function FishImage({ id, alt, eager = false }: { id: string; alt: string; eager?: boolean }) {
  const photo = FISH_PHOTOS[id];
  if (!photo) return null;
  return <img class="fish-photo" src={`${BASE}${photo.file}`} alt={alt} width={photo.width} height={photo.height} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

function FishCard({ fish, note }: { fish: FishInfo; note: string }) {
  return (
    <a class="card fish-card" href={`#/fish/${fish.id}`}>
      <FishImage id={fish.id} alt={fish.name} />
      <span class="fish-card-body">
        <strong>{fish.name}</strong>
        <span class="muted small">{note}</span>
        {fish.warning && <span class="tag tag-alert">זהירות</span>}
      </span>
    </a>
  );
}

function Identifier() {
  const [selected, setSelected] = useState<Trait[]>([]);
  const matches = identifyFish(selected);
  const toggle = (t: Trait) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  return (
    <section class="card rule">
      <h2>מה תפסתי?</h2>
      <p class="muted small">סמן מה אתה רואה על הדג.</p>
      <div class="chip-group" role="group" aria-label="סימני זיהוי">
        {TRAITS.map((t) => (
          <button type="button" key={t.id} class="trait" aria-pressed={selected.includes(t.id)} onClick={() => toggle(t.id)}>{t.label}</button>
        ))}
      </div>
      {selected.length > 0 && (
        matches.length ? (
          <ul class="id-results" role="status">
            {matches.slice(0, 3).map((m) => {
              const fish = FISH.find((f) => f.id === m.id);
              return fish ? (
                <li key={m.id}>
                  <a href={`#/fish/${m.id}`}>
                    <FishImage id={m.id} alt="" />
                    <span><strong>{fish.name}</strong><span class="muted small">{m.hits} מתוך {selected.length} סימנים</span></span>
                  </a>
                </li>
              ) : null;
            })}
          </ul>
        ) : <p class="muted" role="status">לא נמצא דג עם הסימנים האלה.</p>
      )}
    </section>
  );
}

export function FishList() {
  return (
    <Page title="דגים">
      <Identifier />
      <ul class="fish-cards">
        {FISH.map((f) => <li key={f.id}><FishCard fish={f} note={f.share} /></li>)}
      </ul>
      <p class="muted small">האחוזים מסקר שלל ארצי מ-2023 (<a href="https://doi.org/10.3390/fishes8020069" target="_blank" rel="noopener">Frid et al.</a>). מידע על הדגים: <a href="https://www.fishbase.se/" target="_blank" rel="noopener">FishBase</a>. פיתיונות: דיווחי דייגים ומזון הדג בטבע.</p>
    </Page>
  );
}

export function FishDetail({ fish, month }: { fish: FishInfo; month: number }) {
  const ranked = BEACHES.map((b) => ({ beach: b, match: matchPercent(fish, b.bottom, month) })).sort((a, b) => b.match - a.match);
  const id = FISH_ID[fish.id];
  const photo = FISH_PHOTOS[fish.id];
  return (
    <>
      <header class="detail-head">
        <a class="back" href="#/fish" aria-label="חזרה לדגים">→</a>
        <div>
          <h1 class="page-title">{fish.name}</h1>
          <p class="muted small">{fish.formal} · <span dir="ltr"><i>{fish.scientific}</i></span></p>
        </div>
      </header>

      <figure class="fish-hero">
        <FishImage id={fish.id} alt={`${fish.name}, ${fish.scientific}`} eager />
        {photo && <figcaption class="muted small">צילום: <a href={photo.source} target="_blank" rel="noopener">{photo.author}</a>, {photo.license}</figcaption>}
      </figure>

      {fish.warning && <p class="alert">{fish.warning}</p>}
      {fish.bannedInBreeding && <p class="note">אסור לדיג בתקופת הרבייה, 1.5–30.6.</p>}

      {id && (
        <section class="card rule">
          <h2>איך מזהים</h2>
          <ul class="plain">{id.identify.map((t) => <li key={t}>{t}</li>)}</ul>
          {id.lookalike && <p class="note">{id.lookalike}</p>}
        </section>
      )}

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
