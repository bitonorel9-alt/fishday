import { useEffect, useMemo, useState } from "preact/hooks";
import { belowMinimum, SEA_FISH } from "../content/rules";
import { trackEvent } from "../data/analytics";
import { deleteCatch, listCatches, saveCatch, shrinkPhoto, type CatchEntry } from "../data/catchLog";
import { BEACHES } from "../domain/beaches";
import type { LocalNow } from "../domain/time";
import { shortDate } from "../ui/format";
import { Page } from "../ui/parts";
import { loadSettings } from "../ui/settings";
import { castSound, reelSound } from "../ui/sound";

function Photo({ blob, alt }: { blob: Blob; alt: string }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt={alt} loading="lazy" />;
}

function CatchForm({ now, onSaved, onCancel }: { now: LocalNow; onSaved: () => void; onCancel: () => void }) {
  const [date, setDate] = useState(now.date);
  const [beachId, setBeachId] = useState(() => loadSettings().homeBeach ?? "atlit");
  const [fish, setFish] = useState("");
  const [size, setSize] = useState("");
  const [bait, setBait] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const sizeCm = size === "" ? null : Number(size);
  const minimum = sizeCm === null ? null : belowMinimum(fish, sizeCm);

  async function submit(e: Event) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveCatch({
        id: crypto.randomUUID(),
        date,
        beachId,
        fish: fish.trim(),
        sizeCm,
        bait: bait.trim(),
        photo: file ? await shrinkPhoto(file) : null,
        createdAt: Date.now(),
      });
      trackEvent("catch_saved", { photo: file !== null });
      const { clickSounds, volume } = loadSettings();
      if (clickSounds) reelSound(volume);
      onSaved();
    } catch {
      setError("השמירה נכשלה. נסה שוב.");
      setSaving(false);
    }
  }

  return (
    <form class="card log-form" onSubmit={submit}>
      <label class="field"><span>תאריך</span>
        <input type="date" required value={date} max={now.date} onInput={(e) => setDate(e.currentTarget.value)} />
      </label>
      <label class="field"><span>חוף</span>
        <select value={beachId} onChange={(e) => setBeachId(e.currentTarget.value)}>
          {BEACHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <label class="field"><span>דג</span>
        <input required list="fish-names" value={fish} onInput={(e) => setFish(e.currentTarget.value)} />
        <datalist id="fish-names">
          {[...new Set(SEA_FISH.map((f) => f.name))].map((n) => <option key={n} value={n} />)}
        </datalist>
      </label>
      <label class="field"><span>גודל בס"מ</span>
        <input type="number" inputMode="numeric" min="1" max="400" value={size} onInput={(e) => setSize(e.currentTarget.value)} />
      </label>
      {minimum !== null && <p class="alert">מתחת למינימום של {minimum} ס"מ. מחזירים למים מיד.</p>}
      <label class="field"><span>פיתיון</span>
        <input value={bait} onInput={(e) => setBait(e.currentTarget.value)} />
      </label>
      <label class="field"><span>תמונה</span>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} />
      </label>
      {error && <p class="alert" role="alert">{error}</p>}
      <div class="form-actions">
        <button type="submit" class="primary" disabled={saving}>{saving ? "שומר…" : "שמירה"}</button>
        <button type="button" class="secondary" onClick={onCancel}>ביטול</button>
      </div>
    </form>
  );
}

export function Log({ now }: { now: LocalNow }) {
  const [entries, setEntries] = useState<CatchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = () => listCatches().then(setEntries).catch(() => setFailed(true));
  useEffect(() => { void load(); }, []);

  async function remove(entry: CatchEntry) {
    if (!confirm(`למחוק את ${entry.fish} מהיומן?`)) return;
    await deleteCatch(entry.id);
    void load();
  }

  return (
    <Page title="יומן שלל">
      <p class="muted">נשמר רק במכשיר הזה.</p>
      {failed && <p class="alert" role="alert">אין גישה לאחסון במכשיר. היומן לא זמין במצב פרטי.</p>}
      {adding ? (
        <CatchForm now={now} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />
      ) : (
        <button type="button" class="primary wide" onClick={() => {
          const { clickSounds, volume } = loadSettings();
          if (clickSounds) castSound(volume);
          setAdding(true);
        }}>הוספת שלל</button>
      )}
      {entries?.length === 0 && !adding && <p class="muted empty">עדיין אין שלל. הדג הראשון מחכה.</p>}
      <ul class="catch-list">
        {entries?.map((c) => (
          <li class="card catch" key={c.id}>
            {c.photo && <Photo blob={c.photo} alt={`${c.fish} מ${BEACHES.find((b) => b.id === c.beachId)?.name ?? ""}`} />}
            <div class="catch-body">
              <strong>{c.fish}{c.sizeCm !== null && <> · <bdi>{c.sizeCm}</bdi> ס"מ</>}</strong>
              <span class="muted small">{BEACHES.find((b) => b.id === c.beachId)?.name} · {shortDate(c.date)}{c.bait && ` · ${c.bait}`}</span>
              <button type="button" class="link-danger" onClick={() => void remove(c)}>מחיקה</button>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
