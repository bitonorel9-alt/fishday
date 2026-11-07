import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSettings, windLabel, windValue } from "./settings";

describe("יחידות רוח", () => {
  it('קמ"ש נשאר', () => expect(windValue(20.4, "kmh")).toBe(20));
  it("המרה לקשר", () => expect(windValue(18.52, "knots")).toBe(10));
  it("תווית", () => expect(windLabel("knots")).toBe("קשר"));
});

function fakeStorage(data: Record<string, unknown>) {
  const map = new Map(Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]));
  vi.stubGlobal("localStorage", { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => map.set(k, v) });
}

describe("ערכת צבעים", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("משתמש חדש מקבל מצב כהה", () => {
    fakeStorage({});
    expect(loadSettings().theme).toBe("dark");
  });
  it("מי שהיה על אוטומטי בגרסה הקודמת עובר לכהה, ושאר ההגדרות נשמרות", () => {
    fakeStorage({ "fishday.settings.v1": { theme: "system", windUnit: "knots" } });
    const s = loadSettings();
    expect(s.theme).toBe("dark");
    expect(s.windUnit).toBe("knots");
  });
  it("מי שבחר בהיר נשאר בהיר", () => {
    fakeStorage({ "fishday.settings.v1": { theme: "light" } });
    expect(loadSettings().theme).toBe("light");
  });
  it("בחירה חדשה נשמרת בגרסה 2", () => {
    fakeStorage({ "fishday.settings.v1": { theme: "light" }, "fishday.settings.v2": { theme: "system" } });
    expect(loadSettings().theme).toBe("system");
  });
});
