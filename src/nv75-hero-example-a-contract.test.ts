import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateNv75DeputyBank } from "./nv75-deputy-bank";

const repoRoot = path.resolve(__dirname, "..");

/** Acceptance N4 – ukázka A (PŘÍKLAD 1: MŠ 8 tříd) z comboboxu NV75. */
describe("NV75 hero example A (N4)", () => {
  it("a_ms: 8 tříd MŠ => §4b 4b1, banka 14 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ms", units: 8, additionalWorkplacesEligible: 0 }],
    });
    expect(r.appliedRule).toBe("4b1");
    expect(r.bankHoursBase4b).toBe(14);
    expect(r.bankHoursTotal).toBe(14);
  });

  it("export a audit sloupce §4b jsou v NV75 stránce", () => {
    const src = fs.readFileSync(path.resolve(repoRoot, "src/PhmaxNv75DeputyPage.tsx"), "utf8");
    expect(src).toContain('id: "a_ms"');
    expect(src).toContain("PŘÍKLAD 1: MŠ 8 tříd => banka 14 h");
    expect(src).toContain("Pravidlo §4b");
    expect(src).toContain("audit §4b");
    expect(src).toContain("archivní razítko");
  });
});
