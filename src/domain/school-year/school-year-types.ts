import type { EntityId } from "../shared/entity-id";
import type { DataSchemaVersion } from "../shared/data-schema-version";

export type SchoolYearStatus = "planned" | "active" | "closed" | "unknown";

/**
 * School year entity. Identity is `id` + `startYear` (not a display label).
 * Display label "YYYY/YYYY+1" is derived via school-year-label helpers.
 * Scenarios are separate entities (later PR) — not fields on SchoolYear.
 *
 * createdAt / updatedAt are optional: omit when no real business timestamp is known
 * (e.g. legacy identity projections). Do not invent dates from registry.updatedAt.
 */
export type SchoolYear = {
  id: EntityId;
  schemaVersion: DataSchemaVersion;
  schoolId: EntityId;
  startYear: number;
  status: SchoolYearStatus;
  createdAt?: string;
  updatedAt?: string;
};
