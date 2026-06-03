import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import {
  applyPhmaxIsHandoffToStorage,
  buildHandoffApplyConsoleSnippet,
  buildHandoffLocalStorageWrites,
} from "./phmax-is-handoff-apply";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "./phmax-school-scenario-export";
import { PV_BASIC_WIZARD_LS_KEY } from "./pv-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";

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

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedHandoff = path.join(
  repoRoot,
  "docs/import-templates/phmax-is-handoff.generated.json",
);

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

  it("konfigurovatelný konzolový snippet obsahuje klíče autosave", () => {
    const raw = readFileSync(generatedHandoff, "utf8");
    const payload = JSON.parse(raw) as PhmaxIsHandoffPayload;
    const snippet = buildHandoffApplyConsoleSnippet(payload, { reload: false });
    expect(snippet).toContain(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv);
    expect(snippet).toContain(PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs);
    expect(snippet).not.toContain("location.reload()");
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
