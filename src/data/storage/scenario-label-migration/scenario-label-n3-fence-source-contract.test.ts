import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { APPLICATION_LOCAL_STORAGE_PREFIXES } from "../../../application-storage-registry";
import { BACKUP_MODULE_ADAPTERS } from "../../../backup/backup-registry";
import { NAMESPACED_STORAGE_V2_ROOT_PREFIX } from "../namespaced-storage-schema";
import { parseNamespacedStorageKey } from "../namespaced-storage-address";
import { parseScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import {
  parseScenarioLabelN3FenceKey,
  serializeScenarioLabelN3FenceKey,
} from "./scenario-label-n3-fence-key";
import {
  SCENARIO_LABEL_N3_FENCE_BACKUP_OMITS_CERTIFICATE,
  SCENARIO_LABEL_N3_FENCE_SEGMENT,
} from "./scenario-label-n3-fence-types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const SCHOOL_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;

const N3_FENCE_SOURCE_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-key.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-record.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-protocol.ts",
] as const;

const N3_FENCE_SYMBOLS = [
  "serializeScenarioLabelN3FenceKey",
  "parseScenarioLabelN3FenceKey",
  "parseScenarioLabelN3FenceRecord",
  "serializeScenarioLabelN3FenceRecord",
  "buildScenarioLabelN3FenceRecord",
  "assessScenarioLabelN3FenceState",
  "assessScenarioLabelFenceCutoverEligibility",
  "isScenarioLabelN3FenceReadyForPreCutover",
  "noteScenarioLabelN3PlanReadyIsNotFenceEligibility",
  "assertScenarioLabelN3FenceRequiresExactRaw",
] as const;

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("N3-FENCE-PROTO source contract", () => {
  const sources = N3_FENCE_SOURCE_FILES.map((file) => ({ file, source: readSource(file) }));

  it("zero storage / browser IO in N3-FENCE-PROTO production files", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("localStorage");
      expect(source, file).not.toContain("sessionStorage");
      expect(source, file).not.toContain("window.");
      expect(source, file).not.toContain("document.");
      expect(source, file).not.toContain("globalThis");
      expect(source, file).not.toContain(".setItem(");
      expect(source, file).not.toContain(".removeItem(");
      expect(source, file).not.toMatch(/(?:localStorage|sessionStorage)\.clear\(/);
      expect(source, file).not.toContain(".getItem(");
      expect(source, file).not.toContain("BroadcastChannel");
      expect(source, file).not.toContain("navigator.locks");
      expect(source, file).not.toContain("serviceWorker");
      expect(source, file).not.toContain("crypto.subtle");
    }
  });

  it("does not import runtime lifecycle / backup / restore / dashboard engines", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("scenario-label-repository");
      expect(source, file).not.toContain("school-shadow-establishment-runtime");
      expect(source, file).not.toContain("profile-save-platform-binding");
      expect(source, file).not.toContain("vz-school-year-persist-binding");
      expect(source, file).not.toContain("apply-app-backup-restore");
      expect(source, file).not.toContain("phmax-is-handoff-apply");
      expect(source, file).not.toContain("PhmaxDashboardPage");
      expect(source, file).not.toContain("phmax-local-storage-clear");
      expect(source, file).not.toContain("application-storage-registry");
      // Must not import/use the old N2 unbound-permitting readiness helper module.
      expect(source, file).not.toContain("scenario-label-cutover-readiness");
      expect(source, file).not.toMatch(
        /from\s+["']\.\/scenario-label-cutover-readiness["']/,
      );
    }
  });

  it("zero production call sites for N3-FENCE-PROTO symbols", () => {
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
        if (entry.name.includes("n3-fence")) continue;
        const text = fs.readFileSync(full, "utf8");
        for (const symbol of N3_FENCE_SYMBOLS) {
          if (text.includes(symbol)) {
            hits.push(`${path.relative(repoRoot, full)}:${symbol}`);
          }
        }
      }
    }

    walk(srcRoot);
    expect(hits).toEqual([]);
  });

  it("eligibility composer uses N3 school readiness status, not old N2 helper module", () => {
    const protocol = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-fence-protocol.ts",
    );
    expect(protocol).toContain("assessScenarioLabelFenceCutoverEligibility");
    expect(protocol).toContain("ready_for_cutover");
    expect(protocol).not.toContain("scenario-label-cutover-readiness");
    expect(protocol).toContain("unbound-permitting readiness helper");
  });

  it("C1/C2: current Level B / post-export clear does not target fence key", () => {
    const clearSource = readSource("src/phmax-local-storage-clear.ts");
    const repoSource = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
    );
    expect(clearSource).toContain("clearScenarioLabelLifecycle");
    expect(clearSource).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
    expect(clearSource).not.toContain("protocol-commit");
    expect(repoSource).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
    expect(repoSource).not.toContain("protocol-commit");
    expect(repoSource).toContain("buildScenarioLabelNamespacedKey");
    expect(repoSource).toContain("serializeScenarioLabelMigrationMarkerKey");
  });

  it("C3: current Restore scenario ops do not target fence key", () => {
    const restoreOps = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-restore-ops.ts",
    );
    expect(restoreOps).toContain("buildScenarioLabelNamespacedKey");
    expect(restoreOps).toContain("serializeScenarioLabelMigrationMarkerKey");
    expect(restoreOps).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
    expect(restoreOps).not.toContain("protocol-commit");
    expect(restoreOps).not.toContain("serializeScenarioLabelN3FenceKey");
  });

  it("C4: existing Full Reset v2 prefix covers fence key", () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_ID,
    });
    expect(APPLICATION_LOCAL_STORAGE_PREFIXES).toContain(NAMESPACED_STORAGE_V2_ROOT_PREFIX);
    expect(fenceKey.startsWith(NAMESPACED_STORAGE_V2_ROOT_PREFIX)).toBe(true);
    expect(parseScenarioLabelN3FenceKey(fenceKey)).not.toBeNull();
  });

  it("C5: Backup-owned modules exclude fence certificate", () => {
    expect(SCENARIO_LABEL_N3_FENCE_BACKUP_OMITS_CERTIFICATE).toBe(true);
    const scenarioAdapter = BACKUP_MODULE_ADAPTERS.find((a) => a.id === "phmax-scenario-label");
    expect(scenarioAdapter).toBeDefined();
    expect(scenarioAdapter!.storageKeys).toEqual(["phmax-school-scenario-label"]);
    for (const adapter of BACKUP_MODULE_ADAPTERS) {
      for (const key of adapter.storageKeys) {
        expect(key.includes(SCENARIO_LABEL_N3_FENCE_SEGMENT)).toBe(false);
        expect(parseScenarioLabelN3FenceKey(key)).toBeNull();
      }
    }
  });

  it("C6: old console snippet source contains no fence protocol", () => {
    const snippet = readSource("src/phmax-is-handoff-apply.ts");
    expect(snippet).toContain("buildHandoffApplyConsoleSnippet");
    expect(snippet).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
    expect(snippet).not.toContain("protocol-commit");
    expect(snippet).not.toContain("serializeScenarioLabelN3FenceKey");
    expect(snippet).not.toContain("assessScenarioLabelN3FenceState");
  });

  it("fence key isolation: not business address, not migration marker", () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_ID,
    });
    expect(parseNamespacedStorageKey(fenceKey)).toBeNull();
    expect(parseScenarioLabelMigrationMarkerKey(fenceKey)).toBeNull();
  });

  it("old writers (repository / establishment) do not know fence key", () => {
    const establishment = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
    );
    expect(establishment).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
    expect(establishment).not.toContain("protocol-commit");
  });
});
