import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computePvPhmaxTotal, type PvProvozKind } from "./phmax-pv-logic";
import { importTablesToHandoffPayload, parseSemicolonCsv } from "./phmax-import-pv-zs";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(repoRoot, "docs/import-templates");

function recomputePvTotal(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const rows = (snapshot as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return null;
  let sum = 0;
  let any = false;
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const provoz = r.provoz as PvProvozKind;
    const classCount = typeof r.classCount === "number" ? r.classCount : 0;
    const avgHours = typeof r.avgHours === "number" ? r.avgHours : 0;
    const computed = computePvPhmaxTotal({
      provoz,
      classCount,
      avgHoursPerDay: avgHours,
      sec16ClassCount: typeof r.sec16Count === "number" ? r.sec16Count : 0,
      languageGroupCount: typeof r.languageGroups === "number" ? r.languageGroups : 0,
    });
    if (computed.totalPhmax != null) {
      sum += computed.totalPhmax;
      any = true;
    }
  }
  return any ? Math.round((sum + Number.EPSILON) * 100) / 100 : null;
}

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
    expect(recomputePvTotal(pvSnap)).toBe(266);
    expect(computeZsPhmaxTotalFromSnapshot(zsSnap)).toBe(817);
    expect(recomputePvTotal(pvSnap)! + computeZsPhmaxTotalFromSnapshot(zsSnap)!).toBe(summary.totalPhmax);
  });
});
