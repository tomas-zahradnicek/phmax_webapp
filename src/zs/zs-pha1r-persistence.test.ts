import { describe, expect, it, vi } from "vitest";
import { APP_BACKUP_SCHEMA_VERSION } from "../backup/backup-types";
import { getBackupModuleAdapter } from "../backup/backup-registry";
import { validateKnownModuleDataForRestore } from "../backup/restore/restore-module-validators";
import { parseZsSnapshotAuditTotals } from "../phmax-product-audit";
import type { PhaRow } from "../phmax-zs-logic";
import { computeZsPhmaxTotalFromSnapshot } from "./zs-compute-phmax-total-from-snapshot";
import { applyZsResetAll } from "./zs-form-reset";
import {
  applyZsFormSnapshot,
  buildZsFormSnapshot,
  type ZsFormSnapshotSetters,
  type ZsFormSnapshotState,
} from "./zs-form-snapshot";
import { sanitizeZsAutosaveSnapshot } from "./zs-snapshot-row-sanitize";
import { readNamedSnapshotsFromLs, writeNamedSnapshotsToLs } from "../zs-named-snapshots";

function baseState(overrides: Partial<ZsFormSnapshotState> = {}): ZsFormSnapshotState {
  return {
    tab: "phmax",
    mode: "basic",
    basicType: "full_more_than_2",
    basic1Classes: 2,
    basic1Pupils: 40,
    basic2Classes: 1,
    basic2Pupils: 20,
    incl1Classes: 0,
    incl1Pupils: 0,
    incl2Classes: 0,
    incl2Pupils: 0,
    psychRows: [],
    healthRows: [],
    exportLabel: "",
    minorityType: "minorityFull1",
    minority1Classes: 0,
    minority1Pupils: 0,
    minority2Classes: 0,
    minority2Pupils: 0,
    gymRows: [],
    mixedRows: [],
    special1Classes: 0,
    special1Pupils: 0,
    special2Classes: 0,
    special2Pupils: 0,
    specialIIClasses: 0,
    specialIIPupils: 0,
    prepClasses: 0,
    prepChildren: 0,
    prepSpecialClasses: 0,
    prepSpecialChildren: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    phaRows: [],
    pha1rClasses: [],
    schoolEstablishedSec16_9: false,
    schoolAtInstitutionalOrProtectiveCare: false,
    schoolAtHealthcareFacility: false,
    phpYear1: 250,
    phpYear2: 250,
    phpYear3: 250,
    phpWizardStep: "a",
    phpMethodMode: "three_year_avg",
    phpExcludedAbroad: 0,
    phpExcludedForeignSchoolCz: 0,
    phpExcludedIndividual: 0,
    phpExcludedSchool: false,
    selectedExample: "",
    wizardChoice: "",
    zsWizardStep: 1,
    dataMode: "own",
    nv75Role: "ucitel",
    nv75School: "plavecka_skola",
    nv75TeacherMin: 22,
    nv75TeacherMax: 30,
    mixedMethodFirstZsPupils: 0,
    mixedMethodFirstZsClasses: 0,
    mixedMethodFirstSpecialPupils: 0,
    mixedMethodFirstSpecialClasses: 0,
    mixedMethodSecondZsPupils: 0,
    mixedMethodSecondZsClasses: 0,
    mixedMethodSecondSpecialPupils: 0,
    mixedMethodSecondSpecialClasses: 0,
    auditTotals: { totalPhmax: 0, totalPha: 24, totalPhp: 12, tab: "phmax" },
    ...overrides,
  };
}

