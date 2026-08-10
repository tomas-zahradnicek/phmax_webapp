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

/** Pure PROTO modules — still zero storage I/O. */
const N3_FENCE_PURE_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-key.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-record.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-protocol.ts",
] as const;

/** Allowed production call sites for fence finalizer (N3-FENCE-WRITE). */
const ALLOWED_FENCE_FINALIZE_CALL_SITES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
  "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
] as const;

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("N3-FENCE-WRITE source / ownership contracts", () => {
  it("pure PROTO files remain zero storage / browser IO", () => {
    for (const file of N3_FENCE_PURE_FILES) {
      const source = readSource(file);
      expect(source, file).not.toContain("localStorage");
      expect(source, file).not.toContain("sessionStorage");
      expect(source, file).not.toContain(".setItem(");
      expect(source, file).not.toContain(".removeItem(");
      expect(source, file).not.toContain(".getItem(");
    }
  });

  it("finalizer is the only fence writer; call sites are exact inventory", () => {
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
        if (text.includes("finalizeScenarioLabelLegacyFenceCertificate")) {
          hits.push(rel);
        }
      }
    }

    walk(srcRoot);
    expect(hits.sort()).toEqual([...ALLOWED_FENCE_FINALIZE_CALL_SITES].sort());
  });

  it("does not use historic boolean fenceReady production eligibility API in runtime", () => {
    const runtimeOwners = [
      "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
      "src/backup/restore/apply-app-backup-restore.ts",
      "src/phmax-is-handoff-apply.ts",
    ];
    for (const file of runtimeOwners) {
      const source = readSource(file);
      expect(source, file).not.toContain("assessScenarioLabelN3ProductionCutoverEligibility");
      expect(source, file).not.toContain("assessScenarioLabelCutoverReadiness");
    }
  });

  it("Level B / post-export own fence only via aware clear (dispatcher → lifecycle)", () => {
    const clearSource = readSource("src/phmax-local-storage-clear.ts");
    expect(clearSource).toContain("clearScenarioLabelAwareRuntime");
    expect(clearSource).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
    expect(clearSource).not.toContain(SCENARIO_LABEL_N3_FENCE_SEGMENT);
  });

  it("C4: Full Reset v2 prefix still covers fence", () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_ID,
    });
    expect(APPLICATION_LOCAL_STORAGE_PREFIXES).toContain(NAMESPACED_STORAGE_V2_ROOT_PREFIX);
    expect(fenceKey.startsWith(NAMESPACED_STORAGE_V2_ROOT_PREFIX)).toBe(true);
  });

  it("C5: Backup still omits fence", () => {
    expect(SCENARIO_LABEL_N3_FENCE_BACKUP_OMITS_CERTIFICATE).toBe(true);
    for (const adapter of BACKUP_MODULE_ADAPTERS) {
      for (const key of adapter.storageKeys) {
        expect(parseScenarioLabelN3FenceKey(key)).toBeNull();
      }
    }
  });

  it("C6: new console snippet is fence-aware (school only, LAST)", () => {
    const snippet = readSource("src/phmax-is-handoff-apply.ts");
    expect(snippet).toContain("buildScenarioLabelLiveApplySnippetFragment");
    expect(snippet).toContain("SCENARIO_LABEL_N3_FENCE_SEGMENT");
    expect(snippet).toContain("SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION");
    expect(snippet).toContain("fenceKey");
    expect(snippet).toContain("protocolGeneration");
    // Unbound path must not invent fenceKey in unbound branch before school resolve.
    expect(snippet).toContain('markerKey=v2Root+mseg+":"+mod+":"+res+":unbound"');
  });

  it("already_ready path does not call fence finalizer", () => {
    const establishment = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
    );
    const alreadyReadyIdx = establishment.indexOf('plan.kind === "already_ready"');
    expect(alreadyReadyIdx).toBeGreaterThan(-1);
    const returnIdx = establishment.indexOf('return { status: "already_ready" }', alreadyReadyIdx);
    expect(returnIdx).toBeGreaterThan(alreadyReadyIdx);
    const between = establishment.slice(alreadyReadyIdx, returnIdx);
    expect(between).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
  });

  it("Restore writes legacy fence only post-verification soft zone", () => {
    const restore = readSource("src/backup/restore/apply-app-backup-restore.ts");
    expect(restore).toContain("finalizeScenarioLabelLegacyFenceCertificate");
    expect(restore).toContain("Past rollback boundary for LEGACY fence");
    expect(restore).toContain("N3-AWARE-WIRING");
    // Fence must not appear inside restore-ops physical planner as a SET op helper.
    const ops = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-restore-ops.ts",
    );
    expect(ops).not.toContain("finalizeScenarioLabelLegacyFenceCertificate");
    // Allowlist may parse fence keys for touchedKeys; finalizer must stay out of ops builder.
    expect(ops).not.toContain("finalizeScenarioLabelNamespacedFenceCertificate");
  });

  it("fence key isolation unchanged", () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_ID,
    });
    expect(parseNamespacedStorageKey(fenceKey)).toBeNull();
    expect(parseScenarioLabelMigrationMarkerKey(fenceKey)).toBeNull();
  });

  it("no schema2 namespaced marker production write in fence-write owners", () => {
    const owners = [
      "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
      "src/data/storage/scenario-label-migration/scenario-label-repository.ts",
      "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
      "src/phmax-is-handoff-apply.ts",
    ];
    for (const file of owners) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/authority:\s*["']namespaced["']/);
      expect(source, file).not.toContain('authority:"namespaced"');
    }
  });
});
