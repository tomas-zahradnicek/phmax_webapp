import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: PV + ŠD view mode toggle", () => {
  it("PV drží přepínač režimu a guardy pro expertní bloky", () => {
    const src = readSource("src/PhmaxPvPage.tsx");
    const hero = readSource("src/pv/PvHeroHeader.tsx");

    expect(src).toContain('const PV_VIEW_MODE_LS_KEY = "phmax-pv-view-mode";');
    expect(hero).toContain('name="pv-view-mode"');
    expect(hero).toContain('checked={viewMode === "basic"}');
    expect(hero).toContain('checked={viewMode === "expert"}');
    expect(hero).toContain('onChange={() => setViewMode("basic")}');
    expect(hero).toContain('onChange={() => setViewMode("expert")}');
    expect(src).toContain('{viewMode === "expert" ? <ProductLegisContextPanel variant="pv" /> : null}');
    expect(src).toContain('{viewMode === "expert" ? <MethodologyStrip /> : null}');
  });

  it("ŠD drží přepínač režimu a guardy pro expertní bloky", () => {
    const src = readSource("src/PhmaxSdPage.tsx");
    const hero = readSource("src/sd/SdHeroHeader.tsx");

    expect(src).toContain('const SD_VIEW_MODE_LS_KEY = "phmax-sd-view-mode";');
    expect(hero).toContain('name="sd-view-mode"');
    expect(hero).toContain('checked={viewMode === "basic"}');
    expect(hero).toContain('checked={viewMode === "expert"}');
    expect(hero).toContain('onChange={() => setViewMode("basic")}');
    expect(hero).toContain('onChange={() => setViewMode("expert")}');
    expect(src).toContain('{viewMode === "expert" && detailedResult != null ? (');
    expect(src).toContain(') : viewMode === "expert" && breakdown != null && breakdown.length > 0 && basePhmax != null ? (');
    expect(src).toContain('{viewMode === "expert" && activeMethodikaRow != null ? (');
    expect(src).toContain('{viewMode === "expert" ? <ProductLegisContextPanel variant="sd" /> : null}');
    expect(src).toContain('{viewMode === "expert" ? <MethodologyStrip /> : null}');
  });
});
