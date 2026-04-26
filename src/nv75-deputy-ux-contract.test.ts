import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: NV75 deputy bank result visibility", () => {
  it("UI, summary and export keep OV entitlement text visible", () => {
    const page = readSource("src/PhmaxNv75DeputyPage.tsx");
    const core = readSource("src/nv75-deputy-bank.ts");

    expect(core).toContain("ovDeputyEntitlementText");
    expect(core).toContain("2 zástupci ředitele školy pro odborný výcvik");
    expect(core).toContain("vedoucí učitelé odborného výcviku");

    expect(page).toContain("result.ovDeputyEntitlementText");
    expect(page).toContain("bank.ovDeputyEntitlementText");
    expect(page).toContain("OV – metodický výstup funkcí");
    expect(page).toContain("OV metodický výstup funkcí");
    expect(page).toContain("Počet skupin odborného výcviku celkem");
  });

  it("extended methodology examples remain selectable in the NV75 page", () => {
    const page = readSource("src/PhmaxNv75DeputyPage.tsx");

    for (const exampleId of ["bonus_p2_example1", "bonus_poradenske", "ss_mix_40", "ov_16_37", "ov_16_33", "ov_28_42"]) {
      expect(page).toContain(`id: "${exampleId}"`);
    }
  });
});

