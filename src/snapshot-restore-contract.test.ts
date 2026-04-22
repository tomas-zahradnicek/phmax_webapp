import { afterEach, describe, expect, it } from "vitest";
import { pvHeroExampleSnapshot } from "./phmax-pv-hero-examples";
import { sdHeroExampleSnapshot } from "./phmax-sd-hero-examples";
import { parseZsSnapshotAuditTotals } from "./phmax-product-audit";
import { NAMED_SNAPSHOTS_LS_KEY, readNamedSnapshotsFromLs, writeNamedSnapshotsToLs } from "./zs-named-snapshots";
import { revivePhmaxSsUnitRow } from "./ss/phmax-ss-types";
import { buildSsAuditProtocolInput } from "./ss/phmax-ss-units-derive";

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

describe("Snapshot/restore contract", () => {
  afterEach(() => {
    if (originalLocalStorage) {
      globalThis.localStorage = originalLocalStorage;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).localStorage;
    }
  });

  it("PV snapshot má stabilní řádky pro restore flow", () => {
    const snap = pvHeroExampleSnapshot("ill_pv_5_mixed_1625");
    expect(Array.isArray(snap.rows)).toBe(true);
    expect(snap.rows.length).toBe(2);
    for (const row of snap.rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.provoz).toBe("string");
      expect(typeof row.classCount).toBe("number");
      expect(typeof row.avgHours).toBe("number");
    }
  });

  it("ŠD snapshot má stabilní strukturu pro summary/detail restore flow", () => {
    const summary = sdHeroExampleSnapshot("meth_2_35");
    expect(summary.inputMode).toBe("summary");
    expect(typeof summary.pupils).toBe("number");
    expect(Array.isArray(summary.summarySpecialDepartments)).toBe(true);

    const detail = sdHeroExampleSnapshot("meth_7_special_pha");
    expect(detail.inputMode).toBe("detail");
    expect(Array.isArray(detail.detailDepartments)).toBe(true);
    expect(detail.detailDepartments.length).toBeGreaterThan(0);
  });

  it("ZŠ named snapshot storage + totals parser drží restore kontrakt", () => {
    const mem = new MemoryStorage();
    // @ts-expect-error test storage stub
    globalThis.localStorage = mem;

    const items = [
      {
        id: "n-1",
        name: "A",
        savedAt: "2026-04-22T10:00:00.000Z",
        snapshot: { mode: "full", tab: "phmax" },
      },
    ];
    writeNamedSnapshotsToLs(items);
    const restored = readNamedSnapshotsFromLs();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe("n-1");
    expect(mem.getItem(NAMED_SNAPSHOTS_LS_KEY)).not.toBeNull();

    const totals = parseZsSnapshotAuditTotals({
      _phmaxAuditTotals: { totalPhmax: 628, totalPha: 0, totalPhp: 12, tab: "phmax" },
    });
    expect(totals).not.toBeNull();
    expect(totals?.totalPhmax).toBe(628);
  });

  it("ZŠ restore toleruje cizí pole ve snapshotu i v audit totals", () => {
    const totals = parseZsSnapshotAuditTotals({
      _phmaxAuditTotals: {
        totalPhmax: 700,
        totalPha: 10,
        totalPhp: 12,
        tab: "phmax",
        unexpected: { foo: "bar" },
      },
      foreignRootField: true,
    } as Record<string, unknown>);
    expect(totals).not.toBeNull();
    expect(totals?.totalPhmax).toBe(700);
    expect(totals?.tab).toBe("phmax");
  });

  it("SŠ revive + audit input builder drží restore kompatibilitu", () => {
    const restoredRow = revivePhmaxSsUnitRow(
      {
        id: 1,
        label: "Praktická škola",
        educationField: "78-62-C/01",
        studyForm: "denni",
        phmaxMode: "oneObor",
        oborCountInClass: "1",
        averageStudents: "8",
        classCount: "1",
      },
      1,
    );
    expect(restoredRow.studyForm).toBe("denni");
    expect(restoredRow.phmaxMode).toBe("oneObor");

    const auditInput = buildSsAuditProtocolInput([restoredRow]);
    expect(auditInput).not.toBeNull();
    expect((auditInput?.rows.length ?? 0) > 0).toBe(true);
  });

  it("SŠ revive ignoruje cizí pole a zachová známé hodnoty", () => {
    const restoredRow = revivePhmaxSsUnitRow(
      {
        id: 9,
        label: "Řádek s extra poli",
        educationField: "39-41-L/01",
        studyForm: "vecerni",
        phmaxMode: "twoObory",
        oborCountInClass: "2",
        averageStudents: "17",
        classCount: "1",
        injected: { anything: true },
      } as Record<string, unknown>,
      1,
    );
    expect(restoredRow.id).toBe(9);
    expect(restoredRow.studyForm).toBe("vecerni");
    expect(restoredRow.phmaxMode).toBe("twoObory");
    expect((restoredRow as Record<string, unknown>).injected).toBeUndefined();
  });
});
