import type { EntityId } from "../../domain/shared/entity-id";
import type { DataSchemaVersion } from "../../domain/shared/data-schema-version";

/** Explicit schema version for the identity registry persistence document. */
export const IDENTITY_REGISTRY_SCHEMA_VERSION = 1 as const satisfies DataSchemaVersion;

export const IDENTITY_REGISTRY_LS_KEY = "reditelsky-pruvodce-identity-registry-v1";

export type SchoolYearIdentityEntry = {
  id: EntityId;
  schoolId: EntityId;
  startYear: number;
};

/**
 * Persisted identity registry (v1) — single school.
 * Root `schoolId` is authoritative; every schoolYears[].schoolId must match it.
 * Multi-school support is deferred to a future schemaVersion.
 */
export type IdentityRegistryV1 = {
  schemaVersion: typeof IDENTITY_REGISTRY_SCHEMA_VERSION;
  schoolId: EntityId;
  schoolYears: SchoolYearIdentityEntry[];
  updatedAt: string;
};

export type IdentityRegistry = IdentityRegistryV1;

export type IdentityRegistryReadOk = {
  ok: true;
  /** `null` when the key is missing or empty (not an error). */
  registry: IdentityRegistry | null;
};

export type IdentityRegistryReadError = {
  ok: false;
  code: "corrupted" | "storage_unavailable";
  detail?: string;
};

export type IdentityRegistryReadResult = IdentityRegistryReadOk | IdentityRegistryReadError;

export type IdentityRegistryWriteResult =
  | { ok: true }
  | { ok: false; code: "storage_unavailable" | "corrupted_blocked" };
