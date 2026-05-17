import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: ZŠ + SŠ workflow panel pattern", () => {
  it("ZŠ drží zsWorkflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxZsPage.tsx");

    expect(src).toContain("const zsWorkflow = (() => {");
    expect(src).toContain("incompleteSections > 0");
    expect(src).toContain("warnings.length > 0");
    expect(src).toContain("workflowSteps={zsBasicWizardActive ? [] : zsWorkflow.steps}");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain('{ label: "Vyplnit povinné vstupy v aktivních modulech", state: "active" as const }');
  });

  it("NV75 drží nv75Workflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(src).toContain("const nv75Workflow = useMemo");
    expect(src).toContain("nv75InputWarnings.length > 0");
    expect(src).toContain("!bank.appliedRule");
    expect(src).toContain("workflowSteps={nv75Workflow.steps}");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain('{ label: "Uložit scénář", onClick: saveNamedSnapshot }');
  });

  it("SŠ drží ssWorkflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxSsPage.tsx");

    expect(src).toContain("const ssWorkflow = (() => {");
    expect(src).toContain('const errorRows = ss.preview.filter((p) => !p.skipped && "error" in p).length;');
    expect(src).toContain("workflowSteps={ssWorkflow.steps}");
    expect(src).toContain("SsHumanSummary");
    expect(src).toContain('{ label: "Opravit chybné kombinace nebo hodnoty", state: "active" as const }');
  });
});
