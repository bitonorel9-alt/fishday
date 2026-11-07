import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { deleteAccount, type Account } from "../data/account";
import { BEACHES } from "../domain/beaches";
import { Page } from "../ui/parts";
import type { Settings as S, TextSize, ThemeChoice, WindUnit } from "../ui/settings";
import { setVolume, startOcean, stopOcean } from "../ui/sound";

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div class="setting">
      <span class="setting-label">{label}</span>
      <div class="segment" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button type="button" key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="setting setting-row">
      <span>
        <span class="setting-label">{label}</span>
        {hint && <span class="muted small setting-hint">{hint}</span>}
      </span>
      <input type="checkbox" class="switch" role="switch" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
    </label>
  );
}

function Group({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="card rule">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function AccountGroup({ account, onChange }: { account: Account | null; onChange: (a: Account | null) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState(false);
  if (!account) {
    return (
      <a class="card link-card" href="#/join">
        <strong>הצטרפות ל-FishDay</strong>
        <span class="muted small">שם ומייל, ודני יפנה אליך בשם</span>
      </a>
    );
  }
  return (
    <Group title="החשבון שלי">
      <p><strong>{account.name}</strong></p>
      <p class="muted small"><bdi dir="ltr">{account.email}</bdi></p>
      <p class="muted small">{account.updates ? "מקבל עדכונים במייל." : "בלי עדכונים במייל."}</p>
      {error && <p class="alert" role="alert">המחיקה לא הצליחה. בדוק חיבור ונסה שוב.</p>}
      {confirm ? (
        <div class="form-actions">
          <button type="button" class="secondary" onClick={() => setConfirm(false)}>ביטול</button>
          <button type="button" class="primary" onClick={async () => {
            const ok = await deleteAccount(account);
            setError(!ok);
            if (ok) onChange(null);
          }}>כן, למחוק</button>
        </div>
      ) : (
        <button type="button" class="link-danger" onClick={() => setConfirm(true)}>מחק את הפרטים שלי</button>
      )}
      {confirm && <p class="muted small">השם והמייל יימחקו מהשרת ומהטלפון. אי אפשר לבטל.</p>}
    </Group>
  );
}

export function Settings({ settings, update, account, onAccountChange }: { settings: S; update: (patch: Partial<S>) => void; account: Account | null; onAccountChange: (a: Account | null) => void }) {
  return (
    <Page title="הגדרות">
      <AccountGroup account={account} onChange={onAccountChange} />

      <Group title="תצוגה">
        <Segment<ThemeChoice> label="מצב" value={settings.theme} onChange={(theme) => update({ theme })}
          options={[["system", "אוטומטי"], ["light", "בהיר"], ["dark", "כהה"]]} />
        <Segment<TextSize> label="גודל כתב" value={settings.textSize} onChange={(textSize) => update({ textSize })}
          options={[["normal", "רגיל"], ["large", "גדול"], ["xlarge", "גדול מאוד"]]} />
        <Toggle label="עולם תת-ימי" hint="כרישים, דגים ובועות ברקע" checked={settings.seaScene} onChange={(seaScene) => update({ seaScene })} />
        <Toggle label="דג קופץ במגע" hint="דג קטן קופץ מכל לחיצה" checked={settings.tapFish} onChange={(tapFish) => update({ tapFish })} />
      </Group>

      <Group title="צלילים">
        <Toggle label="רעש ים" hint="מתנגן כשהאפליקציה פתוחה" checked={settings.oceanSound}
          onChange={(oceanSound) => { update({ oceanSound }); if (oceanSound) startOcean(settings.volume); else stopOcean(); }} />
        <Toggle label="קליקים ורולר" hint="תקתוק של רולר בלחיצות, וגלגול כשמוסיפים שלל" checked={settings.clickSounds} onChange={(clickSounds) => update({ clickSounds })} />
        <label class="setting">
          <span class="setting-label">עוצמה</span>
          <input type="range" min="0.1" max="1" step="0.1" value={settings.volume}
            onInput={(e) => { const volume = Number(e.currentTarget.value); update({ volume }); setVolume(volume); }} />
        </label>
        <p class="muted small">באייפון, מתג ההשתקה בצד מכבה גם את הצלילים האלה. הקלטת הגלים: <a href="https://commons.wikimedia.org/wiki/File:Ocean_Waves_on_a_Tropical_Beach.ogg" target="_blank" rel="noopener">Jarrod Stanley</a>, CC0.</p>
      </Group>

      <Group title="דיג">
        <label class="setting">
          <span class="setting-label">החוף שלי</span>
          <select value={settings.homeBeach ?? ""} onChange={(e) => update({ homeBeach: e.currentTarget.value || null })}>
            <option value="">החוף הכי טוב עכשיו</option>
            {BEACHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <p class="muted small">החוף שתבחר יופיע ראשון במסך הבית.</p>
        <Segment<WindUnit> label="יחידות רוח" value={settings.windUnit} onChange={(windUnit) => update({ windUnit })}
          options={[["kmh", 'קמ"ש'], ["knots", "קשר"]]} />
      </Group>

      <a class="card link-card" href="#/feedback/other">
        <strong>דווח על טעות</strong>
        <span class="muted small">ציון לא נכון, חוק שהשתנה, רעיון</span>
      </a>

      <a class="card link-card" href="#/privacy">
        <strong>פרטיות</strong>
        <span class="muted small">מה נשמר בטלפון ומה נשלח</span>
      </a>

      <a class="card link-card" href="#/widget">
        <strong>ווידג'ט לאייפון</strong>
        <span class="muted small">ציון חי על מסך הבית</span>
      </a>

      <a class="card link-card" href="#/terms">
        <strong>תנאי שימוש ובטיחות</strong>
        <span class="muted small">הציון הוא הערכה, והים קובע</span>
      </a>

      <a class="card link-card" href="#/accessibility">
        <strong>הצהרת נגישות</strong>
        <span class="muted small">מה עשינו ואיך לדווח על בעיה</span>
      </a>
    </Page>
  );
}
