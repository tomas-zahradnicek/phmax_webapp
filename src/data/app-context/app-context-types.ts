import type { EntityId } from "../../domain/shared/entity-id";

/** Explicit schema version for the persisted AppContext document. */
export const APP_CONTEXT_SCHEMA_VERSION = 1 as const;

export const APP_CONTEXT_LS_KEY = "reditelsky-pruvodce-app-context-v1";

/**
 * Persistent working context for this browser only.
 * Holds active entity pointers — not School/SchoolYear business payloads.
 */
export type AppContext = {
  schemaVersion: typeof APP_CONTEXT_SCHEMA_VERSION;
  activeSchoolId: EntityId | null;
  activeSchoolYearId: EntityId | null;
};

export type AppContextReadOk = {
  ok: true;
  /** `null` when the key is missing or empty (not an error). */
  context: AppContext | null;
};

export type AppContextReadError = {
  ok: false;
  code: "corrupted" | "storage_unavailable";
  detail?: string;
};

export type AppContextReadResult = AppContextReadOk | AppContextReadError;

export type AppContextWriteResult =
  | { ok: true }
  | { ok: false; code: "storage_unavailable" | "corrupted_blocked" | "invalid_context" };
