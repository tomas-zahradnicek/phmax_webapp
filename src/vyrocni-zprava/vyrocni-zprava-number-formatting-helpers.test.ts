import { describe, expect, it } from "vitest";

import {
  formatCzechCount,
  formatCzechCzk,
  formatCzechDecimal,
  formatCzechInteger,
} from "./vyrocni-zprava-number-formatting-helpers";

describe("vyrocni-zprava-number-formatting-helpers", () => {
  it("formátuje desetinná čísla s českou čárkou", () => {
    expect(formatCzechDecimal(1.18)).toBe("1,18");
    expect(formatCzechDecimal(0.2)).toBe("0,2");
  });

  it("formátuje celočíselné hodnoty", () => {
    expect(formatCzechInteger(42)).toBe("42");
    expect(formatCzechInteger(4200000)).toBe("4 200 000");
  });

  it("formátuje CZK částky", () => {
    expect(formatCzechCzk(4200000)).toBe("4 200 000 Kč");
    expect(formatCzechCzk(-1795000)).toBe("-1 795 000 Kč");
  });

  it("řeší české množné číslo", () => {
    const forms = { one: "žák", few: "žáci", many: "žáků" };
    expect(formatCzechCount(1, forms)).toBe("1 žák");
    expect(formatCzechCount(2, forms)).toBe("2 žáci");
    expect(formatCzechCount(4, forms)).toBe("4 žáci");
    expect(formatCzechCount(5, forms)).toBe("5 žáků");
    expect(formatCzechCount(0, forms)).toBe("0 žáků");
  });
});
