/**
 * N3-AWARE-WIRING source contracts.
 *
 * Replaces CORE zero-consumer contract with exact allowed production consumer inventory.
 * Rogue legacy business read/write / direct school-v2 / marker / fence writes outside
 * approved surfaces are forbidden.
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

/** CORE + WIRING runtime implementation files. */
const AWARE_IMPL_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-assessment.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
  "src/data/storage/scenario-label-migration/scenario-label-aware-notices.ts",
  "src/data/storage/scenario-label-migration/scenario-label-aware-runtime.ts",
  "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-namespaced-fence-finalize.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-establishment-gate.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-aware-test-helpers.ts",
] as const;

/** Exact allowed production consumers of AWARE CORE / facade. */
const AWARE_ALLOWED_PRODUCTION_CONSUMERS = [
  "src/PhmaxDashboardPage.tsx",
  "src/backup/backup-registry.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
  "src/backup/restore/build-app-backup-restore-plan.ts",
  "src/phmax-local-storage-clear.ts",
  "src/phmax-school-scenario-export.ts",
  "src/phmax-is-handoff-apply.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
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

const FACADE_SYMBOLS = [
  "readScenarioLabelAwareUi",
  "writeScenarioLabelAwareFromUiInput",
  "writeScenarioLabelAwareFromUiInputOrThrow",
  "clearScenarioLabelAwareRuntime",
  "readScenarioLabelAwareLogicalForBusiness",
  "preflightScenarioLabelAwareAuthority",
] as const;

const LEGACY_BUSINESS_WRITE_CALLERS_FORBIDDEN_OUTSIDE = [
  "writeScenarioLabelFromUiInput(",
  "writeScenarioLabelFromUiInputOrThrow(",
] as const;

describe("N3-AWARE-WIRING source contracts", () => {
  it("AWARE APIs only appear in approved impl + production consumers", () => {
    const hitsBySymbol = new Map<string, string[]>();
    for (const rel of walkSrcTsFiles()) {
      const text = fs.readFileSync(path.join(repoRoot, rel), "utf8");
      for (const symbol of AWARE_API_SYMBOLS) {
        if (text.includes(symbol)) {
          const list = hitsBySymbol.get(symbol) ?? [];
          list.push(rel);
          hitsBySymbol.set(symbol, list);
        }
      }
    }

    for (const symbol of AWARE_API_SYMBOLS) {
      const hits = (hitsBySymbol.get(symbol) ?? []).sort();
      for (const hit of hits) {
        const allowed =
          AWARE_IMPL_FILES.includes(hit as (typeof AWARE_IMPL_FILES)[number]) ||
          AWARE_ALLOWED_PRODUCTION_CONSUMERS.includes(
            hit as (typeof AWARE_ALLOWED_PRODUCTION_CONSUMERS)[number],
          ) ||
          hit.includes("scenario-label-n3-aware") ||
          hit.includes("scenario-label-aware-") ||
          hit.includes("scenario-label-restore-authority") ||
          hit.includes("scenario-label-n3-namespaced-fence") ||
          hit.includes("scenario-label-n3-establishment-gate") ||
          // Inert CUTOVER-CORE executor assesses runtime authority; 0 production callers.
          hit.includes("scenario-label-n3-cutover");
        expect(allowed, `${symbol} referenced from production file ${hit}`).toBe(true);
      }
    }
  });

  it("facade is the Dashboard / Backup / Level B / handoff entry", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("readScenarioLabelAwareUi");
    expect(dash).toContain("writeScenarioLabelAwareFromUiInputOrThrow");
    expect(dash).not.toContain("writeScenarioLabelFromUiInputOrThrow");
    expect(dash).not.toContain("readSchoolScenarioLabel(");

    const backup = readSource("src/backup/backup-registry.ts");
    expect(backup).toContain("readScenarioLabelAwareLogicalForBusiness");

    const clear = readSource("src/phmax-local-storage-clear.ts");
    expect(clear).toContain("clearScenarioLabelAwareRuntime");
    expect(clear).not.toContain("clearScenarioLabelLifecycle(");

    const handoff = readSource("src/phmax-is-handoff-apply.ts");
    expect(handoff).toContain("preflightScenarioLabelAwareAuthority");
    expect(handoff).toContain("writeScenarioLabelAwareFromUiInput");
    expect(handoff).not.toContain("writeScenarioLabelFromUiInput(");
  });

  it("no rogue UI legacy write callers outside repository internals", () => {
    for (const rel of walkSrcTsFiles()) {
      if (rel.endsWith("scenario-label-repository.ts")) continue;
      if (rel.includes("scenario-label-aware-runtime")) continue;
      const text = readSource(rel);
      for (const call of LEGACY_BUSINESS_WRITE_CALLERS_FORBIDDEN_OUTSIDE) {
        expect(text.includes(call), `${rel} must not call ${call}`).toBe(false);
      }
    }
  });

  it("WIRING surfaces do not call cutover planner or boolean fenceReady gate", () => {
    const files = [
      ...AWARE_IMPL_FILES,
      ...AWARE_ALLOWED_PRODUCTION_CONSUMERS,
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
    ];
    for (const file of files) {
      if (!fs.existsSync(path.join(repoRoot, file))) continue;
      const source = readSource(file);
      expect(source, file).not.toContain("planScenarioLabelAuthorityCutover");
      expect(source, file).not.toContain("classifyScenarioLabelAuthorityCutoverOutcome");
      expect(source, file).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
      expect(source, file).not.toMatch(/fenceReady\s*===?\s*true/);
      expect(source, file).not.toMatch(/if\s*\(\s*fenceReady/);
    }
  });

  it("schema2 marker builders only in namespaced writer/clear + restore authority ops + inert cutover", () => {
    const allowed = new Set([
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
      "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-authority-marker.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-authority-protocol.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-test-helpers.ts",
      // N3-CUTOVER-CORE inert executor — sole first-schema2-from-legacy path (0 production callers).
      "src/data/storage/scenario-label-migration/scenario-label-n3-cutover.ts",
    ]);
    for (const rel of walkSrcTsFiles()) {
      const text = readSource(rel);
      if (!text.includes("buildScenarioLabelN3NamespacedMarker")) continue;
      expect(allowed.has(rel) || rel.includes("scenario-label-n3-authority"), rel).toBe(true);
    }
  });

  it("logical read never writes / never routes fence.committedRaw", () => {
    const read = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
    );
    expect(read).not.toContain(".setItem");
    expect(read).not.toContain(".removeItem");
    expect(read).not.toMatch(/\bfence\.committedRaw\b/);

    const facade = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-aware-runtime.ts",
    );
    expect(facade).not.toMatch(/assessment\.fence\.committedRaw/);
    expect(facade).toContain("never fence.committedRaw");
  });

  it("namespaced executor must not call legacy writer as fallback", () => {
    const write = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
    );
    const nsWriteStart = write.indexOf("export function writeScenarioLabelNamespacedRaw");
    const nsWriteEnd = write.indexOf("export function writeScenarioLabelAwareLogical");
    const nsBody = write.slice(nsWriteStart, nsWriteEnd);
    expect(nsBody).not.toContain("writeScenarioLabelRaw(");
    expect(nsBody).not.toContain("clearScenarioLabelLifecycle(");
    expect(nsBody).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
  });

  it("console snippet refuses namespaced mutation (no inline namespaced writer)", () => {
    const handoff = readSource("src/phmax-is-handoff-apply.ts");
    expect(handoff).toContain("namespaced autoritu");
    expect(handoff).toContain("CUTOVER-readiness");
    expect(handoff).not.toContain("authority:\"namespaced\"");
    // Snippet must not embed schema2 write for scenario mutation.
    const fragStart = handoff.indexOf("export function buildScenarioLabelLiveApplySnippetFragment");
    const fragEnd = handoff.indexOf("export function applyPhmaxIsHandoffToStorage");
    const frag = handoff.slice(fragStart, fragEnd);
    expect(frag).not.toContain('authority:"namespaced"');
    expect(frag).toContain("return false");
  });

  it("repository remains low-level legacy implementation (no facade imports)", () => {
    const repo = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
    );
    expect(repo).toContain("export function writeScenarioLabelRaw");
    expect(repo).toContain("export function clearScenarioLabelLifecycle");
    expect(repo).not.toContain("scenario-label-aware-runtime");
    expect(repo).not.toContain("readScenarioLabelAwareLogical");
  });

  it("facade exports cover required UI surface", () => {
    const facade = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-aware-runtime.ts",
    );
    for (const symbol of FACADE_SYMBOLS) {
      expect(facade, symbol).toContain(symbol);
    }
  });
});
