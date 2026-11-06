import { readJson } from "../data/storage";

/** כרטיס הכניסה למשחק: סונאר דייגים שמאתר דגים, עם השיא האישי. */
export function QuizBanner({ compact = false }: { compact?: boolean }) {
  const best = readJson<{ mixed?: number; photos?: number }>("fishday.game.best.v1");
  const top = Math.max(best?.mixed ?? 0, best?.photos ?? 0);
  return (
    <a class={`quiz-banner${compact ? " quiz-compact" : ""}`} href="#/game">
      <svg class="quiz-sonar" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="sonar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#0e4d6b" />
            <stop offset="1" stop-color="#062338" />
          </radialGradient>
          <linearGradient id="sonar-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#19c3d1" stop-opacity="0" />
            <stop offset="1" stop-color="#19c3d1" stop-opacity=".55" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#sonar-bg)" stroke="#19c3d1" stroke-opacity=".5" />
        <g fill="none" stroke="#19c3d1" stroke-opacity=".28">
          <circle cx="60" cy="60" r="42" />
          <circle cx="60" cy="60" r="26" />
          <path d="M60 2v116M2 60h116" />
        </g>
        <g class="quiz-sweep">
          <path d="M60 60 L60 2 A58 58 0 0 1 110 31 Z" fill="url(#sonar-sweep)" />
        </g>
        <g fill="#ffb23e">
          <path d="M33 40c3-4 9-5 14-2l4-3-1 5 1 5-4-3c-5 3-11 2-14-2Z" class="quiz-blip" />
          <path d="M70 76c3-4 9-5 14-2l4-3-1 5 1 5-4-3c-5 3-11 2-14-2Z" class="quiz-blip quiz-blip-2" />
        </g>
        <circle cx="86" cy="38" r="3.500" fill="#f2545b" class="quiz-blip quiz-blip-3" />
        <circle cx="60" cy="60" r="4" fill="#e6fbff" />
      </svg>
      <span class="quiz-text">
        <span class="quiz-kicker">משחק דייגים</span>
        <strong>כמה אתה מכיר את הים?</strong>
        <span class="quiz-meta">10 שאלות · זיהוי דגים, חוקים ובטיחות{top > 0 && <> · השיא שלך <bdi>{top}</bdi></>}</span>
        <span class="quiz-cta">שחק עכשיו
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </span>
      </span>
    </a>
  );
}
