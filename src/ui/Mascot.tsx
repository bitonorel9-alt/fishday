import { useId } from "preact/hooks";
import type { Mood } from "../domain/advice";

const L = "#f1d58e";
// ראש הדניס מהצד, פונה שמאלה, בתוך מסגרת 200x200. אותו קו זהב כמו בלוגו.
const HEAD = "M206 30C150 22 84 46 44 98C32 114 32 128 44 138C78 166 140 186 206 188";
const GILL = "M156 44C134 92 134 140 156 186";
const SCALES = "M176 78q10 10 0 20M176 112q10 10 0 20M176 146q10 10 0 20";

const EYE = {
  open: <><circle cx="96" cy="94" r="21" /><circle cx="92" cy="96" r="9.5" fill={L} stroke="none" /><circle cx="88" cy="92" r="3" fill="#0b3a40" stroke="none" /></>,
  sure: <><circle cx="96" cy="94" r="21" /><path d="M75 88H117" /><circle cx="92" cy="101" r="8.5" fill={L} stroke="none" /></>,
  wide: <><circle cx="96" cy="94" r="24" /><circle cx="96" cy="94" r="6" fill={L} stroke="none" /></>,
  closed: <path d="M75 96Q96 112 117 96" />,
  wink: <path d="M75 100Q96 82 117 100" />,
};
const BROW = {
  calm: "M66 62Q96 46 126 58",
  up: "M66 54Q96 32 126 48",
  worried: "M66 52Q96 52 124 66",
  low: "M68 68Q96 60 124 68",
};
const MOUTH = {
  smile: <path d="M44 128Q62 146 86 134" />,
  smirk: <path d="M48 132Q66 140 84 130" />,
  flat: <path d="M48 134L80 132" />,
  o: <circle cx="60" cy="134" r="9" />,
  open: <path d="M42 126Q64 156 90 132Z" />,
};
const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`;

const FACE: Record<Mood, { eye: keyof typeof EYE; brow: keyof typeof BROW; mouth: keyof typeof MOUTH; prop?: preact.JSX.Element }> = {
  hello: { eye: "open", brow: "up", mouth: "smile" },
  recommend: { eye: "sure", brow: "calm", mouth: "smirk", prop: <path d={`${star(30, 46, 11)}${star(52, 26, 6)}`} fill={L} stroke="none" /> },
  great: { eye: "open", brow: "up", mouth: "open", prop: <path d={`${star(34, 44, 10)}${star(140, 16, 7)}`} fill={L} stroke="none" /> },
  warn: { eye: "wide", brow: "worried", mouth: "o", prop: <path d="M0 178c14 0 14-12 28-12s14 12 28 12 14-12 28-12 14 12 28 12" stroke={L} stroke-width="5" /> },
  tip: { eye: "wink", brow: "up", mouth: "smile", prop: <path d="M38 0V40a14 14 0 0 1-28 0v-8M10 32l8 8" stroke={L} stroke-width="5" /> },
  night: { eye: "closed", brow: "low", mouth: "flat", prop: <path d={`M44 18a20 20 0 1 0 18 30 16 16 0 1 1-18-30Z${star(76, 22, 5)}`} fill={L} stroke="none" /> },
};

/** דני, הדג של FishDay: מדליון זהב עם ראש הדניס. ההבעה משתנה לפי מה שהוא אומר. */
export function Mascot({ mood, size = 56 }: { mood: Mood; size?: number }) {
  const id = useId();
  const f = FACE[mood];
  return (
    <svg class="mascot" viewBox="0 0 220 220" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f7e2a6" /><stop offset=".45" stop-color="#d2a64e" /><stop offset=".7" stop-color="#f1d58e" /><stop offset="1" stop-color="#b8883a" />
        </linearGradient>
        <radialGradient id={`${id}b`} cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#13565e" /><stop offset="1" stop-color="#06262c" /></radialGradient>
        <clipPath id={`${id}c`}><circle cx="110" cy="110" r="96" /></clipPath>
      </defs>
      <circle cx="110" cy="110" r="96" fill={`url(#${id}b)`} />
      <g clip-path={`url(#${id}c)`} transform="translate(10 10)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d={HEAD} stroke={`url(#${id}g)`} stroke-width="7" />
        <path d={GILL} stroke={`url(#${id}g)`} stroke-width="5" />
        <path d={SCALES} stroke={`url(#${id}g)`} stroke-width="3.5" opacity=".55" />
        <g stroke={L} stroke-width="5">{EYE[f.eye]}{MOUTH[f.mouth]}</g>
        <path d={BROW[f.brow]} stroke={L} stroke-width="10" />
        {f.prop}
      </g>
      <circle cx="110" cy="110" r="100" fill="none" stroke={`url(#${id}g)`} stroke-width="5" />
      <circle cx="110" cy="110" r="92" fill="none" stroke={`url(#${id}g)`} stroke-width="1.5" opacity=".6" />
    </svg>
  );
}

/** הדג אומר משהו: מדליון ובועת טקסט. */
export function MascotSays({ mood, text, inline = false, onClose }: { mood: Mood; text: string; inline?: boolean; onClose?: () => void }) {
  return (
    <div class={`${inline ? "" : "card "}mascot-says${mood === "warn" ? " mascot-warn" : ""}`}>
      <Mascot mood={mood} />
      <div class="mascot-bubble">
        <span class="mascot-name">דני</span>
        <p>{text}</p>
      </div>
      {onClose && <button type="button" class="mascot-close" aria-label="הסתר את האזהרה עד מחר" onClick={onClose}>×</button>}
    </div>
  );
}
