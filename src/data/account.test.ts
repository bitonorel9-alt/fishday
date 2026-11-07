import { describe, expect, it } from "vitest";
import { withName } from "../domain/advice";
import { firstName, validEmail, validName } from "./account";

describe("פרטי הרשמה", () => {
  it("שם: לפחות 2 תווים, עד 60", () => {
    expect(validName("א")).toBe(false);
    expect(validName("  אוראל ביטון ")).toBe(true);
    expect(validName("א".repeat(61))).toBe(false);
  });
  it("מייל: צורה בסיסית תקינה", () => {
    expect(validEmail("orel@example.com")).toBe(true);
    expect(validEmail(" orel@example.co.il ")).toBe(true);
    expect(validEmail("orel@example")).toBe(false);
    expect(validEmail("orel example.com")).toBe(false);
    expect(validEmail("@example.com")).toBe(false);
  });
  it("שם פרטי מתוך השם המלא", () => {
    expect(firstName({ name: "אוראל ביטון", email: "a@b.co", updates: false, joinedAt: 0 })).toBe("אוראל");
    expect(firstName(null)).toBeNull();
  });
});

describe("דני פונה בשם", () => {
  it("מכניס את השם אחרי הברכה", () => {
    expect(withName("בוקר טוב. קפה, חכה, ויוצאים.", "אוראל")).toBe("בוקר טוב, אוראל. קפה, חכה, ויוצאים.");
    expect(withName("שלום, אני דני.", "אוראל")).toBe("שלום אוראל, אני דני.");
    expect(withName("ים טוב, רוח טובה.", "אוראל")).toBe("אוראל, ים טוב, רוח טובה.");
  });
  it("בלי שם המשפט נשאר כמו שהוא", () => {
    expect(withName("ערב טוב. שעת הזהב מתקרבת.", null)).toBe("ערב טוב. שעת הזהב מתקרבת.");
  });
});
