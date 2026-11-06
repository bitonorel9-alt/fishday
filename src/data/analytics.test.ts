import { describe, expect, it } from "vitest";
import { errorSummary, pageName } from "./analytics";

describe("pageName", () => {
  it("מסתיר את מסך הבקרה ומאחד דפי דג ומאמר", () => {
    expect(pageName("#/admin")).toBe("");
    expect(pageName("#/fish/sargus")).toBe("/fish/:id");
    expect(pageName("#/guide/bait")).toBe("/guide/:id");
    expect(pageName("#/beach/atlit")).toBe("/beach/atlit");
    expect(pageName("")).toBe("/");
    expect(pageName("#/feedback/beach/%2Fbeach%2Fatlit")).toBe("/feedback");
  });
});

describe("errorSummary", () => {
  it("שומר סוג, הודעה ומקום בלי כתובת מלאה", () => {
    const err = new TypeError("x is undefined");
    err.stack = "TypeError: x is undefined\n    at render (https://bitonorel9-alt.github.io/fishday/assets/index-abc.js:1:200)";
    expect(errorSummary(err)).toBe("TypeError: x is undefined @ render (index-abc.js:1:200)");
  });
  it("מקבל גם ערך שאינו שגיאה, ומקצר ל-300 תווים", () => {
    expect(errorSummary("boom")).toBe("boom");
    expect(errorSummary("a".repeat(500))).toHaveLength(300);
  });
});
