import { PRODUCT_CALCULATOR_TITLES } from "../calculator-ui-constants";
import { CS_HOURS_PER_WEEK_SHORT } from "../cs-format";
import { getPhaMaxPv, type PvProvozKind } from "../phmax-pv-logic";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "../phmax-school-scenario-export";
import { round2 } from "../phmax-zs-logic";
import {
  computeSdPhaMaxFromSnapshot,
  computeSdPhmaxTotalFromSnapshot,
} from "../sd/sd-compute-phmax-total-from-snapshot";
import { PHMAX_SS_UNITS_STORAGE_KEY } from "../ss/phmax-ss-constants";
import { sumPracticalSchoolPhaMaxFromRows } from "../ss/phmax-ss-practical-phamax";
import { parseSsDraftRowsFromSnapshot } from "../ss/ss-draft-storage";
import { computeSsPhmaxTotalFromSnapshot } from "../ss/ss-compute-phmax-total-from-snapshot";
import { computePvPhmaxTotalFromSnapshot } from "../pv/pv-compute-phmax-total-from-snapshot";
import { computeZsPhmaxTotalFromSnapshot } from "../zs/zs-compute-phmax-total-from-snapshot";
import { ZS_AUTOSAVE_STORAGE_KEY } from "../zs/zs-form-snapshot";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";
import {
  buildPersonnelAvailableDataLines,
  detectMissingPersonnelFields,
  detectPersonnelInconsistencies,
} from "./vyrocni-zprava-personnel-logic";

/** Pole kapitoly 03, která kalkulačky neposkytují – nutné doplnit ručně. */
export const SECTION_03_MANUAL_FIELD_LABELS = [
  "počet učitelů ve fyzických osobách",
  "počet učitelů v úvazcích",
  "počet vychovatelů",
  "počet asistentů pedagoga",
  "počet speciálních pedagogů",
  "počet správních zaměstnanců",
  "členění podle věku a pohlaví",
  "členění podle vzdělání",
  "odborná kvalifikace",
] as const;

export const SECTION_03_CALCULATOR_CAPACITY_LABELS = {
  phmax: "PHmax (součet z modulů PV, ŠD, ZŠ, SŠ)",
  phamax: "PHAmax (z modulů PV, ŠD, ZŠ, SŠ)",
  phpmax: "PHPmax (z modulu ZŠ)",
} as const;

export const SECTION_03_CALCULATOR_DATA_WARNING =
  "Z kalkulaček lze využít některé údaje o úvazcích a kapacitách, ale pro úplnou kapitolu je nutné doplnit také fyzické osoby, věkové členění, vzdělání a odbornou kvalifikaci pracovníků.";

export type AnnualReportCalculatorPersonnelValues = {
  teachersFte?: number;
  assistantsFte?: number;
  educatorsFte?: number;
  nonTeachingStaffFte?: number;
  totalPedagogicalFte?: number;
  totalFte?: number;
  phmax?: number;
  phamax?: number;
  phpmax?: number;
};

export type AnnualReportCalculatorData = {
  personnel: {
    available: boolean;
    sources: string[];
    values: AnnualReportCalculatorPersonnelValues;
    missing: string[];
    notes: string[];
  };
};

export type Section03Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  availableData: string[];
  missingData: string[];
  warnings: string[];
};

type StorageLike = Pick<Storage, "getItem">;

const PV_PROVOZ: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

const MODULE_LABELS: Record<Exclude<keyof typeof PHMAX_MODULE_AUTOSAVE_LS_KEYS, "nv75">, string> = {
  pv: PRODUCT_CALCULATOR_TITLES.pv,
  sd: PRODUCT_CALCULATOR_TITLES.sd,
  zs: PRODUCT_CALCULATOR_TITLES.zs,
  ss: PRODUCT_CALCULATOR_TITLES.ss,
};

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function safeJsonParse(raw: string | null): unknown {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readLsJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return null;
  return safeJsonParse(storage.getItem(key));
}

function isPvProvoz(v: unknown): v is PvProvozKind {
  return typeof v === "string" && (PV_PROVOZ as readonly string[]).includes(v);
}

function normalizePvRowLoose(item: unknown): {
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  if (!isPvProvoz(r.provoz)) return null;
  const classCount = typeof r.classCount === "number" && Number.isFinite(r.classCount) ? Math.max(0, r.classCount) : 0;
  const avgHours = typeof r.avgHours === "number" && Number.isFinite(r.avgHours) ? Math.max(0, r.avgHours) : 0;
  const sec16Count = typeof r.sec16Count === "number" && Number.isFinite(r.sec16Count) ? Math.max(0, r.sec16Count) : 0;
  return { provoz: r.provoz, classCount, avgHours, sec16Count };
}

function computePvPhaMaxFromSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const rows = (snapshot as { rows?: unknown }).rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let phaSum = 0;
  let any = false;
  for (const item of rows) {
    const nr = normalizePvRowLoose(item);
    if (!nr || nr.sec16Count <= 0) continue;
    const hoursForPha = nr.provoz === "zdravotnicke" ? 8 : nr.avgHours;
    const phaMax = getPhaMaxPv(nr.sec16Count, hoursForPha);
    if (phaMax != null) {
      phaSum += phaMax;
      any = true;
    }
  }
  return any ? round2(phaSum) : null;
}

