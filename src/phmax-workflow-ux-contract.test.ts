import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: ZŠ + SŠ workflow panel pattern", () => {
  it("ZŠ panel drží recommendedStep + workflowSteps a logiku guardů", () => {
    const src = readSource("src/PhmaxZsPage.tsx");

    expect(src).toContain("const zsWorkflow = (() => {");
    expect(src).toContain("incompleteSections > 0");
    expect(src).toContain("warnings.length > 0");
    expect(src).toContain('recommendedStep={zsWorkflow.recommendedStep}');
    expect(src).toContain("workflowSteps={zsWorkflow.steps}");
    expect(src).toContain('{ label: "Vyplnit povinné vstupy v aktivních modulech", state: "active" as const }');
    expect(src).toContain('{ label: "Zkontrolovat upozornění a hraniční pravidla", state: "active" as const }');
    expect(src).toContain('{ label: "Uložit, exportovat nebo porovnat variantu", state: "active" as const }');
  });

  it("SŠ panel drží recommendedStep + workflowSteps a logiku guardů", () => {
    const src = readSource("src/PhmaxSsPage.tsx");

    expect(src).toContain("const ssWorkflow = (() => {");
    expect(src).toContain('const errorRows = ss.preview.filter((p) => !p.skipped && "error" in p).length;');
    expect(src).toContain("const skippedRows = ss.preview.filter((p) => p.skipped).length;");
    expect(src).toContain('recommendedStep={ssWorkflow.recommendedStep}');
    expect(src).toContain("workflowSteps={ssWorkflow.steps}");
    expect(src).toContain('{ label: "Opravit chybné kombinace nebo hodnoty", state: "active" as const }');
    expect(src).toContain('{ label: "Vyplnit povinné údaje u všech řádků", state: "active" as const }');
    expect(src).toContain('{ label: "Uložit, exportovat nebo porovnat variantu", state: "active" as const }');
  });
});
