import { useEffect, useState } from "preact/hooks";

const FISH = "M8 30c14-16 40-20 64-8l18-12-4 20 4 20-18-12c-24 12-50 8-64-8z";
const SHARK = "M4 46c30-14 60-20 88-21l11-22 11 23c21 2 41 6 60 12l22-19-6 25 6 23-24-15c-24 6-48 8-72 8l-8 15-9-15c-30 0-60-7-79-14z";
const TURTLE = "M8 34c6-5 13-6 20-3 8-13 22-19 38-18 16 0 28 8 36 20l14-4-6 11 6 11-14-4c-7 8-14 12-22 13l10 12-16-4-10-8H46l-14 9 4-13c-5-3-9-7-11-12-7 2-13 0-17-5z";

function Fish({ class: cls }: { class: string }) {
  return (
    <div class={`swim ${cls}`}>
      <svg viewBox="0 0 96 60"><path d={FISH} /><circle cx="22" cy="27" r="2.500" class="eye" /></svg>
    </div>
  );
}

function Jelly({ class: cls }: { class: string }) {
  return (
    <div class={`jelly ${cls}`}>
      <svg viewBox="0 0 60 90"><path d="M6 36C6 14 18 4 30 4s24 10 24 32c-8 5-40 5-48 0z" /><path d="M14 42c-4 12 4 18 0 34M26 44c-3 14 4 20 0 38M38 44c3 14-4 20 0 38M48 42c4 12-4 18 0 34" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round" /></svg>
    </div>
  );
}

/** העולם התת-ימי מאחורי הכיתוב. קישוט בלבד, ולכן נטען אחרי שהתוכן על המסך. */
export function Underwater() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3500);
    return () => clearTimeout(timer);
  }, []);
  if (!ready) return <div class="sea" aria-hidden="true" />;

  return (
    <div class="sea" aria-hidden="true">
      <div class="rays" />
      <div class="swim shark shark-1"><svg viewBox="0 0 200 92"><path d={SHARK} /></svg></div>
      <div class="swim shark shark-2"><svg viewBox="0 0 200 92"><path d={SHARK} /></svg></div>
      <div class="swim turtle"><svg viewBox="0 0 124 76"><path d={TURTLE} /></svg></div>
      <Fish class="f1" />
      <Fish class="f2" />
      <Fish class="f3" />
      <div class="swim school">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <svg key={i} viewBox="0 0 96 60"><path d={FISH} /></svg>)}
      </div>
      <Jelly class="j1" />
      <Jelly class="j2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} class={`bubble b${i}`} />)}
    </div>
  );
}
