import { describe, expect, it } from "vitest";
import { createDefaultSection12Data } from "../vyrocni-zprava-section12-data-logic";
import { buildJsonPostImportGuide, buildXlsxPostImportGuide } from "./vyrocni-zprava-post-import-guide";
import type { AnnualReportImportPreviewSummary } from "./vyrocni-zprava-xlsx-import-preview";
import type { AnnualReportXlsxImportResult } from "./vyrocni-zprava-xlsx-import-types";

describe("vyrocni-zprava-post-import-guide", () => {
  it("sestaví návod pro XLSX import s detekovanými kapitolami", () => {
    const preview = {
      overwriteTargets: [],
      manualOverwriteWarnings: [],
      canConfirm: true,
      sectionSummaries: [
        { id: "01", label: "Základní údaje", detected: true, summary: "ok", readiness: "PRIPRAVENO", overwrite: false, warningsCount: 0, impact: "DOPLNI" },
        { id: "12", label: "Projekty", detected: true, summary: "ok", readiness: "PRIPRAVENO", overwrite: false, warningsCount: 0, impact: "DOPLNI" },
        { id: "14", label: "Závěr", detected: false, summary: "", readiness: "NEURCENO", overwrite: false, warningsCount: 0, impact: "BEZE_ZMENY" },
      ],
    } satisfies AnnualReportImportPreviewSummary;
    const result = {
      profilePatch: { name: "ZŠ Komenského" },
      publicationBlockPatch: { approvedBySchoolCouncilDate: "1. 6. 2025" },
      section12Data: createDefaultSection12Data(),
    } as AnnualReportXlsxImportResult;

    const guide = buildXlsxPostImportGuide(preview, result);
    expect(guide.chapterIds).toEqual(["01", "12"]);
    expect(guide.setupItems).toEqual(["školní rok a profil školy", "Schválení a zveřejnění"]);
  });

  it("sestaví návod pro JSON obnovu podle dostupných sekcí", () => {
    const guide = buildJsonPostImportGuide({
      section03Data: { teachers: [{ name: "Novák", role: "učitel" }] },
      section14Data: { closingStatement: "Závěr školního roku." },
    });
    expect(guide.chapterIds).toEqual(["03", "14"]);
    expect(guide.sourceLabel).toBe("obnovy JSON zálohy");
  });
});
