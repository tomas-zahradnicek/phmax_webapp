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
});
