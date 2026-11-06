import { useState } from "preact/hooks";
import { readJson, writeJson } from "../data/storage";
import { buildRound, pointsFor, rankFor, ROUND_LENGTH, seededRng, type GameMode, type Question } from "../domain/game";
import { Page } from "../ui/parts";
import { loadSettings } from "../ui/settings";
import { clickSound, reelSound } from "../ui/sound";
import { jumpFish } from "../ui/tapFish";

const BEST_KEY = "fishday.game.best.v1";
const BASE = import.meta.env.BASE_URL;

type Best = Record<GameMode, number>;

interface Answer {
  question: Question;
  chosen: string;
  correct: boolean;
}

function Start({ onStart, best }: { onStart: (mode: GameMode) => void; best: Best }) {
  return (
    <Page title="משחק דייגים">
      <p class="muted">10 שאלות. רצף של תשובות נכונות נותן בונוס.</p>
      <button type="button" class="card game-mode" onClick={() => onStart("mixed")}>
        <strong>סבב משולב</strong>
        <span class="muted small">זיהוי דגים, חוקים, גדלים ובטיחות</span>
        {best.mixed > 0 && <span class="game-best">שיא: <bdi>{best.mixed}</bdi></span>}
      </button>
      <button type="button" class="card game-mode" onClick={() => onStart("photos")}>
        <strong>זיהוי בתמונות</strong>
        <span class="muted small">איזה דג זה?</span>
        {best.photos > 0 && <span class="game-best">שיא: <bdi>{best.photos}</bdi></span>}
      </button>
    </Page>
  );
}

function Results({ answers, score, best, mode, onAgain, onMenu }: { answers: Answer[]; score: number; best: number; mode: GameMode; onAgain: () => void; onMenu: () => void }) {
  const correct = answers.filter((a) => a.correct).length;
  const missed = answers.filter((a) => !a.correct);
  return (
    <Page title="סיום">
      <section class="card game-result">
        <span class="game-rank">{rankFor(correct)}</span>
        <strong class="game-score"><bdi>{score}</bdi></strong>
        <span class="muted"><bdi>{correct}</bdi> מתוך {ROUND_LENGTH} נכונות{score >= best && score > 0 ? " · שיא חדש!" : ` · השיא שלך: ${best}`}</span>
      </section>
      {missed.length > 0 && (
        <section class="card rule">
          <h2>מה כדאי לזכור</h2>
          <ul class="plain">
            {missed.map((a) => (
              <li key={a.question.prompt + (a.question.photo ?? "")}>
                {a.question.kind === "photo" ? "הדג בתמונה" : a.question.prompt}: <strong>{a.question.answer}</strong>. <a href={a.question.link}>עוד</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div class="form-actions">
        <button type="button" class="primary" onClick={onAgain}>עוד סבב</button>
        <button type="button" class="secondary" onClick={onMenu}>{mode === "mixed" ? "לזיהוי בתמונות" : "לסבב משולב"}</button>
      </div>
    </Page>
  );
}

export function Game() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [round, setRound] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState<Best>(() => ({ mixed: 0, photos: 0, ...readJson<Partial<Best>>(BEST_KEY) }));

  const start = (m: GameMode) => {
    setMode(m);
    setRound(buildRound(m, seededRng(Date.now())));
    setIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    window.scrollTo(0, 0);
  };

  if (!mode) return <Start onStart={start} best={best} />;

  const question = round[index];
  const answered = answers[index];

  if (!question) {
    return <Results answers={answers} score={score} best={best[mode]} mode={mode} onAgain={() => start(mode)} onMenu={() => start(mode === "mixed" ? "photos" : "mixed")} />;
  }

  const choose = (option: string, e: MouseEvent) => {
    if (answered) return;
    const correct = option === question.answer;
    const nextStreak = correct ? streak + 1 : 0;
    const settings = loadSettings();
    if (correct) {
      if (settings.clickSounds) reelSound(settings.volume);
      if (settings.tapFish) for (let i = 0; i < 3; i++) setTimeout(() => jumpFish(e.clientX, e.clientY), i * 120);
    } else if (settings.clickSounds) {
      clickSound(settings.volume);
    }
    setStreak(nextStreak);
    setScore((s) => s + pointsFor(correct, nextStreak));
    setAnswers((a) => [...a, { question, chosen: option, correct }]);
  };

  const next = () => {
    const last = index + 1 >= round.length;
    if (last && score > best[mode]) {
      const updated = { ...best, [mode]: score };
      setBest(updated);
      writeJson(BEST_KEY, updated);
    }
    setIndex(index + 1);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header class="game-head">
        <button type="button" class="back" onClick={() => setMode(null)} aria-label="יציאה מהמשחק">→</button>
        <div class="game-progress" role="progressbar" aria-valuemin={0} aria-valuemax={round.length} aria-valuenow={index + 1} aria-label={`שאלה ${index + 1} מתוך ${round.length}`}>
          <i style={{ width: `${((index + (answered ? 1 : 0)) / round.length) * 100}%` }} />
        </div>
        <span class="game-points"><bdi>{score}</bdi></span>
      </header>
      {streak >= 2 && <p class="game-streak" role="status">רצף של {streak}!</p>}

      <section class="card game-question">
        <span class="muted small">שאלה {index + 1} מתוך {round.length}</span>
        {question.photo && <img class="game-photo" src={`${BASE}${question.photo}`} alt="דג לזיהוי" loading="eager" decoding="async" />}
        <h1>{question.prompt}</h1>
        <div class="game-options">
          {question.options.map((o) => {
            const state = !answered ? "" : o === question.answer ? "right" : o === answered.chosen ? "wrong" : "dim";
            return (
              <button type="button" key={o} class={`game-option ${state}`} disabled={!!answered} onClick={(e) => choose(o, e)}>{o}</button>
            );
          })}
        </div>
        {answered && (
          <div class="game-feedback" role="status">
            <strong>{answered.correct ? `נכון! +${pointsFor(true, streak)}` : `התשובה: ${question.answer}`}</strong>
            {question.explain && <p>{question.explain}</p>}
            <button type="button" class="primary wide" onClick={next}>{index + 1 >= round.length ? "לתוצאות" : "הבא"}</button>
          </div>
        )}
      </section>
    </>
  );
}
