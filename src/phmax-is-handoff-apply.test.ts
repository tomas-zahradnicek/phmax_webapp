import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import {
  applyPhmaxIsHandoffToStorage,
  buildHandoffApplyConsoleSnippet,
  buildHandoffLocalStorageWrites,
  buildScenarioLabelLiveApplySnippetFragment,
} from "./phmax-is-handoff-apply";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "./phmax-school-scenario-export";
import { PV_BASIC_WIZARD_LS_KEY } from "./pv-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";
import { IDENTITY_REGISTRY_LS_KEY } from "./data/identity/identity-registry-types";
import { buildScenarioLabelNamespacedKey } from "./data/storage/scenario-label-migration/scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "./data/storage/scenario-label-migration/scenario-label-migration-marker-key";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedHandoff = path.join(
  repoRoot,
  "docs/import-templates/phmax-is-handoff.generated.json",
);

function identityJson(schoolId: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

describe("phmax-is-handoff-apply", () => {
  it("zapíše PV/ZŠ snapshoty, scénář a wizard krok 2", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    const mem = new MemoryStorage();
    const result = applyPhmaxIsHandoffToStorage(mem, payload);

    expect(result.appliedModules).toEqual(["pv", "zs"]);
    expect(result.scenarioLabel).toBe("Import z IS 2026-05");
    expect(result.warnings).toEqual([]);

    const pv = JSON.parse(mem.getItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv)!) as { rows: unknown[] };
    expect(pv.rows.length).toBe(2);
    expect(mem.getItem(PV_BASIC_WIZARD_LS_KEY)).toBe("2");
    expect(mem.getItem(ZS_BASIC_WIZARD_LS_KEY)).toBe("2");
    expect(mem.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("Import z IS 2026-05");
  });

  it("S: missing/empty incoming scenario label is NO-OP (does not clear)", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    payload.schoolScenario.scenarioLabel = "   ";
    const mem = new MemoryStorage();
    mem.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "KEEP-ME");
    const result = applyPhmaxIsHandoffToStorage(mem, payload);
    expect(result.scenarioLabel).toBeNull();
    expect(mem.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("KEEP-ME");
  });

  it("F: incoming missing scenario label is NO-OP", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    delete (payload.schoolScenario as { scenarioLabel?: string }).scenarioLabel;
    const mem = new MemoryStorage();
    mem.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "KEEP-ME");
    const result = applyPhmaxIsHandoffToStorage(mem, payload);
    expect(result.scenarioLabel).toBeNull();
    expect(mem.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("KEEP-ME");
  });

  it("buildHandoffLocalStorageWrites excludes scenario label (owned by repository)", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    const writes = buildHandoffLocalStorageWrites(payload);
    expect(writes.every((w) => w.key !== PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe(true);
  });

  it("R: handleImportApplied must not contain second scenario storage write", () => {
    const page = readFileSync(path.join(repoRoot, "src/PhmaxDashboardPage.tsx"), "utf8");
    const start = page.indexOf("const handleImportApplied = useCallback(");
    const end = page.indexOf("const openModuleWithInputsFocus", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const fn = page.slice(start, end);
    expect(fn).not.toContain("localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY");
    expect(fn).not.toContain("writeScenarioLabel");
    expect(fn).toContain("setScenarioLabel(result.scenarioLabel)");
  });

  it("konfigurovatelný konzolový snippet obsahuje klíče autosave", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    const snippet = buildHandoffApplyConsoleSnippet(payload, { reload: false });
    expect(snippet).toContain(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv);
    expect(snippet).toContain(PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs);
    expect(snippet).not.toContain("location.reload()");
  });

  it("B: snippet does NOT embed generation-time school:A key", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    payload.schoolScenario.scenarioLabel = "LABEL";
    const snippet = buildHandoffApplyConsoleSnippet(payload, { reload: false });
    expect(snippet).not.toContain(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
    );
    expect(snippet).not.toContain(
      serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_A }),
    );
    expect(snippet).toContain("resolved LIVE from destination Identity");
    expect(snippet).toContain(IDENTITY_REGISTRY_LS_KEY);
  });

  it("A: generation concept A + destination Identity B → writes school:B", () => {
    const fragment = buildScenarioLabelLiveApplySnippetFragment("NEW");
    expect(fragment).not.toContain(SCHOOL_A);

    const store = new Map<string, string>();
    store.set(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_B));
    const localStorageMock = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    vi.stubGlobal("localStorage", localStorageMock);
    try {
      new Function(fragment)();
    } finally {
      vi.unstubAllGlobals();
    }

    expect(store.get(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("NEW");
    expect(
      store.get(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B })),
    ).toBe("NEW");
    expect(
      store.has(serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_B })),
    ).toBe(true);
    expect(
      store.has(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBe(false);
    // N3-FENCE-WRITE: school snippet writes fence LAST with protocolGeneration 3.
    const fenceKey = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${SCHOOL_B}`;
    const fenceRaw = store.get(fenceKey);
    expect(fenceRaw).toBeTruthy();
    const fence = JSON.parse(fenceRaw!) as {
      protocolGeneration: number;
      authority: string;
      committedRaw: { exists: boolean; value?: string };
    };
    expect(fence.protocolGeneration).toBe(3);
    expect(fence.authority).toBe("legacy");
    expect(fence.committedRaw).toEqual({ exists: true, value: "NEW" });
    // Fence setItem comes after marker setItem in the generated fragment.
    expect(fragment.indexOf("localStorage.setItem(fenceKey")).toBeGreaterThan(
      fragment.indexOf("localStorage.setItem(markerKey"),
    );
  });

  it("C: missing destination Identity → unbound", () => {
    const mem = new MemoryStorage();
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    payload.schoolScenario.scenarioLabel = "UNBOUND-LABEL";
    applyPhmaxIsHandoffToStorage(mem, payload);
    expect(mem.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("UNBOUND-LABEL");
  });

  it("D: corrupted destination Identity → skipped (no guessed unbound)", () => {
    const mem = new MemoryStorage();
    mem.setItem(IDENTITY_REGISTRY_LS_KEY, "{not-json");
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    payload.schoolScenario.scenarioLabel = "SKIP-LABEL";
    applyPhmaxIsHandoffToStorage(mem, payload);
    expect(mem.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("SKIP-LABEL");
    expect(mem.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
  });

  it("buildHandoffLocalStorageWrites respektuje skipWizardReset", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    const all = buildHandoffLocalStorageWrites(payload);
    const noWizard = buildHandoffLocalStorageWrites(payload, { skipWizardReset: true });
    expect(noWizard.length).toBeLessThan(all.length);
    expect(noWizard.some((w) => w.key === PV_BASIC_WIZARD_LS_KEY)).toBe(false);
  });
});
