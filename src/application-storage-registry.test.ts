import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NAMESPACED_STORAGE_V2_ROOT_PREFIX } from "./data/storage/namespaced-storage-schema";
import {
  APPLICATION_LOCAL_STORAGE_EXACT_KEYS,
  APPLICATION_LOCAL_STORAGE_PREFIXES,
  APPLICATION_SESSION_STORAGE_EXACT_KEYS,
  APPLICATION_SESSION_STORAGE_PREFIXES,
  clearAllApplicationStorage,
} from "./application-storage-registry";
import { listRegisteredBackupStorageKeys } from "./backup/backup-registry";
import { PHMAX_APP_LOCAL_STORAGE_KEYS } from "./phmax-local-storage-clear";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  readonly removeAttempts: string[] = [];

  constructor(
    initial: Record<string, string> = {},
    private readonly throwOnRemove: string | null = null,
    private readonly throwOnRead: string | null = null,
    private readonly throwOnEnumeration = false,
  ) {
    for (const [key, value] of Object.entries(initial)) {
      this.values.set(key, value);
    }
  }

  get length(): number {
    if (this.throwOnEnumeration) {
      throw new Error("simulated enumeration failure");
    }
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    if (key === this.throwOnRead) {
      throw new Error("simulated read failure");
    }
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.removeAttempts.push(key);
    if (key === this.throwOnRemove) {
      throw new Error("simulated remove failure");
    }
    this.values.delete(key);
  }
}

function seedExact(keys: readonly string[], value = "owned"): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, value]));
}

