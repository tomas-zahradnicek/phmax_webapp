/**
 * Full Application Reset delete registry.
 *
 * This is intentionally independent from the central backup registry:
 * delete coverage includes UI, diagnostics, device context and integration
 * configuration that are not part of a user backup.
 */
export const APPLICATION_LOCAL_STORAGE_EXACT_KEYS = [
  // Platform profile / identity / workspace context
  "reditelsky-pruvodce-school-profile-v1",
  "reditelsky-pruvodce-identity-registry-v1",
  "reditelsky-pruvodce-app-context-v1",

  // Calculator business data
  "edu-cz-pv-calculator-state",
  "edu-cz-pv-named-snapshots-v1",
  "edu-cz-sd-calculator-state",
  "edu-cz-sd-named-snapshots-v1",
  "edu-cz-zs-calculator-state",
  "edu-cz-zs-named-snapshots-v1",
  "phmax-ss-units-draft",
  "phmax-ss-named-snapshots-v1",
  "phmax-ss-framework-phase1-notes",
  "edu-cz-nv75-deputy-bank-state",
  "edu-cz-nv75-deputy-bank-named-snapshots",
  "phmax-school-scenario-label",

  // Lite calculator drafts
  "phmax-pv-lite-v3",
  "phmax-sd-lite-v2",
  "phmax-zs-lite-v2",

  // Annual report business data (section 03 is the personnel key)
  "vyrocni-zprava-state-v1",
  "vyrocni-zprava-personnel-data-v1",
  "vyrocni-zprava-section01-data-v1",
  "vyrocni-zprava-section02-data-v1",
  "vyrocni-zprava-section04-data-v1",
  "vyrocni-zprava-section05-data-v1",
  "vyrocni-zprava-section06-data-v1",
  "vyrocni-zprava-section07-data-v1",
  "vyrocni-zprava-section08-data-v1",
  "vyrocni-zprava-section09-data-v1",
  "vyrocni-zprava-section10-data-v1",
  "vyrocni-zprava-section11-data-v1",
  "vyrocni-zprava-section12-data-v1",
  "vyrocni-zprava-section13-data-v1",
  "vyrocni-zprava-section14-data-v1",

  // Calculator UI / workspace
  "phmax-pv-view-mode",
  "phmax-sd-view-mode",
  "phmax-zs-view-mode",
  "phmax-ss-view-mode",
  "phmax-nv75-view-mode",
  "phmax-pv-onboarding",
  "phmax-sd-onboarding",
  "phmax-zs-onboarding",
  "phmax-ss-onboarding",
  "phmax-nv75-onboarding",
  "phmax-pv-basic-wizard-step",
  "phmax-sd-basic-wizard-step",
  "phmax-zs-basic-wizard-step",
  "phmax-ss-basic-wizard-step",
  "phmax-nv75-basic-wizard-step",
  "phmax-zs-pha-basic-wizard-step",
  "phmax-zs-php-basic-wizard-step",
  "phmax-pv-quick-tour-v1",
  "phmax-sd-quick-tour-v1",
  "phmax-zs-quick-tour-v1",
  "phmax-ss-quick-tour-v1",
  "phmax-nv75-quick-tour-v1",
  "phmax-display-density",
  "phmax-calculator-focus",
  "phmax-app-whats-new-seen-version",
  "phmax-calculator-hint-first-visit-v1",
  "phmax-calculator-expert-first-switch-v1",
  "phmax-toc-open",
  "phmax-dash-role-v1",
  "phmax-dash-quick-tour-v1",
  "phmax-dash-last-export-v1",
  "phmax-dash-last-active-product",

  // Integration configuration
  "phmax-is-handoff-endpoint",
] as const;

export const APPLICATION_LOCAL_STORAGE_PREFIXES = [
  "phmax-dash-last-visit-",
  "vyrocni-zprava-diagnostic-backup-v1:",
  "reditelsky-pruvodce:v2:",
] as const;

