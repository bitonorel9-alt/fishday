import { useState } from "preact/hooks";
import { firstName, signUp, validEmail, validName, type Account } from "../data/account";
import { trackEvent } from "../data/analytics";
import { Mascot } from "../ui/Mascot";
import { Logo } from "../ui/parts";

// אותו דג זהב בקו כמו בלוגו, פונה שמאלה.
function GoldFish() {
  return (
    <svg viewBox="-160 -90 312 180" aria-hidden="true">
      <g transform="scale(-1 1)" fill="none" stroke="currentColor" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">
        <path d="M140 6C128-40 74-78 4-76C-50-74-92-50-112-22L-150-58C-144-30-140-14-134 2C-140 18-144 34-150 62L-112 28C-90 56-46 76 6 74C70 72 122 46 140 6Z" />
        <path d="M78-52C92-20 92 22 78 52" />
        <circle cx="104" cy="-22" r="9" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** הים מאחורי ההרשמה: קרני אור, דגי זהב שוחים ובועות. */
function JoinSea() {
  return (
    <div class="join-sea" aria-hidden="true">
      <div class="rays" />
      {[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n} class={`join-fish jf${n}`}><GoldFish /></span>)}
      {[0, 1, 2, 3, 4, 5].map((n) => <i key={n} class={`bubble b${n}`} />)}
    </div>
  );
}

export function Join({ onDone, onLater }: { onDone: (account: Account) => void; onLater: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [updates, setUpdates] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "limit" | "invalid" | "failed">("idle");
  const [done, setDone] = useState<Account | null>(null);
  const ready = validName(name) && validEmail(email);

  if (done) {
    return (
      <div class="join" role="dialog" aria-modal="true" aria-labelledby="join-title">
        <JoinSea />
        <div class="join-panel join-done">
          <Mascot mood="great" size={112} />
          <h1 id="join-title" class="join-title">נעים להכיר, {firstName(done)}!</h1>
          <p class="join-lead">מעכשיו אני מכיר אותך. כל בוקר אגיד לך איפה הים הכי טוב.</p>
          <button type="button" class="primary join-go" onClick={() => onDone(done)}>יאללה לים</button>
        </div>
      </div>
    );
  }

  return (
    <div class="join" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <JoinSea />
      <div class="join-panel">
        <div class="join-brand" dir="ltr">
          <Logo size={58} />
          <span class="hero-wordmark">Fish<span>Day</span></span>
        </div>
        <p class="hero-tagline">דיג בזמן הנכון</p>

        <div class="join-dani">
          <Mascot mood="hello" size={64} />
          <div class="mascot-bubble">
            <span class="mascot-name">דני</span>
            <p id="join-title">נעים מאוד, אני דני. איך קוראים לך?</p>
          </div>
        </div>

        <form class="join-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!ready) return;
          setState("sending");
          const result = await signUp(name, email, updates);
          if (result === "ok") {
            trackEvent("signup");
            setDone({ name: name.trim(), email: email.trim().toLowerCase(), updates, joinedAt: Date.now() });
          } else setState(result);
        }}>
          <label class="field"><span>שם מלא</span>
            <input type="text" autoComplete="name" maxLength={60} required value={name} placeholder="למשל: ישראל ישראלי" onInput={(e) => setName(e.currentTarget.value)} />
          </label>
          <label class="field"><span>מייל</span>
            <input type="email" dir="ltr" inputMode="email" autoComplete="email" maxLength={254} required value={email} placeholder="name@example.com" onInput={(e) => setEmail(e.currentTarget.value)} />
          </label>
          <label class="join-check">
            <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.currentTarget.checked)} />
            <span>אשמח לקבל במייל עדכונים על FishDay</span>
          </label>
          {state === "invalid" && <p class="alert" role="alert">משהו בשם או במייל לא תקין. בדוק ונסה שוב.</p>}
          {state === "limit" && <p class="alert" role="alert">יותר מדי ניסיונות היום. נסה שוב מחר.</p>}
          {state === "failed" && <p class="alert" role="alert">אין חיבור לשרת. בדוק קליטה ונסה שוב.</p>}
          <button type="submit" class="primary" disabled={!ready || state === "sending"}>{state === "sending" ? "שולח…" : "הצטרפות"}</button>
          <button type="button" class="join-later" onClick={onLater}>אולי אחר כך</button>
          <p class="join-note">
            השם והמייל נשמרים בשרת של FishDay ב-Cloudflare. הם משמשים כדי שדני יפנה אליך בשם, ולעדכונים רק אם סימנת. אין חובה חוקית למסור אותם, והם לא מועברים לאף אחד. אפשר למחוק אותם בכל רגע בהגדרות. <a href="#/privacy">פרטיות</a>
          </p>
        </form>
      </div>
    </div>
  );
}