function captureSetters() {
  const captured: {
    basic1Classes?: number;
    phaRows?: PhaRow[];
    pha1rClasses?: unknown;
    schoolEstablishedSec16_9?: boolean;
    schoolAtInstitutionalOrProtectiveCare?: boolean;
    schoolAtHealthcareFacility?: boolean;
    phpYear1?: number;
  } = {};
  const recorded = {
    setBasic1Classes: (value: number) => {
      captured.basic1Classes = value;
    },
    setPhaRows: (value: PhaRow[]) => {
      captured.phaRows = value;
    },
    setPha1rClasses: (value: unknown) => {
      captured.pha1rClasses = value;
    },
    setSchoolEstablishedSec16_9: (value: boolean) => {
      captured.schoolEstablishedSec16_9 = value;
    },
    setSchoolAtInstitutionalOrProtectiveCare: (value: boolean) => {
      captured.schoolAtInstitutionalOrProtectiveCare = value;
    },
    setSchoolAtHealthcareFacility: (value: boolean) => {
      captured.schoolAtHealthcareFacility = value;
    },
    setPhpYear1: (value: number) => {
      captured.phpYear1 = value;
    },
  };
  const setters = new Proxy(recorded, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target];
      return () => {};
    },
  });
  return { captured, setters: setters as unknown as ZsFormSnapshotSetters };
}

