import { APP_VERSION } from "./app-version";
import { buildPhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";
import { normalizeImportRows } from "./phmax-import-columns";
import { computePvPhmaxTotal } from "./phmax-pv-logic";
import type { PvProvozKind } from "./phmax-pv-logic";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";
import { computeSdPhmaxTotalFromSnapshot } from "./sd/sd-compute-phmax-total-from-snapshot";
import { computeSsPhmaxTotalFromSnapshot } from "./ss/ss-compute-phmax-total-from-snapshot";
import { revivePhmaxSsUnitRow } from "./ss/phmax-ss-types";
import type { HealthRow, PsychRow } from "./phmax-zs-logic";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";
import { sanitizeCalculatorMode } from "./zs/zs-snapshot-row-sanitize";

export const PHMAX_IMPORT_PV_ZS_SCHEMA = "phmax-import-pv-zs-v1" as const;
export const PHMAX_IMPORT_SCHOOL_SCHEMA = "phmax-import-school-v2" as const;

const ACCEPTED_SCHEMA_VERSIONS = new Set<string>([PHMAX_IMPORT_PV_ZS_SCHEMA, PHMAX_IMPORT_SCHOOL_SCHEMA]);

export const IMPORT_META_HEADERS = [
  "school_id",
  "school_name",
  "school_year",
  "scenario_label",
  "schema_version",
] as const;

export const IMPORT_PV_HEADERS = [
  "school_id",
  "scenario_label",
  "row_key",
  "label",
  "provoz",
  "class_count",
  "avg_hours",
  "sec16_count",
  "language_groups",
] as const;

export const IMPORT_ZS_HEADERS = [
  "school_id",
  "scenario_label",
  "basic_type",
  "basic1_classes",
  "basic1_pupils",
  "basic2_classes",
  "basic2_pupils",
  "incl1_classes",
  "incl1_pupils",
  "incl2_classes",
  "incl2_pupils",
  "prep_classes",
  "prep_children",
  "export_label",
] as const;

export type ImportCsvRow = Record<string, string>;

const PV_PROVOZ = new Set(["polodenni", "celodenni", "internat", "zdravotnicke"]);
const ZS_BASIC_TYPES = new Set([
  "full_more_than_2",
  "full_max_2",
  "first_only_1",
  "first_only_2",
  "first_only_3",
  "first_only_4",
]);

export type ImportTablesInput = {
  metaRows: ImportCsvRow[];
  pvRows: ImportCsvRow[];
  zsRows: ImportCsvRow[];
  sdRows?: ImportCsvRow[];
  ssRows?: ImportCsvRow[];
  zsPsychRows?: ImportCsvRow[];
  zsHealthRows?: ImportCsvRow[];
  appVersion?: string;
};

export type ImportPreviewSummary = {
  scenarioLabel: string;
  schoolId: string;
  pvRowCount: number;
  pvPhmax: number | null;
  zsPhmax: number | null;
  sdPhmax: number | null;
  ssPhmax: number | null;
  zsPsychRowCount: number;
  zsHealthRowCount: number;
  totalPhmax: number | null;
};

/** Jednoduchý CSV (;) s podporou uvozovek – stejný formát jako šablona v1. */
export function parseSemicolonCsv(text: string): ImportCsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: ImportCsvRow = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ";" && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseImportNum(raw: string | undefined, field: string): number {
  const s = (raw ?? "").trim();
  if (s === "") return 0;
  const n = Number.parseFloat(s.replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Neplatné číslo v poli ${field}: "${raw}"`);
  return n;
}

function assertSameBatch(rows: ImportCsvRow[], keys: { school_id: string; scenario_label: string }, label: string) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (r.school_id !== keys.school_id || r.scenario_label !== keys.scenario_label) {
      const rowNo = i + 2;
      throw new Error(
        `${label}, řádek ${rowNo}: school_id/scenario_label se neshodují s Meta ` +
          `(očekáváno ${keys.school_id} / ${keys.scenario_label}, nalezeno ${r.school_id} / ${r.scenario_label})`,
      );
    }
  }
}

function buildPvSnapshot(pvRows: ImportCsvRow[]) {
  const rows = pvRows.map((r) => {
    const provoz = r.provoz as PvProvozKind;
    if (!PV_PROVOZ.has(provoz)) throw new Error(`Neplatný provoz: ${r.provoz}`);
    const row = {
      id: r.row_key,
      label: r.label ?? "",
      provoz,
      classCount: parseImportNum(r.class_count, "class_count"),
      avgHours: parseImportNum(r.avg_hours, "avg_hours"),
      sec16Count: parseImportNum(r.sec16_count, "sec16_count"),
      languageGroups: parseImportNum(r.language_groups, "language_groups"),
      pv1dActualChildren: parseImportNum(r.pv1d_actual_children, "pv1d_actual_children"),
      pv1dMinimumChildren: parseImportNum(r.pv1d_minimum_children, "pv1d_minimum_children"),
      pv1dKuPhmaxCap: parseImportNum(r.pv1d_ku_phmax_cap, "pv1d_ku_phmax_cap"),
      pv1dExemption: r.pv1d_exemption === "1" || r.pv1d_exemption === "true",
      pv1dKuDecisionRef: r.pv1d_ku_decision_ref ?? "",
    };
    return row;
  });

  let totalPhmax = 0;
  let any = false;
  for (const row of rows) {
    const c = computePvPhmaxTotal({
      provoz: row.provoz,
      classCount: row.classCount,
      avgHoursPerDay: row.avgHours,
      sec16ClassCount: row.sec16Count,
      languageGroupCount: row.languageGroups,
    });
    if (c.totalPhmax != null) {
      totalPhmax += c.totalPhmax;
      any = true;
    }
  }
  const snapshot: Record<string, unknown> = { rows };
  if (any) {
    snapshot._phmaxAuditTotals = {
      totalPhmax: Math.round((totalPhmax + Number.EPSILON) * 100) / 100,
      tab: "phmax",
    };
  }
  return { snapshot, totalPhmax: any ? Math.round((totalPhmax + Number.EPSILON) * 100) / 100 : null };
}

const ZS_PSYCH_KINDS = new Set(["psych1", "psych2", "psychMix"]);
const ZS_HEALTH_KINDS = new Set(["health1", "health2", "healthMix"]);

function buildZsPsychRows(rows: ImportCsvRow[]): PsychRow[] {
  return rows.map((r, i) => {
    const kind = r.kind;
    if (!ZS_PSYCH_KINDS.has(kind)) throw new Error(`Neplatný druh psychologa: ${kind}`);
    const mode = r.mode === "higher_of_two" ? "higher_of_two" : "current_only";
    return {
      id: parseImportNum(r.row_id, "row_id") || i + 1,
      kind: kind as PsychRow["kind"],
      mode,
      currentPupils: parseImportNum(r.current_pupils, "current_pupils"),
      currentClasses: parseImportNum(r.current_classes, "current_classes"),
      prevPupils: parseImportNum(r.prev_pupils, "prev_pupils"),
      prevClasses: parseImportNum(r.prev_classes, "prev_classes"),
    };
  });
}

function buildZsHealthRows(rows: ImportCsvRow[]): HealthRow[] {
  return rows.map((r, i) => {
    const kind = r.kind;
    if (!ZS_HEALTH_KINDS.has(kind)) throw new Error(`Neplatný druh zdravotní třídy: ${kind}`);
    const mode = r.mode === "higher_of_two" ? "higher_of_two" : "current_only";
    return {
      id: parseImportNum(r.row_id, "row_id") || i + 1,
      kind: kind as HealthRow["kind"],
      mode,
      currentPupils: parseImportNum(r.current_pupils, "current_pupils"),
      currentClasses: parseImportNum(r.current_classes, "current_classes"),
      prevPupils: parseImportNum(r.prev_pupils, "prev_pupils"),
      prevClasses: parseImportNum(r.prev_classes, "prev_classes"),
    };
  });
}

function buildZsSnapshot(
  zsRow: ImportCsvRow,
  opts?: { psychRows?: PsychRow[]; healthRows?: HealthRow[] },
) {
  const basicType = zsRow.basic_type;
  if (!ZS_BASIC_TYPES.has(basicType)) throw new Error(`Neplatný basic_type: ${basicType}`);

  const snapshot: Record<string, unknown> = {
    tab: "phmax",
    mode: sanitizeCalculatorMode("phmax_full_zs"),
    basicType,
    basic1Classes: parseImportNum(zsRow.basic1_classes, "basic1_classes"),
    basic1Pupils: parseImportNum(zsRow.basic1_pupils, "basic1_pupils"),
    basic2Classes: parseImportNum(zsRow.basic2_classes, "basic2_classes"),
    basic2Pupils: parseImportNum(zsRow.basic2_pupils, "basic2_pupils"),
    incl1Classes: parseImportNum(zsRow.incl1_classes, "incl1_classes"),
    incl1Pupils: parseImportNum(zsRow.incl1_pupils, "incl1_pupils"),
    incl2Classes: parseImportNum(zsRow.incl2_classes, "incl2_classes"),
    incl2Pupils: parseImportNum(zsRow.incl2_pupils, "incl2_pupils"),
    prepClasses: parseImportNum(zsRow.prep_classes, "prep_classes"),
    prepChildren: parseImportNum(zsRow.prep_children, "prep_children"),
    prepSpecialClasses: 0,
    prepSpecialChildren: 0,
    psychRows: opts?.psychRows ?? [],
    healthRows: opts?.healthRows ?? [],
    gymRows: [],
    mixedRows: [],
    exportLabel: zsRow.export_label ?? "",
    minorityType: "minorityFull1",
    minority1Classes: 0,
    minority1Pupils: 0,
    minority2Classes: 0,
    minority2Pupils: 0,
    special1Classes: 0,
    special1Pupils: 0,
    special2Classes: 0,
    special2Pupils: 0,
    specialIIClasses: 0,
    specialIIPupils: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    phaRows: [],
    phpYear1: 0,
    phpYear2: 0,
    phpYear3: 0,
    phpWizardStep: "a",
    phpMethodMode: "three_year_avg",
    phpExcludedAbroad: 0,
    phpExcludedForeignSchoolCz: 0,
    phpExcludedIndividual: 0,
    phpExcludedSchool: false,
    dataMode: "own",
    wizardChoice: "",
    zsWizardStep: 2,
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
  };

  const totalPhmax = computeZsPhmaxTotalFromSnapshot(snapshot);
  if (totalPhmax != null) {
    snapshot._phmaxAuditTotals = { totalPhmax, totalPha: 0, totalPhp: 0, tab: "phmax" };
  }
  return { snapshot, totalPhmax };
}

function buildSdSnapshot(sdRow: ImportCsvRow) {
  const inputMode = sdRow.input_mode === "detail" ? "detail" : "summary";
  const snapshot: Record<string, unknown> = {
    pupils: parseImportNum(sdRow.pupils, "pupils"),
    manualDepts: false,
    departments: Math.max(1, parseImportNum(sdRow.departments, "departments")),
    inputMode,
    summarySpecialDepartments: [],
    regularExceptionGranted: false,
    specialExceptionGranted: false,
    detailDepartments: [{ kind: "regular", participants: 0 }],
  };
  const totalPhmax = computeSdPhmaxTotalFromSnapshot(snapshot);
  if (totalPhmax != null) {
    snapshot._phmaxAuditTotals = { totalPhmax, tab: "phmax" };
  }
  return { snapshot, totalPhmax };
}

function buildSsSnapshot(ssRows: ImportCsvRow[]) {
  const rows = ssRows.map((r, i) =>
    revivePhmaxSsUnitRow(
      {
        id: i + 1,
        label: r.label ?? "",
        educationField: r.education_field ?? "",
        studyForm: r.study_form || "denni",
        classCount: r.class_count ?? "1",
        averageStudents: r.average_students ?? "",
        phmaxMode: "",
        oborCountInClass: "1",
        additionalOborCodes: "",
        oborStudentCountsRaw: "",
        isArt82TalentClass: false,
        classType: "",
        isPar16Class: false,
        isLegacyMultioborClass: false,
        legacyMaxOborCount: "",
        note: "",
      },
      i + 1,
    ),
  );
  const payload = { rows };
  const totalPhmax = computeSsPhmaxTotalFromSnapshot(payload);
  const snapshot: Record<string, unknown> =
    totalPhmax != null ? { rows, _phmaxAuditTotals: { totalPhmax, tab: "phmax" } } : { rows };
  return { snapshot, totalPhmax };
}

function buildImportSummary(modules: {
  pv: number | null;
  sd: number | null;
  zs: number | null;
  ss: number | null;
}): CrossPhmaxSummary {
  const slices = [
    { id: "pv" as const, label: "PV", phmax: modules.pv, hasData: modules.pv != null, incomplete: false },
    { id: "sd" as const, label: "ŠD", phmax: modules.sd, hasData: modules.sd != null, incomplete: false },
    { id: "zs" as const, label: "ZŠ", phmax: modules.zs, hasData: modules.zs != null, incomplete: false },
    { id: "ss" as const, label: "SŠ", phmax: modules.ss, hasData: modules.ss != null, incomplete: false },
  ];
  const withValues = slices.filter((s) => s.hasData && s.phmax != null);
  const totalPhmax =
    withValues.length > 0
      ? Math.round((withValues.reduce((sum, s) => sum + (s.phmax ?? 0), 0) + Number.EPSILON) * 100) / 100
      : null;
  return {
    slices,
    modulesWithPhmax: withValues.length,
    totalPhmax,
    hasIncomplete: false,
  };
}

export function importTablesToHandoffPayload(input: ImportTablesInput) {
  const metaRows = normalizeImportRows(input.metaRows, "meta");
  const pvRows = normalizeImportRows(input.pvRows, "pv");
  const zsRows = normalizeImportRows(input.zsRows, "zs");
  const sdRows = input.sdRows?.length ? normalizeImportRows(input.sdRows, "sd") : undefined;
  const ssRows = input.ssRows?.length ? normalizeImportRows(input.ssRows, "ss") : undefined;
  const zsPsychRows = input.zsPsychRows?.length
    ? normalizeImportRows(input.zsPsychRows, "zsPsych")
    : undefined;
  const zsHealthRows = input.zsHealthRows?.length
    ? normalizeImportRows(input.zsHealthRows, "zsHealth")
    : undefined;

  if (metaRows.length !== 1) throw new Error("List Meta musí mít právě jeden datový řádek.");
  const meta = metaRows[0];
  if (!ACCEPTED_SCHEMA_VERSIONS.has(meta.schema_version)) {
    throw new Error(
      `Očekáván schema_version ${PHMAX_IMPORT_PV_ZS_SCHEMA} nebo ${PHMAX_IMPORT_SCHOOL_SCHEMA}, dostáno: ${meta.schema_version}`,
    );
  }
  if (zsRows.length !== 1) throw new Error("List ZŠ souhrn musí mít právě jeden datový řádek.");
  if (pvRows.length < 1) throw new Error("List PV musí mít alespoň jeden řádek pracoviště.");

  const keys = { school_id: meta.school_id, scenario_label: meta.scenario_label };
  assertSameBatch(pvRows, keys, "PV");
  assertSameBatch(zsRows, keys, "ZŠ");
  if (sdRows) assertSameBatch(sdRows, keys, "ŠD");
  if (ssRows) assertSameBatch(ssRows, keys, "SŠ");
  if (zsPsychRows) assertSameBatch(zsPsychRows, keys, "ZŠ psycholog");
  if (zsHealthRows) assertSameBatch(zsHealthRows, keys, "ZŠ zdravotní");

  const { snapshot: pvSnapshot, totalPhmax: pvPhmax } = buildPvSnapshot(pvRows);
  const psych = zsPsychRows ? buildZsPsychRows(zsPsychRows) : [];
  const health = zsHealthRows ? buildZsHealthRows(zsHealthRows) : [];
  const { snapshot: zsSnapshot, totalPhmax: zsPhmax } = buildZsSnapshot(zsRows[0], {
    psychRows: psych,
    healthRows: health,
  });

  const moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"] = {
    pv: pvSnapshot,
    zs: zsSnapshot,
  };
  let sdPhmax: number | null = null;
  let ssPhmax: number | null = null;

  if (sdRows?.length === 1) {
    const sd = buildSdSnapshot(sdRows[0]);
    moduleSnapshots.sd = sd.snapshot;
    sdPhmax = sd.totalPhmax;
  }
  if (ssRows && ssRows.length > 0) {
    const ss = buildSsSnapshot(ssRows);
    moduleSnapshots.ss = ss.snapshot;
    ssPhmax = ss.totalPhmax;
  }

  const summary = buildImportSummary({
    pv: pvPhmax,
    sd: sdPhmax,
    zs: zsPhmax,
    ss: ssPhmax,
  });
  const scenarioLabel = meta.scenario_label.trim() || "Import ze školy";

  const importNotes: string[] = [];
  if (!sdRows?.length) importNotes.push("List ŠD v souboru chybí – PHmax školní družiny nebyl importován.");
  if (!ssRows?.length) importNotes.push("List SŠ v souboru chybí – PHmax střední školy nebyl importován.");
  if (!zsPsychRows?.length) importNotes.push("List ZŠ psycholog v souboru chybí – řádky psychiatrie nebyly importovány.");
  if (!zsHealthRows?.length) importNotes.push("List ZŠ zdravotní v souboru chybí – řádky zdravotní školy nebyly importovány.");

  const schoolScenario: SchoolScenarioExportPayload = {
    schema: "phmax-school-scenario-v1",
    appVersion: input.appVersion ?? APP_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Import ze šablony školy. Orientační – ověřte v aplikaci PHmax před odesláním do IS.",
    summary,
    attentionModuleLabels: [],
    moduleSnapshots,
    scenarioLabel,
    coherenceWarnings: importNotes,
    importBatchMeta: {
      school_id: meta.school_id,
      school_name: meta.school_name ?? "",
      school_year: meta.school_year ?? "",
    },
  };

  return buildPhmaxIsHandoffPayload(schoolScenario);
}

export function buildImportPreviewSummary(payload: ReturnType<typeof importTablesToHandoffPayload>): ImportPreviewSummary {
  const meta = payload.schoolScenario;
  const pvSlice = meta.summary.slices.find((s) => s.id === "pv");
  const zsSlice = meta.summary.slices.find((s) => s.id === "zs");
  const pvSnap = meta.moduleSnapshots.pv as { rows?: unknown[] } | undefined;
  const zsSnap = meta.moduleSnapshots.zs as { psychRows?: unknown[]; healthRows?: unknown[] } | undefined;
  const sdSlice = meta.summary.slices.find((s) => s.id === "sd");
  const ssSlice = meta.summary.slices.find((s) => s.id === "ss");
  return {
    scenarioLabel: meta.scenarioLabel,
    schoolId: meta.importBatchMeta?.school_id ?? "",
    pvRowCount: Array.isArray(pvSnap?.rows) ? pvSnap.rows.length : 0,
    pvPhmax: pvSlice?.phmax ?? null,
    zsPhmax: zsSlice?.phmax ?? null,
    sdPhmax: sdSlice?.phmax ?? null,
    ssPhmax: ssSlice?.phmax ?? null,
    zsPsychRowCount: Array.isArray(zsSnap?.psychRows) ? zsSnap.psychRows.length : 0,
    zsHealthRowCount: Array.isArray(zsSnap?.healthRows) ? zsSnap.healthRows.length : 0,
    totalPhmax: meta.summary.totalPhmax,
  };
}

export function csvTextsToHandoffPayload(input: {
  metaCsv: string;
  pvCsv: string;
  zsCsv: string;
  appVersion?: string;
}) {
  return importTablesToHandoffPayload({
    metaRows: parseSemicolonCsv(input.metaCsv),
    pvRows: parseSemicolonCsv(input.pvCsv),
    zsRows: parseSemicolonCsv(input.zsCsv),
    appVersion: input.appVersion,
  });
}

