import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "./phmax-school-scenario-export";
import {
  buildImportModuleStorageDiff,
  firstImportAffectedModule,
  formatImportModuleStorageDiff,
} from "./phmax-import-storage-diff";

const LABELS = { pv: "PV", sd: "ŠD", zs: "ZŠ", ss: "SŠ", nv75: "NV75" } as const;

function handoffWith(modules: Partial<Record<keyof typeof LABELS, unknown>>): PhmaxIsHandoffPayload {
  return {
    schema: "phmax-is-handoff-v1",
    schoolScenario: {
      schema: "phmax-school-scenario-v1",
      appVersion: "test",
      exportedAt: "2026-01-01T00:00:00.000Z",
      disclaimer: "test",
      summary: { totalPhmax: 0, hasIncomplete: false, modulesWithPhmax: 0, slices: [] },
      attentionModuleLabels: [],
      moduleSnapshots: modules,
      scenarioLabel: "Test",
      coherenceWarnings: [],
    },
  };
}

describe("buildImportModuleStorageDiff", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rozliší přepis, nový modul a beze změny", () => {
    store.set(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv, "{}");
    store.set(PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd, "{}");

    const diff = buildImportModuleStorageDiff(handoffWith({ pv: { rows: [] }, zs: { tab: "phmax" } }));

    expect(diff.overwrite).toEqual(["pv"]);
    expect(diff.loadNew).toEqual(["zs"]);
    expect(diff.unchanged).toEqual(["sd"]);
  });

  it("formátuje lidsky čitelný souhrn", () => {
    const diff = {
      overwrite: ["pv" as const, "zs" as const],
      unchanged: ["sd" as const],
      loadNew: [] as const[],
    };
    expect(formatImportModuleStorageDiff(diff, LABELS)).toBe("Přepíše / načte: PV, ZŠ · Beze změny: ŠD");
    expect(firstImportAffectedModule(diff)).toBe("pv");
  });
});
