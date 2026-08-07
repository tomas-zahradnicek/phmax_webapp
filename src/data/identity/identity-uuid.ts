import type { EntityId } from "../../domain/shared/entity-id";

/**
 * Canonical UUID string format: 8-4-4-4-12 hex (case-insensitive).
 * Not a full RFC-4122 version/variant check — format gate for EntityIds only.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is EntityId {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

export function normalizeUuid(value: string): EntityId {
  return value.trim().toLowerCase();
}
