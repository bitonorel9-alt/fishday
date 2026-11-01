const FISH_SVG = `<svg viewBox="0 0 48 30" aria-hidden="true"><path d="M3 15C9 5 24 2 37 8l9-6-2 13 2 13-9-6C24 28 9 25 3 15Z" fill="url(#g)"/><circle cx="14" cy="13" r="1.800" fill="#075985"/><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffd66e"/><stop offset="1" stop-color="#ff7a36"/></linearGradient></defs></svg>`;

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
