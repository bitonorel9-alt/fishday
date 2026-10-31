export interface CatchEntry {
  id: string;
  date: string;
  beachId: string;
  fish: string;
  sizeCm: number | null;
  bait: string;
  photo: Blob | null;
  createdAt: number;
}

const DB_NAME = "fishday";
const STORE = "catches";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listCatches(): Promise<CatchEntry[]> {
  const all = await withStore<CatchEntry[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export const saveCatch = (entry: CatchEntry) => withStore("readwrite", (s) => s.put(entry));
export const deleteCatch = (id: string) => withStore("readwrite", (s) => s.delete(id));

/** מקטין תמונה לפני שמירה, כדי לא למלא את אחסון המכשיר. */
export async function shrinkPhoto(file: File, maxSide = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Photo failed"))), "image/jpeg", 0.8);
  });
}
