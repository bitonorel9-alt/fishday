import { describe, expect, it } from "vitest";
import { BEACHES } from "../domain/beaches";
import { parseForecast } from "./forecast";

const times = ["2026-10-31T05:00", "2026-10-31T06:00"];
const marine = BEACHES.map(() => ({
  hourly: { time: times, wave_height: [0.8, null], wave_period: [6, 6], wave_direction: [280, 280], sea_surface_temperature: [25, 25] },
}));
const weather = BEACHES.map(() => ({
  hourly: { time: times, wind_speed_10m: [8, 9], wind_gusts_10m: [15, 16], wind_direction_10m: [90, 90], temperature_2m: [20, 21] },
  daily: { time: ["2026-10-31"], sunrise: ["2026-10-31T05:56"], sunset: ["2026-10-31T16:50"] },
}));

describe("parseForecast", () => {
  const f = parseForecast(marine, weather, 1000);
  const first = f.hours.atlit![0]!;
  const second = f.hours.atlit![1]!;

  it("מחבר ים ומזג אוויר", () => {
    expect(first.waveHeight).toBe(0.8);
    expect(first.windSpeed).toBe(8);
    expect(first.hour).toBe(5);
    expect(first.date).toBe("2026-10-31");
  });
  it("ערך חסר נשאר null ולא הופך ל-0", () => expect(second.waveHeight).toBeNull());
  it("זריחה ושקיעה בשעה עשרונית", () => expect(f.days[0]!.sun.sunrise).toBeCloseTo(5.933, 2));
  it("מיישר לפי זמן גם כשהסדר שונה", () => {
    const shifted = marine.map((m) => ({ hourly: { ...m.hourly, time: [times[1]!, "2026-10-31T07:00"] } }));
    const r = parseForecast(shifted, weather, 1000);
    expect(r.hours.atlit![0]!.waveHeight).toBeNull();
    expect(r.hours.atlit![1]!.waveHeight).toBe(0.8);
  });
  it("תשובה חלקית נכשלת במקום להציג נתונים שגויים", () => {
    expect(() => parseForecast(marine.slice(1), weather, 1000)).toThrow();
  });
});