describe("PHA1Rmax persistence", () => {
  it("20. starý snapshot bez PHA1R polí se načte a PHmax se nezmění", () => {
    const legacy = {
      basicType: "full_more_than_2",
      basic1Classes: 2,
      basic1Pupils: 40,
      basic2Classes: 1,
      basic2Pupils: 20,
      phaRows: [{ id: 1, kind: "zs1", classes: 1, pupils: 6 }],
      phpYear1: 250,
      phpExcludedSchool: true,
      _phmaxAuditTotals: { totalPhmax: 80, totalPha: 24, totalPhp: 12, tab: "phmax" },
    };
    const phmaxBefore = computeZsPhmaxTotalFromSnapshot(legacy);
    const safe = sanitizeZsAutosaveSnapshot(legacy);
    expect(safe.pha1rClasses).toEqual([]);
    expect(safe.schoolEstablishedSec16_9).toBe(false);
    expect(safe.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(safe.schoolAtHealthcareFacility).toBe(false);
    expect(safe.basic1Classes).toBe(2);
    expect(safe.basic1Pupils).toBe(40);
    expect(safe.phaRows).toEqual(legacy.phaRows);
    expect(safe.phpYear1).toBe(250);
    expect(safe.phpExcludedSchool).toBe(true);
    expect(computeZsPhmaxTotalFromSnapshot(safe)).toBe(phmaxBefore);

    const { captured, setters } = captureSetters();
    applyZsFormSnapshot(legacy, setters, "ok", () => {});
    expect(captured.pha1rClasses).toEqual([]);
    expect(captured.schoolEstablishedSec16_9).toBe(false);
    expect(captured.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(captured.schoolAtHealthcareFacility).toBe(false);
    expect(captured.basic1Classes).toBe(2);
    expect(captured.phaRows).toEqual(legacy.phaRows);
    expect(captured.phpYear1).toBe(250);

    const totals = parseZsSnapshotAuditTotals(legacy);
    expect(totals).toMatchObject({ totalPhmax: 80, totalPha: 24, totalPhp: 12, tab: "phmax" });
    expect(totals?.totalPha1r).toBeUndefined();
  });

  it("21. nový snapshot přežije build, sanitize a apply", () => {
    const phaRows: PhaRow[] = [{ id: 1, kind: "zs1", classes: 1, pupils: 6 }];
    const state = baseState({
      tab: "pha",
      phaRows,
      pha1rClasses: [
        { id: 4, grade1Pupils: 16, grade1Par38: 1, grade1Par41: 0, establishedSec16_9: false },
        { id: 5, grade1Pupils: 18, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: true },
      ],
      schoolEstablishedSec16_9: false,
      auditTotals: { totalPhmax: 10, totalPha: 24, totalPhp: 12, totalPha1r: 999, tab: "pha" },
    });
    const snap = buildZsFormSnapshot(state);
    const safe = sanitizeZsAutosaveSnapshot(snap);
    expect(safe.pha1rClasses).toEqual(state.pha1rClasses);
    expect(safe.schoolEstablishedSec16_9).toBe(false);
    const totals = safe._phmaxAuditTotals as { totalPha: number; totalPha1r: number; totalPhp: number };
    expect(totals.totalPha).toBe(24);
    expect(totals.totalPhp).toBe(12);
    expect(totals.totalPha1r).toBe(20);

    const { captured, setters } = captureSetters();
    applyZsFormSnapshot(safe, setters, "ok", () => {});
    expect(captured.pha1rClasses).toEqual(state.pha1rClasses);
    expect(captured.phaRows).toEqual(phaRows);
  });

  it("záporné počty sanitize nezahodí clampingem na nulu", () => {
    const safe = sanitizeZsAutosaveSnapshot({
      pha1rClasses: [{ id: 1, grade1Pupils: -2, grade1Par38: 3, grade1Par41: -1, establishedSec16_9: true }],
    });
    expect(safe.pha1rClasses).toEqual([
      { id: 1, grade1Pupils: -2, grade1Par38: 3, grade1Par41: -1, establishedSec16_9: true },
    ]);
  });

  it("22. named snapshot a backup modul phmax-zs zachovají nová pole i starý formát", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const snap = buildZsFormSnapshot(
      baseState({
        pha1rClasses: [{ id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
      }),
    );
    writeNamedSnapshotsToLs([{ id: "n-1", name: "Nový", savedAt: "t", snapshot: snap }]);
    const restored = readNamedSnapshotsFromLs();
    expect(restored[0].snapshot.pha1rClasses).toEqual(snap.pha1rClasses);
    expect((restored[0].snapshot._phmaxAuditTotals as { totalPha1r: number }).totalPha1r).toBe(20);

    writeNamedSnapshotsToLs([
      { id: "old", name: "Starý", savedAt: "t", snapshot: { basic1Classes: 2, phaRows: [] } },
    ]);
    const legacyNamed = readNamedSnapshotsFromLs();
    const legacySafe = sanitizeZsAutosaveSnapshot(legacyNamed[0].snapshot);
    expect(legacySafe.pha1rClasses).toEqual([]);
    expect(legacySafe.basic1Classes).toBe(2);

    const backup = validateKnownModuleDataForRestore("phmax-zs", {
      autosave: snap,
      namedSnapshots: { items: restored },
    });
    expect(backup.ok).toBe(true);
    if (backup.ok) {
      const autosave = (backup.data as { autosave: Record<string, unknown> }).autosave;
      expect(autosave.pha1rClasses).toEqual(snap.pha1rClasses);
    }

    const legacyBackup = validateKnownModuleDataForRestore("phmax-zs", {
      autosave: { basic1Classes: 2 },
    });
    expect(legacyBackup.ok).toBe(true);

    expect(APP_BACKUP_SCHEMA_VERSION).toBe(1);
    expect(getBackupModuleAdapter("phmax-zs")?.schemaVersion).toBe(1);
    vi.unstubAllGlobals();
  });

  it("23. audit totals bez totalPha1r parser přijme", () => {
    const totals = parseZsSnapshotAuditTotals({
      _phmaxAuditTotals: { totalPhmax: 10, totalPha: 4, totalPhp: 12, tab: "php" },
    });
    expect(totals).toEqual({ totalPhmax: 10, totalPha: 4, totalPhp: 12, tab: "php" });
    expect(totals?.totalPha1r).toBeUndefined();
  });

  it("24. audit totals s totalPha1r parser přijme hodnotu", () => {
    const totals = parseZsSnapshotAuditTotals({
      _phmaxAuditTotals: { totalPhmax: 10, totalPha: 4, totalPhp: 12, totalPha1r: 40, tab: "pha" },
    });
    expect(totals?.totalPha1r).toBe(40);
    expect(totals?.totalPha).toBe(4);
  });

  it("úplný reset vynuluje PHA1R stav", () => {
    const setters = {
      setPha1rClasses: vi.fn(),
      setSchoolEstablishedSec16_9: vi.fn(),
      setSchoolAtInstitutionalOrProtectiveCare: vi.fn(),
      setSchoolAtHealthcareFacility: vi.fn(),
    };
    const rest = new Proxy(setters, {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target];
        return vi.fn();
      },
    });
    applyZsResetAll(rest as unknown as ZsFormSnapshotSetters);
    expect(setters.setPha1rClasses).toHaveBeenCalledWith([]);
    expect(setters.setSchoolEstablishedSec16_9).toHaveBeenCalledWith(false);
    expect(setters.setSchoolAtInstitutionalOrProtectiveCare).toHaveBeenCalledWith(false);
    expect(setters.setSchoolAtHealthcareFacility).toHaveBeenCalledWith(false);
  });
});