export const APPLICATION_SESSION_STORAGE_EXACT_KEYS = [
  "phmax-mobile-summary-dismissed",
  "phmax-focus-example-select",
  "phmax-focus-module-inputs",
  "phmax-focus-module-row-id",
  "phmax-focus-module-row-key",
  "phmax-focus-module-section-id",
] as const;

/** No dynamic sessionStorage prefixes are currently owned by the application. */
export const APPLICATION_SESSION_STORAGE_PREFIXES = [] as const;

export type ApplicationStorageArea = "localStorage" | "sessionStorage";
export type ApplicationStorageFailureOperation = "read" | "remove" | "enumerate";

export type ApplicationStorageClearFailure = {
  storage: ApplicationStorageArea;
  key: string;
  operation: ApplicationStorageFailureOperation;
};

export type ClearAllApplicationStorageResult = {
  ok: boolean;
  /**
   * Number of items confirmed present before a successful remove.
   *
   * This can be conservatively understated when getItem fails but removeItem
   * succeeds. It is not proof of reset completeness; consumers must use `ok`.
   */
  removed: number;
  failed: ApplicationStorageClearFailure[];
};

type ResetStorage = Pick<Storage, "getItem" | "removeItem" | "length" | "key">;

export type ClearAllApplicationStorageOptions = {
  localStorage?: ResetStorage | null;
  sessionStorage?: ResetStorage | null;
};

function resolveStorage(area: ApplicationStorageArea): ResetStorage | null {
  try {
    if (area === "localStorage") {
      return typeof localStorage === "undefined" ? null : localStorage;
    }
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function clearStorageArea(
  area: ApplicationStorageArea,
  storage: ResetStorage | null,
  exactKeys: readonly string[],
  prefixes: readonly string[],
  failed: ApplicationStorageClearFailure[],
): number {
  if (storage == null) {
    for (const key of exactKeys) {
      failed.push({ storage: area, key, operation: "remove" });
    }
    for (const prefix of prefixes) {
      failed.push({ storage: area, key: `${prefix}*`, operation: "enumerate" });
    }
    return 0;
  }

  let removed = 0;
  for (const key of exactKeys) {
    let wasPresent = false;
    try {
      wasPresent = storage.getItem(key) != null;
    } catch {
      failed.push({ storage: area, key, operation: "read" });
    }

    try {
      storage.removeItem(key);
      if (wasPresent) removed += 1;
    } catch {
      failed.push({ storage: area, key, operation: "remove" });
    }
  }

  if (prefixes.length === 0) return removed;

  const prefixKeys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key != null && prefixes.some((prefix) => key.startsWith(prefix))) {
        prefixKeys.push(key);
      }
    }
  } catch {
    for (const prefix of prefixes) {
      failed.push({ storage: area, key: `${prefix}*`, operation: "enumerate" });
    }
    return removed;
  }

  for (const key of prefixKeys) {
    try {
      storage.removeItem(key);
      removed += 1;
    } catch {
      failed.push({ storage: area, key, operation: "remove" });
    }
  }

  return removed;
}

/**
 * Raw low-level Full Application Reset.
 *
 * Removes only explicitly owned keys/prefixes, never parses payloads and never
 * reloads, bootstraps identity/context, changes React state or starts backup.
 */
export function clearAllApplicationStorage(
  options: ClearAllApplicationStorageOptions = {},
): ClearAllApplicationStorageResult {
  const failed: ApplicationStorageClearFailure[] = [];
  const local =
    options.localStorage === undefined ? resolveStorage("localStorage") : options.localStorage;
  const session =
    options.sessionStorage === undefined ? resolveStorage("sessionStorage") : options.sessionStorage;

  const removedLocal = clearStorageArea(
    "localStorage",
    local,
    APPLICATION_LOCAL_STORAGE_EXACT_KEYS,
    APPLICATION_LOCAL_STORAGE_PREFIXES,
    failed,
  );
  const removedSession = clearStorageArea(
    "sessionStorage",
    session,
    APPLICATION_SESSION_STORAGE_EXACT_KEYS,
    APPLICATION_SESSION_STORAGE_PREFIXES,
    failed,
  );

  return {
    ok: failed.length === 0,
    removed: removedLocal + removedSession,
    failed,
  };
}
