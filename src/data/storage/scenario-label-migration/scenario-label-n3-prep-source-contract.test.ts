import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

/** Sole production caller of the PREP helper (post-school-ready orchestration). */
const ALLOWED_PREP_CALL_SITES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-prep.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
] as const;

const FORBIDDEN_PREP_CONSUMERS = [
  "src/PhmaxDashboardPage.tsx",
  "src/App.tsx",
  "src/backup/backup-registry.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
  "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
  "src/data/storage/scenario-label-migration/scenario-label-restore-ops.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
] as const;

describe("N3-PREP source / ownership contracts", () => {
  it("only designated post-school-ready orchestration invokes PREP helper", () => {
    const srcRoot = path.join(repoRoot, "src");
    const hits: string[] = [];

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
        if (text.includes("prepareScenarioLabelN3LegacyFenceCertificate")) {
          hits.push(rel);
        }
      }
    }

    walk(srcRoot);
    expect(hits.sort()).toEqual([...ALLOWED_PREP_CALL_SITES].sort());
  });

  it("Dashboard / App bootstrap / Backup / Restore / reads do not call PREP", () => {
    for (const file of FORBIDDEN_PREP_CONSUMERS) {
      const source = readSource(file);
      expect(source, file).not.toContain("prepareScenarioLabelN3LegacyFenceCertificate");
      expect(source, file).not.toContain("scenario-label-n3-prep");
    }
  });

  it("PREP does not call mutation finalizer", () => {
    const prep = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-prep.ts",
    );
    expect(prep).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
    expect(prep).not.toContain("scenario-label-n3-fence-finalize");
  });

  it("PREP never writes legacy / school-v2 / marker / schema2 authority", () => {
    const prep = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-prep.ts",
    );
    expect(prep).toContain("serializeScenarioLabelN3FenceKey");
    expect(prep).toContain("buildScenarioLabelN3FenceRecord");
    // Only fence setItem path — no marker/business builders as write targets.
    expect(prep).not.toContain("serializeScenarioLabelMigrationMarkerPayload");
    expect(prep).not.toContain("buildScenarioLabelMigrationMarkerPayload");
    expect(prep).not.toContain("authority: \"namespaced\"");
    expect(prep).not.toContain('authority: "namespaced"');
    expect(prep).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
    expect(prep).not.toContain("assessScenarioLabelCutoverReadiness");
  });

  it("already_ready path invokes PREP via aware gate; established path does not", () => {
    const runtime = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
    );
    expect(runtime).toContain("prepareScenarioLabelN3LegacyFenceCertificate");
    expect(runtime).toContain("permit_legacy_prep");
    expect(runtime).toContain('return { status: "already_ready" }');

    const alreadyReadyIdx = runtime.indexOf('plan.kind === "already_ready"');
    expect(alreadyReadyIdx).toBeGreaterThan(-1);
    const returnIdx = runtime.indexOf('return { status: "already_ready" }', alreadyReadyIdx);
    expect(returnIdx).toBeGreaterThan(alreadyReadyIdx);
    const between = runtime.slice(alreadyReadyIdx, returnIdx);
    // Early already_ready inside establish still has zero fence writes.
    expect(between).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
    expect(between).not.toContain("prepareScenarioLabelN3LegacyFenceCertificate");
  });

  it("Restore applying path remains PREP-free", () => {
    const restore = readSource("src/backup/restore/apply-app-backup-restore.ts");
    expect(restore).not.toContain("prepareScenarioLabelN3LegacyFenceCertificate");
    expect(restore).not.toContain("scenario-label-n3-prep");
    expect(restore).toContain("finalizeScenarioLabelLegacyFenceCertificate");
  });
});
