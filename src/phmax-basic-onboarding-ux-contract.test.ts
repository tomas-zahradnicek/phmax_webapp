import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: basic onboarding steps + CTA", () => {
  it("BasicModeSteps podporuje CTA tlačítko na cílový prvek", () => {
    const src = readSource("src/BasicModeSteps.tsx");
    expect(src).toContain("ctaLabel?: string;");
    expect(src).toContain("ctaTargetId?: string;");
    expect(src).toContain('document.getElementById(targetId)');
    expect(src).toContain('el.scrollIntoView({ behavior: "smooth", block: "center" });');
    expect(src).toContain('if (el instanceof HTMLElement) el.focus();');
    expect(src).toContain("{step.ctaLabel}");
  });

  it("Každá karta v basic flow drží 3 kroky a CTA na ukázkový příklad", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const zs = readSource("src/PhmaxZsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    for (const src of [pv, sd, ss, zs, nv75]) {
      expect(src).toContain("heading=\"Rychlý start pro");
      expect(src).toContain("steps={[");
      expect(src).toContain("title: \"Vyberte");
      expect(src).toContain("title: \"Načtěte");
      expect(src).toContain("title: \"Ověřte");
      expect(src).toContain("ctaLabel: \"Přejít na ukázkový příklad\"");
      expect(src).toContain("ctaTargetId:");
    }
  });

  it("CTA cíl míří na existující hero example select id", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const zs = readSource("src/PhmaxZsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(pv).toContain('ctaTargetId: "pv-hero-example-select"');
    expect(pv).toContain('id="pv-hero-example-select"');

    expect(sd).toContain('ctaTargetId: "sd-hero-example-select"');
    expect(sd).toContain('id="sd-hero-example-select"');

    expect(ss).toContain('ctaTargetId: "ss-hero-example-select"');
    expect(ss).toContain('id="ss-hero-example-select"');

    expect(zs).toContain('ctaTargetId: "zs-hero-example-select"');
    expect(zs).toContain('id="zs-hero-example-select"');

    expect(nv75).toContain('ctaTargetId: "nv75-hero-example-select"');
    expect(nv75).toContain('id="nv75-hero-example-select"');
  });
});

