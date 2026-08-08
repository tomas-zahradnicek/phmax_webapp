import { readAppContext } from "../../data/app-context/app-context-storage";
import { readIdentityRegistry } from "../../data/identity/identity-registry-storage";
import { readLegacySchoolProfile } from "../../data/legacy/legacy-school-profile";
import { readLegacySchoolYearHint } from "../../data/legacy/legacy-school-year";
import {
  RESTORE_IDENTITY_KEY,
  SCHOOL_PROFILE_LS_KEY,
} from "./restore-owned-keys";
import type { RestorePlan } from "./restore-types";

export type VerifyPostRestorePlatformStateResult =
  | { ok: true }
  | { ok: false; detail: string };

export type VerifyPostRestorePlatformStateDependencies = {
  readIdentity?: typeof readIdentityRegistry;
  readProfile?: typeof readLegacySchoolProfile;
  readContext?: typeof readAppContext;
  readYearHint?: typeof readLegacySchoolYearHint;
};

export type PostRestorePlatformExpectations = {
  /** Identity SET op or requiresIdentityBootstrap. */
  expectIdentity: boolean;
  /** School binding must be ready (AppContext + active school). */
  expectSchoolReady: boolean;
  /** SchoolProfile SET in plan operations. */
  expectProfile: boolean;
  /**
   * requiresVzSchoolYearReconcile && school ready && persisted valid year.
   * When true, matching schoolYears entry + activeSchoolYearId must align.
   */
  expectVzYearBound: boolean;
};

function planSetsKey(plan: RestorePlan, key: string): boolean {
  return plan.operations.some((op) => op.action === "set" && op.key === key);
}

/**
 * Derive read-only verification expectations from RestorePlan + reconcile outcome.
 * Business-only partial plans yield all-false expectations.
 */
export function derivePostRestorePlatformExpectations(
  plan: RestorePlan,
  options: { schoolReady: boolean },
): PostRestorePlatformExpectations {
  const expectIdentity =
    plan.platform.requiresIdentityBootstrap || planSetsKey(plan, RESTORE_IDENTITY_KEY);
  const expectProfile = planSetsKey(plan, SCHOOL_PROFILE_LS_KEY);
  const expectSchoolReady =
    options.schoolReady ||
    plan.platform.requiresIdentityBootstrap ||
    expectProfile;

  return {
    expectIdentity,
    expectSchoolReady,
    expectProfile,
    expectVzYearBound: plan.platform.requiresVzSchoolYearReconcile && options.schoolReady,
  };
}

/**
 * Read-only post-restore platform verification.
 * Never writes / bootstraps / repairs.
 *
 * Does NOT require SchoolProfile.id === Identity.schoolId (0F legacy mismatch allowed).
 */
export function verifyPostRestorePlatformState(
  plan: RestorePlan,
  options: { schoolReady: boolean },
  dependencies: VerifyPostRestorePlatformStateDependencies = {},
): VerifyPostRestorePlatformStateResult {
  const readIdentity = dependencies.readIdentity ?? readIdentityRegistry;
  const readProfile = dependencies.readProfile ?? readLegacySchoolProfile;
  const readContext = dependencies.readContext ?? readAppContext;
  const readYearHint = dependencies.readYearHint ?? readLegacySchoolYearHint;

  const expectations = derivePostRestorePlatformExpectations(plan, options);

  let identitySchoolId: string | null = null;
  let schoolYears: ReadonlyArray<{ id: string; schoolId: string; startYear: number }> = [];

  if (expectations.expectIdentity || expectations.expectSchoolReady || expectations.expectVzYearBound) {
    let identityResult;
    try {
      identityResult = readIdentity();
    } catch {
      return { ok: false, detail: "identity_read_failed" };
    }
    if (!identityResult.ok) {
      return { ok: false, detail: `identity_${identityResult.code}` };
    }
    if (expectations.expectIdentity || expectations.expectSchoolReady) {
      if (identityResult.registry == null) {
        return { ok: false, detail: "identity_missing" };
      }
    }
    if (identityResult.registry) {
      identitySchoolId = identityResult.registry.schoolId;
      schoolYears = identityResult.registry.schoolYears;
    }
  }

  if (expectations.expectProfile) {
    let profileResult;
    try {
      profileResult = readProfile();
    } catch {
      return { ok: false, detail: "profile_read_failed" };
    }
    if (!profileResult.ok) {
      return { ok: false, detail: `profile_${profileResult.code}` };
    }
    if (profileResult.profile == null) {
      return { ok: false, detail: "profile_missing" };
    }
  }

  if (expectations.expectSchoolReady) {
    if (identitySchoolId == null) {
      return { ok: false, detail: "identity_missing_for_school" };
    }

    let contextResult;
    try {
      contextResult = readContext();
    } catch {
      return { ok: false, detail: "app_context_read_failed" };
    }
    if (!contextResult.ok) {
      return { ok: false, detail: `app_context_${contextResult.code}` };
    }
    if (contextResult.context == null) {
      return { ok: false, detail: "app_context_missing" };
    }
    if (contextResult.context.activeSchoolId !== identitySchoolId) {
      return { ok: false, detail: "active_school_mismatch" };
    }

    const activeYearId = contextResult.context.activeSchoolYearId;
    if (activeYearId != null) {
      const yearEntry = schoolYears.find((entry) => entry.id === activeYearId);
      if (!yearEntry) {
        return { ok: false, detail: "active_year_missing_in_identity" };
      }
      if (yearEntry.schoolId !== identitySchoolId) {
        return { ok: false, detail: "active_year_school_mismatch" };
      }
    }

    if (expectations.expectVzYearBound) {
      let hint;
      try {
        hint = readYearHint();
      } catch {
        return { ok: false, detail: "vz_year_hint_read_failed" };
      }
      if (!hint.ok) {
        return { ok: false, detail: `vz_year_hint_${hint.code}` };
      }
      if (hint.startYear != null) {
        const match = schoolYears.find(
          (entry) =>
            entry.schoolId === identitySchoolId && entry.startYear === hint.startYear,
        );
        if (!match) {
          return { ok: false, detail: "vz_year_missing_in_identity" };
        }
        if (contextResult.context.activeSchoolYearId !== match.id) {
          return { ok: false, detail: "vz_active_year_mismatch" };
        }
      }
    }
  }

  return { ok: true };
}
