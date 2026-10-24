import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { pickBand, PHA_TABLE, PHP_TABLE } from "../phmax-zs-logic";
import { computeZsPhmaxTotalFromSnapshot } from "./zs-compute-phmax-total-from-snapshot";
import { clearZsPha1rState } from "./zs-form-reset";
import { buildZsFormSnapshot, type ZsFormSnapshotSetters, type ZsFormSnapshotState } from "./zs-form-snapshot";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { createZsRowHandlers } from "./zs-row-handlers";
import { sanitizeZsAutosaveSnapshot } from "./zs-snapshot-row-sanitize";
import {
  buildPha1rResultPresentation,
  buildPha1rRowViews,
  createEmptyPha1rRow,
  pha1rExclusionMessage,
  pha1rGrade1Label,
  pha1rPar38Label,
  pha1rPar41Label,
  pha1rRemoveAriaLabel,
  pha1rSec16Label,
  PHA1R_EMPTY_NOTICE,
  PHA1R_SECTION_TITLE,
  zsOverviewOrientationTotal,
  type Pha1rRowView,
} from "./zs-pha1r-ui";
import { computeZsPha1r, type Pha1rClassRow, type Pha1rSchoolFlags } from "./zs-pha1r";

const openSchool: Pha1rSchoolFlags = {
  schoolEstablishedSec16_9: false,
  schoolAtInstitutionalOrProtectiveCare: false,
  schoolAtHealthcareFacility: false,
};

function row(id: number, grade1Pupils: number, extras: Partial<Pha1rClassRow> = {}): Pha1rClassRow {
  return { ...createEmptyPha1rRow(id), grade1Pupils, ...extras, id };
}

function present(classes: Pha1rClassRow[], flags: Pha1rSchoolFlags = openSchool) {
  return buildPha1rResultPresentation({ classes, flags });
}

function harness(initial: Pha1rClassRow[] = []) {
  let rows = initial;
  const setRows: Parameters<typeof createZsRowHandlers<Pha1rClassRow, keyof Pha1rClassRow>>[0] = (update) => {
    rows = typeof update === "function" ? update(rows) : update;
  };
  const handlers = createZsRowHandlers(setRows, createEmptyPha1rRow);
  return {
    handlers,
    get rows() {
      return rows;
    },
    setSec16(id: number, value: boolean) {
      rows = rows.map((item) => (item.id === id ? { ...item, establishedSec16_9: value } : item));
    },
  };
}

function minimalState(overrides: Partial<ZsFormSnapshotState> = {}): ZsFormSnapshotState {
  return {
    tab: "pha",
    mode: "basic",
    basicType: "full_more_than_2",
    basic1Classes: 2,
    basic1Pupils: 40,
    basic2Classes: 0,
    basic2Pupils: 0,
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
    phaRows: [{ id: 1, kind: "zs1", classes: 1, pupils: 6 }],
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
    auditTotals: { totalPhmax: 0, totalPha: 24, totalPhp: 12, tab: "pha" },
    ...overrides,
  };
}

