/**
 * Transformace CSV šablony PV+ZŠ → JSON phmax-is-handoff-v1 (ukázka pro IT).
 *
 *   npx --yes tsx scripts/csv-to-phmax-handoff.ts
 *   npx --yes tsx scripts/csv-to-phmax-handoff.ts --out ./handoff.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computePvPhmaxTotal } from "../src/phmax-pv-logic";
import type { PvProvozKind } from "../src/phmax-pv-logic";
import { buildPhmaxIsHandoffPayload, PHMAX_IS_EXPORT_SCHEMA } from "../src/phmax-is-export-adapter";
import type { SchoolScenarioExportPayload } from "../src/phmax-school-scenario-export";
import type { CrossPhmaxSummary } from "../src/phmax-dashboard-cross-phmax";
import { computeZsPhmaxTotalFromSnapshot } from "../src/zs/zs-compute-phmax-total-from-snapshot";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PV_PROVOZ = new Set(["polodenni", "celodenni", "internat", "zdravotnicke"]);
const ZS_BASIC_TYPES = new Set([
  "full_more_than_2",
  "full_max_2",
  "first_only_1",
  "first_only_2",
  "first_only_3",
  "first_only_4",
]);

type CsvRow = Record<string, string>;

function parseArgs(argv: string[]) {
  const opts = {
    meta: path.join(repoRoot, "docs/import-templates/phmax-import-meta-v1.example.csv"),
    pv: path.join(repoRoot, "docs/import-templates/phmax-import-pv-v1.example.csv"),
    zs: path.join(repoRoot, "docs/import-templates/phmax-import-zs-summary-v1.example.csv"),
    out: path.join(repoRoot, "docs/import-templates/phmax-is-handoff.generated.json"),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--meta" && next) {
      opts.meta = path.resolve(next);
      i++;
    } else if (a === "--pv" && next) {
      opts.pv = path.resolve(next);
      i++;
    } else if (a === "--zs" && next) {
      opts.zs = path.resolve(next);
      i++;
    } else if (a === "--out" && next) {
      opts.out = path.resolve(next);
      i++;
    }
  }
  return opts;
}

/** Jednoduchý CSV (;) s podporou uvozovek. */
function parseSemicolonCsv(text: string): CsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: CsvRow = {};
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

