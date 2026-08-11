/**
 * N3-CUTOVER-ACTIVATE — owner orchestration matrix (O1–O18).
 */

import { describe, expect, it, vi } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import {
  MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG,
  establishScenarioLabelSchoolShadowFromLegacy,
  runScenarioLabelEstablishmentAfterSchoolReady,
  scenarioLabelEstablishmentNoticeKind,
} from "./scenario-label-school-shadow-establishment-runtime";
import type { ScenarioLabelN3AuthorityCutoverResult } from "./scenario-label-n3-cutover-types";
import {
  MemoryStorage,
  SCHOOL_A,
  rawPresent,
  seedLegacyReady,
  seedLegacyUnprepared,
  seedNamespacedReady,
  schoolKeys,
} from "./scenario-label-n3-aware-test-helpers";
import {
  buildScenarioLabelN3FenceRecord,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import {
  runPlatformBindingAfterProfilePersist,
  runPlatformBindingOnMount,
} from "../../../school-profile/profile-save-platform-binding";
import { runVzSchoolYearBindingAfterPersist } from "../../../vyrocni-zprava/vz-school-year-persist-binding";

function countingCutover(result: ScenarioLabelN3AuthorityCutoverResult) {
  return vi.fn(() => result);
}

describe("N3-CUTOVER-ACTIVATE owner matrix", () => {
  it("O1: already_ready + PREP prepared + allowCutover true → executor exactly once", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "A");
    const executeAuthorityCutover = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover },
    );
    expect(result.status).toBe("already_ready");
    expect(executeAuthorityCutover).toHaveBeenCalledTimes(1);
    expect(executeAuthorityCutover).toHaveBeenCalledWith({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result).toMatchObject({
      cutover: { attempted: true, status: "cutover_success", notice: "silent" },
    });
  });

  it("O2: already_ready + PREP already_prepared → executor exactly once", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const executeAuthorityCutover = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover },
    );
    expect(result.status).toBe("already_ready");
    expect(executeAuthorityCutover).toHaveBeenCalledTimes(1);
  });

  it("O3: established + successful legacy fence finalize → executor exactly once", () => {
    const storage = new MemoryStorage();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "NEW");
    const executeAuthorityCutover = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover },
    );
    expect(result.status).toBe("established");
    expect(executeAuthorityCutover).toHaveBeenCalledTimes(1);
  });

  it("O4: PREP blocked_violation → executor 0", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "A");
    const keys = schoolKeys(SCHOOL_A);
    const violatedFence = serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "legacy",
        schoolId: SCHOOL_A,
        committedRaw: rawPresent("STALE"),
      }),
    );
    // Gate sees missing fence → permit_legacy_prep; PREP later sees violated → blocked_violation.
    let fenceReads = 0;
    const origGet = storage.getItem.bind(storage);
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fenceReads += 1;
        return fenceReads <= 2 ? null : violatedFence;
      }
      return origGet(key);
    };
    const cut = countingCutover({ status: "cutover_success", schoolId: SCHOOL_A });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(cut).toHaveBeenCalledTimes(0);
    expect(out).not.toHaveProperty("cutover");
  });

  it("O5: PREP blocked_invalid → 0", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "A");
    const keys = schoolKeys(SCHOOL_A);
    let fenceReads = 0;
    const origGet = storage.getItem.bind(storage);
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fenceReads += 1;
        return fenceReads <= 2 ? null : "{not-json";
      }
      return origGet(key);
    };
    const cut = countingCutover({ status: "cutover_success", schoolId: SCHOOL_A });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(cut).toHaveBeenCalledTimes(0);
  });

  it("O6: PREP storage_unavailable → 0", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "A");
    const keys = schoolKeys(SCHOOL_A);
    const origGet = storage.getItem.bind(storage);
    let markerReads = 0;
    storage.getItem = (key: string) => {
      if (key === keys.marker) {
        markerReads += 1;
        // Gate succeeds; PREP later read throws.
        if (markerReads > 2) throw new Error("quota");
      }
      return origGet(key);
    };
    const cut = countingCutover({ status: "cutover_success", schoolId: SCHOOL_A });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(cut).toHaveBeenCalledTimes(0);
  });

  it("O7: namespaced AWARE gate → 0 PREP + 0 cutover", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const cut = countingCutover({ status: "cutover_success", schoolId: SCHOOL_A });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out).toEqual({ status: "skipped_namespaced" });
    expect(cut).toHaveBeenCalledTimes(0);
  });

  it("O8: blocked authority gate → 0", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "A");
    const keys = schoolKeys(SCHOOL_A);
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: rawPresent("A"),
        }),
      ),
    );
    const cut = countingCutover({ status: "cutover_success", schoolId: SCHOOL_A });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("skipped_authority_blocked");
    expect(cut).toHaveBeenCalledTimes(0);
  });

  it("O9: cutover not_eligible → orchestration success / silent", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "not_eligible",
      reason: "fence_not_legacy_committed",
    });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("none");
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O10: concurrent_drift → business success → no retry", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({ status: "concurrent_drift", phase: "pre_marker" });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("none");
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O11: rolled_back → soft metadata signal", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "rolled_back",
      from: "marker_verify_failed",
      schoolId: SCHOOL_A,
    });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("soft");
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O12: cutover_degraded → metadata notice → no N2 repair", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const before = JSON.stringify([...storage.store.entries()]);
    const cut = countingCutover({
      status: "cutover_degraded",
      reason: "post_marker_business_drift",
      schoolId: SCHOOL_A,
    });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("soft");
    expect(cut).toHaveBeenCalledTimes(1);
    expect(JSON.stringify([...storage.store.entries()])).toBe(before);
  });

  it("O13: fatal_partial → strong metadata signal", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "fatal_partial",
      reason: "marker_rollback_failed",
      phase: "marker_verify",
      schoolId: SCHOOL_A,
    });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("strong");
    expect(MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG).toContain("scénáře");
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O14: cutover throw → caught → business persistence unaffected", async () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = vi.fn(() => {
      throw new Error("boom");
    });
    const out = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(out.status).toBe("already_ready");
    expect(scenarioLabelEstablishmentNoticeKind(out)).toBe("soft");
    expect(cut).toHaveBeenCalledTimes(1);

    const profile = await runPlatformBindingAfterProfilePersist(
      { ok: true },
      async () => ({
        status: "ready",
        schoolId: SCHOOL_A,
        activeSchoolId: SCHOOL_A,
        activeSchoolYearId: null,
        staleActiveSchoolId: false,
        staleActiveSchoolYearId: false,
      }),
      () => out,
    );
    expect(profile.bindingAttempted).toBe(true);
    expect(profile.metadataNotice).not.toBeNull();
  });

  it("O15: StrictMode/repeat → no harmful duplicate cutover", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const first = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(first).toMatchObject({ cutover: { status: "cutover_success" } });
    seedNamespacedReady(storage, "A");
    const second = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage, executeAuthorityCutover: cut },
    );
    expect(second).toEqual({ status: "skipped_namespaced" });
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O16: VZ logical event → one owner attempt", async () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const establish = (binding: { status: string; schoolId?: EntityId }) =>
      runScenarioLabelEstablishmentAfterSchoolReady(binding, {
        storage,
        executeAuthorityCutover: cut,
      });
    const vz = await runVzSchoolYearBindingAfterPersist(
      { ok: true },
      async () => ({
        status: "ready",
        schoolId: SCHOOL_A,
        schoolYearId: "yyyyyyyy-yyyy-4yyy-8yyy-yyyyyyyyyyyy" as EntityId,
        startYear: 2026,
      }),
      establish,
    );
    expect(vz.bindingAttempted).toBe(true);
    expect(vz.metadataNotice).toBeNull();
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("O17: allowCutover false → 0 executor", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const out = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, {
      storage,
      allowCutover: false,
      executeAuthorityCutover: cut,
    });
    expect(out.status).toBe("already_ready");
    expect(cut).toHaveBeenCalledTimes(0);
    expect(out).not.toHaveProperty("cutover");
  });

  it("O18: Restore-style establishment invocation → 0 executor", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const cut = countingCutover({
      status: "cutover_success",
      schoolId: SCHOOL_A,
    });
    const out = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, {
      storage,
      executeAuthorityCutover: cut,
    });
    expect(out.status).toBe("already_ready");
    expect(cut).toHaveBeenCalledTimes(0);
  });
});

