import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const AWARE_IMPL_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-assessment.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-namespaced-fence-finalize.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-establishment-gate.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-test-helpers.ts",
] as const;

const AWARE_API_SYMBOLS = [
  "assessScenarioLabelRuntimeAuthority",
  "readScenarioLabelAwareLogical",
  "writeScenarioLabelAwareLogical",
  "writeScenarioLabelNamespacedRaw",
  "clearScenarioLabelAwareLogical",
  "clearScenarioLabelNamespaced",
  "finalizeScenarioLabelNamespacedFenceCertificate",
  "decideScenarioLabelAwareEstablishment",
  "decideScenarioLabelAwareEstablishmentFromAssessment",
] as const;

const FORBIDDEN_PRODUCTION_CONSUMERS = [
  "src/PhmaxDashboardPage.tsx",
  "src/App.tsx",
  "src/backup/backup-registry.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
  "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
  "src/data/storage/scenario-label-migration/scenario-label-restore-ops.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-prep.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
] as const;

describe("N3-AWARE-CORE source contracts", () => {
  it("new AWARE APIs have 0 production consumers outside CORE package", () => {
    const srcRoot = path.join(repoRoot, "src");
    const hitsBySymbol = new Map<string, string[]>();

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        if (entry.name.includes(".test.")) continue;
        const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
        const text = fs.readFileSync(full, "utf8");
        for (const symbol of AWARE_API_SYMBOLS) {
          if (text.includes(symbol)) {
            const list = hitsBySymbol.get(symbol) ?? [];
            list.push(rel);
            hitsBySymbol.set(symbol, list);
          }
        }
      }
    }

    walk(srcRoot);

    for (const symbol of AWARE_API_SYMBOLS) {
      const hits = (hitsBySymbol.get(symbol) ?? []).sort();
      for (const hit of hits) {
        const allowed =
          AWARE_IMPL_FILES.includes(hit as (typeof AWARE_IMPL_FILES)[number]) ||
          hit.includes("scenario-label-n3-aware") ||
          hit.includes("scenario-label-n3-namespaced-fence") ||
          hit.includes("scenario-label-n3-establishment-gate");
        expect(allowed, `${symbol} referenced from production file ${hit}`).toBe(true);
      }
    }
  });

  it("Dashboard / Backup / Restore / snippet / Level-B owners do not import AWARE", () => {
    for (const file of FORBIDDEN_PRODUCTION_CONSUMERS) {
      const source = readSource(file);
      expect(source, file).not.toContain("scenario-label-n3-aware");
      expect(source, file).not.toContain("scenario-label-n3-namespaced-fence-finalize");
      expect(source, file).not.toContain("scenario-label-n3-establishment-gate");
      for (const symbol of AWARE_API_SYMBOLS) {
        expect(source, `${file} :: ${symbol}`).not.toContain(symbol);
      }
    }
  });

  it("CORE mutation logic does not call cutover planner/executor or boolean fenceReady gate", () => {
    const mutationFiles = [
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-namespaced-fence-finalize.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-assessment.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-establishment-gate.ts",
    ];
    for (const file of mutationFiles) {
      const source = readSource(file);
      expect(source, file).not.toContain("planScenarioLabelAuthorityCutover");
      expect(source, file).not.toContain("classifyScenarioLabelAuthorityCutoverOutcome");
      expect(source, file).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
      expect(source, file).not.toContain("assessScenarioLabelFenceCutoverEligibility");
      expect(source, file).not.toContain("isScenarioLabelN3FenceReadyForPreCutover");
      // Historic boolean fenceReady must not gate mutations.
      expect(source, file).not.toMatch(/fenceReady\s*===?\s*true/);
      expect(source, file).not.toMatch(/if\s*\(\s*fenceReady/);
    }
  });

  it("schema2 writes only inside dedicated namespaced writer/clear (+ finalize consumes settled marker)", () => {
    const write = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
    );
    const clear = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
    );
    const finalize = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-namespaced-fence-finalize.ts",
    );
    const assessment = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-assessment.ts",
    );
    const read = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
    );
    const gate = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-establishment-gate.ts",
    );

    expect(write).toContain("buildScenarioLabelN3NamespacedMarker");
    expect(clear).toContain("buildScenarioLabelN3NamespacedMarker");
    expect(finalize).not.toContain("buildScenarioLabelN3NamespacedMarker");
    expect(assessment).not.toContain("buildScenarioLabelN3NamespacedMarker");
    expect(read).not.toContain("buildScenarioLabelN3NamespacedMarker");
    expect(gate).not.toContain("buildScenarioLabelN3NamespacedMarker");

    // Namespaced writer requires already-namespaced authority gate.
    expect(write).toContain('assessment.kind !== "NAMESPACED_READY"');
    expect(write).toContain('assessment.kind !== "NAMESPACED_DEGRADED"');
    expect(write).toContain("SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2");
  });

  it("namespaced executor must not call legacy writer as fallback", () => {
    const write = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
    );
    const clear = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
    );

    // writeScenarioLabelNamespacedRaw body must not invoke writeScenarioLabelRaw.
    const nsWriteStart = write.indexOf("export function writeScenarioLabelNamespacedRaw");
    const nsWriteEnd = write.indexOf("export function writeScenarioLabelAwareLogical");
    expect(nsWriteStart).toBeGreaterThan(-1);
    expect(nsWriteEnd).toBeGreaterThan(nsWriteStart);
    const nsBody = write.slice(nsWriteStart, nsWriteEnd);
    expect(nsBody).not.toContain("writeScenarioLabelRaw(");
    expect(nsBody).not.toContain("clearScenarioLabelLifecycle(");
    expect(nsBody).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");

    const nsClearStart = clear.indexOf("export function clearScenarioLabelNamespaced");
    const nsClearEnd = clear.indexOf("export function clearScenarioLabelAwareLogical");
    const nsClearBody = clear.slice(nsClearStart, nsClearEnd);
    expect(nsClearBody).not.toContain("writeScenarioLabelRaw(");
    expect(nsClearBody).not.toContain("clearScenarioLabelLifecycle(");
    expect(nsClearBody).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
    expect(nsClearBody).not.toContain("buildScenarioLabelN3LegacyMarker");
    expect(nsClearBody).not.toContain("buildScenarioLabelMigrationMarkerPayload");
  });

  it("logical read never writes / never routes fence.committedRaw", () => {
    const read = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
    );
    expect(read).not.toContain(".setItem");
    expect(read).not.toContain(".removeItem");
    expect(read).not.toContain(".committedRaw");
    expect(read).not.toMatch(/\bfence\.committedRaw\b/);
    expect(read).toContain('source: "school_v2"');
    expect(read).toContain("assessment.schoolV2Raw");
    expect(read).not.toContain("assessment.fence");
  });

  it("business reads / Backup / Restore / Level B remain on legacy repository APIs", () => {
    const repo = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
    );
    expect(repo).toContain("export function readScenarioLabelRaw");
    expect(repo).toContain("export function writeScenarioLabelRaw");
    expect(repo).toContain("export function clearScenarioLabelLifecycle");
    expect(repo).not.toContain("readScenarioLabelAwareLogical");
    expect(repo).not.toContain("writeScenarioLabelAwareLogical");
    expect(repo).not.toContain("clearScenarioLabelAwareLogical");
  });
});
