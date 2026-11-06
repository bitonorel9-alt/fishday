import { BEACHES, REGIONS } from "../domain/beaches";
import type { ScoredForecast } from "../domain/insights";
import type { LocalNow } from "../domain/time";
import { BeachRow, Page } from "../ui/parts";

interface Props {
  scored: ScoredForecast;
  now: LocalNow;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export function Beaches({ scored, now, favorites, onToggleFavorite }: Props) {
  return (
    <Page title="חופים">
      <p class="muted">מצפון לדרום. הציון הוא לשעה הנוכחית, והעקומה מראה את 12 השעות הבאות.</p>
      {REGIONS.map((region) => {
        const here = BEACHES.filter((b) => b.region === region);
        return here.length ? (
          <section key={region} class="region">
            <h2 class="section-title">{region}</h2>
            <ul class="beach-list">
              {here.map((beach) => (
                <BeachRow key={beach.id} beach={beach} hours={scored[beach.id] ?? []} now={now} favorite={favorites.includes(beach.id)} onToggle={() => onToggleFavorite(beach.id)} />
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </Page>
  );
}
