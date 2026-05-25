import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { createSdProductAuditProtocol } from "./phmax-product-audit";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

/** Acceptance S2/S3 – ŠD souhrnný režim a porovnání variant A/B. */
describe("ŠD acceptance contract (S2, S3)", () => {
  it("S2 – souhrnný režim má větu o počtu oddělení v UI", () => {
    const sd = readSource("src/PhmaxSdPage.tsx");
    expect(sd).toContain("sd-summary-dept-hint");
    expect(sd).toContain("pro kolik běžných oddělení");
    expect(sd).toContain("Souhrnný režim");
  });

  it("S3 – pojmenované zálohy a porovnání variant A/B", () => {
    const sd = readSource("src/PhmaxSdPage.tsx");
    expect(sd).toContain("edu-cz-sd-named-snapshots-v1");
    expect(sd).toContain("BasicComparePreview");
    expect(sd).toContain("Porovnání 2 variant");

    const a = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 3,
    });
    const b = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 4,
    });
    const out = comparePhmaxProductVariants([
      { id: "variant-a", label: "varianta A", protocol: a },
      { id: "variant-b", label: "varianta B", protocol: b },
    ]);
    expect(out.variants).toHaveLength(2);
    expect(out.differences.some((line) => line.includes("PHmax"))).toBe(true);
  });
});
