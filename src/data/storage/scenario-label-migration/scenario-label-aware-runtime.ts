/**
 * N3-AWARE-WIRING — thin scenario-specific runtime facade.
 *
 * Dashboard / Backup / handoff must NOT interpret marker/fence/schema themselves.
 * Wraps CORE read/write/clear + canonical Identity → schoolId resolution.
 *
 * No cutover. No generic migration framework. No write-on-read.
 */

import {
  readIdentityRegistry,
  readIdentityRegistryFromStorage,
} from "../../identity/identity-registry-storage";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import type { EntityId } from "../../../domain/shared/entity-id";
import { resolveScenarioLabelMigrationTarget } from "./scenario-label-migration-target";
import type { RawStoredText } from "./scenario-label-migration-types";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import {
  clearScenarioLabelAwareLogical,
  type ClearScenarioLabelAwareLogicalInput,
} from "./scenario-label-n3-aware-clear";
import { readScenarioLabelAwareLogical } from "./scenario-label-n3-aware-read";
import type {
  ScenarioLabelAwareClearResult,
  ScenarioLabelAwareLogicalReadResult,
  ScenarioLabelAwareStorage,
  ScenarioLabelAwareWriteResult,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_AWARE_NO_CUTOVER,
  SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ,
} from "./scenario-label-n3-aware-types";
import { writeScenarioLabelAwareLogical } from "./scenario-label-n3-aware-write";
import {
  SCENARIO_LABEL_NOTICE_BLOCKED_AUTHORITY,
  SCENARIO_LABEL_NOTICE_FATAL_PARTIAL,
  SCENARIO_LABEL_NOTICE_FENCE_INCOMPLETE,
  SCENARIO_LABEL_NOTICE_MARKER_INCOMPLETE_SOFT,
  SCENARIO_LABEL_NOTICE_NAMESPACED_DEGRADED,
  SCENARIO_LABEL_NOTICE_NOT_SAVED,
  SCENARIO_LABEL_NOTICE_STORAGE_UNAVAILABLE,
  type ScenarioLabelNotice,
} from "./scenario-label-aware-notices";
import type { ScenarioLabelRepositoryDependencies } from "./scenario-label-repository";

export type ScenarioLabelAwareRuntimeStorage = ScenarioLabelAwareStorage;

export type ResolveScenarioLabelSchoolIdInput = {
  readonly storage?: ScenarioLabelAwareRuntimeStorage;
  readonly readIdentity?: () => IdentityRegistryReadResult;
};

/**
 * Canonical Identity → schoolId for AWARE surfaces.
 * Missing Identity → null (unbound-compatible). Corrupted/unavailable → null + skipped.
 */
export function resolveScenarioLabelAwareSchoolId(
  input: ResolveScenarioLabelSchoolIdInput = {},
): EntityId | null {
  const readIdentity =
    input.readIdentity ??
    (input.storage
      ? () => readIdentityRegistryFromStorage(input.storage!)
      : readIdentityRegistry);
  const resolution = resolveScenarioLabelMigrationTarget(readIdentity());
  if (resolution.status !== "resolved") return null;
  if (resolution.target.kind !== "school") return null;
  return resolution.target.schoolId;
}

