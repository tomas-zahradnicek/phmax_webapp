/**
 * N3-CUTOVER-ACTIVATE source contracts:
 * - EXACTLY 1 production executor caller (shared establishment/PREP runtime)
 * - allowCutover lifecycle-only (default false; runner forces true)
 * - first schema2 from legacy only via cutover executor
 * - forbidden surfaces remain cutover-free (except the one approved owner)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function walkSrcTsFiles(): string[] {
  const srcRoot = path.join(repoRoot, "src");
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
      if (entry.name.includes(".test.")) continue;
      out.push(path.relative(repoRoot, full).replace(/\\/g, "/"));
    }
  }
  walk(srcRoot);
  return out;
}

const CUTOVER_SYMBOLS = ["executeScenarioLabelN3AuthorityCutover"] as const;

/** Definition + sole approved production owner. */
const CUTOVER_ALLOWED_PRODUCTION_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
] as const;

const FORBIDDEN_PRODUCTION_SURFACES = [
  "src/PhmaxDashboardPage.tsx",
  "src/App.tsx",
  "src/backup/backup-registry.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
  "src/phmax-local-storage-clear.ts",
  "src/phmax-school-scenario-export.ts",
  "src/phmax-is-handoff-apply.ts",
  "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
  "src/data/storage/scenario-label-migration/scenario-label-aware-runtime.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
  "src/data/storage/scenario-label-migration/scenario-label-restore-ops.ts",
  "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-prep.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
  "src/school-profile/profile-save-platform-binding.ts",
  "src/vyrocni-zprava/vz-school-year-persist-binding.ts",
] as const;

describe("N3-CUTOVER-ACTIVATE source contracts", () => {
  it("production cutover call sites === exactly 1 owner + definition", () => {
    const hits: string[] = [];
    for (const rel of walkSrcTsFiles()) {
      const text = readSource(rel);
      for (const symbol of CUTOVER_SYMBOLS) {
        if (text.includes(symbol)) {
          hits.push(rel);
        }
      }
    }
    const unique = [...new Set(hits)].sort();
    expect(unique).toEqual([...CUTOVER_ALLOWED_PRODUCTION_FILES].sort());
  });

  it("forbidden surfaces do not import or call cutover executor", () => {
    for (const file of FORBIDDEN_PRODUCTION_SURFACES) {
      if (!fs.existsSync(path.join(repoRoot, file))) continue;
      const source = readSource(file);
      expect(source, file).not.toContain("executeScenarioLabelN3AuthorityCutover");
      expect(source, file).not.toContain("scenario-label-n3-cutover");
    }
  });

  it("allowCutover is lifecycle-only with safe default false", () => {
    const runtime = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
    );
    expect(runtime).toContain("allowCutover");
    expect(runtime).toContain("const allowCutover = deps.allowCutover === true");
    expect(runtime).toContain("allowCutover: true");
    // No CORE eligibility bypass knobs on the public deps surface.
    expect(runtime).toContain("Never accepts eligibility / fence-ready / authority-ready bypass flags");
    expect(runtime).not.toMatch(/fenceReady\s*\?:/);
    expect(runtime).not.toContain("authorityReady");
    expect(runtime).not.toMatch(/\beligible\s*\?:/);
    expect(runtime).not.toMatch(/schemaVersion\s*\?:/);
  });

  it("Restore applies establishment without allowCutover true", () => {
    const restore = readSource("src/backup/restore/apply-app-backup-restore.ts");
    expect(restore).toContain("establishScenarioLabelSchoolShadowFromLegacy");
    expect(restore).not.toContain("allowCutover");
    expect(restore).not.toContain("executeScenarioLabelN3AuthorityCutover");
    expect(restore).not.toContain("runScenarioLabelEstablishmentAfterSchoolReady");
  });

  it("CUTOVER executor does not import/call N2 assessScenarioLabelCutoverReadiness", () => {
    const cutover = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    );
    expect(cutover).not.toContain("assessScenarioLabelCutoverReadiness");
    expect(cutover).not.toContain("scenario-label-cutover-readiness");
  });

  it("CUTOVER executor does not use boolean fenceReady production eligibility API", () => {
    const cutover = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    );
    expect(cutover).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
    expect(cutover).not.toMatch(/fenceReady\s*===?\s*true/);
    expect(cutover).not.toMatch(/if\s*\(\s*fenceReady/);
    expect(cutover).toContain("assessScenarioLabelFenceCutoverEligibility");
    expect(cutover).toContain("assessScenarioLabelN3CutoverReadiness");
    expect(cutover).toContain("assessScenarioLabelRuntimeAuthority");
  });

  it("ACTIVATE locks mark production transition active", () => {
    const types = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover-types.ts",
    );
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_CORE_INERT = false");
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_PRODUCTION_ACTIVE = true");
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_NO_PERSISTENT_JOURNAL = true");
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_NO_BUSINESS_WRITES = true");
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_FENCE_WRITTEN_LAST = true");
    expect(types).toContain("SCENARIO_LABEL_N3_CUTOVER_SNIPPET_POLICY = \"B_refuse_namespaced_mutation\"");
  });

  it("first schema2 from legacy: cutover is the only LEGACY→schema2 creator path", () => {
    const cutover = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    );
    expect(cutover).toContain("buildScenarioLabelN3NamespacedMarker");
    expect(cutover).toContain('kind !== "LEGACY_READY"');
    expect(cutover).toContain("LEGACY_READY");

    const write = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
    );
    expect(write).toContain("SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2");
    expect(write).toContain('assessment.kind !== "NAMESPACED_READY"');
    expect(write).toContain('assessment.kind !== "NAMESPACED_DEGRADED"');
    expect(write).not.toContain("executeScenarioLabelN3AuthorityCutover");

    const clear = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
    );
    expect(clear).not.toContain("executeScenarioLabelN3AuthorityCutover");

    const restore = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
    );
    expect(restore).not.toContain("executeScenarioLabelN3AuthorityCutover");

    const allowedBuilders = new Set([
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
      "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-authority-marker.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-authority-protocol.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-test-helpers.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    ]);
    for (const rel of walkSrcTsFiles()) {
      const text = readSource(rel);
      if (!text.includes("buildScenarioLabelN3NamespacedMarker")) continue;
      expect(
        allowedBuilders.has(rel) || rel.includes("scenario-label-n3-authority"),
        `unexpected schema2 builder site: ${rel}`,
      ).toBe(true);
    }
  });

  it("executor never writes business legacy / school-v2 keys", () => {
    const cutover = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    );
    expect(cutover).toContain("storage.setItem(keys.markerKey");
    expect(cutover).toContain("storage.setItem(keys.fenceKey");
    expect(cutover).not.toMatch(
      /storage\.setItem\(\s*PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY/,
    );
    expect(cutover).not.toMatch(
      /storage\.removeItem\(\s*PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY/,
    );
    expect(cutover).not.toMatch(/storage\.setItem\(\s*keys\.schoolKey/);
    expect(cutover).not.toMatch(/storage\.removeItem\(\s*keys\.schoolKey/);
    expect(cutover).toContain("Never restores business keys");
  });

  it("establishment/PREP owner may same-run cutover after prepared|already_prepared", () => {
    const runtime = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
    );
    expect(runtime).toContain("executeScenarioLabelN3AuthorityCutover");
    expect(runtime).toContain("prepareScenarioLabelN3LegacyFenceCertificate");
    expect(runtime).toContain("attemptCutoverAfterLegacyCommitted");
    expect(runtime).toContain('prepStatus !== "prepared"');
    expect(runtime).toContain('prepStatus !== "already_prepared"');
  });
});
