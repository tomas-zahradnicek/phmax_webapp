/**
 * N3-AWARE-CORE residual contracts (kept alongside WIRING inventory).
 * Production consumer allowlist lives in scenario-label-aware-wiring-source-contract.test.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("N3-AWARE-CORE residual contracts", () => {
  it("CORE mutation logic does not call cutover planner/executor or boolean fenceReady gate", () => {
    const mutationFiles = [
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-namespaced-fence-finalize.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-assessment.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
      "src/data/storage/scenario-label-migration/scenario-label-n3-establishment-gate.ts",
      "src/data/storage/scenario-label-migration/scenario-label-aware-runtime.ts",
      "src/data/storage/scenario-label-migration/scenario-label-restore-authority-ops.ts",
    ];
    for (const file of mutationFiles) {
      const source = readSource(file);
      expect(source, file).not.toContain("planScenarioLabelAuthorityCutover");
      expect(source, file).not.toContain("classifyScenarioLabelAuthorityCutoverOutcome");
      expect(source, file).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
      expect(source, file).not.toContain("assessScenarioLabelFenceCutoverEligibility");
      expect(source, file).not.toContain("isScenarioLabelN3FenceReadyForPreCutover");
      expect(source, file).not.toMatch(/fenceReady\s*===?\s*true/);
      expect(source, file).not.toMatch(/if\s*\(\s*fenceReady/);
    }
  });

  it("logical read never writes / never routes fence.committedRaw", () => {
    const read = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-read.ts",
    );
    expect(read).not.toContain(".setItem");
    expect(read).not.toContain(".removeItem");
    expect(read).not.toMatch(/\bfence\.committedRaw\b/);
    expect(read).toContain('source: "school_v2"');
    expect(read).toContain("assessment.schoolV2Raw");
  });

  it("namespaced executor must not call legacy writer as fallback", () => {
    const write = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-write.ts",
    );
    const clear = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-clear.ts",
    );

    const nsWriteStart = write.indexOf("export function writeScenarioLabelNamespacedRaw");
    const nsWriteEnd = write.indexOf("export function writeScenarioLabelAwareLogical");
    const nsBody = write.slice(nsWriteStart, nsWriteEnd);
    expect(nsBody).not.toContain("writeScenarioLabelRaw(");
    expect(nsBody).not.toContain("clearScenarioLabelLifecycle(");
    expect(nsBody).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");

    const nsClearStart = clear.indexOf("export function clearScenarioLabelNamespaced");
    const nsClearEnd = clear.indexOf("export function clearScenarioLabelAwareLogical");
    const nsClearBody = clear.slice(nsClearStart, nsClearEnd);
    expect(nsClearBody).not.toContain("writeScenarioLabelRaw(");
    expect(nsClearBody).not.toContain("clearScenarioLabelLifecycle(");
    expect(nsClearBody).not.toContain("buildScenarioLabelN3LegacyMarker");
  });

  it("SCENARIO_LABEL_N3_AWARE_NO_CUTOVER remains locked", () => {
    const types = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-aware-types.ts",
    );
    expect(types).toContain("SCENARIO_LABEL_N3_AWARE_NO_CUTOVER = true");
    expect(types).toContain("SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2 = true");
    expect(types).toContain("SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK = true");
  });
});
