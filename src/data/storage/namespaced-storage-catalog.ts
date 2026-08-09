/**
 * Closed catalog of namespaced (v2) physical storage resources.
 *
 * A logical backup module is NOT 1:1 with a physical resource: one module can
 * own several resources and those resources can legitimately differ in scope
 * (e.g. a calculator autosave vs. its named-snapshot archive).
 *
 * Identity Registry and AppContext are deliberately absent: the registry is the
 * app-global index that makes namespacing possible, and AppContext is a device
 * pointer. Neither may ever be addressed under a school namespace.
 */

/** Scope kinds a physical resource may legitimately live under. */
export type StorageScopeKind = "unbound" | "school" | "schoolYear";

type NamespacedStorageCatalogShape = Readonly<
  Record<string, Readonly<Record<string, readonly StorageScopeKind[]>>>
>;

/**
 * Allowed scope kinds per resource.
 *
 * `unbound` is allowed everywhere because every business module is usable today
 * before a SchoolProfile exists, so a pre-profile address must stay expressible.
 *
 * Where the storage ownership audit could not safely lock a scope yet, the
 * policy stays deliberately permissive instead of guessing. Calculator autosave
 * is the documented case: its business meaning points at a school year, but the
 * current payload carries no year, so a first migration to school scope must
 * remain possible.
 */
export const NAMESPACED_STORAGE_CATALOG = {
  "school-profile": {
    // School identification data — stable across school years.
    profile: ["unbound", "school"],
  },
  "phmax-scenario-label": {
    // Label of the whole-school scenario. School-level, never year-level.
    value: ["unbound", "school"],
  },
  "phmax-pv": {
    autosave: ["unbound", "school", "schoolYear"],
    // Scenario archive must survive a school-year switch.
    "named-snapshots": ["unbound", "school"],
  },
  "phmax-sd": {
    autosave: ["unbound", "school", "schoolYear"],
    "named-snapshots": ["unbound", "school"],
  },
  "phmax-zs": {
    autosave: ["unbound", "school", "schoolYear"],
    "named-snapshots": ["unbound", "school"],
  },
  "phmax-ss": {
    autosave: ["unbound", "school", "schoolYear"],
    "named-snapshots": ["unbound", "school"],
    // Free-text framework notes; do not influence any calculation.
    "framework-notes": ["unbound", "school"],
  },
  "phmax-nv75": {
    autosave: ["unbound", "school", "schoolYear"],
    "named-snapshots": ["unbound", "school"],
  },
  "annual-report": {
    // The only module whose payload already carries the school year label.
    main: ["unbound", "schoolYear"],
    // Chapter 03 is stored as the personnel resource, not as a section.
    personnel: ["unbound", "schoolYear"],
    "section-01": ["unbound", "schoolYear"],
    "section-02": ["unbound", "schoolYear"],
    "section-04": ["unbound", "schoolYear"],
    "section-05": ["unbound", "schoolYear"],
    "section-06": ["unbound", "schoolYear"],
    "section-07": ["unbound", "schoolYear"],
    "section-08": ["unbound", "schoolYear"],
    "section-09": ["unbound", "schoolYear"],
    "section-10": ["unbound", "schoolYear"],
    "section-11": ["unbound", "schoolYear"],
    "section-12": ["unbound", "schoolYear"],
    "section-13": ["unbound", "schoolYear"],
    "section-14": ["unbound", "schoolYear"],
  },
} as const satisfies NamespacedStorageCatalogShape;

export type NamespacedModuleId = keyof typeof NAMESPACED_STORAGE_CATALOG;

export type NamespacedResourceIdOf<M extends NamespacedModuleId> =
  keyof (typeof NAMESPACED_STORAGE_CATALOG)[M] & string;

export type NamespacedResourceId = {
  [M in NamespacedModuleId]: NamespacedResourceIdOf<M>;
}[NamespacedModuleId];

export type NamespacedCatalogEntry = {
  moduleId: NamespacedModuleId;
  resourceId: string;
  allowedScopeKinds: readonly StorageScopeKind[];
};

/**
 * Map-based lookup instead of object property access: an attacker-supplied
 * segment such as `constructor` must never resolve through the prototype chain.
 */
const CATALOG_LOOKUP: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<StorageScopeKind>>> =
  new Map(
    Object.entries(NAMESPACED_STORAGE_CATALOG).map(([moduleId, resources]) => [
      moduleId,
      new Map(
        Object.entries(resources).map(([resourceId, scopeKinds]) => [
          resourceId,
          new Set(scopeKinds as readonly StorageScopeKind[]),
        ]),
      ),
    ]),
  );

export function isNamespacedModuleId(value: unknown): value is NamespacedModuleId {
  return typeof value === "string" && CATALOG_LOOKUP.has(value);
}

/** True only for a concrete module/resource pair that exists in the catalog. */
export function isNamespacedResourcePair(moduleId: unknown, resourceId: unknown): boolean {
  if (typeof moduleId !== "string" || typeof resourceId !== "string") return false;
  return CATALOG_LOOKUP.get(moduleId)?.has(resourceId) ?? false;
}

export function allowedScopeKindsFor(
  moduleId: unknown,
  resourceId: unknown,
): readonly StorageScopeKind[] | null {
  if (typeof moduleId !== "string" || typeof resourceId !== "string") return null;
  const scopeKinds = CATALOG_LOOKUP.get(moduleId)?.get(resourceId);
  return scopeKinds ? [...scopeKinds] : null;
}

export function isScopeKindAllowedFor(
  moduleId: unknown,
  resourceId: unknown,
  scopeKind: unknown,
): boolean {
  if (typeof moduleId !== "string" || typeof resourceId !== "string") return false;
  if (typeof scopeKind !== "string") return false;
  return CATALOG_LOOKUP.get(moduleId)?.get(resourceId)?.has(scopeKind as StorageScopeKind) ?? false;
}

export function listNamespacedCatalogEntries(): readonly NamespacedCatalogEntry[] {
  const entries: NamespacedCatalogEntry[] = [];
  for (const [moduleId, resources] of CATALOG_LOOKUP) {
    for (const [resourceId, scopeKinds] of resources) {
      entries.push({
        moduleId: moduleId as NamespacedModuleId,
        resourceId,
        allowedScopeKinds: [...scopeKinds],
      });
    }
  }
  return entries;
}
