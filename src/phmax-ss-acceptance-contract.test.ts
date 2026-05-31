import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculatePhmaxRow } from "./ss/phmax-ss-service";
import { phmaxSsDataset } from "./ss/phmax-ss-dataset";
import { resolveIsPar16Class } from "./ss/phmax-ss-par16";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

/** SŠ acceptance contract – doplněk k docs/ss-acceptance-checklist.md (ruční scénáře A–E). */
describe("SŠ acceptance contract", () => {
  it("checklist a README odkaz existují", () => {
    expect(fs.existsSync(path.resolve(repoRoot, "docs/ss-acceptance-checklist.md"))).toBe(true);
    expect(readSource("README.md")).toContain("docs/ss-acceptance-checklist.md");
    expect(readSource("docs/ss-acceptance-checklist.md")).toContain("### A – Běžný jednoobor");
    expect(readSource("docs/ss-acceptance-checklist.md")).toContain("### E – § 16 odst. 9");
  });

  it("SŠ má CalculatorProductShell, workflow dock a §16 přepínač", () => {
    const ss = readSource("src/PhmaxSsPage.tsx");
    expect(ss).toContain("CalculatorProductShell");
    expect(ss).toContain("CalculatorWorkflowDock");
    expect(ss).toContain("SsHumanSummary");
    expect(ss).toContain("createSsScrollToInputs");
    expect(readSource("src/ss/create-ss-scroll-to-inputs.ts")).toContain("createSsScrollToInputs");
    expect(readSource("src/ss/phmax-ss-par16.ts")).toContain("§ 16");
  });

  it("golden smoke – běžný jednoobor PHmax 100 (50 × 2)", () => {
    const out = calculatePhmaxRow(phmaxSsDataset, {
      code: "39-41-L/01",
      averageStudents: 17,
      classCount: 2,
      mode: "oneObor",
      form: "denni",
      isPar16Class: false,
    });
    expect(out.row.totalPhmax).toBe(100);
  });

  it("PrŠ PHAmax – jen 78-62-C/01 a 78-62-C/02 denní", () => {
    const ss = readSource("src/PhmaxSsPage.tsx");
    expect(ss).toContain("78-62-C/01");
    expect(ss).toContain("78-62-C/02");
    expect(readSource("src/ss/phmax-ss-practical-phamax.ts")).toContain("78-62-C/01");
  });

  it("§16 scénář E – heuristika i explicitní přepínač", () => {
    expect(resolveIsPar16Class({ isPar16Class: false, classType: "Třída zřízená podle § 16 odst. 9" })).toBe(true);
    expect(resolveIsPar16Class({ isPar16Class: true, classType: "" })).toBe(true);
    expect(resolveIsPar16Class({ isPar16Class: false, classType: "Běžná třída" })).toBe(false);
  });
});