describe("N3-CUTOVER-ACTIVATE Profile/VZ business independence", () => {
  it("Profile save: cutover soft/strong/throw outcomes do not claim persist failure", async () => {
    const cases: ScenarioLabelN3AuthorityCutoverResult[] = [
      { status: "cutover_success", schoolId: SCHOOL_A },
      { status: "not_eligible", reason: "data_not_ready_for_cutover" },
      { status: "concurrent_drift", phase: "pre_marker" },
      { status: "rolled_back", from: "fence_write_failed", schoolId: SCHOOL_A },
      {
        status: "cutover_degraded",
        reason: "rollback_not_safe",
        schoolId: SCHOOL_A,
      },
      {
        status: "fatal_partial",
        reason: "metadata_rollback_incomplete",
        phase: "fence_verify",
        schoolId: SCHOOL_A,
      },
    ];
    for (const cutover of cases) {
      const storage = new MemoryStorage();
      seedLegacyReady(storage, "A");
      const outcome = await runPlatformBindingAfterProfilePersist(
        { ok: true },
        async () => ({
          status: "ready",
          schoolId: SCHOOL_A,
          activeSchoolId: SCHOOL_A,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        (binding) =>
          runScenarioLabelEstablishmentAfterSchoolReady(binding, {
            storage,
            executeAuthorityCutover: () => cutover,
          }),
      );
      expect(outcome.bindingAttempted).toBe(true);
      if (
        cutover.status === "rolled_back" ||
        cutover.status === "cutover_degraded" ||
        cutover.status === "fatal_partial"
      ) {
        expect(outcome.metadataNotice).toBeTruthy();
      }
      if (cutover.status === "fatal_partial") {
        expect(outcome.metadataNotice).toBe(MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG);
      }
    }

    const throwOutcome = await runPlatformBindingAfterProfilePersist(
      { ok: true },
      async () => ({
        status: "ready",
        schoolId: SCHOOL_A,
        activeSchoolId: SCHOOL_A,
        activeSchoolYearId: null,
        staleActiveSchoolId: false,
        staleActiveSchoolYearId: false,
      }),
      () => {
        throw new Error("cutover boom");
      },
    );
    expect(throwOutcome.bindingAttempted).toBe(true);
    expect(throwOutcome.metadataNotice).toBeTruthy();
  });

  it("Profile mount: cutover soft failure does not block form (notice only)", async () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "A");
    const outcome = await runPlatformBindingOnMount(
      async () => ({
        status: "ready",
        schoolId: SCHOOL_A,
        activeSchoolId: SCHOOL_A,
        activeSchoolYearId: null,
        staleActiveSchoolId: false,
        staleActiveSchoolYearId: false,
      }),
      (binding) =>
        runScenarioLabelEstablishmentAfterSchoolReady(binding, {
          storage,
          executeAuthorityCutover: () => ({
            status: "rolled_back",
            from: "fence_verify_failed",
            schoolId: SCHOOL_A,
          }),
        }),
    );
    expect(outcome.bindingAttempted).toBe(true);
    expect(outcome.binding?.status).toBe("ready");
    expect(outcome.metadataNotice).toBeTruthy();
  });
});