describe("application storage delete registry", () => {
  it("má auditovaný počet exact keys a úzkých prefixů", () => {
    expect(APPLICATION_LOCAL_STORAGE_EXACT_KEYS).toHaveLength(66);
    expect(APPLICATION_LOCAL_STORAGE_PREFIXES).toEqual([
      "phmax-dash-last-visit-",
      "vyrocni-zprava-diagnostic-backup-v1:",
      NAMESPACED_STORAGE_V2_ROOT_PREFIX,
    ]);
    expect(APPLICATION_SESSION_STORAGE_EXACT_KEYS).toHaveLength(6);
    expect(APPLICATION_SESSION_STORAGE_PREFIXES).toEqual([]);
    expect(new Set(APPLICATION_LOCAL_STORAGE_EXACT_KEYS).size).toBe(
      APPLICATION_LOCAL_STORAGE_EXACT_KEYS.length,
    );
    expect(new Set(APPLICATION_SESSION_STORAGE_EXACT_KEYS).size).toBe(
      APPLICATION_SESSION_STORAGE_EXACT_KEYS.length,
    );
  });

  it("zahrnuje explicitně všechny gaps z 0E-3C auditu", () => {
    expect(APPLICATION_LOCAL_STORAGE_EXACT_KEYS).toEqual(
      expect.arrayContaining([
        "phmax-pv-lite-v3",
        "phmax-sd-lite-v2",
        "phmax-zs-lite-v2",
        "phmax-nv75-view-mode",
        "phmax-zs-pha-basic-wizard-step",
        "phmax-zs-php-basic-wizard-step",
        "phmax-toc-open",
        "phmax-dash-role-v1",
        "phmax-dash-quick-tour-v1",
        "phmax-dash-last-export-v1",
        "phmax-is-handoff-endpoint",
        "reditelsky-pruvodce-identity-registry-v1",
        "reditelsky-pruvodce-app-context-v1",
        "vyrocni-zprava-state-v1",
        "vyrocni-zprava-personnel-data-v1",
        "vyrocni-zprava-section14-data-v1",
      ]),
    );
  });

  it("zůstává nadmnožinou calculator clear a central backup registrů", () => {
    const fullResetKeys = new Set<string>(APPLICATION_LOCAL_STORAGE_EXACT_KEYS);

    for (const key of PHMAX_APP_LOCAL_STORAGE_KEYS) {
      expect(fullResetKeys.has(key), `calculator clear key chybí ve Full Reset: ${key}`).toBe(true);
    }
    for (const key of listRegisteredBackupStorageKeys()) {
      expect(fullResetKeys.has(key), `backup key chybí ve Full Reset: ${key}`).toBe(true);
    }
  });

  it("odstraní všechny exact owned localStorage a sessionStorage keys", () => {
    const local = new MemoryStorage(seedExact(APPLICATION_LOCAL_STORAGE_EXACT_KEYS));
    const session = new MemoryStorage(seedExact(APPLICATION_SESSION_STORAGE_EXACT_KEYS));

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });

    expect(result).toEqual({
      ok: true,
      removed:
        APPLICATION_LOCAL_STORAGE_EXACT_KEYS.length +
        APPLICATION_SESSION_STORAGE_EXACT_KEYS.length,
      failed: [],
    });
    for (const key of APPLICATION_LOCAL_STORAGE_EXACT_KEYS) {
      expect(local.getItem(key), key).toBeNull();
    }
    for (const key of APPLICATION_SESSION_STORAGE_EXACT_KEYS) {
      expect(session.getItem(key), key).toBeNull();
    }
  });

  it("odstraní pouze strict prefix matches a zachová lookalikes", () => {
    const local = new MemoryStorage({
      "phmax-dash-last-visit-test": "delete",
      "vyrocni-zprava-diagnostic-backup-v1:2026-08-08T10:00:00Z": "delete",
      "third-party-phmax-dash-last-visit-test": "keep-a",
      "vyrocni-zprava-diagnostic-backup-v10:test": "keep-b",
    });
    const session = new MemoryStorage();

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });

    expect(result.ok).toBe(true);
    expect(result.removed).toBe(2);
    expect(local.getItem("phmax-dash-last-visit-test")).toBeNull();
    expect(
      local.getItem("vyrocni-zprava-diagnostic-backup-v1:2026-08-08T10:00:00Z"),
    ).toBeNull();
    expect(local.getItem("third-party-phmax-dash-last-visit-test")).toBe("keep-a");
    expect(local.getItem("vyrocni-zprava-diagnostic-backup-v10:test")).toBe("keep-b");
  });

  it("zachová cizí localStorage i sessionStorage bitově beze změny", () => {
    const local = new MemoryStorage({
      ...seedExact(APPLICATION_LOCAL_STORAGE_EXACT_KEYS),
      "third-party-example": "KEEP",
      "unrelated-app-data": '{"keep":true}',
    });
    const session = new MemoryStorage({
      ...seedExact(APPLICATION_SESSION_STORAGE_EXACT_KEYS),
      "third-party-session": "KEEP",
    });

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });

    expect(result.ok).toBe(true);
    expect(local.getItem("third-party-example")).toBe("KEEP");
    expect(local.getItem("unrelated-app-data")).toBe('{"keep":true}');
    expect(session.getItem("third-party-session")).toBe("KEEP");
  });

  it("maže corrupted payloady raw bez parsování", () => {
    const corruptedKeys = [
      "reditelsky-pruvodce-identity-registry-v1",
      "reditelsky-pruvodce-app-context-v1",
      "reditelsky-pruvodce-school-profile-v1",
      "vyrocni-zprava-state-v1",
      "edu-cz-pv-calculator-state",
    ] as const;
    const local = new MemoryStorage(seedExact(corruptedKeys, "{invalid-json"));

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: new MemoryStorage(),
    });

    expect(result.ok).toBe(true);
    expect(result.removed).toBe(corruptedKeys.length);
    for (const key of corruptedKeys) {
      expect(local.getItem(key)).toBeNull();
    }
  });

  it("je idempotentní na prázdném storage i při druhém volání", () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();

    const first = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });
    const second = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });

    expect(first).toEqual({ ok: true, removed: 0, failed: [] });
    expect(second).toEqual({ ok: true, removed: 0, failed: [] });
  });

  it("pokračuje po removeItem chybě a vrátí identifikovatelný failure", () => {
    const failedKey = "reditelsky-pruvodce-identity-registry-v1";
    const laterKey = "phmax-is-handoff-endpoint";
    const local = new MemoryStorage(
      {
        [failedKey]: "corrupted-but-owned",
        [laterKey]: "https://is.example.test",
      },
      failedKey,
    );
    const session = new MemoryStorage({
      "phmax-focus-example-select": "1",
    });

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: session,
    });

    expect(result.ok).toBe(false);
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: failedKey,
      operation: "remove",
    });
    expect(local.getItem(failedKey)).toBe("corrupted-but-owned");
    expect(local.getItem(laterKey)).toBeNull();
    expect(session.getItem("phmax-focus-example-select")).toBeNull();
    expect(local.removeAttempts).toContain(laterKey);
  });

  it("při nedostupném localStorage selže uzavřeně a stále zpracuje sessionStorage", () => {
    const session = new MemoryStorage({
      "phmax-focus-example-select": "delete",
      "third-party-session": "KEEP",
    });

    const result = clearAllApplicationStorage({
      localStorage: null,
      sessionStorage: session,
    });

    expect(result.ok).toBe(false);
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: "reditelsky-pruvodce-school-profile-v1",
      operation: "remove",
    });
    expect(session.getItem("phmax-focus-example-select")).toBeNull();
    expect(session.getItem("third-party-session")).toBe("KEEP");
    expect(session.removeAttempts).not.toContain("third-party-session");
  });

  it("po read failure stále maže key, pokračuje a removed zůstává konzervativní", () => {
    const unreadableKey = "reditelsky-pruvodce-identity-registry-v1";
    const laterKey = "phmax-is-handoff-endpoint";
    const local = new MemoryStorage(
      {
        [unreadableKey]: "{invalid-json",
        [laterKey]: "https://is.example.test",
        "third-party-example": "KEEP",
      },
      null,
      unreadableKey,
    );

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: new MemoryStorage(),
    });

    expect(result.ok).toBe(false);
    expect(result.removed).toBe(1);
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: unreadableKey,
      operation: "read",
    });
    expect(local.removeAttempts).toContain(unreadableKey);
    expect(local.removeAttempts).toContain(laterKey);
    expect(local.getItem(laterKey)).toBeNull();
    expect(local.getItem("third-party-example")).toBe("KEEP");
    expect(local.removeAttempts).not.toContain("third-party-example");
  });

  it("po enumeration failure hlásí prefix failures bez pádu a exact keys zpracuje", () => {
    const exactKey = "phmax-is-handoff-endpoint";
    const prefixKey = "phmax-dash-last-visit-zs";
    const local = new MemoryStorage(
      {
        [exactKey]: "https://is.example.test",
        [prefixKey]: "2026-08-08T10:00:00Z",
        "third-party-example": "KEEP",
      },
      null,
      null,
      true,
    );

    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: new MemoryStorage(),
    });

    expect(result.ok).toBe(false);
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: "phmax-dash-last-visit-*",
      operation: "enumerate",
    });
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: "vyrocni-zprava-diagnostic-backup-v1:*",
      operation: "enumerate",
    });
    expect(result.failed).toContainEqual({
      storage: "localStorage",
      key: "reditelsky-pruvodce:v2:*",
      operation: "enumerate",
    });
    expect(local.getItem(exactKey)).toBeNull();
    expect(local.getItem(prefixKey)).toBe("2026-08-08T10:00:00Z");
    expect(local.getItem("third-party-example")).toBe("KEEP");
    expect(local.removeAttempts).not.toContain("third-party-example");
  });

  it("Full Reset removes v2 scenario keys and markers; preserves foreign key", () => {
    const local = new MemoryStorage({
      "phmax-school-scenario-label": "LEGACY",
      "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value": "U",
      "reditelsky-pruvodce:v2:school:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:module:phmax-scenario-label:resource:value":
        "S",
      "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound": '{"schemaVersion":1}',
      "foreign-test-key": "KEEP",
    });
    const result = clearAllApplicationStorage({
      localStorage: local,
      sessionStorage: new MemoryStorage(),
    });
    expect(result.ok).toBe(true);
    expect(local.getItem("phmax-school-scenario-label")).toBeNull();
    expect(
      local.getItem("reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value"),
    ).toBeNull();
    expect(
      local.getItem(
        "reditelsky-pruvodce:v2:school:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:module:phmax-scenario-label:resource:value",
      ),
    ).toBeNull();
    expect(
      local.getItem("reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound"),
    ).toBeNull();
    expect(local.getItem("foreign-test-key")).toBe("KEEP");
    const src = readFileSync(fileURLToPath(new URL("./application-storage-registry.ts", import.meta.url)), "utf8");
    expect(src).not.toContain("localStorage.clear()");
  });
});
