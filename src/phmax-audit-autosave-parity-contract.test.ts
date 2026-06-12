import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Audit autosave parity (PV, ŠD, ZŠ, SŠ)", () => {
  it("všechny moduly ukládají _phmaxAuditTotals pro dashboard Σ a koherenci", () => {
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("_phmaxAuditTotals");
    expect(readSource("src/PhmaxSdPage.tsx")).toContain("_phmaxAuditTotals");
    expect(readSource("src/zs/zs-form-snapshot.ts")).toContain("_phmaxAuditTotals");
    expect(readSource("src/ss/ss-draft-storage.ts")).toContain("_phmaxAuditTotals");
    expect(readSource("src/phmax-cross-phmax-coherence.ts")).toContain("crossPhmaxAuditCoherenceWarnings");
  });

  it("přepočet ze snapshotu je sdílený modul pro PV, ŠD, ZŠ a SŠ", () => {
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("computePvPhmaxTotalFromSnapshot");
    expect(readSource("src/PhmaxSdPage.tsx")).toContain("computeSdPhmaxTotalFromSnapshot");
    expect(readSource("src/zs/zs-form-snapshot.ts")).toContain("computeZsPhmaxTotalFromFields");
    expect(readSource("src/ss/use-phmax-ss-units.ts")).toContain("computeSsPhmaxTotalFromSnapshot");
  });

  it("zobrazení PHmax používá stejný přepočet jako autosave (ŠD, SŠ)", () => {
    const sd = readSource("src/PhmaxSdPage.tsx");
    expect(sd).toContain("sdPhmaxTotalFromEngine");
    expect(sd).toContain("formatSdHours(sdPhmaxTotalFromEngine)");
    expect(sd).toContain("computeSdPhmaxTotalFromSnapshot(sdAutosaveCore)");
    expect(readSource("src/ss/use-phmax-ss-units.ts")).toContain("computeSsPhmaxTotalFromSnapshot({ rows })");
  });

  it("zobrazení PHmax používá stejný přepočet jako autosave (PV)", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    expect(pv).toContain("pvPhmaxTotalFromEngine");
    expect(pv).toContain("computePvPhmaxTotalFromSnapshot({ rows })");
    expect(readSource("src/pv/pv-compute-phmax-total-from-snapshot.ts")).toContain("computePv1d3Reduction");
  });
});
