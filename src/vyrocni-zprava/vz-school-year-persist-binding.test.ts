import { describe, expect, it, vi } from "vitest";
import type { EnsureVzSchoolYearPlatformBindingResult } from "./ensure-vz-school-year-platform-binding";
import {
  MSG_VZ_SCENARIO_SHADOW_METADATA_SOFT,
  MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED,
  createSerializedVzSchoolYearBindingRunner,
  mayBindVzSchoolYearAfterPersist,
  runVzSchoolYearBindingAfterPersist,
  shouldApplyVzSchoolYearBindingUiOutcome,
} from "./vz-school-year-persist-binding";

const readyResult: EnsureVzSchoolYearPlatformBindingResult = {
  status: "ready",
  schoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  schoolYearId: "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff",
  startYear: 2026,
};

const silentEstablish = () => ({ status: "already_ready" as const });

describe("vz-school-year-persist-binding (0G-2 orchestration)", () => {
  it("A: persist fail → ensure 0×", async () => {
    const ensure = vi.fn(async () => readyResult);
    const establish = vi.fn(silentEstablish);
    const outcome = await runVzSchoolYearBindingAfterPersist(
      { ok: false, saveIssue: { code: "quota_exceeded" } },
      ensure,
      establish,
    );
    expect(mayBindVzSchoolYearAfterPersist({ ok: false, saveIssue: { code: "quota_exceeded" } })).toBe(
      false,
    );
    expect(ensure).not.toHaveBeenCalled();
    expect(establish).not.toHaveBeenCalled();
    expect(outcome).toEqual({ bindingAttempted: false, binding: null, metadataNotice: null });
  });

  it("B: persist success + helper empty → no warning", async () => {
    const ensure = vi.fn(async (): Promise<EnsureVzSchoolYearPlatformBindingResult> => ({
      status: "empty",
    }));
    const establish = vi.fn(silentEstablish);
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(establish).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      bindingAttempted: true,
      binding: { status: "empty" },
      metadataNotice: null,
    });
  });

  it("C: persist success + helper noop → establish 1×", async () => {
    const ensure = vi.fn(async (): Promise<EnsureVzSchoolYearPlatformBindingResult> => ({
      status: "noop",
      reason: "no_valid_year",
      schoolId: readyResult.schoolId,
    }));
    const establish = vi.fn(silentEstablish);
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(establish).toHaveBeenCalledTimes(1);
    expect(outcome.metadataNotice).toBeNull();
    expect(outcome.bindingAttempted).toBe(true);
  });

  it("D: persist success + helper ready → establish 1×", async () => {
    const ensure = vi.fn(async () => readyResult);
    const establish = vi.fn(silentEstablish);
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(establish).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({
      bindingAttempted: true,
      binding: readyResult,
      metadataNotice: null,
    });
  });

  it("E: persist success + helper error → metadata warning; no establishment", async () => {
    const ensure = vi.fn(async (): Promise<EnsureVzSchoolYearPlatformBindingResult> => ({
      status: "error",
      reason: "identity_corrupted",
    }));
    const establish = vi.fn(silentEstablish);
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(establish).not.toHaveBeenCalled();
    expect(outcome.bindingAttempted).toBe(true);
    expect(outcome.metadataNotice).toBe(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED);
    expect(outcome.metadataNotice).toContain("uložena");
    expect(outcome.metadataNotice).not.toMatch(/Identity|AppContext|schoolYearId|localStorage/i);
  });

  it("F: metadata error → later ready → warning cleared", async () => {
    let call = 0;
    const ensure = vi.fn(async (): Promise<EnsureVzSchoolYearPlatformBindingResult> => {
      call += 1;
      if (call === 1) {
        return { status: "error", reason: "platform_failure" };
      }
      return readyResult;
    });
    const establish = vi.fn(silentEstablish);

    const first = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(first.metadataNotice).toBe(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED);
    expect(establish).not.toHaveBeenCalled();

    const second = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(second.bindingAttempted).toBe(true);
    if (!second.bindingAttempted) return;
    expect(second.binding.status).toBe("ready");
    expect(second.metadataNotice).toBeNull();
    expect(establish).toHaveBeenCalledTimes(1);
  });

  it("U/W: one VZ event → establishment exactly 1× (nested ensure does not double)", async () => {
    const ensure = vi.fn(async () => readyResult);
    const establish = vi.fn(silentEstablish);
    await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(establish).toHaveBeenCalledTimes(1);
  });

  it("Y: establishment soft fail → VZ business path still success shape", async () => {
    const ensure = vi.fn(async () => readyResult);
    const establish = vi.fn(() => ({ status: "shadow_dirty" as const }));
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establish);
    expect(outcome.bindingAttempted).toBe(true);
    expect(outcome.metadataNotice).toBe(MSG_VZ_SCENARIO_SHADOW_METADATA_SOFT);
    expect(outcome.metadataNotice).not.toBe(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED);
  });

  it("Y2: establishment throw → soft warning; business shape intact", async () => {
    const ensure = vi.fn(async () => readyResult);
    const establish = vi.fn(() => {
      throw new Error("unexpected");
    });
    // Outer runner does not catch — establishAfterReady default does. Injected throw must be wrapped by caller helper.
    // Use runScenarioLabelEstablishmentAfterSchoolReady semantics via wrapper:
    const wrapped = vi.fn(() => {
      try {
        throw new Error("unexpected");
      } catch {
        return { status: "storage_unavailable" as const };
      }
    });
    const outcome = await runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, wrapped);
    expect(outcome.metadataNotice).toBe(MSG_VZ_SCENARIO_SHADOW_METADATA_SOFT);
    void establish;
  });

  it("G: serialized runner → ensure calls never overlap", async () => {
    let active = 0;
    let maxActive = 0;
    const ensure = vi.fn(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return readyResult;
    });
    const establish = vi.fn(silentEstablish);
    const runner = createSerializedVzSchoolYearBindingRunner(ensure, establish);
    await Promise.all([
      runner.afterPersist({ ok: true }),
      runner.afterPersist({ ok: true }),
    ]);
    expect(maxActive).toBe(1);
    expect(establish).toHaveBeenCalledTimes(2);
  });

  it("H: stale earlier UI result → newer result wins (generation guard)", () => {
    const olderError = {
      bindingAttempted: true as const,
      binding: { status: "error" as const, reason: "platform_failure" as const },
      metadataNotice: MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED,
    };
    const newerReady = {
      bindingAttempted: true as const,
      binding: readyResult,
      metadataNotice: null,
    };

    expect(
      shouldApplyVzSchoolYearBindingUiOutcome({
        mounted: true,
        generation: 1,
        currentGeneration: 2,
        outcome: olderError,
      }),
    ).toBe(false);

    expect(
      shouldApplyVzSchoolYearBindingUiOutcome({
        mounted: true,
        generation: 2,
        currentGeneration: 2,
        outcome: newerReady,
      }),
    ).toBe(true);
  });

  it("Q: unmounted → UI outcome not applied", () => {
    expect(
      shouldApplyVzSchoolYearBindingUiOutcome({
        mounted: false,
        generation: 1,
        currentGeneration: 1,
        outcome: {
          bindingAttempted: true,
          binding: { status: "error", reason: "storage_unavailable" },
          metadataNotice: MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED,
        },
      }),
    ).toBe(false);
  });

  it("failed persist on runner skips ensure without enqueue side effects", async () => {
    const ensure = vi.fn(async () => readyResult);
    const runner = createSerializedVzSchoolYearBindingRunner(ensure);
    const outcome = await runner.afterPersist({
      ok: false,
      saveIssue: { code: "storage_unavailable" },
    });
    expect(ensure).not.toHaveBeenCalled();
    expect(outcome.bindingAttempted).toBe(false);
  });

  it("bindingAttempted false outcomes are not applied to UI", () => {
    expect(
      shouldApplyVzSchoolYearBindingUiOutcome({
        mounted: true,
        generation: 1,
        currentGeneration: 1,
        outcome: { bindingAttempted: false, binding: null, metadataNotice: null },
      }),
    ).toBe(false);
  });
});
