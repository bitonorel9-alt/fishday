import { describe, expect, it } from "vitest";
import { FISH } from "./fish";
import { FISH_ID, identifyFish, TRAITS } from "./fishId";
import { FISH_PHOTOS } from "./fishPhotos";

describe("identifyFish", () => {
  it("פסים עם כתם לפני הזנב: סרגוס ראשון", () => {
    expect(identifyFish(["vertical-bars", "tail-spot"])[0]?.id).toBe("sargus");
  });
  it("פסים בלבד מחזיר כמה מועמדים", () => {
    expect(identifyFish(["vertical-bars"]).map((m) => m.id)).toEqual(expect.arrayContaining(["sargus", "mormyrus"]));
  });
  it("פס זהב: דניס", () => expect(identifyFish(["gold-head"])[0]?.id).toBe("denis"));
  it("בלי בחירה אין תוצאות", () => expect(identifyFish([])).toEqual([]));
});

describe("תוכן הדגים", () => {
  it.each(FISH.map((f) => f.id))("%s: יש סימני זיהוי ותמונה עם קרדיט", (id) => {
    expect(FISH_ID[id]?.identify.length).toBeGreaterThanOrEqual(2);
    const photo = FISH_PHOTOS[id];
    expect(photo?.file).toBeTruthy();
    expect(photo?.license).toBeTruthy();
    expect(photo?.source).toMatch(/^https:/);
  });
  it("לכל סימן יש לפחות דג אחד", () => {
    for (const t of TRAITS) expect(identifyFish([t.id]).length).toBeGreaterThan(0);
  });
});
