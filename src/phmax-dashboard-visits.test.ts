import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatDashboardProductVisit,
  readDashboardProductVisit,
  recordDashboardProductVisit,
} from "./phmax-dashboard-visits";

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
  clear() {
    this.store.clear();
  }
}

const originalLocalStorage = globalThis.localStorage;

describe("phmax-dashboard-visits", () => {
  beforeEach(() => {
    // @ts-expect-error test storage stub
    globalThis.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    if (originalLocalStorage) {
      globalThis.localStorage = originalLocalStorage;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).localStorage;
    }
  });

  it("zapíše a přečte čas poslední návštěvy modulu", () => {
    recordDashboardProductVisit("pv");
    const d = readDashboardProductVisit("pv");
    expect(d).not.toBeNull();
    expect(formatDashboardProductVisit("pv")).not.toContain("zatím neotevřeno");
  });

  it("bez záznamu vrátí text pro neotevřený modul", () => {
    expect(formatDashboardProductVisit("ss")).toContain("zatím neotevřeno");
  });
});
