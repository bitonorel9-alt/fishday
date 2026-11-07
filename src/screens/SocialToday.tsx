import { useEffect, useState } from "preact/hooks";

interface SocialVideo {
  file: string;
  title: string;
  caption: string;
  seconds: number;
}

interface Manifest {
  date: string;
  createdAt: string;
  videos: SocialVideo[];
}

const BASE = `${import.meta.env.BASE_URL}social/`;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" class="secondary" onClick={async () => {
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      } catch {
        setDone(false);
      }
    }}>{done ? "הועתק ✓" : "העתק כיתוב"}</button>
  );
}

/** שלושת סרטוני הסושיאל שנוצרו הבוקר: צפייה, הורדה וכיתוב מוכן. */
export function SocialToday() {
  const [data, setData] = useState<Manifest | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${BASE}today.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => setData(m))
      .catch(() => setError(true));
  }, []);

  if (error) return <section class="card rule"><h2>סרטוני היום</h2><p class="muted">עוד אין סרטונים. הם נוצרים כל בוקר ב-8:00.</p></section>;
  if (!data) return <section class="card rule"><h2>סרטוני היום</h2><p class="muted" role="status">טוען…</p></section>;

  const made = new Date(data.createdAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <section class="card rule">
      <h2>סרטוני היום</h2>
      <p class="muted small">נוצרו ב-<bdi>{made}</bdi>. מורידים, מעלים לאינסטגרם ולטיקטוק, ומדביקים את הכיתוב.</p>
      <div class="social-list">
        {data.videos.map((v) => (
          <article key={v.file} class="social-item">
            <video src={`${BASE}${v.file}?d=${data.date}`} controls playsInline preload="metadata" />
            <div class="social-body">
              <strong>{v.title}</strong>
              <pre class="social-caption">{v.caption}</pre>
              <div class="form-actions">
                <a class="primary btn-link" href={`${BASE}${v.file}?d=${data.date}`} download={`fishday-${data.date}-${v.file}`}>הורדה</a>
                <CopyButton text={v.caption} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
