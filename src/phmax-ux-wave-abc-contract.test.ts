import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("UX wave A/B/C contract", () => {
  it("shared next-action and fill status", () => {
    expect(readSource("src/calculator-next-action.ts")).toContain("buildCalculatorNextAction");
    expect(readSource("src/CalculatorNextActionStrip.tsx")).toContain("data-testid=\"calculator-next-action\"");
    expect(readSource("src/FillStatusBadge.tsx")).toContain("fill-status-badge");
  });

  it("dashboard role cards, export wizard, print, import placeholder", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("dash-role-cards");
    expect(dash).toContain("dash-export-wizard");
    expect(dash).toContain("dash-school-15min");
    expect(dash).toContain("printSchoolReview");
    expect(dash).toContain("DASH_IMPORT_PLACEHOLDER_LABEL");
    expect(dash).toContain("Celá škola za 15 min");
  });

  it("modules wire next action and tours", () => {
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("CalculatorNextActionStrip");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("ZsTabProgressMap");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("phmaxTabDone");
  });

  it("hero hints and expert notice", () => {
    expect(readSource("src/CalculatorHintTooltip.tsx")).toContain("firstVisitCoachmark");
    expect(readSource("src/CalculatorHeroDisplayControls.tsx")).toContain("CalculatorExpertModeNotice");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("Expertní: až když znáte metodiku");
  });
});
