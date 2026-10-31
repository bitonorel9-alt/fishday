/** localStorage עלול להיכשל במצב פרטי. האפליקציה ממשיכה לעבוד גם בלעדיו. */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אין מקום או אין גישה: מוותרים על השמירה.
  }
}
