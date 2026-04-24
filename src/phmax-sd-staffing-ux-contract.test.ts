import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: SD staffing model (NV 75/2005, PPV) guards", () => {
  it("phmax-sd-staffing-nv75 exports computeSdStaffingSplitNv75 a odkazuje na tab. 7.1 / 7.2", () => {
    const src = readSource("src/phmax-sd-staffing-nv75.ts");

    expect(src).toContain("export function computeSdStaffingSplitNv75");
    expect(src).toContain("7.1");
    expect(src).toContain("7.2");
    expect(src).toContain("75/2005");
  });

  it("PhmaxSdPage drží vychovatelPpcHours v snapshotu a propojuje export s modelem", () => {
    const page = readSource("src/PhmaxSdPage.tsx");
    const exportRows = readSource("src/phmax-sd-export-rows.ts");

    expect(page).toContain("vychovatelPpcHours");
    expect(page).toMatch(/buildPhmaxSdExportRows\([\s\S]*?staffingNv75/s);
    expect(exportRows).toContain("staffingNv75");
    expect(exportRows).toContain("7.1");
    expect(exportRows).toContain("7.2");
  });

  it("phmax-sd-legislativa a legislativní panel ŠD zmiňují NV 75/2005 a tooltips tabulek 7.1/7.2", () => {
    const leg = readSource("src/phmax-sd-legislativa.ts");
    const ui = readSource("src/PhmaxProductLegisUi.tsx");

    expect(leg).toContain("sd-nv75-7-1");
    expect(leg).toContain("sd-nv75-7-2");
    expect(leg).toContain("75/2005");
    expect(ui).toContain('citeId="sd-nv75-7-1"');
    expect(ui).toContain('citeId="sd-nv75-7-2"');
    expect(ui).toContain("nv75_2005");
  });
});
