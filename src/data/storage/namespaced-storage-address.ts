import type { EntityId } from "../../domain/shared/entity-id";
import { isUuid } from "../identity/identity-uuid";
import { normalizeUuid } from "../identity/identity-uuid";
import {
  isNamespacedResourcePair,
  isScopeKindAllowedFor,
  type NamespacedModuleId,
  type NamespacedResourceIdOf,
  type StorageScopeKind,
} from "./namespaced-storage-catalog";
import {
  NAMESPACED_STORAGE_NAMESPACE,
  NAMESPACED_STORAGE_SCHEMA_VERSION,
  NAMESPACED_STORAGE_SEGMENT_LABELS,
  NAMESPACED_STORAGE_SEPARATOR,
  NAMESPACED_STORAGE_VERSION_SEGMENT,
} from "./namespaced-storage-schema";

/**
 * Where a physical resource lives.
 *
 * `unbound` covers the shipped product state in which business modules are used
 * before any SchoolProfile exists, so no schoolId can be resolved yet.
 */
export type StorageScope =
  | { readonly kind: "unbound" }
  | { readonly kind: "school"; readonly schoolId: EntityId }
  | {
      readonly kind: "schoolYear";
      readonly schoolId: EntityId;
      readonly schoolYearId: EntityId;
    };

/**
 * Module/resource pair, correlated by the catalog: an impossible combination
 * such as `phmax-pv` + `framework-notes` is already a compile-time error.
 */
type NamespacedResourceRef = {
  [M in NamespacedModuleId]: {
    readonly moduleId: M;
    readonly resourceId: NamespacedResourceIdOf<M>;
  };
}[NamespacedModuleId];

export type StorageAddress = {
  readonly version: typeof NAMESPACED_STORAGE_SCHEMA_VERSION;
  readonly scope: StorageScope;
} & NamespacedResourceRef;

export type NamespacedStorageAddressErrorCode =
  | "invalid_version"
  | "invalid_scope_kind"
  | "invalid_school_id"
  | "invalid_school_year_id"
  | "unknown_resource"
  | "scope_not_allowed";

export class NamespacedStorageAddressError extends Error {
  readonly code: NamespacedStorageAddressErrorCode;

  constructor(code: NamespacedStorageAddressErrorCode, message: string) {
    super(message);
    this.name = "NamespacedStorageAddressError";
    this.code = code;
  }
}

/**
 * Stricter than `isUuid`: accepts only UUIDs already in canonical form.
 *
 * `isUuid` tolerates surrounding whitespace and any casing; a physical key
 * segment must not. Accepting noncanonical input would create alias keys for the
 * same domain identity or silently repair a malformed key.
 */
function isSegmentEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function scopeSegments(scope: StorageScope): readonly string[] {
  const labels = NAMESPACED_STORAGE_SEGMENT_LABELS;
  switch (scope.kind) {
    case "unbound":
      return [labels.unbound];
    case "school":
      if (!isSegmentEntityId(scope.schoolId)) {
        throw new NamespacedStorageAddressError(
          "invalid_school_id",
          "schoolId must be a canonical UUID EntityId without surrounding whitespace.",
        );
      }
      return [labels.school, scope.schoolId];
    case "schoolYear":
      if (!isSegmentEntityId(scope.schoolId)) {
        throw new NamespacedStorageAddressError(
          "invalid_school_id",
          "schoolId must be a canonical UUID EntityId without surrounding whitespace.",
        );
      }
      if (!isSegmentEntityId(scope.schoolYearId)) {
        throw new NamespacedStorageAddressError(
          "invalid_school_year_id",
          "schoolYearId must be a canonical UUID EntityId without surrounding whitespace.",
        );
      }
      return [labels.school, scope.schoolId, labels.year, scope.schoolYearId];
    default: {
      const exhaustive: never = scope;
      throw new NamespacedStorageAddressError(
        "invalid_scope_kind",
        `Unsupported storage scope: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
}

/**
 * Build the canonical physical key for an address.
 *
 * Pure and deterministic. Never normalizes ids, never appends free-form
 * suffixes and never touches a storage API. Fails closed on any input the type
 * system could not already exclude.
 */
export function serializeStorageAddress(address: StorageAddress): string {
  if (address.version !== NAMESPACED_STORAGE_SCHEMA_VERSION) {
    throw new NamespacedStorageAddressError(
      "invalid_version",
      `Only physical storage schema v${NAMESPACED_STORAGE_SCHEMA_VERSION} is addressable.`,
    );
  }

  const { moduleId, resourceId, scope } = address;

  if (!isNamespacedResourcePair(moduleId, resourceId)) {
    throw new NamespacedStorageAddressError(
      "unknown_resource",
      `Unknown catalog resource: ${String(moduleId)}/${String(resourceId)}`,
    );
  }

  const segments = scopeSegments(scope);

  if (!isScopeKindAllowedFor(moduleId, resourceId, scope.kind)) {
    throw new NamespacedStorageAddressError(
      "scope_not_allowed",
      `Scope "${scope.kind}" is not allowed for ${String(moduleId)}/${String(resourceId)}.`,
    );
  }

  const labels = NAMESPACED_STORAGE_SEGMENT_LABELS;
  return [
    NAMESPACED_STORAGE_NAMESPACE,
    NAMESPACED_STORAGE_VERSION_SEGMENT,
    ...segments,
    labels.module,
    moduleId,
    labels.resource,
    resourceId,
  ].join(NAMESPACED_STORAGE_SEPARATOR);
}

type ParsedShape = {
  scope: StorageScope;
  moduleId: string;
  resourceId: string;
};

function matchKeyShape(rest: readonly string[]): ParsedShape | null {
  const labels = NAMESPACED_STORAGE_SEGMENT_LABELS;

  if (
    rest.length === 5 &&
    rest[0] === labels.unbound &&
    rest[1] === labels.module &&
    rest[3] === labels.resource
  ) {
    return { scope: { kind: "unbound" }, moduleId: rest[2], resourceId: rest[4] };
  }

  if (
    rest.length === 6 &&
    rest[0] === labels.school &&
    rest[2] === labels.module &&
    rest[4] === labels.resource
  ) {
    if (!isSegmentEntityId(rest[1])) return null;
    return {
      scope: { kind: "school", schoolId: rest[1] },
      moduleId: rest[3],
      resourceId: rest[5],
    };
  }

  if (
    rest.length === 8 &&
    rest[0] === labels.school &&
    rest[2] === labels.year &&
    rest[4] === labels.module &&
    rest[6] === labels.resource
  ) {
    if (!isSegmentEntityId(rest[1]) || !isSegmentEntityId(rest[3])) return null;
    return {
      scope: { kind: "schoolYear", schoolId: rest[1], schoolYearId: rest[3] },
      moduleId: rest[5],
      resourceId: rest[7],
    };
  }

  return null;
}

/**
 * Parse a v2 namespaced business storage key.
 *
 * Deliberately named after what it actually covers: v1 flat keys, Identity
 * Registry and AppContext are not namespaced business resources and are
 * rejected. Returns `null` for anything that is not an exact canonical key and
 * never repairs a malformed key.
 */
export function parseNamespacedStorageKey(key: unknown): StorageAddress | null {
  if (typeof key !== "string") return null;

  const parts = key.split(NAMESPACED_STORAGE_SEPARATOR);
  if (parts.length < 3) return null;
  if (parts[0] !== NAMESPACED_STORAGE_NAMESPACE) return null;
  if (parts[1] !== NAMESPACED_STORAGE_VERSION_SEGMENT) return null;

  const rest = parts.slice(2);
  if (rest.some((segment) => segment === "")) return null;

  const shape = matchKeyShape(rest);
  if (!shape) return null;

  if (!isNamespacedResourcePair(shape.moduleId, shape.resourceId)) return null;
  if (!isScopeKindAllowedFor(shape.moduleId, shape.resourceId, shape.scope.kind)) return null;

  // Single cast: the catalog guard above proves the pair is correlated, which
  // the compiler cannot infer from two independent runtime checks.
  return {
    version: NAMESPACED_STORAGE_SCHEMA_VERSION,
    scope: shape.scope,
    moduleId: shape.moduleId,
    resourceId: shape.resourceId,
  } as StorageAddress;
}

export function isNamespacedStorageKey(key: unknown): boolean {
  return parseNamespacedStorageKey(key) !== null;
}

export type { StorageScopeKind };
