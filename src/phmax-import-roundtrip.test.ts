import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computePvPhmaxTotalFromSnapshot } from "./pv/pv-compute-phmax-total-from-snapshot";
import { importTablesToHandoffPayload, parseSemicolonCsv } from "./phmax-import-pv-zs";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(repoRoot, "docs/import-templates");

describe("phmax-import-roundtrip", () => {
  it("CSV šablona → handoff → součty PHmax odpovídají přepočtu modulů", () => {
    const metaRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
    );
    const pvRows = parseSemicolonCsv(readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"));
    const zsRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    );

    const payload = importTablesToHandoffPayload({ metaRows, pvRows, zsRows });
    const summary = payload.schoolScenario.summary;

    expect(summary.totalPhmax).toBe(1083);
    expect(summary.slices.find((s) => s.id === "pv")?.phmax).toBe(266);
    expect(summary.slices.find((s) => s.id === "zs")?.phmax).toBe(817);

    const pvSnap = payload.schoolScenario.moduleSnapshots.pv;
    const zsSnap = payload.schoolScenario.moduleSnapshots.zs;
    expect(computePvPhmaxTotalFromSnapshot(pvSnap)).toBe(266);
    expect(computeZsPhmaxTotalFromSnapshot(zsSnap)).toBe(817);
    expect(computePvPhmaxTotalFromSnapshot(pvSnap)! + computeZsPhmaxTotalFromSnapshot(zsSnap)!).toBe(
      summary.totalPhmax,
    );
  });
});
