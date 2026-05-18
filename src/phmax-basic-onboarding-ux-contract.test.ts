import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: basic onboarding steps + CTA", () => {
  it("BasicModeSteps a buildBasicQuickStartSteps podporují CTA na cílový prvek", () => {
    const steps = readSource("src/BasicModeSteps.tsx");
    const factory = readSource("src/basic-quick-start.ts");
    expect(factory).toContain("ctaLabel?: string;");
    expect(factory).toContain("ctaTargetId?: string;");
    expect(factory).toContain("BASIC_QUICK_START_EXAMPLE_CTA_LABEL");
    expect(steps).toContain("document.getElementById(targetId)");
    expect(steps).toContain('el.scrollIntoView({ behavior: "smooth", block: "center" });');
    expect(steps).toContain("{step.ctaLabel}");
  });

  it("PV/ŠD/SŠ/NV75 používají buildBasicQuickStartSteps se třemi kroky", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    for (const src of [pv, sd, ss, nv75]) {
      expect(src).toContain("buildBasicQuickStartSteps");
      expect(src).toContain("selectTitle:");
      expect(src).toContain("verifyTitle:");
      expect(src).toContain("exampleTargetId:");
    }
  });

  it("CTA cíl míří na existující hero example select id", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(pv).toContain('exampleTargetId: "pv-hero-example-select"');
    expect(pv).toContain('id="pv-hero-example-select"');

    expect(sd).toContain('exampleTargetId: "sd-hero-example-select"');
    expect(sd).toContain('id="sd-hero-example-select"');

    expect(ss).toContain('exampleTargetId: "ss-hero-example-select"');
    expect(ss).toContain('id="ss-hero-example-select"');

    expect(nv75).toContain('exampleTargetId: "nv75-hero-example-select"');
    expect(nv75).toContain('id="nv75-hero-example-select"');
  });
});