describe("PHA1Rmax UI", () => {
  it("1. sekce PHA1Rmax existuje na záložce PHAmax pod PHAmax", () => {
    const section = readFileSync("src/zs/ZsPha1rSection.tsx", "utf8");
    const panels = readFileSync("src/zs/ZsPhaPhpTabPanels.tsx", "utf8");
    expect(section).toContain(PHA1R_SECTION_TITLE);
    expect(section).toContain('data-section="pha1r"');
    expect(panels.indexOf("<ZsPhaTabPanel")).toBeLessThan(panels.indexOf("<ZsPha1rSection"));
  });

  it("2. a 3. řádek třídy lze přidat a odebrat", () => {
    const editor = harness();
    editor.handlers.add();
    editor.handlers.add();
    expect(editor.rows).toHaveLength(2);
    const removedId = editor.rows[0].id;
    editor.handlers.remove(removedId);
    expect(editor.rows).toHaveLength(1);
    expect(editor.rows[0].id).not.toBe(removedId);
  });

  it("4. editace se propíše do state a id zůstane", () => {
    const editor = harness([row(7, 0)]);
    editor.handlers.update(7, "grade1Pupils", 16);
    editor.handlers.update(7, "grade1Par38", 1);
    editor.handlers.update(7, "grade1Par41", 0);
    editor.setSec16(7, true);
    expect(editor.rows[0]).toMatchObject({
      id: 7,
      grade1Pupils: 16,
      grade1Par38: 1,
      grade1Par41: 0,
      establishedSec16_9: true,
    });
  });

  it("5. 14 relevantních žáků => 0", () => {
    expect(present([row(1, 14)]).hoursText).toBe("0 hodin týdně");
    expect(present([row(1, 14)]).eligibleClassCount).toBe(0);
  });

  it("6. 15 relevantních žáků => 20", () => {
    expect(present([row(1, 15)]).hoursText).toBe("20 hodin týdně");
    expect(present([row(1, 15)]).detail).toContain("Počet způsobilých tříd: 1");
  });

  it("7. dvě třídy po 15 => 40", () => {
    expect(present([row(1, 15), row(2, 15)]).hoursText).toBe("40 hodin týdně");
  });

  it("8. 14 + 16 => 20", () => {
    const views = buildPha1rRowViews({ classes: [row(1, 14), row(2, 16)], flags: openSchool });
    expect(views.map((item) => item.hours)).toEqual([0, 20]);
    expect(present([row(1, 14), row(2, 16)]).hoursText).toBe("20 hodin týdně");
  });

  it("9. odečet § 38 posune práh", () => {
    const views = buildPha1rRowViews({
      classes: [row(1, 16, { grade1Par38: 1 })],
      flags: openSchool,
    });
    expect(views[0].relevantGrade1Pupils).toBe(15);
    expect(views[0].hours).toBe(20);
    expect(views[0].statusText).toContain("15 relevantních žáků");
  });

  it("10. odečet § 41 posune práh", () => {
    const views = buildPha1rRowViews({
      classes: [row(1, 15, { grade1Par41: 1 })],
      flags: openSchool,
    });
    expect(views[0].relevantGrade1Pupils).toBe(14);
    expect(views[0].hours).toBe(0);
  });

  it("11. třída § 16/9 má 0 hodin a vysvětlení", () => {
    const views = buildPha1rRowViews({
      classes: [row(1, 20, { establishedSec16_9: true })],
      flags: openSchool,
    });
    expect(views[0].hours).toBe(0);
    expect(views[0].statusText).toContain("PHA1Rmax se neuplatní");
  });

  it("12. škola podle § 16 odst. 9 => 0 a důvod", () => {
    const flags = { ...openSchool, schoolEstablishedSec16_9: true };
    const view = present([row(1, 20)], flags);
    expect(view.hoursText).toBe("0 hodin týdně");
    expect(view.kind).toBe("excluded");
    expect(view.detail).toBe(
      pha1rExclusionMessage(["schoolEstablishedSec16_9"]),
    );
    expect(view.detail).toContain("§ 16 odst. 9");
  });

  it("13. ústavní nebo ochranná výchova => 0", () => {
    const view = present([row(1, 20)], { ...openSchool, schoolAtInstitutionalOrProtectiveCare: true });
    expect(view.kind).toBe("excluded");
    expect(view.detail).toContain("ústavní nebo ochranné výchovy");
    expect(computeZsPha1r({ classes: [row(1, 20)], flags: { ...openSchool, schoolAtInstitutionalOrProtectiveCare: true } }).totalPha1r).toBe(0);
  });

  it("14. zdravotnické zařízení => 0", () => {
    const view = present([row(1, 20)], { ...openSchool, schoolAtHealthcareFacility: true });
    expect(view.detail).toContain("zdravotnickém zařízení");
    expect(view.hoursText).toBe("0 hodin týdně");
  });

  it("15. § 38 + § 41 nad celkovým počtem je viditelná nekonzistence", () => {
    const views: Pha1rRowView[] = buildPha1rRowViews({
      classes: [row(1, 10, { grade1Par38: 6, grade1Par41: 6 })],
      flags: openSchool,
    });
    expect(views[0].issues.some((issue) => issue.code === "par_sum_exceeds_grade1")).toBe(true);
    expect(views[0].hours).toBe(0);
    expect(views[0].issues[0].label).toContain("Třída 1");
  });

  it("16. prázdné řádky jsou 0 a neutrální stav, ne chyba", () => {
    const view = present([]);
    expect(view.hoursText).toBe("0 hodin týdně");
    expect(view.kind).toBe("empty");
    expect(view.detail).toBe(PHA1R_EMPTY_NOTICE);
    expect(view.isError).toBe(false);
  });

  it("17. úprava řádku a školní příznak zůstanou ve snapshotu", () => {
    const editor = harness([row(3, 15)]);
    editor.handlers.update(3, "grade1Pupils", 18);
    const snap = buildZsFormSnapshot(
      minimalState({
        pha1rClasses: editor.rows,
        schoolAtHealthcareFacility: true,
      }),
    );
    const safe = sanitizeZsAutosaveSnapshot(JSON.parse(JSON.stringify(snap)) as Record<string, unknown>);
    expect(safe.pha1rClasses).toEqual([row(3, 18)]);
    expect(safe.schoolAtHealthcareFacility).toBe(true);
    expect((safe._phmaxAuditTotals as { totalPha1r: number }).totalPha1r).toBe(0);
  });

  it("18. reset vyčistí PHA1R data", () => {
    const setters = {
      setPha1rClasses: vi.fn(),
      setSchoolEstablishedSec16_9: vi.fn(),
      setSchoolAtInstitutionalOrProtectiveCare: vi.fn(),
      setSchoolAtHealthcareFacility: vi.fn(),
    };
    clearZsPha1rState(setters as unknown as ZsFormSnapshotSetters);
    expect(setters.setPha1rClasses).toHaveBeenCalledWith([]);
    expect(setters.setSchoolEstablishedSec16_9).toHaveBeenCalledWith(false);
  });

  it("19. starý snapshot bez PHA1R polí dá prázdnou sekci a false příznaky", () => {
    const safe = sanitizeZsAutosaveSnapshot({ basic1Classes: 2, phaRows: [{ id: 1, kind: "zs1", classes: 1, pupils: 6 }] });
    expect(safe.pha1rClasses).toEqual([]);
    expect(safe.schoolEstablishedSec16_9).toBe(false);
    expect(safe.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(safe.schoolAtHealthcareFacility).toBe(false);
    expect(present([]).kind).toBe("empty");
  });

  it("20. až 22. PHA1R data nemění PHmax, PHAmax ani PHPmax", () => {
    const before = minimalState();
    const after = minimalState({
      pha1rClasses: [row(1, 15), row(2, 15)],
    });
    expect(computeZsPhmaxTotalFromSnapshot(buildZsFormSnapshot(before))).toBe(
      computeZsPhmaxTotalFromSnapshot(buildZsFormSnapshot(after)),
    );
    const pha = pickBand(6, PHA_TABLE.zs1).value;
    expect(pha).toBe(24);
    expect(pickBand(250, PHP_TABLE).value).toBe(12);
    const beforeTotals = buildZsFormSnapshot(before)._phmaxAuditTotals as { totalPha: number; totalPhp: number };
    const afterTotals = buildZsFormSnapshot(after)._phmaxAuditTotals as { totalPha: number; totalPhp: number; totalPha1r: number };
    expect(afterTotals.totalPha).toBe(beforeTotals.totalPha);
    expect(afterTotals.totalPhp).toBe(beforeTotals.totalPhp);
    expect(afterTotals.totalPha1r).toBe(40);
  });

  it("23. přehledový součet PHA1Rmax nepřičítá", () => {
    expect(zsOverviewOrientationTotal(10, 20, 30)).toBe(60);
    const overview = readFileSync("src/zs/ZsOverviewSection.tsx", "utf8");
    expect(overview).toContain("zsOverviewOrientationTotal(totalPhmax, totalPha, totalPhp)");
    expect(overview).toContain("PHA1Rmax");
    expect(overview).not.toContain("totalPhmax + totalPha + totalPhp + totalPha1r");
  });

  it("24. labely řádků a odebrání jsou rozlišitelné", () => {
    expect(pha1rGrade1Label(2)).toBe("Třída 2: počet žáků 1. ročníku");
    expect(pha1rPar38Label(2)).toContain("§ 38");
    expect(pha1rPar41Label(2)).toContain("§ 41");
    expect(pha1rSec16Label(2)).toContain("§ 16 odst. 9");
    expect(pha1rRemoveAriaLabel(2)).toBe("Odebrat třídu 2");
    const section = readFileSync("src/zs/ZsPha1rSection.tsx", "utf8");
    expect(section).toContain("pha1rRemoveAriaLabel");
    expect(section).toContain("aria-describedby");
    expect(section).toContain("aria-invalid");
  });

  it("25. více školních důvodů je ve stabilním pořadí", () => {
    expect(
      pha1rExclusionMessage([
        "schoolEstablishedSec16_9",
        "schoolAtInstitutionalOrProtectiveCare",
        "schoolAtHealthcareFacility",
      ]),
    ).toBe(
      "PHA1Rmax se pro tento typ školy neuplatní: základní škola zřízená podle § 16 odst. 9; základní škola při školském zařízení pro výkon ústavní nebo ochranné výchovy; základní škola při zdravotnickém zařízení.",
    );
  });

  it("načtení ukázky smaže PHA1R stav", () => {
    const setPha1rClasses = vi.fn();
    const setSchoolEstablishedSec16_9 = vi.fn();
    const setSchoolAtInstitutionalOrProtectiveCare = vi.fn();
    const setSchoolAtHealthcareFacility = vi.fn();
    const setters = new Proxy(
      {
        setPha1rClasses,
        setSchoolEstablishedSec16_9,
        setSchoolAtInstitutionalOrProtectiveCare,
        setSchoolAtHealthcareFacility,
      },
      { get: (target, prop) => (prop in target ? target[prop as keyof typeof target] : vi.fn()) },
    );
    loadZsHeroExample("phmax_bezna_zs", {
      setters: setters as unknown as ZsFormSnapshotSetters,
      createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
      createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
      createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
      applyResetPhmax: () => {},
      applyResetPha: () => {},
      applyResetPhp: () => {},
      resetNv75: () => {},
    });
    expect(setPha1rClasses).toHaveBeenCalledWith([]);
    expect(setSchoolEstablishedSec16_9).toHaveBeenCalledWith(false);
    expect(setSchoolAtInstitutionalOrProtectiveCare).toHaveBeenCalledWith(false);
    expect(setSchoolAtHealthcareFacility).toHaveBeenCalledWith(false);
  });
});
