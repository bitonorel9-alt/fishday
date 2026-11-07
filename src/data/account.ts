/**
 * הרשמה לא חובה: שם מלא ומייל. נשמרים בטלפון, ונשלחים לשרת של FishDay רק כשהמשתמש נרשם.
 * בלי סיסמה ובלי אימות מייל בשלב הזה.
 */
import { deviceId, STATS_URL } from "./analytics";
import { readJson, writeJson } from "./storage";

const KEY = "fishday.account";
const SKIP_KEY = "fishday.join.skipped";

export interface Account {
  name: string;
  email: string;
  updates: boolean;
  joinedAt: number;
}

export const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export function loadAccount(): Account | null {
  return readJson<Account>(KEY);
}

/** השם הפרטי, כדי שדני יפנה אישית. */
export function firstName(account: Account | null): string | null {
  return account?.name.trim().split(/\s+/)[0] || null;
}

export function joinSkipped(): boolean {
  return readJson<number>(SKIP_KEY) !== null;
}

export function skipJoin() {
  writeJson(SKIP_KEY, Date.now());
}

export function validName(name: string): boolean {
  const n = name.trim();
  return n.length >= 2 && n.length <= 60;
}

export function validEmail(email: string): boolean {
  return email.trim().length <= 254 && EMAIL_PATTERN.test(email.trim());
}

async function post(path: string, body: unknown): Promise<number> {
  const r = await fetch(`${STATS_URL}${path}`, { method: "POST", body: JSON.stringify(body) });
  return r.status;
}

export async function signUp(name: string, email: string, updates: boolean): Promise<"ok" | "limit" | "invalid" | "failed"> {
  const account: Account = { name: name.trim().replace(/\s+/g, " "), email: email.trim().toLowerCase(), updates, joinedAt: Date.now() };
  try {
    const status = await post("/signup", { d: deviceId(), n: account.name, e: account.email, u: updates });
    if (status === 429) return "limit";
    if (status === 400) return "invalid";
    if (status >= 300) return "failed";
    writeJson(KEY, account);
    return "ok";
  } catch {
    return "failed";
  }
}

/** מוחק מהשרת ומהטלפון. */
export async function deleteAccount(account: Account): Promise<boolean> {
  try {
    const status = await post("/signup/delete", { d: deviceId(), e: account.email });
    if (status >= 300) return false;
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
