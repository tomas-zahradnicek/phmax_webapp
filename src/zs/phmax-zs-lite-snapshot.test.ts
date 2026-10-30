import { afterEach, describe, expect, it, vi } from "vitest";
import { ZS_LITE_LS_KEY, parseZsLiteSnapshot, readZsLiteSnapshot } from "./phmax-zs-lite-snapshot";

function installStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("phmax-zs-lite-snapshot PHA1R", () => {
  it("A: starý záznam bez PHA1R obnoví prázdné řádky a false příznaky", () => {
    const restored = parseZsLiteSnapshot({
      basicType: "full_max_2",
      basic1Classes: 2,
      basic1Pupils: 40,
      basic2Classes: 1,
      basic2Pupils: 18,
      hasSec16: true,
      incl1Classes: 1,
      incl1Pupils: 8,
      incl2Classes: 0,
      incl2Pupils: 0,
    });

    expect(restored.basicType).toBe("full_max_2");
    expect(restored.basic1Classes).toBe(2);
    expect(restored.basic1Pupils).toBe(40);
    expect(restored.hasSec16).toBe(true);
    expect(restored.incl1Pupils).toBe(8);
    expect(restored.pha1rClasses).toEqual([]);
    expect(restored.schoolEstablishedSec16_9).toBe(false);
    expect(restored.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(restored.schoolAtHealthcareFacility).toBe(false);
  });

  it("B: nový záznam uloží a obnoví třídy i školní příznaky", () => {
    const store = installStorage();
    const saved = {
      basicType: "first_only_2",
      basic1Classes: 2,
      basic1Pupils: 30,
      basic2Classes: 0,
      basic2Pupils: 0,
      hasSec16: false,
      incl1Classes: 0,
      incl1Pupils: 0,
      incl2Classes: 0,
      incl2Pupils: 0,
      pha1rClasses: [
        { id: 4, grade1Pupils: 16, grade1Par38: 1, grade1Par41: 0, establishedSec16_9: false },
      ],
      schoolEstablishedSec16_9: true,
      schoolAtInstitutionalOrProtectiveCare: false,
      schoolAtHealthcareFacility: true,
    };
    store.set(ZS_LITE_LS_KEY, JSON.stringify(saved));

    expect(readZsLiteSnapshot()).toEqual(saved);
    expect(ZS_LITE_LS_KEY).toBe("phmax-zs-lite-v2");
  });
});