type ZsAuditTotals = { totalPhmax: number; totalPha: number; totalPhp: number };

function readZsAuditTotals(snapshot: unknown): ZsAuditTotals | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const t = (snapshot as { _phmaxAuditTotals?: unknown })._phmaxAuditTotals;
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const totalPhmax = o.totalPhmax;
  const totalPha = o.totalPha;
  const totalPhp = o.totalPhp;
  if (typeof totalPhmax !== "number" || !Number.isFinite(totalPhmax)) return null;
  if (typeof totalPha !== "number" || !Number.isFinite(totalPha)) return null;
  if (typeof totalPhp !== "number" || !Number.isFinite(totalPhp)) return null;
  return { totalPhmax, totalPha, totalPhp };
}

type ModuleCapacitySlice = {
  id: Exclude<keyof typeof PHMAX_MODULE_AUTOSAVE_LS_KEYS, "nv75">;
  label: string;
  hasData: boolean;
  phmax: number | null;
  phamax: number | null;
  phpmax: number | null;
};

function readPvSlice(storage: StorageLike | null): ModuleCapacitySlice {
  const snapshot = readLsJson(storage, PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv);
  const hasRows =
    snapshot != null &&
    typeof snapshot === "object" &&
    Array.isArray((snapshot as { rows?: unknown }).rows) &&
    ((snapshot as { rows: unknown[] }).rows?.length ?? 0) > 0;
  return {
    id: "pv",
    label: MODULE_LABELS.pv,
    hasData: hasRows,
    phmax: hasRows ? computePvPhmaxTotalFromSnapshot(snapshot) : null,
    phamax: hasRows ? computePvPhaMaxFromSnapshot(snapshot) : null,
    phpmax: null,
  };
}

function readSdSlice(storage: StorageLike | null): ModuleCapacitySlice {
  const snapshot = readLsJson(storage, PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd);
  const phmax = snapshot != null ? computeSdPhmaxTotalFromSnapshot(snapshot) : null;
  const phamax = snapshot != null ? computeSdPhaMaxFromSnapshot(snapshot) : null;
  const hasData = phmax != null;
  return {
    id: "sd",
    label: MODULE_LABELS.sd,
    hasData,
    phmax,
    phamax: phamax != null && phamax > 0 ? phamax : null,
    phpmax: null,
  };
}

function readZsSlice(storage: StorageLike | null): ModuleCapacitySlice {
  const snapshot = readLsJson(storage, ZS_AUTOSAVE_STORAGE_KEY);
  const hasSnapshot = snapshot != null && typeof snapshot === "object" && Object.keys(snapshot as object).length > 0;
  const audit = hasSnapshot ? readZsAuditTotals(snapshot) : null;
  const phmaxFromCompute = hasSnapshot ? computeZsPhmaxTotalFromSnapshot(snapshot) : null;
  const phmax = audit?.totalPhmax ?? phmaxFromCompute;
  const hasData = hasSnapshot && phmax != null;
  return {
    id: "zs",
    label: MODULE_LABELS.zs,
    hasData,
    phmax: hasData ? phmax : null,
    phamax: audit != null && audit.totalPha > 0 ? round2(audit.totalPha) : null,
    phpmax: audit != null && audit.totalPhp > 0 ? round2(audit.totalPhp) : null,
  };
}

function readSsSlice(storage: StorageLike | null): ModuleCapacitySlice {
  const snapshot = readLsJson(storage, PHMAX_SS_UNITS_STORAGE_KEY);
  const rows = parseSsDraftRowsFromSnapshot(snapshot);
  const hasData = rows.length > 0;
  return {
    id: "ss",
    label: MODULE_LABELS.ss,
    hasData,
    phmax: hasData ? computeSsPhmaxTotalFromSnapshot(snapshot) : null,
    phamax: hasData ? sumPracticalSchoolPhaMaxFromRows(rows) : null,
    phpmax: null,
  };
}

function sumNullable(values: readonly (number | null)[]): number | null {
  let sum = 0;
  let any = false;
  for (const v of values) {
    if (v == null || !Number.isFinite(v)) continue;
    sum += v;
    any = true;
  }
  return any ? round2(sum) : null;
}

function formatCapacityLabel(label: string, value: number): string {
  return `${label}: ${value.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${CS_HOURS_PER_WEEK_SHORT}`;
}

