import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { BREEDING_BANNED, BREEDING_SEASON, findFish, PROTECTED, RULES_CHECKED_AT, seasonState, SOURCES, type Source } from "../content/rules";
import { BEACHES } from "../domain/beaches";
import type { LocalNow } from "../domain/time";
import { shortDate } from "../ui/format";
import { Page } from "../ui/parts";

function Sources({ list }: { list: Source[] }) {
  return (
    <ul class="sources">
      {list.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener">{s.label}</a> <span class="muted">({s.updated})</span>
        </li>
      ))}
    </ul>
  );
}

function Rule({ title, children, sources }: { title: string; children: ComponentChildren; sources: Source[] }) {
  return (
    <section class="card rule">
      <h2>{title}</h2>
      {children}
      <Sources list={sources} />
    </section>
  );
}

const STATE_TEXT = {
  before: "תקופת הרבייה עוד לא התחילה השנה.",
  during: "עכשיו תקופת רבייה.",
  after: "תקופת הרבייה הסתיימה השנה.",
  unknown: "עדיין לא עודכנו כאן תאריכי השנה. בדוק באתר אגף הדיג.",
};

export function Rules({ now }: { now: LocalNow }) {
  const [query, setQuery] = useState("");
  const results = findFish(query);
  const state = seasonState(now.date);

  return (
    <Page title="מה מותר">
      <p class="muted">לדיג בחכה מהחוף בים התיכון. נבדק מול המקורות ב-{RULES_CHECKED_AT}. זה לא ייעוץ משפטי, והשילוט בשטח קובע.</p>

      <section class="card">
        <label class="field">
          <span>חיפוש דג וגודל מינימום</span>
          <input type="search" value={query} placeholder="למשל: דניס" onInput={(e) => setQuery(e.currentTarget.value)} />
        </label>
        {results.length ? (
          <ul class="fish-list">
            {results.map((f) => (
              <li key={f.formal}>
                <span>
                  <strong>{f.name}</strong>
                  {f.name !== f.formal && <span class="muted small"> {f.formal}</span>}
                  {f.note && <span class="note-inline">{f.note}</span>}
                </span>
                <span class="size"><bdi>{f.minCm}</bdi> ס"מ</span>
              </li>
            ))}
          </ul>
        ) : (
          <p class="muted">אין בטבלה. לדג שלא מופיע אין מגבלת גודל, אלא אם הוא מוגן.</p>
        )}
        <p class="muted small">מודדים מקצה הפה עד קצה הזנב, כשהדג שוכב. דג קטן מהמינימום מחזירים למים מיד.</p>
        <Sources list={[SOURCES.sizes]} />
      </section>

      <Rule title="רישיון ושלל" sources={[SOURCES.sport]}>
        <ul class="plain">
          <li>חכה מהחוף בלי אמצעי עזר: לא צריך רישיון.</li>
          <li>רחפן, עפיפון, מצבר או מנוע חשמלי: צריך רישיון דיג ספורטיבי.</li>
          <li>שלל יומי: עד 5 ק"ג, או עד 2 דגים גדולים.</li>
        </ul>
      </Rule>

      <Rule title={`תקופת הרבייה ${BREEDING_SEASON.year}`} sources={[SOURCES.season, SOURCES.seasonParks]}>
        <p><strong>{shortDate(BREEDING_SEASON.start)}–{shortDate(BREEDING_SEASON.end)}.</strong> {STATE_TEXT[state]}</p>
        <p>חכה מהחוף בלי אמצעי עזר מותרת, באזורים שמותר לדוג בהם. רחפן מהחוף אסור בכל התקופה.</p>
        <p>רט"ג מפרסמת שהדגים האלה אסורים לדיג בכל התקופה, בכל השיטות:</p>
        <ul class="plain">{BREEDING_BANNED.map((f) => <li key={f}>{f}</li>)}</ul>
      </Rule>

      <Rule title="אסור תמיד" sources={[SOURCES.protected, SOURCES.sizes, SOURCES.booklet]}>
        <ul class="plain">{PROTECTED.map((f) => <li key={f}>{f}</li>)}</ul>
        <p>גם "דיג חטיפה" אסור: חכה עם קרס עוגן שנועד לתפוס את הדג בגופו.</p>
      </Rule>

      <Rule title="שמורות ימיות" sources={[SOURCES.booklet, SOURCES.reservesMap, SOURCES.roshCarmel]}>
        <p>דיג בשמורה אסור. חכה מהחוף מותרת רק היכן שתקנון השמורה מתיר.</p>
        <ul class="plain">
          {BEACHES.filter((b) => b.legalNote).map((b) => (
            <li key={b.id}><strong>{b.name}:</strong> {b.legalNote}</li>
          ))}
        </ul>
        <p class="muted small">המפות להמחשה בלבד. בספק, מוקד רט"ג: <a href="tel:*3639" dir="ltr">3639*</a></p>
      </Rule>
    </Page>
  );
}
