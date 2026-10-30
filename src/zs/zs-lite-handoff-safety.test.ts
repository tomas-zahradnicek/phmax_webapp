import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZS_AUTOSAVE_STORAGE_KEY } from "./zs-form-snapshot";
import { writeZsLiteHandoffToFullStorage, type ZsLiteHandoffInput } from "../phmax-lite-handoff";
import { runZsLiteGuardedTransfer, ZS_LITE_HANDOFF_REPLACE_CONFIRM } from "./zs-lite-pha1r-result";

const readyInput: ZsLiteHandoffInput = {
  basicType: "full_more_than_2",
  basic1Classes: 2,
  basic1Pupils: 90,
  basic2Classes: 1,
  basic2Pupils: 20,
  incl1Classes: 0,
  incl1Pupils: 0,
  incl2Classes: 0,
  incl2Pupils: 0,
  pha1rClasses: [{ id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
};

function installStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  let writes = 0;
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes += 1;
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return {
    store,
    writes: () => writes,
  };
}

function transfer(storage: ReturnType<typeof installStorage>, confirm: (message: string) => boolean, input = readyInput) {
  let navigated = false;
  let notice = "";
  let writeCalls = 0;
  runZsLiteGuardedTransfer({
    input,
    write: () => {
      writeCalls += 1;
      return writeZsLiteHandoffToFullStorage(input);
    },
    confirm,
    navigate: () => {
      navigated = true;
    },
    notify: (message) => {
      notice = message;
    },
  });
  return { navigated, notice, writeCalls, stored: storage.store.get(ZS_AUTOSAVE_STORAGE_KEY) ?? null, writes: storage.writes() };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ZŠ Lite handoff safety", () => {
  it("první přenos bez uložených dat nevyžaduje potvrzení", () => {
    const storage = installStorage();
    let confirms = 0;
    const result = transfer(storage, () => {
      confirms += 1;
      return false;
    });
    expect(confirms).toBe(0);
    expect(result.navigated).toBe(true);
    expect(result.writeCalls).toBe(1);
    expect(result.writes).toBe(1);
    const stored = JSON.parse(result.stored ?? "{}") as { basic1Pupils?: number; tab?: string };
    expect(stored.basic1Pupils).toBe(90);
    expect(stored.tab).toBe("phmax");
  });

  it("existující údaje vyžádají potvrzení a zrušení je zachová", () => {
    const previous = JSON.stringify({ basic1Pupils: 91, basic1Classes: 4, exportLabel: "Škola" });
    const storage = installStorage({ [ZS_AUTOSAVE_STORAGE_KEY]: previous });
    const result = transfer(storage, (message) => {
      expect(message).toBe(ZS_LITE_HANDOFF_REPLACE_CONFIRM);
      return false;
    });
    expect(result.navigated).toBe(false);
    expect(result.notice).toBe("");
    expect(result.writeCalls).toBe(0);
    expect(result.writes).toBe(0);
    expect(storage.store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);
  });

  it("potvrzení nahradí uložené údaje jedním zápisem", () => {
    const storage = installStorage({
      [ZS_AUTOSAVE_STORAGE_KEY]: JSON.stringify({ basic1Pupils: 91 }),
    });
    const result = transfer(storage, () => true);
    expect(result.navigated).toBe(true);
    expect(result.writeCalls).toBe(1);
    expect(result.writes).toBe(1);
    const stored = JSON.parse(result.stored ?? "{}") as { basic1Pupils?: number; pha1rClasses?: unknown[] };
    expect(stored.basic1Pupils).toBe(90);
    expect(stored.pha1rClasses).toEqual(readyInput.pha1rClasses);
  });

  it("neplatné vstupy nepřepíšou existující údaje", () => {
    const previous = JSON.stringify({ basic1Pupils: 91 });
    const storage = installStorage({ [ZS_AUTOSAVE_STORAGE_KEY]: previous });
    let confirms = 0;
    const result = transfer(
      storage,
      () => {
        confirms += 1;
        return true;
      },
      {
        ...readyInput,
        pha1rClasses: [{ id: 1, grade1Pupils: 10, grade1Par38: 6, grade1Par41: 6, establishedSec16_9: false }],
      },
    );
    expect(confirms).toBe(0);
    expect(result.navigated).toBe(false);
    expect(result.writeCalls).toBe(0);
    expect(result.notice).toContain("neprovedl");
    expect(storage.store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);
  });

  it("nečitelný autosave se tiše nepřepíše", () => {
    const storage = installStorage({ [ZS_AUTOSAVE_STORAGE_KEY]: "{broken" });
    let confirms = 0;
    const result = transfer(storage, () => {
      confirms += 1;
      return true;
    });
    expect(confirms).toBe(0);
    expect(result.navigated).toBe(false);
    expect(result.writeCalls).toBe(0);
    expect(result.notice).toContain("nelze bezpečně přečíst");
    expect(storage.store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe("{broken");
  });

  it("otevření plné kalkulačky bez přenosu nezapisuje", () => {
    const source = readFileSync("src/zs/PhmaxZsLitePage.tsx", "utf8");
    const browse = source.slice(source.indexOf("const browseFull"), source.indexOf("const transferToFull"));
    expect(browse).toContain("onOpenFullVersion()");
    expect(browse).not.toContain("writeZsLiteHandoffToFullStorage");
    expect(browse).not.toContain("runZsLiteGuardedTransfer");
    expect(browse).not.toContain("localStorage");
  });
});
