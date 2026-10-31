import { describe, expect, it } from "vitest";
import { windLabel, windValue } from "./settings";

describe("יחידות רוח", () => {
  it('קמ"ש נשאר', () => expect(windValue(20.4, "kmh")).toBe(20));
  it("המרה לקשר", () => expect(windValue(18.52, "knots")).toBe(10));
  it("תווית", () => expect(windLabel("knots")).toBe("קשר"));
});