/** Načte personálně relevantní podklady z autosave kalkulaček (bez úpravy výpočtů). */
export function getAnnualReportCalculatorData(storage?: StorageLike | null): AnnualReportCalculatorData {
  const ls = resolveStorage(storage);
  const slices = [readPvSlice(ls), readSdSlice(ls), readZsSlice(ls), readSsSlice(ls)];

  const sources = slices.filter((s) => s.hasData).map((s) => s.label);
  const values: AnnualReportCalculatorPersonnelValues = {};

  const phmax = sumNullable(slices.map((s) => s.phmax));
  const phamax = sumNullable(slices.map((s) => s.phamax));
  const phpmax = slices.find((s) => s.id === "zs")?.phpmax ?? null;

  if (phmax != null) values.phmax = phmax;
  if (phamax != null) values.phamax = phamax;
  if (phpmax != null) values.phpmax = phpmax;

  const missing: string[] = [...SECTION_03_MANUAL_FIELD_LABELS];
  if (phmax == null) missing.push(SECTION_03_CALCULATOR_CAPACITY_LABELS.phmax);
  if (phamax == null) missing.push(SECTION_03_CALCULATOR_CAPACITY_LABELS.phamax);
  if (phpmax == null) missing.push(SECTION_03_CALCULATOR_CAPACITY_LABELS.phpmax);

  const notes: string[] = [];
  const zsSlice = slices.find((s) => s.id === "zs");
  if (zsSlice?.hasData && values.phamax == null && values.phpmax == null) {
    notes.push(
      "PHAmax a PHPmax ZŠ jsou v podkladech dostupné až po uložení modulu ZŠ (auditní součty _phmaxAuditTotals).",
    );
  }
  const ssSlice = slices.find((s) => s.id === "ss");
  if (ssSlice?.hasData && ssSlice.phamax == null) {
    notes.push("PHAmax SŠ se v aplikaci počítá jen pro praktické školy (obory 78-62-C/01 a 78-62-C/02) v denní formě.");
  }
  if (phmax != null || phamax != null || phpmax != null) {
    notes.push(`Kapacity z kalkulaček jsou uvedeny v ${CS_HOURS_PER_WEEK_SHORT} – nejde o počty fyzických osob ani úvazků.`);
  }

  const available = sources.length > 0;

  return {
    personnel: {
      available,
      sources,
      values,
      missing,
      notes,
    },
  };
}

function buildAvailableDataLines(data: AnnualReportCalculatorData, storage?: StorageLike | null): string[] {
  const ls = resolveStorage(storage);
  const slices = [readPvSlice(ls), readSdSlice(ls), readZsSlice(ls), readSsSlice(ls)];
  const lines: string[] = [];

  for (const slice of slices) {
    if (!slice.hasData) continue;
    if (slice.phmax != null) lines.push(formatCapacityLabel(`PHmax – ${slice.label}`, slice.phmax));
    if (slice.phamax != null) lines.push(formatCapacityLabel(`PHAmax – ${slice.label}`, slice.phamax));
    if (slice.phpmax != null) lines.push(formatCapacityLabel(`PHPmax – ${slice.label}`, slice.phpmax));
  }

  const { values } = data.personnel;
  if (values.phmax != null && slices.filter((s) => s.hasData).length > 1) {
    lines.push(formatCapacityLabel("PHmax – součet modulů", values.phmax));
  }
  if (values.phamax != null && slices.filter((s) => s.phamax != null).length > 1) {
    lines.push(formatCapacityLabel("PHAmax – součet modulů", values.phamax));
  }

  return lines;
}

/** Vyhodnotí připravenost kapitoly 03 – bez generování textu. */
export function getSection03Readiness(
  options: {
    calculatorData?: AnnualReportCalculatorData;
    personnelData?: AnnualReportPersonnelData;
  } = {},
  storage?: StorageLike | null,
): Section03Readiness {
  const calculatorData = options.calculatorData ?? getAnnualReportCalculatorData(storage);
  const personnelData = options.personnelData;
  const availableData = [
    ...buildAvailableDataLines(calculatorData, storage),
    ...(personnelData ? buildPersonnelAvailableDataLines(personnelData) : []),
  ];

  const missingData = personnelData ? detectMissingPersonnelFields(personnelData) : [...SECTION_03_MANUAL_FIELD_LABELS];

  const warnings = [SECTION_03_CALCULATOR_DATA_WARNING];
  if (!calculatorData.personnel.available) {
    warnings.push("V prohlížeči nejsou uložena data z kalkulaček PHmax/PHAmax/PHPmax.");
  } else {
    warnings.push("Data z kalkulaček slouží jen jako doplňkové podklady – nenahrazují ruční personální údaje.");
  }

  if (!personnelData || detectMissingPersonnelFields(personnelData).length > 0) {
    warnings.push("Doplňte personální údaje ve formuláři níže.");
  }

  if (personnelData) {
    warnings.push(...detectPersonnelInconsistencies(personnelData));
  }

  const personnelComplete =
    personnelData != null &&
    detectMissingPersonnelFields(personnelData).length === 0 &&
    detectPersonnelInconsistencies(personnelData).length === 0;

  const status: Section03Readiness["status"] = personnelComplete ? "PRIPRAVENO" : "CHYBI_UDAJE";

  return {
    status,
    availableData,
    missingData,
    warnings,
  };
}

export function isAnnualReportSection03Family(sectionId: string): boolean {
  return sectionId === "03" || sectionId.startsWith("3.");
}