function resolveRuntimeStorage(
  storage?: ScenarioLabelAwareRuntimeStorage,
): ScenarioLabelAwareRuntimeStorage | null {
  if (storage) return storage;
  try {
    if (typeof localStorage === "undefined" || localStorage == null) return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** UI empty-input contract (unchanged): trim; empty/whitespace → clear (absent), never present "". */
export function mapScenarioLabelUiInputToDesiredRaw(label: string): RawStoredText {
  const trimmed = label.trim();
  if (trimmed === "") return { exists: false };
  return { exists: true, value: trimmed };
}

export type ScenarioLabelUiReadState = {
  readonly displayValue: string | null;
  readonly readable: boolean;
  readonly inputEnabled: boolean;
  readonly notice?: ScenarioLabelNotice;
  /** Advisory only — mutations always fresh-assess. */
  readonly authorityHint:
    | "legacy"
    | "namespaced"
    | "unbound"
    | "blocked"
    | "unavailable";
  /** True when displayValue is a proven logical value (not React memory). */
  readonly logicalProven: boolean;
};

function displayFromRaw(raw: RawStoredText): string {
  if (!raw.exists) return "";
  return raw.value.trim();
}

/**
 * Map CORE logical read → Dashboard UI state.
 * blocked is NOT "". Stale React memory must not be treated as persisted truth.
 */
export function mapAwareLogicalReadToUiState(
  result: ScenarioLabelAwareLogicalReadResult,
): ScenarioLabelUiReadState {
  switch (result.status) {
    case "unavailable":
      return {
        displayValue: null,
        readable: false,
        inputEnabled: false,
        notice: SCENARIO_LABEL_NOTICE_STORAGE_UNAVAILABLE,
        authorityHint: "unavailable",
        logicalProven: false,
      };
    case "blocked":
      return {
        displayValue: null,
        readable: false,
        inputEnabled: false,
        notice: SCENARIO_LABEL_NOTICE_BLOCKED_AUTHORITY,
        authorityHint: "blocked",
        logicalProven: false,
      };
    case "unbound":
      return {
        displayValue: displayFromRaw(result.raw),
        readable: true,
        inputEnabled: true,
        authorityHint: "unbound",
        logicalProven: true,
      };
    case "ok":
      if (result.authority === "namespaced") {
        return {
          displayValue: displayFromRaw(result.raw),
          readable: true,
          inputEnabled: true,
          notice:
            result.signal === "degraded"
              ? SCENARIO_LABEL_NOTICE_NAMESPACED_DEGRADED
              : undefined,
          authorityHint: "namespaced",
          logicalProven: true,
        };
      }
      // legacy — LEGACY_COMPAT_UNPREPARED / VIOLATED_RECOVERABLE preferably silent
      return {
        displayValue: displayFromRaw(result.raw),
        readable: true,
        inputEnabled: true,
        authorityHint: "legacy",
        logicalProven: true,
      };
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      return {
        displayValue: null,
        readable: false,
        inputEnabled: false,
        notice: SCENARIO_LABEL_NOTICE_BLOCKED_AUTHORITY,
        authorityHint: "blocked",
        logicalProven: false,
      };
    }
  }
}

export type ReadScenarioLabelAwareUiInput = {
  readonly storage?: ScenarioLabelAwareRuntimeStorage;
  readonly schoolId?: EntityId | null;
  readonly readIdentity?: () => IdentityRegistryReadResult;
};

/** Zero-write UI read. Assess only — never PREP / repair / fence / cutover. */
export function readScenarioLabelAwareUi(
  input: ReadScenarioLabelAwareUiInput = {},
): ScenarioLabelUiReadState {
  void SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ;
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;

  const storage = resolveRuntimeStorage(input.storage);
  if (storage == null) {
    return mapAwareLogicalReadToUiState({ status: "unavailable" });
  }

  const schoolId =
    input.schoolId !== undefined
      ? input.schoolId
      : resolveScenarioLabelAwareSchoolId({
          storage,
          readIdentity: input.readIdentity,
        });

  const logical = readScenarioLabelAwareLogical({ storage, schoolId });
  return mapAwareLogicalReadToUiState(logical);
}

/** Fresh logical read for export / Backup / print — never fence.committedRaw. */
export function readScenarioLabelAwareLogicalForBusiness(
  input: ReadScenarioLabelAwareUiInput = {},
): ScenarioLabelAwareLogicalReadResult {
  void SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ;

  const storage = resolveRuntimeStorage(input.storage);
  if (storage == null) return { status: "unavailable" };

  const schoolId =
    input.schoolId !== undefined
      ? input.schoolId
      : resolveScenarioLabelAwareSchoolId({
          storage,
          readIdentity: input.readIdentity,
        });

  return readScenarioLabelAwareLogical({ storage, schoolId });
}

export type ScenarioLabelUiWriteOutcome = {
  readonly saved: boolean;
  /** Disable further scenario mutation until reload when true. */
  readonly mutationLocked: boolean;
  readonly notice?: ScenarioLabelNotice;
  /** Proven display value after successful/settled write; null when not safely known. */
  readonly displayValue: string | null;
  readonly writeResult: ScenarioLabelAwareWriteResult;
};

/**
 * Map write/clear result → UX.
 * success → saved; fence_incomplete / fatal_partial → lock further mutation.
 */
export function mapAwareWriteResultToUiOutcome(
  result: ScenarioLabelAwareWriteResult,
  attemptedUiLabel: string,
): ScenarioLabelUiWriteOutcome {
  switch (result.status) {
    case "success":
      return {
        saved: true,
        mutationLocked: false,
        displayValue: attemptedUiLabel.trim(),
        writeResult: result,
      };
    case "marker_incomplete":
      if (result.business === "data_ok_metadata_incomplete") {
        return {
          saved: true,
          mutationLocked: false,
          notice: SCENARIO_LABEL_NOTICE_MARKER_INCOMPLETE_SOFT,
          displayValue: attemptedUiLabel.trim(),
          writeResult: result,
        };
      }
      return {
        saved: false,
        mutationLocked: false,
        notice: SCENARIO_LABEL_NOTICE_NOT_SAVED,
        displayValue: null,
        writeResult: result,
      };
    case "fence_incomplete":
      return {
        saved: false,
        mutationLocked: true,
        notice: SCENARIO_LABEL_NOTICE_FENCE_INCOMPLETE,
        displayValue: attemptedUiLabel.trim(),
        writeResult: result,
      };
    case "fatal_partial":
      return {
        saved: false,
        mutationLocked: true,
        notice: SCENARIO_LABEL_NOTICE_FATAL_PARTIAL,
        displayValue: null,
        writeResult: result,
      };
    case "blocked_authority":
      return {
        saved: false,
        mutationLocked: true,
        notice: SCENARIO_LABEL_NOTICE_BLOCKED_AUTHORITY,
        displayValue: null,
        writeResult: result,
      };
    case "storage_unavailable":
      return {
        saved: false,
        mutationLocked: true,
        notice: SCENARIO_LABEL_NOTICE_STORAGE_UNAVAILABLE,
        displayValue: null,
        writeResult: result,
      };
    case "authoritative_failed":
    case "rollback_succeeded":
      return {
        saved: false,
        mutationLocked: false,
        notice: SCENARIO_LABEL_NOTICE_NOT_SAVED,
        displayValue: null,
        writeResult: result,
      };
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      return {
        saved: false,
        mutationLocked: true,
        notice: SCENARIO_LABEL_NOTICE_NOT_SAVED,
        displayValue: null,
        writeResult: result,
      };
    }
  }
}

