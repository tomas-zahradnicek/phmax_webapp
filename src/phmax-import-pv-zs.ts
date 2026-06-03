import { APP_VERSION } from "./app-version";
import { buildPhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";
import { computePvPhmaxTotal } from "./phmax-pv-logic";
import type { PvProvozKind } from "./phmax-pv-logic";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";

export const PHMAX_IMPORT_PV_ZS_SCHEMA = "phmax-import-pv-zs-v1" as const;

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
  appVersion?: string;
};

export type ImportPreviewSummary = {
  scenarioLabel: string;
  schoolId: string;
  pvRowCount: number;
  pvPhmax: number | null;
  zsPhmax: number | null;
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
  for (const r of rows) {
    if (r.school_id !== keys.school_id || r.scenario_label !== keys.scenario_label) {
      throw new Error(
        `${label}: school_id/scenario_label se neshodují s meta (${keys.school_id} / ${keys.scenario_label})`,
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

function buildZsSnapshot(zsRow: ImportCsvRow) {
  const basicType = zsRow.basic_type;
  if (!ZS_BASIC_TYPES.has(basicType)) throw new Error(`Neplatný basic_type: ${basicType}`);

  const snapshot: Record<string, unknown> = {
    tab: "phmax",
    mode: "basic",
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
    psychRows: [],
    healthRows: [],
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
    phpMethodMode: "three_year_avg",
    dataMode: "own",
    wizardChoice: "",
    zsWizardStep: 1,
  };

  const totalPhmax = computeZsPhmaxTotalFromSnapshot(snapshot);
  if (totalPhmax != null) {
    snapshot._phmaxAuditTotals = { totalPhmax, totalPha: 0, totalPhp: 0, tab: "phmax" };
  }
  return { snapshot, totalPhmax };
}

function buildImportSummary(pvPhmax: number | null, zsPhmax: number | null): CrossPhmaxSummary {
  const slices = [
    { id: "pv" as const, label: "PV", phmax: pvPhmax, hasData: pvPhmax != null, incomplete: false },
    { id: "sd" as const, label: "ŠD", phmax: null, hasData: false, incomplete: false },
    { id: "zs" as const, label: "ZŠ", phmax: zsPhmax, hasData: zsPhmax != null, incomplete: false },
    { id: "ss" as const, label: "SŠ", phmax: null, hasData: false, incomplete: false },
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
  const { metaRows, pvRows, zsRows } = input;
  if (metaRows.length !== 1) throw new Error("List Meta musí mít právě jeden datový řádek.");
  const meta = metaRows[0];
  if (meta.schema_version !== PHMAX_IMPORT_PV_ZS_SCHEMA) {
    throw new Error(`Očekáván schema_version ${PHMAX_IMPORT_PV_ZS_SCHEMA}, dostáno: ${meta.schema_version}`);
  }
  if (zsRows.length !== 1) throw new Error("List ZŠ musí mít právě jeden datový řádek.");
  if (pvRows.length < 1) throw new Error("List PV musí mít alespoň jeden řádek pracoviště.");

  const keys = { school_id: meta.school_id, scenario_label: meta.scenario_label };
  assertSameBatch(pvRows, keys, "PV");
  assertSameBatch(zsRows, keys, "ZŠ");

  const { snapshot: pvSnapshot, totalPhmax: pvPhmax } = buildPvSnapshot(pvRows);
  const { snapshot: zsSnapshot, totalPhmax: zsPhmax } = buildZsSnapshot(zsRows[0]);
  const summary = buildImportSummary(pvPhmax, zsPhmax);
  const scenarioLabel = meta.scenario_label.trim() || "Import ze školy";

  const schoolScenario: SchoolScenarioExportPayload = {
    schema: "phmax-school-scenario-v1",
    appVersion: input.appVersion ?? APP_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Import ze šablony PV+ZŠ. Orientační – ověřte v aplikaci PHmax před odesláním do IS.",
    summary,
    attentionModuleLabels: [],
    moduleSnapshots: { pv: pvSnapshot, zs: zsSnapshot },
    scenarioLabel,
    coherenceWarnings: [],
  };

  return buildPhmaxIsHandoffPayload(schoolScenario);
}

export function buildImportPreviewSummary(payload: ReturnType<typeof importTablesToHandoffPayload>): ImportPreviewSummary {
  const meta = payload.schoolScenario;
  const pvSlice = meta.summary.slices.find((s) => s.id === "pv");
  const zsSlice = meta.summary.slices.find((s) => s.id === "zs");
  const pvRows = meta.moduleSnapshots.pv as { rows?: unknown[] } | undefined;
  return {
    scenarioLabel: meta.scenarioLabel,
    schoolId: "",
    pvRowCount: Array.isArray(pvRows?.rows) ? pvRows.rows.length : 0,
    pvPhmax: pvSlice?.phmax ?? null,
    zsPhmax: zsSlice?.phmax ?? null,
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

function headerSignalsMeta(headers: string[]): boolean {
  return headers.includes("schema_version") && headers.includes("school_id");
}

function headerSignalsPv(headers: string[]): boolean {
  return headers.includes("provoz") && headers.includes("row_key");
}

function headerSignalsZs(headers: string[]): boolean {
  return headers.includes("basic_type") && headers.includes("basic1_classes");
}

export function classifyImportCsvText(text: string): "meta" | "pv" | "zs" | "unknown" {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return "unknown";
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  if (headerSignalsMeta(headers)) return "meta";
  if (headerSignalsPv(headers)) return "pv";
  if (headerSignalsZs(headers)) return "zs";
  return "unknown";
}

export function parseImportCsvFileBundle(files: { name: string; text: string }[]) {
  const tables: Partial<Record<"meta" | "pv" | "zs", ImportCsvRow[]>> = {};
  for (const file of files) {
    const kind = classifyImportCsvText(file.text);
    if (kind === "unknown") {
      throw new Error(`Soubor ${file.name}: neznámá struktura CSV (očekávány sloupce Meta, PV nebo ZŠ).`);
    }
    if (tables[kind]) {
      throw new Error(`Soubor ${file.name}: duplicitní CSV typu ${kind}. Nahrajte jeden soubor na list.`);
    }
    tables[kind] = parseSemicolonCsv(file.text);
  }
  if (!tables.meta || !tables.pv || !tables.zs) {
    const missing = (["meta", "pv", "zs"] as const).filter((k) => !tables[k]);
    throw new Error(`Chybí CSV soubory: ${missing.join(", ")}. Nahrajte tři soubory nebo jeden Excel (.xlsx).`);
  }
  return importTablesToHandoffPayload({
    metaRows: tables.meta,
    pvRows: tables.pv,
    zsRows: tables.zs,
  });
}
