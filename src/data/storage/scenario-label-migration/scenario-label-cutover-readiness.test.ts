import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assessScenarioLabelCutoverReadiness } from "./scenario-label-cutover-readiness";
import type { ScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-types";

const SCHOOL_A = "11111111-1111-4111-8111-111111111111";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function syncedPresent(): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "present",
  };
}

function syncedAbsent(): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "absent",
  };
}

describe("assessScenarioLabelCutoverReadiness (pure N2-HARDEN)", () => {
  it("U: target unresolved → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "skipped", reason: "corrupted" },
        marker: syncedPresent(),
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: false, reason: "target_unresolved" });
  });

  it("V: marker missing → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: null,
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: false, reason: "marker_missing" });
  });

  it("W: marker invalid → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: {
          schemaVersion: 1,
          authority: "legacy",
          mirrorHealth: "synced",
          // force invalid via cast
          authoritativePresence: undefined as unknown as "present",
        },
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: false, reason: "marker_invalid" });
  });

  it("X: dirty → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: {
          status: "resolved",
          target: { kind: "school", schoolId: SCHOOL_A },
        },
        marker: {
          schemaVersion: 1,
          authority: "legacy",
          mirrorHealth: "dirty",
          authoritativePresence: "present",
        },
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: false, reason: "marker_not_synced" });
  });

  it("Y: presence mismatch → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: syncedPresent(),
        legacyRaw: { exists: false },
        shadowRaw: { exists: false },
      }),
    ).toEqual({ ready: false, reason: "presence_mismatch" });
  });

  it("Z: raw mismatch → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: syncedPresent(),
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "B" },
      }),
    ).toEqual({ ready: false, reason: "raw_mismatch" });
  });

  it("AA: legacy+v2 missing + synced absent → READY", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: syncedAbsent(),
        legacyRaw: { exists: false },
        shadowRaw: { exists: false },
      }),
    ).toEqual({ ready: true });
  });

  it('AB: present empty "" both sides + synced present → READY', () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: syncedPresent(),
        legacyRaw: { exists: true, value: "" },
        shadowRaw: { exists: true, value: "" },
      }),
    ).toEqual({ ready: true });
  });

  it("AC: legacy A + v2 A + synced present → READY", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: {
          status: "resolved",
          target: { kind: "school", schoolId: SCHOOL_A },
        },
        marker: syncedPresent(),
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: true });
  });

  it("marker_not_legacy → false", () => {
    expect(
      assessScenarioLabelCutoverReadiness({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        marker: {
          schemaVersion: 1,
          authority: "namespaced" as "legacy",
          mirrorHealth: "synced",
          authoritativePresence: "present",
        },
        legacyRaw: { exists: true, value: "A" },
        shadowRaw: { exists: true, value: "A" },
      }),
    ).toEqual({ ready: false, reason: "marker_not_legacy" });
  });

  it("0 production call sites (only this helper file + its tests import it)", () => {
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
        if (entry.name.includes("cutover-readiness")) continue;
        const text = fs.readFileSync(full, "utf8");
        if (text.includes("assessScenarioLabelCutoverReadiness")) {
          hits.push(path.relative(repoRoot, full));
        }
      }
    }
    walk(srcRoot);
    expect(hits).toEqual([]);
  });
});