export type WriteScenarioLabelAwareFromUiInput = {
  readonly label: string;
  readonly storage?: ScenarioLabelAwareRuntimeStorage;
  readonly schoolId?: EntityId | null;
  readonly readIdentity?: ScenarioLabelRepositoryDependencies["readIdentity"];
};

/**
 * UI write entry — preserves empty→clear semantics.
 * Caller never selects authority; fresh assessment inside CORE dispatcher.
 */
export function writeScenarioLabelAwareFromUiInput(
  input: WriteScenarioLabelAwareFromUiInput,
): ScenarioLabelUiWriteOutcome {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;

  const storage = resolveRuntimeStorage(input.storage);
  if (storage == null) {
    return mapAwareWriteResultToUiOutcome({ status: "storage_unavailable" }, input.label);
  }

  const schoolId =
    input.schoolId !== undefined
      ? input.schoolId
      : resolveScenarioLabelAwareSchoolId({
          storage,
          readIdentity: input.readIdentity,
        });

  const desiredRaw = mapScenarioLabelUiInputToDesiredRaw(input.label);
  const writeResult = writeScenarioLabelAwareLogical({
    storage,
    schoolId,
    desiredRaw,
    readIdentity: input.readIdentity,
  });
  return mapAwareWriteResultToUiOutcome(writeResult, input.label);
}

/**
 * Dashboard-compatible throw on hard authoritative failure only
 * (preserves prior OrThrow surface for unexpected storage failure).
 * Authority block / fence_incomplete return outcomes — do not throw.
 */
export function writeScenarioLabelAwareFromUiInputOrThrow(
  input: WriteScenarioLabelAwareFromUiInput,
): ScenarioLabelUiWriteOutcome {
  const outcome = writeScenarioLabelAwareFromUiInput(input);
  if (
    outcome.writeResult.status === "authoritative_failed" &&
    outcome.writeResult.code === "storage_unavailable"
  ) {
    throw new Error("localStorage není k dispozici (spusťte v prohlížeči na originu aplikace).");
  }
  if (
    outcome.writeResult.status === "authoritative_failed" &&
    outcome.writeResult.code === "legacy_write_failed"
  ) {
    throw new Error("Uložení názvu scénáře se nezdařilo.");
  }
  return outcome;
}

export type ClearScenarioLabelAwareRuntimeInput = {
  readonly storage?: ScenarioLabelAwareRuntimeStorage;
  readonly schoolId?: EntityId | null;
  readonly readIdentity?: ClearScenarioLabelAwareLogicalInput["readIdentity"];
};

export function clearScenarioLabelAwareRuntime(
  input: ClearScenarioLabelAwareRuntimeInput = {},
): ScenarioLabelAwareClearResult {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;

  const storage = resolveRuntimeStorage(input.storage);
  if (storage == null) return { status: "storage_unavailable" };

  const schoolId =
    input.schoolId !== undefined
      ? input.schoolId
      : resolveScenarioLabelAwareSchoolId({
          storage,
          readIdentity: input.readIdentity,
        });

  return clearScenarioLabelAwareLogical({
    storage,
    schoolId,
    readIdentity: input.readIdentity,
  });
}

/** Zero-write preflight for handoff / snippet — never mutates. */
export function preflightScenarioLabelAwareAuthority(
  input: ReadScenarioLabelAwareUiInput = {},
): ScenarioLabelRuntimeAuthorityAssessment {
  void SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ;

  const storage = resolveRuntimeStorage(input.storage);
  if (storage == null) return { kind: "STORAGE_UNAVAILABLE" };

  const schoolId =
    input.schoolId !== undefined
      ? input.schoolId
      : resolveScenarioLabelAwareSchoolId({
          storage,
          readIdentity: input.readIdentity,
        });

  return assessScenarioLabelRuntimeAuthority({ storage, schoolId });
}

/** Logical display string for export when readable; null when blocked/unavailable. */
export function logicalScenarioLabelDisplayOrNull(
  result: ScenarioLabelAwareLogicalReadResult,
): string | null {
  if (result.status === "ok" || result.status === "unbound") {
    return displayFromRaw(result.raw);
  }
  return null;
}