function parseNum(raw: string | undefined, field: string): number {
  const s = (raw ?? "").trim();
  if (s === "") return 0;
  const n = Number.parseFloat(s.replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Neplatné číslo v poli ${field}: "${raw}"`);
  return n;
}

function readCsv(filePath: string): CsvRow[] {
  return parseSemicolonCsv(readFileSync(filePath, "utf8"));
}

function assertSameBatch(rows: CsvRow[], keys: { school_id: string; scenario_label: string }, file: string) {
  for (const r of rows) {
    if (r.school_id !== keys.school_id || r.scenario_label !== keys.scenario_label) {
      throw new Error(
        `${file}: school_id/scenario_label se neshodují s meta (${keys.school_id} / ${keys.scenario_label})`,
      );
    }
  }
}

function buildPvSnapshot(pvRows: CsvRow[]) {
  const rows = pvRows.map((r) => {
    const provoz = r.provoz as PvProvozKind;
    if (!PV_PROVOZ.has(provoz)) throw new Error(`Neplatný provoz: ${r.provoz}`);
    const row = {
      id: r.row_key,
      label: r.label ?? "",
      provoz,
      classCount: parseNum(r.class_count, "class_count"),
      avgHours: parseNum(r.avg_hours, "avg_hours"),
      sec16Count: parseNum(r.sec16_count, "sec16_count"),
      languageGroups: parseNum(r.language_groups, "language_groups"),
      pv1dActualChildren: parseNum(r.pv1d_actual_children, "pv1d_actual_children"),
      pv1dMinimumChildren: parseNum(r.pv1d_minimum_children, "pv1d_minimum_children"),
      pv1dKuPhmaxCap: parseNum(r.pv1d_ku_phmax_cap, "pv1d_ku_phmax_cap"),
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

function buildZsSnapshot(zsRow: CsvRow) {
  const basicType = zsRow.basic_type;
  if (!ZS_BASIC_TYPES.has(basicType)) throw new Error(`Neplatný basic_type: ${basicType}`);

  const snapshot: Record<string, unknown> = {
    tab: "phmax",
    mode: "basic",
    basicType,
    basic1Classes: parseNum(zsRow.basic1_classes, "basic1_classes"),
    basic1Pupils: parseNum(zsRow.basic1_pupils, "basic1_pupils"),
    basic2Classes: parseNum(zsRow.basic2_classes, "basic2_classes"),
    basic2Pupils: parseNum(zsRow.basic2_pupils, "basic2_pupils"),
    incl1Classes: parseNum(zsRow.incl1_classes, "incl1_classes"),
    incl1Pupils: parseNum(zsRow.incl1_pupils, "incl1_pupils"),
    incl2Classes: parseNum(zsRow.incl2_classes, "incl2_classes"),
    incl2Pupils: parseNum(zsRow.incl2_pupils, "incl2_pupils"),
    prepClasses: parseNum(zsRow.prep_classes, "prep_classes"),
    prepChildren: parseNum(zsRow.prep_children, "prep_children"),
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

function buildSummary(pvPhmax: number | null, zsPhmax: number | null): CrossPhmaxSummary {
  const slices = [
    {
      id: "pv" as const,
      label: "PV",
      phmax: pvPhmax,
      hasData: pvPhmax != null,
      incomplete: false,
    },
    {
      id: "sd" as const,
      label: "ŠD",
      phmax: null,
      hasData: false,
      incomplete: false,
    },
    {
      id: "zs" as const,
      label: "ZŠ",
      phmax: zsPhmax,
      hasData: zsPhmax != null,
      incomplete: false,
    },
    {
      id: "ss" as const,
      label: "SŠ",
      phmax: null,
      hasData: false,
      incomplete: false,
    },
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

function readAppVersion(): string {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as { version?: string };
  return typeof pkg.version === "string" ? pkg.version : "0.0.0";
}

export function csvFilesToHandoffPayload(paths: {
  meta: string;
  pv: string;
  zs: string;
}): ReturnType<typeof buildPhmaxIsHandoffPayload> {
  const metaRows = readCsv(paths.meta);
  if (metaRows.length !== 1) throw new Error("Meta CSV musí mít právě jeden datový řádek.");
  const meta = metaRows[0];
  if (meta.schema_version !== "phmax-import-pv-zs-v1") {
    throw new Error(`Očekáván schema_version phmax-import-pv-zs-v1, dostáno: ${meta.schema_version}`);
  }

  const pvRows = readCsv(paths.pv);
  const zsRows = readCsv(paths.zs);
  if (zsRows.length !== 1) throw new Error("ZŠ summary CSV musí mít právě jeden datový řádek.");

  const keys = { school_id: meta.school_id, scenario_label: meta.scenario_label };
  assertSameBatch(pvRows, keys, paths.pv);
  assertSameBatch(zsRows, keys, paths.zs);

  const { snapshot: pvSnapshot, totalPhmax: pvPhmax } = buildPvSnapshot(pvRows);
  const { snapshot: zsSnapshot, totalPhmax: zsPhmax } = buildZsSnapshot(zsRows[0]);

  const summary = buildSummary(pvPhmax, zsPhmax);
  const scenarioLabel = meta.scenario_label.trim() || "Import CSV";
  const appVersion = readAppVersion();

  const schoolScenario: SchoolScenarioExportPayload = {
    schema: "phmax-school-scenario-v1",
    appVersion,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Vygenerováno skriptem csv-to-phmax-handoff.ts z CSV šablony. Orientační – ověřte v aplikaci PHmax před odesláním do IS.",
    summary,
    attentionModuleLabels: [],
    moduleSnapshots: { pv: pvSnapshot, zs: zsSnapshot },
    scenarioLabel,
    coherenceWarnings: [],
  };

  return buildPhmaxIsHandoffPayload(schoolScenario);
}

function main() {
  const opts = parseArgs(process.argv);
  const payload = csvFilesToHandoffPayload(opts);
  writeFileSync(opts.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Handoff JSON: ${opts.out}`);
  console.log(`  schema: ${PHMAX_IS_EXPORT_SCHEMA}`);
  console.log(`  school: ${payload.schoolScenario.scenarioLabel}`);
  console.log(
    `  cross-PHmax: ${payload.schoolScenario.summary.totalPhmax ?? "–"} (PV ${payload.schoolScenario.summary.slices.find((s) => s.id === "pv")?.phmax ?? "–"}, ZŠ ${payload.schoolScenario.summary.slices.find((s) => s.id === "zs")?.phmax ?? "–"})`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
