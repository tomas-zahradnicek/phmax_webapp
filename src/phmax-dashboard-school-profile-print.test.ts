import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSchoolProfilePrintHtml } from "./phmax-dashboard-school-profile-print";

const appVersion = (JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")) as {
  version: string;
}).version;

describe("buildSchoolProfilePrintHtml", () => {
  it("obsahuje souhrn školy bez technického JSON", () => {
    const html = buildSchoolProfilePrintHtml({
      generatedAt: "1. 1. 2026",
      appVersion,
      coherenceWarnings: ["ZŠ: audit ≠ přepočet"],
      profile: {
        tone: "ok",
        scenarioLabel: "Test škola",
        modulesInUse: 2,
        modulesOk: 2,
        attentionCount: 0,
        totalPhmax: 120,
        totalPhmaxIncomplete: false,
        namedBackupsTotal: 2,
        lastExportLabel: "12. 1. 2026",
        lead: "Škola připravena – vyplněné moduly bez chyb.",
        moduleChips: [
          { id: "pv", label: "PV", active: true, needsAttention: false, phmaxLabel: "50" },
          { id: "zs", label: "ZŠ", active: true, needsAttention: false, phmaxLabel: "70" },
        ],
      },
    });
    expect(html).toContain("Školní profil");
    expect(html).toContain("Test škola");
    expect(html).toContain("ZŠ: audit");
    expect(html).not.toContain("coherenceWarnings");
    expect(html).not.toContain("phmax-school-scenario");
  });
});
