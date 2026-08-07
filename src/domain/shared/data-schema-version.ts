/**
 * Schema version for the domain model (School / SchoolYear).
 * Intentionally separate from package.json / __APP_VERSION__ and from
 * the central backup envelope schemaVersion.
 */
export type DataSchemaVersion = number;

/** Initial domain model schema version for School / SchoolYear. */
export const DOMAIN_DATA_SCHEMA_VERSION = 1 as const satisfies DataSchemaVersion;
