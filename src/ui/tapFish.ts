// אותו דג זהב בקו כמו בלוגו, פונה שמאלה.
const FISH_SVG = `<svg viewBox="-160 -90 312 180" aria-hidden="true"><defs><linearGradient id="tap-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e2a6"/><stop offset=".45" stop-color="#d2a64e"/><stop offset=".7" stop-color="#f1d58e"/><stop offset="1" stop-color="#b8883a"/></linearGradient></defs><g transform="scale(-1 1)" fill="none" stroke="url(#tap-gold)" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"><path d="M140 6C128-40 74-78 4-76C-50-74-92-50-112-22L-150-58C-144-30-140-14-134 2C-140 18-144 34-150 62L-112 28C-90 56-46 76 6 74C70 72 122 46 140 6Z"/><path d="M78-52C92-20 92 22 78 52"/><circle cx="104" cy="-22" r="11" fill="#f1d58e" stroke="none"/></g></svg>`;

const MAX_ACTIVE = 4;
let active = 0;

/** דג קטן שקופץ מנקודת המגע ונופל עם התזה. */
export function jumpFish(x: number, y: number) {
  if (active >= MAX_ACTIVE) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  active++;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const el = document.createElement("div");
  el.className = "tap-fish";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty("--dir", String(dir));
  el.style.setProperty("--flip", String(-dir));
  el.innerHTML = `<i class="tap-ring"></i><i class="tap-ring tap-ring-2"></i><span>${FISH_SVG}</span>`;
  document.body.append(el);
  setTimeout(() => {
    el.remove();
    active--;
  }, 900);
}
