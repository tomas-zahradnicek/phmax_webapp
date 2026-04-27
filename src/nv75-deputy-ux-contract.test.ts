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
    expect(page).toContain("Počet skupin odborného výcviku na školních pracovištích");
    expect(page).toContain("Počet skupin odborného výcviku u instruktora / ve firmách");
    expect(page).toContain("Počet skupin odborného výcviku celkem");
    expect(page).toContain("Výstup dle §13 odst. 7 vyhl. 13/2005");
  });

  it("§4d input is derived from workplace units, not only a manual eligible count", () => {
    const page = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(page).toContain("additionalWorkplaceUnits");
    expect(page).toContain("eligibleAdditionalWorkplacesForRow");
    expect(page).toContain("Přidat další pracoviště");
    expect(page).toContain("Způsobilá pracoviště:");
    expect(page).toContain("bez bonifikace");
    expect(page).toContain("formatAdditionalWorkplacesForExport");
    expect(page).toContain("další pracoviště (detail)");
  });

  it("appendix 2/3 reductions are represented as auditable data tables", () => {
    const core = readSource("src/nv75-deputy-bank.ts");

    expect(core).toContain("NV75_REDUCTION_TABLES");
    expect(core).toContain("function reductionFromTable");
    expect(core).toContain("repeatAfter");
    expect(core).toContain("function reductionByKind");
    expect(core).not.toContain('case "ms":');
    expect(core).not.toContain('case "ss_konz":');
    expect(core).not.toContain('case "domov_mladeze":');
    expect(core).toContain("NV75_BONUS4D_RULES");
    expect(core).toContain("bonusPerEligibleWorkplace");
    expect(core).not.toContain('kind === "ms" || kind === "zs" || kind === "ss_konz"');
  });

  it("extended methodology examples remain selectable in the NV75 page", () => {
    const page = readSource("src/PhmaxNv75DeputyPage.tsx");

    for (const exampleId of ["bonus_p2_example1", "bonus_poradenske", "ss_mix_40", "ov_16_37", "ov_16_33", "ov_28_42"]) {
      expect(page).toContain(`id: "${exampleId}"`);
    }
    expect(page).toContain("selectedExampleDetails");
    expect(page).toContain("Očekávaný výsledek");
    expect(page).toContain("OV PŘÍKLAD 1");
    expect(page).toContain("§4d PŘÍKLAD 1");
  });
});

