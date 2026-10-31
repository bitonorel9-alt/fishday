const TZ = "Asia/Jerusalem";

export interface LocalNow {
  date: string;
  hour: number;
}

export function israelNow(at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-31T05:56" לשעה עשרונית. */
export function hourOf(localIso: string): number {
  const [h = "0", m = "0"] = (localIso.split("T")[1] ?? "").split(":");
  return Number(h) + Number(m) / 60;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatHour(decimal: number): string {
  const total = Math.round(decimal * 60);
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
}
