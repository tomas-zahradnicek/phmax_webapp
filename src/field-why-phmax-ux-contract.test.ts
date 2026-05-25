import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: FieldWhyPhmax + dashboard user-first blok", () => {
  it("Komponenta FieldWhyPhmax drží výchozí shrnutí a export", () => {
    const src = readSource("src/FieldWhyPhmax.tsx");
    expect(src).toContain("export function FieldWhyPhmaxDetails");
    expect(src).toContain("Proč tyto vstupy ovlivní PHmax?");
  });

  it("PV, ŠD, ZŠ, SŠ, NV75 importují a vykreslují FieldWhyPhmaxDetails", () => {
    const tagRe = /<FieldWhyPhmaxDetails[\s>/]/;
    for (const name of ["PhmaxPvPage", "PhmaxSdPage", "PhmaxSsPage", "PhmaxNv75DeputyPage"]) {
      const s = readSource(`src/${name}.tsx`);
      expect(s).toContain('from "./FieldWhyPhmax"');
      expect(tagRe.test(s)).toBe(true);
    }
    for (const zsFile of ["src/zs/ZsPhmaxBasicSection.tsx", "src/zs/ZsPhmaxSec16Section.tsx"]) {
      const s = readSource(zsFile);
      expect(s).toContain('FieldWhyPhmax');
      expect(tagRe.test(s)).toBe(true);
    }
  });

  it("Souhrnný přehled má uživatelsky-první úvodní sekci", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("Začněte uživatelsky nejdříve tady");
    expect(dash).toContain("Otevřít");
    expect(dash).toContain("DASH_QUICK_IDS");
    expect(dash).toContain("dash-kpi-strip");
    expect(dash).toContain("primaryKpi");
    expect(dash).toContain("lastVisit");
    expect(dash).toContain("modulesWithData");
    expect(readSource("src/App.tsx")).toContain("recordDashboardProductVisit");
  });

  it("PV má společný FieldWhy nad kartou vstupů a ZŠ u §16", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    expect(pv).toContain("Proč se PHmax počítá po pracovištích");
    expect(pv.match(/FieldWhyPhmaxDetails/g)?.length ?? 0).toBeGreaterThanOrEqual(2);

    const sec16 = readSource("src/zs/ZsPhmaxSec16Section.tsx");
    expect(sec16).toContain("Proč má § 16/9 vlastní vstupy a výsledek");
    expect(sec16).toContain('sectionId="sec16"');
  });
});
