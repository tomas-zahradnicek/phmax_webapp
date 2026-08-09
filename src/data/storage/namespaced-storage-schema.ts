/**
 * Physical storage schema for namespaced (v2) business data.
 *
 * This version describes WHERE data is stored. It is intentionally independent
 * of `BackupEnvelope.schemaVersion` (still 1), which describes WHAT a backup
 * payload contains. Namespacing must never bump the backup envelope version.
 *
 * N1 defines the addressing grammar only — no runtime storage access and no
 * production key is created from it yet.
 */
export const NAMESPACED_STORAGE_SCHEMA_VERSION = 2 as const;

export const NAMESPACED_STORAGE_NAMESPACE = "reditelsky-pruvodce";

export const NAMESPACED_STORAGE_SEPARATOR = ":";

export const NAMESPACED_STORAGE_VERSION_SEGMENT = `v${NAMESPACED_STORAGE_SCHEMA_VERSION}` as const;

/**
 * Canonical root prefix of every v2 namespaced key.
 *
 * Not used for storage scanning or deletion in N1: Full Reset integration
 * starts in N2, when the first real namespaced write exists.
 * N2-WRITE registers `NAMESPACED_STORAGE_V2_ROOT_PREFIX` in
 * `APPLICATION_LOCAL_STORAGE_PREFIXES` for Full Application Reset.
 */
export const NAMESPACED_STORAGE_V2_ROOT_PREFIX =
  `${NAMESPACED_STORAGE_NAMESPACE}${NAMESPACED_STORAGE_SEPARATOR}${NAMESPACED_STORAGE_VERSION_SEGMENT}${NAMESPACED_STORAGE_SEPARATOR}` as const;

/** Fixed grammar labels. A segment label is never user data. */
export const NAMESPACED_STORAGE_SEGMENT_LABELS = {
  unbound: "unbound",
  school: "school",
  year: "year",
  module: "module",
  resource: "resource",
} as const;
