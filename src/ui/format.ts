import { addDays, pad2, type LocalNow } from "../domain/time";

const weekday = new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" });

const noon = (date: string) => new Date(`${date}T12:00:00Z`);

export function dayLabel(date: string, now: LocalNow): string {
  if (date === now.date) return "היום";
  if (date === addDays(now.date, 1)) return "מחר";
  return weekday.format(noon(date));
}

export function shortDate(date: string): string {
  const d = noon(date);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}`;
}

export const hourLabel = (hour: number) => `${pad2(hour)}:00`;

export function durationLabel(hours: number): string {
  const total = Math.round(hours * 60);
  if (total < 60) return `${total} דק'`;
  const h = Math.floor(total / 60);
  return `${h}:${pad2(total % 60)} שע'`;
}

export function updatedAgo(fetchedAt: number, nowMs: number): string {
  const minutes = Math.max(0, Math.round((nowMs - fetchedAt) / 60_000));
  if (minutes < 1) return "עודכן עכשיו";
  if (minutes < 60) return `עודכן לפני ${minutes} דק'`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "עודכן לפני שעה" : `עודכן לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  return days === 1 ? "עודכן לפני יום" : `עודכן לפני ${days} ימים`;
}
