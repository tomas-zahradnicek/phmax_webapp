import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  CALCULATOR_LIMITS_NOTE,
  DASH_IMPORT_HINT,
  DASH_IMPORT_LABEL,
  DASH_IMPORT_STEPS,
  DASH_IMPORT_TEMPLATE_LABEL,
  DASH_IMPORT_UPLOAD_LABEL,
  DASH_OPEN_MODULE_OWN_DATA_BUTTON_SUFFIX,
  DASH_OPEN_MODULE_EXAMPLE_BUTTON_SUFFIX,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { DashboardSchoolImportDialog } from "./DashboardSchoolImportDialog";
import { dispatchPhmaxImportApplied } from "./phmax-import-applied-event";
import { downloadPhmaxImportTemplateXlsx } from "./phmax-import-template-xlsx";
import { FillStatusBadge, dashboardRowFillStatusKind } from "./FillStatusBadge";
import { APP_VERSION } from "./app-version";
import {
  buildSchoolReviewPrintHtml,
  openSchoolReviewPrintWindow,
} from "./phmax-dashboard-school-review-print";
import { HeroStatusBar } from "./HeroStatusBar";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { round2 } from "./phmax-zs-logic";
import { computePvPhmaxTotal, getPhaMaxPv, type PvProvozKind } from "./phmax-pv-logic";
import { calculateNv75DeputyBank } from "./nv75-deputy-bank";
import { eligibleAdditionalWorkplacesForRow, normalizeNv75UiRow, type Nv75DeputyUiRow } from "./PhmaxNv75DeputyPage";
import { readNamedSnapshotsFromLs } from "./zs-named-snapshots";
import { PHMAX_SS_UNITS_STORAGE_KEY } from "./ss/phmax-ss-constants";
import { deriveSsUnitsPreview } from "./ss/phmax-ss-units-derive";
import { getDashboardFocusHint } from "./phmax-dashboard-focus";
import { nv75DashboardVerdictFromLs } from "./phmax-nv75-dashboard-focus";
import {
  parseSdDashboardSnapshot,
  sdDashboardVerdictFromSnapshot,
} from "./phmax-sd-dashboard-focus";
import {
  computeSdPhmaxTotalFromSnapshot,
  computeSdPhaMaxFromSnapshot,
} from "./sd/sd-compute-phmax-total-from-snapshot";
import { countPar16MarkedRows, PHMAX_SS_PAR16_DOCK_HINT } from "./ss/phmax-ss-par16";
import { parseSsDraftRowsFromSnapshot } from "./ss/ss-draft-storage";
import { sumPracticalSchoolPhaMaxFromRows } from "./ss/phmax-ss-practical-phamax";
import { formatDashboardProductVisit, readLastActiveProduct } from "./phmax-dashboard-visits";
import { clearAllPhmaxLocalStorage } from "./phmax-local-storage-clear";
import { PHMAX_DASHBOARD_MAIN_ID } from "./phmax-main-landmarks";
import { requestFocusExampleSelect } from "./phmax-focus-example-hint";
import { requestFocusModuleInputs } from "./phmax-focus-inputs-hint";
import { sortByDashboardAttention } from "./phmax-dashboard-sort";
import {
  buildCrossPhmaxSummary,
  formatCrossPhmaxSliceLabel,
  parseDashboardKpiPhmax,
} from "./phmax-dashboard-cross-phmax";
import { coherenceWarningModuleId } from "./phmax-cross-phmax-coherence-nav";
import { offerClearBrowserDataAfterDashboardExport } from "./phmax-dashboard-export-followup";
import {
  buildCrossPhmaxExportPayload,
  crossPhmaxAttentionMismatches,
} from "./phmax-dashboard-cross-phmax-export";
import {
  buildSchoolScenarioExportPayload,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
  readSchoolScenarioLabel,
} from "./phmax-school-scenario-export";
import { buildPhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import { crossPhmaxAuditCoherenceWarnings } from "./phmax-cross-phmax-coherence";
import { buildDashboardExportChecklist } from "./phmax-dashboard-export-checklist";
import {
  postPhmaxIsHandoff,
  readPhmaxIsEndpoint,
  writePhmaxIsEndpoint,
} from "./phmax-is-handoff-client";
import { downloadTextFile, exportFilenameStamped } from "./export-utils";
import { useUiNotice } from "./useUiNotice";

const DASH_QUICK_IDS: Exclude<ProductView, "dash">[] = ["pv", "sd", "zs", "ss", "nv75"];

/** Moduly pro dashboard deep-link na vstupy. */
const DASH_INPUT_FOCUS_IDS = ["pv", "sd", "zs", "ss", "nv75"] as const satisfies readonly Exclude<ProductView, "dash">[];

const DASH_START_MODULES: ReadonlyArray<{
  id: Exclude<ProductView, "dash">;
  lead: string;
}> = [
  { id: "pv", lead: "Předškolní vzdělávání – ukázka volitelná, nebo rovnou vlastní pracoviště." },
  { id: "sd", lead: "Školní družina – ukázka volitelná, nebo rovnou vlastní údaje." },
  { id: "zs", lead: "PHmax / PHAmax / PHPmax – vlastní škola nebo ukázka z metodiky." },
  { id: "ss", lead: "Střední škola – evidence tříd; ukázka volitelná." },
  { id: "nv75", lead: "Banka odpočtů – ukázka A volitelná, nebo vlastní řádky." },
];

const DASH_CALC_LABEL: Record<Exclude<ProductView, "dash">, string> = {
  pv: "PV",
  sd: "ŠD",
  zs: "ZŠ",
  ss: "SŠ",
  nv75: "NV75",
};

type PhmaxDashboardPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const LS_PV = "edu-cz-pv-calculator-state";
const LS_PV_NAMED = "edu-cz-pv-named-snapshots-v1";
const LS_SD = "edu-cz-sd-calculator-state";
const LS_SD_NAMED = "edu-cz-sd-named-snapshots-v1";
const LS_ZS = "edu-cz-zs-calculator-state";
const LS_NV75 = "edu-cz-nv75-deputy-bank-state";
const LS_NV75_NAMED = "edu-cz-nv75-deputy-bank-named-snapshots";

const PV_PROVOZ: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

function safeJsonParse(raw: string | null): unknown {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function namedCount(key: string): number {
  const data = safeJsonParse(typeof localStorage === "undefined" ? null : localStorage.getItem(key));
  if (!data || typeof data !== "object") return 0;
  const items = (data as { items?: unknown }).items;
  return Array.isArray(items) ? items.length : 0;
}

function normalizePvRowLoose(item: unknown): {
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const provoz = r.provoz;
  if (typeof provoz !== "string" || !PV_PROVOZ.includes(provoz as PvProvozKind)) return null;
  const classCount = typeof r.classCount === "number" && Number.isFinite(r.classCount) ? Math.max(0, r.classCount) : 0;
  const avgHours = typeof r.avgHours === "number" && Number.isFinite(r.avgHours) ? Math.max(0, r.avgHours) : 0;
  const sec16Count = typeof r.sec16Count === "number" && Number.isFinite(r.sec16Count) ? Math.max(0, r.sec16Count) : 0;
  const languageGroups =
    typeof r.languageGroups === "number" && Number.isFinite(r.languageGroups) ? Math.max(0, r.languageGroups) : 0;
  return { provoz: provoz as PvProvozKind, classCount, avgHours, sec16Count, languageGroups };
}

function summarizePvFromLs(): {
  present: boolean;
  rowCount: number;
  phmax: number | null;
  pha: number | null;
  incomplete: boolean;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_PV);
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return { present: false, rowCount: 0, phmax: null, pha: null, incomplete: false };
  }
  const rowsRaw = (parsed as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
    return { present: false, rowCount: 0, phmax: null, pha: null, incomplete: false };
  }
  let phmaxSum = 0;
  let phaSum = 0;
  let incomplete = false;
  for (const item of rowsRaw) {
    const nr = normalizePvRowLoose(item);
    if (!nr) continue;
    const computed = computePvPhmaxTotal({
      provoz: nr.provoz,
      classCount: nr.classCount,
      avgHoursPerDay: nr.avgHours,
      sec16ClassCount: nr.sec16Count,
      languageGroupCount: nr.languageGroups,
    });
    if (computed.totalPhmax != null) phmaxSum += computed.totalPhmax;
    else incomplete = true;
    const hoursForPha = nr.provoz === "zdravotnicke" ? 8 : nr.avgHours;
    const phaMax = nr.sec16Count > 0 ? getPhaMaxPv(nr.sec16Count, hoursForPha) : null;
    if (phaMax != null) phaSum += phaMax;
  }
  return {
    present: true,
    rowCount: rowsRaw.length,
    phmax: round2(phmaxSum),
    pha: phaSum > 0 ? round2(phaSum) : null,
    incomplete,
  };
}

function readSdBrief(): {
  present: boolean;
  pupils: number;
  departments: number;
  inputMode: "summary" | "detail";
  phmax: number | null;
  pha: number | null;
} | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_SD);
  const snap = parseSdDashboardSnapshot(raw);
  if (!snap) return null;
  const parsed = safeJsonParse(raw);
  const phmax = computeSdPhmaxTotalFromSnapshot(parsed);
  const pha = computeSdPhaMaxFromSnapshot(parsed);
  return {
    present: true,
    pupils: snap.pupils,
    departments: snap.departments,
    inputMode: snap.inputMode,
    phmax,
    pha: pha != null && pha > 0 ? pha : null,
  };
}

function deriveSdDashboardVerdict(sd: NonNullable<ReturnType<typeof readSdBrief>>): DashboardVerdict {
  const snap = parseSdDashboardSnapshot(typeof localStorage === "undefined" ? null : localStorage.getItem(LS_SD));
  if (snap) return sdDashboardVerdictFromSnapshot(snap);
  return {
    tone: "ok",
    label: "Vstupy uloženy – ověřte PHmax v modulu",
    detail: `Účastníci ${sd.pupils}, oddělení ${sd.departments}, režim ${
      sd.inputMode === "detail" ? "detailní" : "souhrnný"
    }. Stejný stav jako v docku ŠD po otevření modulu.`,
  };
}

type ZsAuditTotals = { totalPhmax: number; totalPha: number; totalPhp: number; tab?: string };

function readZsTotals(): ZsAuditTotals | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_ZS);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") return null;
  const t = (data as { _phmaxAuditTotals?: unknown })._phmaxAuditTotals;
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const totalPhmax = o.totalPhmax;
  const totalPha = o.totalPha;
  const totalPhp = o.totalPhp;
  if (typeof totalPhmax !== "number" || typeof totalPha !== "number" || typeof totalPhp !== "number") return null;
  const tab = typeof o.tab === "string" ? o.tab : undefined;
  return { totalPhmax, totalPha, totalPhp, tab };
}

function parseSsDraftRows(raw: string | null): ReturnType<typeof parseSsDraftRowsFromSnapshot> {
  return parseSsDraftRowsFromSnapshot(safeJsonParse(raw));
}

function summarizeSsFromLs(): {
  present: boolean;
  rowCount: number;
  phmax: number | null;
  phamaxPractical: number | null;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY);
  const rows = parseSsDraftRows(raw);
  if (rows.length === 0)
    return { present: false, rowCount: 0, phmax: null, phamaxPractical: null };
  const preview = deriveSsUnitsPreview(rows);
  let sum = 0;
  for (const p of preview) {
    if (!p.skipped && "resolved" in p) sum += p.resolved?.totalPhmax ?? 0;
  }
  const rounded = Math.round((sum + Number.EPSILON) * 100) / 100;
  const phamax = sumPracticalSchoolPhaMaxFromRows(rows);
  return {
    present: true,
    rowCount: rows.length,
    phmax: rounded,
    phamaxPractical: phamax,
  };
}

function nv75CalculationRows(rows: Nv75DeputyUiRow[]) {
  return rows.map((row) => ({
    kind: row.kind,
    units: row.units,
    additionalWorkplacesEligible: eligibleAdditionalWorkplacesForRow(row),
  }));
}

function readNv75State(): {
  rowCount: number;
  bankTotal: number | null;
  rule: string | null;
  practicalFilled: boolean;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_NV75);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") {
    return { rowCount: 0, bankTotal: null, rule: null, practicalFilled: false };
  }
  const o = data as Record<string, unknown>;
  const rowsRaw = o.rows;
  const practicalGeneralNonOv =
    typeof o.practicalGeneralNonOv === "number" && Number.isFinite(o.practicalGeneralNonOv) ? o.practicalGeneralNonOv : 0;
  const practicalOvEhl0 =
    typeof o.practicalOvEhl0 === "number" && Number.isFinite(o.practicalOvEhl0) ? o.practicalOvEhl0 : 0;
  const practicalSec16 =
    typeof o.practicalSec16 === "number" && Number.isFinite(o.practicalSec16) ? o.practicalSec16 : 0;
  const ovGroupsSchool =
    typeof o.ovGroupsSchool === "number" && Number.isFinite(o.ovGroupsSchool) ? o.ovGroupsSchool : 0;
  const ovGroupsInstructor =
    typeof o.ovGroupsInstructor === "number" && Number.isFinite(o.ovGroupsInstructor) ? o.ovGroupsInstructor : 0;
  const practicalFilled = practicalGeneralNonOv > 0 || practicalOvEhl0 > 0 || practicalSec16 > 0 || ovGroupsSchool > 0 || ovGroupsInstructor > 0;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
    return { rowCount: 0, bankTotal: null, rule: null, practicalFilled };
  }
  let uiRows: Nv75DeputyUiRow[];
  try {
    uiRows = rowsRaw
      .map((item) => normalizeNv75UiRow((item ?? {}) as Nv75DeputyUiRow))
      .map((r, idx) => ({ ...r, id: typeof r.id === "number" ? r.id : idx + 1 }));
  } catch {
    return { rowCount: rowsRaw.length, bankTotal: null, rule: null, practicalFilled };
  }
  try {
    const result = calculateNv75DeputyBank({
      activities: nv75CalculationRows(uiRows),
      practicalStudentsGeneralNonOv: practicalGeneralNonOv,
      practicalStudentsOvEhl0: practicalOvEhl0,
      practicalStudentsSec16: practicalSec16,
      ovGroupsSchool,
      ovGroupsInstructor,
    });
    return {
      rowCount: uiRows.length,
      bankTotal: result.bankHoursTotal,
      rule: result.appliedRule,
      practicalFilled,
    };
  } catch {
    return { rowCount: uiRows.length, bankTotal: null, rule: null, practicalFilled };
  }
}

function zsSnapshotHasAnyInput(): boolean {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_ZS);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") return false;
  return Object.keys(data as object).length > 0;
}

type DashboardKpi = {
  label: string;
  value: string;
};

type DashboardVerdict = {
  label: string;
  detail: string;
  tone: "ok" | "warning" | "danger" | "neutral";
};

type DashboardRow = {
  id: Exclude<ProductView, "dash">;
  title: string;
  status: string;
  detail: string;
  namedBackups: number;
  hasData: boolean;
  lastVisit: string;
  primaryKpi: DashboardKpi;
  secondaryKpis: DashboardKpi[];
  verdict: DashboardVerdict | null;
};

function dashboardModuleFillLabel(
  hasData: boolean,
  verdict: DashboardVerdict | null,
  phmaxKpiValue?: string,
): string {
  if (!hasData) return "Ještě nevyplněno";
  if (phmaxKpiValue != null && phmaxKpiValue !== "–") {
    const phmax = parseDashboardKpiPhmax(phmaxKpiValue);
    if (phmax === 0) return "PHmax = 0 (modul vyplněn)";
  }
  if (verdict?.tone === "ok") return "Vstupy v pořádku";
  if (verdict) return verdict.label;
  return "Uložený stav – otevřete modul";
}

function dashboardFillStatusClass(hasData: boolean, verdict: DashboardVerdict | null): string {
  if (!hasData) return "dash-continue-card__fill-status--empty";
  if (verdict?.tone === "ok") return "dash-continue-card__fill-status--ok";
  if (verdict) return "dash-continue-card__fill-status--warning";
  return "dash-continue-card__fill-status--empty";
}

function dashboardKpiStatusClass(row: DashboardRow): string {
  if (!row.hasData) return "dash-kpi-tile__status--empty";
  if (row.verdict?.tone === "ok") return "dash-kpi-tile__status--ok";
  if (row.verdict?.tone === "danger") return "dash-kpi-tile__status--danger";
  return "dash-kpi-tile__status--warning";
}

function dashboardVerdictNeedsAttention(verdict: DashboardVerdict | null): boolean {
  return verdict?.tone === "warning" || verdict?.tone === "danger";
}

function dashboardRowSupportsInputFocus(id: Exclude<ProductView, "dash">): boolean {
  return (DASH_INPUT_FOCUS_IDS as readonly string[]).includes(id);
}

function deriveSsDashboardVerdict(): DashboardVerdict | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY);
  const rows = parseSsDraftRows(raw);
  if (rows.length === 0) return null;
  const preview = deriveSsUnitsPreview(rows);
  const errorRows = preview.filter((p) => !p.skipped && "error" in p).length;
  if (errorRows > 0) {
    return {
      tone: "danger",
      label: "Překročení pravidel vstupu",
      detail: `${errorRows} řádků obsahuje neplatnou kombinaci nebo hodnotu.`,
    };
  }
  const skippedRows = preview.filter((p) => p.skipped).length;
  if (skippedRows > 0) {
    return {
      tone: "warning",
      label: "Na hraně: chybí povinné údaje",
      detail: `U ${skippedRows} řádků zatím chybí podklady pro výpočet.`,
    };
  }
  const par16Rows = countPar16MarkedRows(rows);
  if (par16Rows > 0) {
    return {
      tone: "warning",
      label: "§ 16/9 – výpočet pásem metodiky",
      detail: `${par16Rows} řádků § 16/9. ${PHMAX_SS_PAR16_DOCK_HINT}`,
    };
  }
  return {
    tone: "ok",
    label: "Vstupy jsou v limitu orientačního modelu",
    detail: "Řádky mají platný výpočet PHmax (stejný stav jako v docku modulu).",
  };
}


function derivePvDashboardVerdict(pv: ReturnType<typeof summarizePvFromLs>): DashboardVerdict | null {
  if (!pv.present) return null;
  if (pv.incomplete) {
    return {
      tone: "warning",
      label: "Na hraně: neúplný součet",
      detail: "Některá pracoviště nemají vyplněné povinné údaje – součet PHmax může být neúplný.",
    };
  }
  return {
    tone: "ok",
    label: "Vstupy jsou v limitu orientačního modelu",
    detail: "Pracoviště mají platný výpočet PHmax (stejný stav jako v docku modulu).",
  };
}

function deriveNv75DashboardVerdict(nv: ReturnType<typeof readNv75State>): DashboardVerdict | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_NV75);
  return nv75DashboardVerdictFromLs(raw, nv.bankTotal, nv.rule);
}

function buildDashboardRows(): DashboardRow[] {
  const pv = summarizePvFromLs();
  const sd = readSdBrief();
  const zsTotals = readZsTotals();
  const zsNamed = readNamedSnapshotsFromLs().length;
  const ss = summarizeSsFromLs();
  const nv = readNv75State();

  const rows: DashboardRow[] = [
    {
      id: "pv",
      title: PRODUCT_CALCULATOR_TITLES.pv,
      hasData: pv.present,
      status: dashboardModuleFillLabel(
        pv.present,
        derivePvDashboardVerdict(pv),
        pv.phmax != null ? String(pv.phmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: pv.phmax != null ? String(pv.phmax) : "–",
      },
      secondaryKpis: [
        { label: "PHAmax", value: pv.pha != null ? String(pv.pha) : "–" },
        { label: "Pracoviště", value: String(pv.rowCount) },
      ],
      detail: pv.present
        ? `Pracoviště: ${pv.rowCount}${pv.incomplete ? " · součet PHmax může být neúplný" : ""} · PHmax: ${
            pv.phmax ?? "–"
          } · PHAmax: ${pv.pha ?? "–"}`
        : "Po prvním uložení v PV se zde objeví orientační PHmax.",
      namedBackups: namedCount(LS_PV_NAMED),
      lastVisit: formatDashboardProductVisit("pv"),
      verdict: derivePvDashboardVerdict(pv),
    },
    {
      id: "sd",
      title: PRODUCT_CALCULATOR_TITLES.sd,
      hasData: Boolean(sd),
      status: dashboardModuleFillLabel(Boolean(sd), sd ? deriveSdDashboardVerdict(sd) : null),
      primaryKpi: {
        label: sd?.phmax != null ? "PHmax" : "Oddělení",
        value: sd?.phmax != null ? String(sd.phmax) : sd ? String(sd.departments) : "–",
      },
      secondaryKpis: [
        { label: "Účastníci", value: sd ? String(sd.pupils) : "–" },
        { label: sd?.phmax != null ? "Oddělení" : "Režim", value: sd ? (sd.phmax != null ? String(sd.departments) : sd.inputMode === "detail" ? "detailní" : "souhrnný") : "–" },
        ...(sd?.pha != null ? [{ label: "PHAmax", value: String(sd.pha) }] : []),
      ],
      detail: sd
        ? sd.phmax != null
          ? `PHmax ${sd.phmax}${sd.pha != null ? `, PHAmax ${sd.pha}` : ""} · účastníci ${sd.pupils}, oddělení ${sd.departments}, režim ${sd.inputMode === "detail" ? "detailní" : "souhrnný"}.`
          : `Účastníci: ${sd.pupils}, oddělení: ${sd.departments}, režim: ${sd.inputMode === "detail" ? "detailní" : "souhrnný"} · PHmax nelze dopočítat – doplňte vstupy v modulu ŠD.`
        : "Po uložení stavu v ŠD se zde zobrazí základ vstupů.",
      namedBackups: namedCount(LS_SD_NAMED),
      lastVisit: formatDashboardProductVisit("sd"),
      verdict: sd ? deriveSdDashboardVerdict(sd) : null,
    },
    {
      id: "zs",
      title: PRODUCT_CALCULATOR_TITLES.zs,
      hasData: zsSnapshotHasAnyInput() || zsTotals != null,
      status: dashboardModuleFillLabel(
        zsSnapshotHasAnyInput() || zsTotals != null,
        zsTotals != null
          ? {
              tone: "ok",
              label: "Souhrn z autosave",
              detail: "",
            }
          : zsSnapshotHasAnyInput()
            ? {
                tone: "warning",
                label: "Stav uložen",
                detail: "",
              }
            : null,
        zsTotals != null ? String(zsTotals.totalPhmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: zsTotals != null ? String(zsTotals.totalPhmax) : "–",
      },
      secondaryKpis: [
        { label: "PHAmax", value: zsTotals != null ? String(zsTotals.totalPha) : "–" },
        { label: "PHPmax", value: zsTotals != null ? String(zsTotals.totalPhp) : "–" },
      ],
      detail: zsTotals
        ? `Součty z autosave (záložka ${String(zsTotals.tab ?? "–")}): PHmax ${zsTotals.totalPhmax}, PHAmax ${zsTotals.totalPha}, PHPmax ${zsTotals.totalPhp}.`
        : zsSnapshotHasAnyInput()
          ? "Stav ZŠ je uložen; otevřete ZŠ – po uložení autosave se doplní řádek _phmaxAuditTotals pro souhrnné PHmax/PHAmax/PHPmax."
          : "Zatím nebyl uložen žádný stav ZŠ v tomto prohlížeči.",
      namedBackups: zsNamed,
      lastVisit: formatDashboardProductVisit("zs"),
      verdict:
        zsTotals != null
          ? {
              tone: "ok",
              label: "Souhrn z autosave",
              detail: `PHmax ${zsTotals.totalPhmax}, PHAmax ${zsTotals.totalPha}, PHPmax ${zsTotals.totalPhp} (záložka ${String(zsTotals.tab ?? "phmax")}).`,
            }
          : zsSnapshotHasAnyInput()
            ? {
                tone: "warning",
                label: "Stav uložen",
                detail: "Otevřete ZŠ – po výpočtu se v docku zobrazí aktuální verdikt.",
              }
            : null,
    },
    {
      id: "ss",
      title: PRODUCT_CALCULATOR_TITLES.ss,
      hasData: ss.present,
      status: dashboardModuleFillLabel(
        ss.present,
        deriveSsDashboardVerdict(),
        ss.phmax != null ? String(ss.phmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: ss.phmax != null ? String(ss.phmax) : "–",
      },
      secondaryKpis: [
        {
          label: "PHAmax PrŠ",
          value: ss.phamaxPractical != null ? String(ss.phamaxPractical) : "–",
        },
        { label: "Řádky", value: String(ss.rowCount) },
      ],
      detail: ss.present
        ? `Řádky evidence: ${ss.rowCount}, součet PHmax (platné řádky): ${ss.phmax}${ss.phamaxPractical != null ? `, PHAmax (PrŠ, denní): ${ss.phamaxPractical}` : ""}`
        : "Po vyplnění SŠ se zde zobrazí orientační PHmax ze stejné logiky jako ve formuláři.",
      namedBackups: 0,
      lastVisit: formatDashboardProductVisit("ss"),
      verdict: deriveSsDashboardVerdict(),
    },
    {
      id: "nv75",
      title: PRODUCT_CALCULATOR_TITLES.nv75,
      hasData: nv.rowCount > 0 || nv.bankTotal != null,
      status: dashboardModuleFillLabel(nv.rowCount > 0 || nv.bankTotal != null, deriveNv75DashboardVerdict(nv)),
      primaryKpi: {
        label: "Banka h/týd",
        value: nv.bankTotal != null ? String(nv.bankTotal) : "–",
      },
      secondaryKpis: [
        { label: "Řádky", value: String(nv.rowCount) },
        { label: "§4b", value: nv.rule ?? "–" },
      ],
      detail:
        nv.rowCount > 0
          ? `Řádky: ${nv.rowCount}${nv.rule ? ` · §4b pravidlo: ${nv.rule}` : ""}, banka celkem: ${
              nv.bankTotal ?? "–"
            }${nv.practicalFilled ? " · §4c kontext doplněn" : ""} · NV75 není součástí orientačního PHmax na dashboardu (jiná jednotka – hodiny odpočtů).`
          : "Po uložení vstupů v NV75 se zobrazí banka odpočtů a pravidlo §4b. Do cross-součtu PHmax se nezapočítává.",
      namedBackups: namedCount(LS_NV75_NAMED),
      lastVisit: formatDashboardProductVisit("nv75"),
      verdict: deriveNv75DashboardVerdict(nv),
    },
  ];
  return rows;
}

export function PhmaxDashboardPage({ productView, setProductView }: PhmaxDashboardPageProps) {
  const [refreshAt, setRefreshAt] = useState(() => new Date());
  const [notice, publishNotice] = useUiNotice();
  const [scenarioLabel, setScenarioLabel] = useState(() => readSchoolScenarioLabel());
  const [isEndpoint, setIsEndpoint] = useState(() => readPhmaxIsEndpoint());
  const [exportDisclaimerConfirmed, setExportDisclaimerConfirmed] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTemplateBusy, setImportTemplateBusy] = useState(false);
  const importTriggerRef = React.useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    setRefreshAt(new Date());
    setScenarioLabel(readSchoolScenarioLabel());
    setIsEndpoint(readPhmaxIsEndpoint());
    publishNotice("Souhrnný přehled byl znovu načten z prohlížeče.");
  }, [publishNotice]);

  useEffect(() => {
    setScenarioLabel(readSchoolScenarioLabel());
    setIsEndpoint(readPhmaxIsEndpoint());
  }, [refreshAt]);

  const clearLocalDataNow = useCallback(() => {
    const removed = clearAllPhmaxLocalStorage();
    setRefreshAt(new Date());
    publishNotice(
      removed > 0
        ? `Smazáno ${removed} uložených položek z prohlížeče.`
        : "V prohlížeči nebyla nalezena uložená data kalkulaček.",
    );
  }, [publishNotice]);

  const handleClearLocalData = useCallback(() => {
    const confirmed = window.confirm(
      "Opravdu smazat všechna uložená data kalkulaček v tomto prohlížeči? Tuto akci nelze vrátit.",
    );
    if (!confirmed) return;
    clearLocalDataNow();
  }, [clearLocalDataNow]);

  const afterDashboardJsonExport = useCallback(
    (notice: string) => {
      publishNotice(notice);
      offerClearBrowserDataAfterDashboardExport(clearLocalDataNow);
    },
    [clearLocalDataNow, publishNotice],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshAt(new Date());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const rows = sortByDashboardAttention(buildDashboardRows());
  const modulesWithData = rows.filter((r) => r.hasData).length;
  const lastActive = readLastActiveProduct();
  const continueRow = lastActive ? rows.find((row) => row.id === lastActive) ?? null : null;
  const showNewUserGuide = !lastActive;
  const zsNamedBackupCount = rows.find((r) => r.id === "zs")?.namedBackups ?? 0;

  const scrollToSchool15Min = useCallback(() => {
    document.getElementById("dash-school-15min")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openImportDialog = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleDownloadImportTemplate = useCallback(async () => {
    if (importTemplateBusy) return;
    setImportTemplateBusy(true);
    try {
      await downloadPhmaxImportTemplateXlsx();
      publishNotice("Šablona phmax-import-skola-v2.xlsx byla stažena do složky Stažené soubory.");
    } catch (e) {
      publishNotice(e instanceof Error ? e.message : "Stažení šablony se nepodařilo.");
    } finally {
      setImportTemplateBusy(false);
    }
  }, [importTemplateBusy, publishNotice]);

  const handleImportApplied = useCallback(
    (payload: ReturnType<typeof buildPhmaxIsHandoffPayload>) => {
      const label = payload.schoolScenario.scenarioLabel?.trim();
      if (label) {
        localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, label);
        setScenarioLabel(label);
      }
      setRefreshAt(new Date());
      dispatchPhmaxImportApplied();
      publishNotice(
        `Import uložen (PV, ZŠ${payload.schoolScenario.moduleSnapshots.sd ? ", ŠD" : ""}${payload.schoolScenario.moduleSnapshots.ss ? ", SŠ" : ""}). Součet PHmax: ${payload.schoolScenario.summary.totalPhmax ?? "–"} h/týden.`,
      );
    },
    [publishNotice],
  );

  const openModuleWithExampleHint = useCallback(
    (id: Exclude<ProductView, "dash">) => {
      requestFocusExampleSelect();
      setProductView(id);
    },
    [setProductView],
  );

  const openModuleForOwnData = useCallback(
    (id: Exclude<ProductView, "dash">) => {
      requestFocusModuleInputs();
      setProductView(id);
    },
    [setProductView],
  );

  const openDashboardModule = useCallback(
    (row: DashboardRow) => {
      if (!row.hasData) {
        openModuleWithExampleHint(row.id);
        return;
      }
      if (dashboardRowSupportsInputFocus(row.id)) {
        const hint = getDashboardFocusHint(row.id, {
          preferIssue: dashboardVerdictNeedsAttention(row.verdict),
        });
        if (hint) requestFocusModuleInputs(hint);
      }
      setProductView(row.id);
    },
    [openModuleWithExampleHint, setProductView],
  );

  const openDashboardKpiModule = useCallback(
    (row: DashboardRow) => {
      openDashboardModule(row);
    },
    [openDashboardModule],
  );

  const attentionRows = sortByDashboardAttention(
    rows.filter(
      (row) =>
        dashboardRowSupportsInputFocus(row.id) && row.hasData && dashboardVerdictNeedsAttention(row.verdict),
    ),
  );

  const crossPhmax = buildCrossPhmaxSummary(rows, DASH_CALC_LABEL);

  const attentionModuleLabels = attentionRows.map((r) => DASH_CALC_LABEL[r.id]);
  const attentionIds = new Set(attentionRows.map((r) => r.id));
  const crossPhmaxMismatches = crossPhmaxAttentionMismatches(crossPhmax, attentionIds);

  const auditCoherenceWarnings = useMemo(() => {
    const scenario = buildSchoolScenarioExportPayload(crossPhmax, attentionModuleLabels, scenarioLabel);
    return crossPhmaxAuditCoherenceWarnings(crossPhmax, scenario.moduleSnapshots);
  }, [crossPhmax, attentionModuleLabels, scenarioLabel]);

  const exportChecklist = useMemo(
    () =>
      buildDashboardExportChecklist({
        crossPhmax,
        attentionModuleLabels,
        auditCoherenceWarnings,
        exportDisclaimerConfirmed,
        appVersion: APP_VERSION,
        scenarioLabel: scenarioLabel.trim() || "Celá škola (autosave)",
      }),
    [
      crossPhmax,
      attentionModuleLabels,
      auditCoherenceWarnings,
      exportDisclaimerConfirmed,
      scenarioLabel,
    ],
  );

  const printSchoolReview = useCallback(() => {
    const html = buildSchoolReviewPrintHtml({
      generatedAt: new Date().toLocaleString("cs-CZ"),
      appVersion: APP_VERSION,
      scenarioLabel: scenarioLabel.trim() || "Celá škola (autosave)",
      crossPhmax,
      modules: rows.map((row) => ({
        label: DASH_CALC_LABEL[row.id],
        status: row.status,
        phmax: row.primaryKpi.value,
      })),
      coherenceWarnings: auditCoherenceWarnings,
      disclaimer:
        "Orientační výpočet z autosave v tomto prohlížeči – neoficiální podklad před jednáním. NV75 a PV § 1d v cross-součtu nejsou.",
    });
    openSchoolReviewPrintWindow(html);
    publishNotice("Otevřeno okno pro tisk kontroly před jednáním.");
  }, [crossPhmax, rows, scenarioLabel, auditCoherenceWarnings, publishNotice]);

  const persistScenarioLabel = useCallback((label: string) => {
    const trimmed = label.trim();
    if (typeof localStorage !== "undefined") {
      if (trimmed) localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, trimmed);
      else localStorage.removeItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    }
    setScenarioLabel(trimmed);
  }, []);

  const downloadCrossPhmaxJson = useCallback(() => {
    const payload = {
      ...buildCrossPhmaxExportPayload(crossPhmax, attentionModuleLabels),
      coherenceWarnings: auditCoherenceWarnings,
    };
    downloadTextFile(
      exportFilenameStamped("phmax-cross-phmax", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport("Stažen orientační JSON součtu PHmax.");
  }, [crossPhmax, attentionModuleLabels, auditCoherenceWarnings, afterDashboardJsonExport]);

  const downloadSchoolScenarioJson = useCallback(() => {
    const payload = buildSchoolScenarioExportPayload(
      crossPhmax,
      attentionModuleLabels,
      scenarioLabel,
      auditCoherenceWarnings,
    );
    downloadTextFile(
      exportFilenameStamped("phmax-skola-scenar", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport("Stažen scénář celá škola (JSON + autosave modulů).");
  }, [crossPhmax, attentionModuleLabels, scenarioLabel, auditCoherenceWarnings, afterDashboardJsonExport]);

  const downloadIsHandoffJson = useCallback(() => {
    const scenario = buildSchoolScenarioExportPayload(
      crossPhmax,
      attentionModuleLabels,
      scenarioLabel,
      auditCoherenceWarnings,
    );
    const payload = buildPhmaxIsHandoffPayload(scenario);
    downloadTextFile(
      exportFilenameStamped("phmax-is-handoff", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport("Stažen handoff JSON pro IS školy – viz docs/phmax-is-integration.md.");
  }, [crossPhmax, attentionModuleLabels, scenarioLabel, auditCoherenceWarnings, afterDashboardJsonExport]);

  const sendIsHandoff = useCallback(async () => {
    const scenario = buildSchoolScenarioExportPayload(
      crossPhmax,
      attentionModuleLabels,
      scenarioLabel,
      auditCoherenceWarnings,
    );
    const payload = buildPhmaxIsHandoffPayload(scenario);
    const result = await postPhmaxIsHandoff(isEndpoint, payload);
    publishNotice(result.ok ? `Handoff odeslán (HTTP ${result.status}).` : result.message);
  }, [crossPhmax, attentionModuleLabels, scenarioLabel, auditCoherenceWarnings, isEndpoint, publishNotice]);

  return (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <header className="hero hero--feature">
          <div className="hero__orb hero__orb--one" />
          <div className="hero__orb hero__orb--two" />
          <div className="hero__pills-row">
            <ProductViewPills productView={productView} setProductView={setProductView} />
            <button type="button" className="btn ghost" onClick={refresh}>
              Obnovit z prohlížeče
            </button>
            <button type="button" className="btn ghost" onClick={handleClearLocalData}>
              Vymazat lokální data
            </button>
          </div>
          <div className="hero__grid" style={{ marginTop: 8 }}>
            <div>
              <h1 className="hero__title">{PRODUCT_CALCULATOR_TITLES.dash}</h1>
              <p className="hero__text">{CALCULATOR_LIMITS_NOTE}</p>
              <p className="hero__text" style={{ marginTop: 8 }}>
                Souhrnný přehled (Σ) čte uložený stav z prohlížeče u každého modulu zvlášť. Orientační součet PHmax napříč PV, ŠD, ZŠ a SŠ je níže –{" "}
                <strong>NV75</strong> (banka odpočtů hodin, ne PHmax) a krácení <strong>PV § 1d</strong> v cross-součtu nejsou.
                Pro první orientaci můžete v modulu použít combobox <strong>Příkladové výpočty</strong>, nebo rovnou
                vyplnit vlastní údaje do formuláře – pole nejsou uzamčená, souhrn se přepočítá podle vašich vstupů.
              </p>
              <p className="hero__text hero__text--url" style={{ marginTop: 8 }}>
                URL:{" "}
                <code className="hero__url-code">
                  {typeof window !== "undefined" ? window.location.origin : ""}?view=dash
                </code>
              </p>
            </div>
          </div>
        </header>

        <main id={PHMAX_DASHBOARD_MAIN_ID} tabIndex={-1}>
        <section className="card section-card dash-role-cards" aria-labelledby="dash-role-heading">
          <h2 id="dash-role-heading" className="section-title">
            Kdo jste? Rychlý vstup
          </h2>
          <div className="dash-role-cards__grid">
            <article className="dash-role-cards__tile">
              <h3 className="dash-role-cards__tile-title">Ředitel / zřizovatel</h3>
              <p className="muted-text">
                Souhrn školy, kontrolní list exportu a tisk před jednáním. Handout PDF v dokumentaci projektu.
              </p>
              <div className="dash-role-cards__actions">
                <button type="button" className="btn primary" onClick={scrollToSchool15Min}>
                  Celá škola za 15 min
                </button>
                <button type="button" className="btn ghost" onClick={printSchoolReview}>
                  Kontrola před jednáním (tisk)
                </button>
              </div>
            </article>
            <article className="dash-role-cards__tile">
              <h3 className="dash-role-cards__tile-title">Metodik</h3>
              <p className="muted-text">Modul po modulu – ukázka volitelná, vlastní data vždy editovatelná.</p>
              <div className="dash-role-cards__actions">
                <button type="button" className="btn primary" onClick={() => openModuleForOwnData("zs")}>
                  Otevřít ZŠ – vlastní data
                </button>
                {zsNamedBackupCount > 0 ? (
                  <button
                    type="button"
                    className="btn ghost"
                    data-testid="dash-open-zs-compare"
                    onClick={() => setProductView("zs")}
                  >
                    Porovnat pojmenované zálohy ({zsNamedBackupCount}) v ZŠ
                  </button>
                ) : null}
              </div>
            </article>
            <article className="dash-role-cards__tile">
              <h3 className="dash-role-cards__tile-title">IT / správce</h3>
              <p className="muted-text">
                Scénář JSON, handoff a varování koherence – viz{" "}
                <code className="methodology-strip__code">docs/phmax-is-integration.md</code>.
              </p>
              <div className="dash-role-cards__actions">
                <button type="button" className="btn primary" onClick={scrollToSchool15Min}>
                  Export a scénář školy
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  data-testid="dash-import-open"
                  title={DASH_IMPORT_HINT}
                  onClick={openImportDialog}
                >
                  {DASH_IMPORT_LABEL}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section
          id="dash-school-import"
          className="card section-card dash-school-import"
          aria-labelledby="dash-import-heading"
        >
          <h2 id="dash-import-heading" className="section-title">
            Import ze školy
          </h2>
          <p className="muted-text">{DASH_IMPORT_HINT}</p>
          <ol className="dash-school-import__steps muted-text">
            {DASH_IMPORT_STEPS.map((step, i) => (
              <li key={step}>
                <strong>{i + 1}.</strong> {step}
              </li>
            ))}
          </ol>
          <div className="dash-card__actions dash-school-import__actions">
            <button
              type="button"
              className="btn primary"
              data-testid="dash-import-download-template"
              disabled={importTemplateBusy}
              aria-busy={importTemplateBusy}
              title="Krok 1 – prázdná šablona s listy Meta, PV, ZŠ a volitelně ŠD, SŠ"
              onClick={() => void handleDownloadImportTemplate()}
            >
              {importTemplateBusy ? "Připravuji šablonu…" : DASH_IMPORT_TEMPLATE_LABEL}
            </button>
            <button
              ref={importTriggerRef}
              type="button"
              className="btn ghost"
              data-testid="dash-import-open-main"
              title="Krok 3 – nahrát vyplněný Excel nebo CSV"
              onClick={openImportDialog}
            >
              {DASH_IMPORT_UPLOAD_LABEL}
            </button>
          </div>
        </section>

        <DashboardSchoolImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onApplied={handleImportApplied}
          triggerRef={importTriggerRef}
        />

        {continueRow ? (
          <section className="card card--accent section-card dash-continue-card" aria-labelledby="dash-continue-heading">
            <h2 id="dash-continue-heading" className="section-title">
              Pokračovat v {DASH_CALC_LABEL[continueRow.id]}
            </h2>
            <p className="muted-text" style={{ marginBottom: 12 }}>
              Naposledy jste pracovali v modulu <strong>{continueRow.title}</strong>. Níže je rychlý náhled z uloženého stavu v tomto prohlížeči.
            </p>
            <p
              className={`dash-continue-card__fill-status ${dashboardFillStatusClass(continueRow.hasData, continueRow.verdict)}`}
            >
              <FillStatusBadge
                kind={dashboardRowFillStatusKind(continueRow.hasData, continueRow.verdict?.tone)}
                label={dashboardModuleFillLabel(continueRow.hasData, continueRow.verdict)}
              />
            </p>
            {continueRow.verdict ? (
              <div
                className={`dash-continue-card__verdict dash-continue-card__verdict--${continueRow.verdict.tone}`}
                role="status"
              >
                <strong>{continueRow.verdict.label}</strong>
                <p className="muted-text" style={{ margin: 0 }}>
                  {continueRow.verdict.detail}
                </p>
              </div>
            ) : null}
            <div className="dash-continue-card__kpi" aria-label="Hlavní metrika modulu">
              <span className="dash-continue-card__kpi-label">{continueRow.primaryKpi.label}</span>
              <strong className="dash-continue-card__kpi-value">{continueRow.primaryKpi.value}</strong>
            </div>
            <div className="dash-card__kpis" style={{ marginTop: 10 }} aria-label="Doplňkové metriky">
              {continueRow.secondaryKpis.map((kpi) => (
                <span key={kpi.label} className="dash-card__kpi-pill">
                  {kpi.label}: <strong>{kpi.value}</strong>
                </span>
              ))}
            </div>
            <p className="dash-card__meta">{continueRow.status}</p>
            <div className="dash-card__actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => openDashboardModule(continueRow)}
              >
                {continueRow.hasData ? `Pokračovat v ${DASH_CALC_LABEL[continueRow.id]}` : `Otevřít ${DASH_CALC_LABEL[continueRow.id]} a ukázku`}
              </button>
              {!continueRow.hasData ? (
                <button type="button" className="btn ghost" onClick={() => openModuleWithExampleHint(continueRow.id)}>
                  Začít u ukázkového příkladu
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {crossPhmax.modulesWithPhmax >= 2 ? (
          <section
            id="dash-school-15min"
            className="card section-card dash-cross-phmax"
            aria-labelledby="dash-cross-phmax-heading"
          >
            <h2 id="dash-cross-phmax-heading" className="section-title">
              Orientační součet PHmax (PV + ŠD + ZŠ + SŠ)
            </h2>
            <p className="muted-text" style={{ marginTop: 0 }}>
              Sloučení autosave z modulů v tomto prohlížeči – neoficiální souhrn pro kontrolu. NV75 (banka odpočtů) a krácení PV § 1d v cross-součtu nejsou.
            </p>
            <p className="dash-cross-phmax__total" style={{ marginTop: 12, fontSize: "1.35rem" }}>
              Celkem PHmax: <strong>{crossPhmax.totalPhmax != null ? crossPhmax.totalPhmax : "–"}</strong> h/týden
              {crossPhmax.hasIncomplete ? (
                <span className="muted-text" style={{ display: "block", fontSize: "0.88rem", marginTop: 6 }}>
                  Některé moduly mají neúplný výpočet – součet může být podhodnocený.
                </span>
              ) : null}
              {crossPhmaxMismatches.length > 0 ? (
                <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.88rem" }}>
                  <strong>Upozornění:</strong> modul(y) {crossPhmaxMismatches.join(", ")} jsou zároveň ve Vyžaduje
                  pozornost – opravte vstupy před použitím součtu.
                </p>
              ) : null}
              {auditCoherenceWarnings.length > 0 ? (
                <ul className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.88rem", paddingLeft: "1.25rem" }}>
                  {auditCoherenceWarnings.map((w) => {
                    const moduleId = coherenceWarningModuleId(w);
                    return (
                      <li key={w}>
                        {w}
                        {moduleId ? (
                          <>
                            {" "}
                            <button
                              type="button"
                              className="btn ghost"
                              style={{ display: "inline", padding: "0 4px", fontSize: "inherit", verticalAlign: "baseline" }}
                              onClick={() => openModuleForOwnData(moduleId)}
                            >
                              Otevřít {DASH_CALC_LABEL[moduleId]}
                            </button>
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </p>
            <label className="field" style={{ marginTop: 12, maxWidth: 420 }}>
              <span className="field__label">Název scénáře školy (JSON export)</span>
              <input
                type="text"
                className="input"
                value={scenarioLabel}
                onChange={(e) => persistScenarioLabel(e.target.value)}
                placeholder="Celá škola (autosave)"
              />
            </label>
            <label className="field" style={{ marginTop: 8, maxWidth: 520 }}>
              <span className="field__label">URL endpoint IS (volitelné POST)</span>
              <input
                type="url"
                className="input"
                value={isEndpoint}
                onChange={(e) => {
                  setIsEndpoint(e.target.value);
                  writePhmaxIsEndpoint(e.target.value);
                }}
                placeholder="https://…/phmax-handoff"
              />
            </label>
            <ul className="dash-cross-phmax__list muted-text" style={{ marginTop: 10, paddingLeft: "1.25rem" }}>
              {crossPhmax.slices.map((slice) => (
                <li key={slice.id}>
                  {formatCrossPhmaxSliceLabel(slice)}
                  {slice.incomplete ? " (neúplný)" : ""}
                  {attentionIds.has(slice.id) ? " (vyžaduje pozornost)" : ""}
                </li>
              ))}
            </ul>
            <details className="dash-export-checklist" style={{ marginTop: 12 }} open>
              <summary className="section-title" style={{ fontSize: "1rem", cursor: "pointer" }}>
                Kontrolní list před exportem
              </summary>
              <ul className="muted-text" style={{ marginTop: 8, paddingLeft: "1.25rem" }}>
                {exportChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <label className="field" style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  data-testid="dash-export-confirm"
                  checked={exportDisclaimerConfirmed}
                  onChange={(e) => setExportDisclaimerConfirmed(e.target.checked)}
                />
                <span className="muted-text">
                  Potvrzuji, že export je orientační a neoficiální – použiji ho jen pro interní kontrolu školy.
                </span>
              </label>
            </details>
            {exportDisclaimerConfirmed ? (
              <div className="dash-export-wizard muted-text" data-testid="dash-export-wizard">
                <p className="dash-export-wizard__step dash-export-wizard__step--active">
                  <strong>Krok 1:</strong> Stáhněte JSON (součet, scénář nebo handoff) – orientační, neoficiální.
                </p>
                <p className="dash-export-wizard__step">
                  <strong>Krok 2 – IT:</strong> předejte soubor, verzi aplikace ({APP_VERSION}), název scénáře a pole{" "}
                  <code className="methodology-strip__code">coherenceWarnings</code> (pokud není prázdné). Dokumentace:{" "}
                  <code className="methodology-strip__code">docs/phmax-is-integration.md</code>.
                </p>
                <p className="dash-export-wizard__step">
                  <strong>Krok 3:</strong> Na sdíleném PC po exportu zvažte smazání lokálních dat (nabídne aplikace).
                </p>
              </div>
            ) : null}
            <div className="dash-card__actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn ghost" onClick={printSchoolReview}>
                Kontrola před jednáním (tisk)
              </button>
              <button
                type="button"
                className="btn ghost"
                data-testid="dash-import-open-export"
                title={DASH_IMPORT_HINT}
                onClick={openImportDialog}
              >
                {DASH_IMPORT_LABEL}
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!exportDisclaimerConfirmed}
                onClick={downloadCrossPhmaxJson}
              >
                Stáhnout JSON součtu PHmax
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!exportDisclaimerConfirmed}
                onClick={downloadSchoolScenarioJson}
              >
                Scénář celá škola (JSON)
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!exportDisclaimerConfirmed}
                onClick={downloadIsHandoffJson}
              >
                Export pro IS školy (JSON)
              </button>
              {isEndpoint.trim() ? (
                <button
                  type="button"
                  className="btn ghost"
                  disabled={!exportDisclaimerConfirmed}
                  onClick={() => void sendIsHandoff()}
                >
                  Odeslat handoff na IS (POST)
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {attentionRows.length > 0 ? (
          <section className="card section-card dash-attention-card" aria-labelledby="dash-attention-heading">
            <h2 id="dash-attention-heading" className="section-title">
              Vyžaduje pozornost
            </h2>
            <p className="muted-text" style={{ marginBottom: 12 }}>
              Moduly s varováním nebo chybou vstupů – po otevření se posunete k první problematické sekci.
            </p>
            <div className="dash-attention-card__list">
              {attentionRows.map((row) => (
                <article
                  key={row.id}
                  className={`dash-attention-card__item dash-attention-card__item--${row.verdict?.tone ?? "warning"}`}
                >
                  <div>
                    <strong>{DASH_CALC_LABEL[row.id]}</strong>
                    <span className="muted-text"> – {row.verdict?.label}</span>
                    {row.verdict?.detail ? (
                      <p className="muted-text" style={{ margin: "4px 0 0" }}>
                        {row.verdict.detail}
                      </p>
                    ) : null}
                  </div>
                  <button type="button" className="btn primary" onClick={() => openDashboardModule(row)}>
                    Otevřít a přejít k chybě
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {zsNamedBackupCount > 0 ? (
          <section className="card section-card dash-compare-hint" aria-labelledby="dash-compare-heading">
            <h2 id="dash-compare-heading" className="section-title">
              Porovnání scénářů (ZŠ)
            </h2>
            <p className="muted-text" style={{ marginBottom: 10 }}>
              V prohlížeči máte <strong>{zsNamedBackupCount}</strong> pojmenovaných záloh ZŠ. V modulu ZŠ otevřete panel{" "}
              <strong>Akce</strong> → porovnání se zálohou nebo export audit JSON.
            </p>
            <button
              type="button"
              className="btn primary"
              data-testid="dash-compare-zs-primary"
              onClick={() => setProductView("zs")}
            >
              Otevřít ZŠ – pojmenované zálohy
            </button>
          </section>
        ) : null}

        {showNewUserGuide ? (
          <section className="card card--accent section-card dash-new-user-card" aria-labelledby="dash-new-user-heading">
            <h2 id="dash-new-user-heading" className="section-title">
              Nejste si jisti? Začněte u jedné kalkulačky
            </h2>
            <p className="muted-text" style={{ marginBottom: 12 }}>
              Po otevření modulu vás aplikace může posunout k poli <strong>Příkladové výpočty</strong> – ukázka je
              volitelná. Můžete rovnou vyplnit vlastní školu; načtenou ukázku lze kdykoli upravit nebo vymazat v Akcích.
            </p>
            <ol className="dash-new-user-card__steps muted-text">
              <li>Vyberte modul (PV, ŠD, ZŠ, SŠ nebo NV75).</li>
              <li>Vyplňte vlastní data nebo volitelnou ukázku.</li>
              <li>
                <strong>Celá škola za 15 min</strong> – souhrn Σ a export JSON pro IT (
                <button type="button" className="btn ghost" style={{ display: "inline", padding: "0 4px" }} onClick={scrollToSchool15Min}>
                  přejít na souhrn
                </button>
                ).
              </li>
            </ol>
            <div className="dash-new-user-card__grid">
              {DASH_START_MODULES.map((item) => (
                <article key={item.id} className="dash-new-user-card__tile">
                  <h3 className="dash-new-user-card__tile-title">{PRODUCT_CALCULATOR_TITLES[item.id]}</h3>
                  <p className="muted-text dash-new-user-card__tile-lead">{item.lead}</p>
                  <div className="dash-new-user-card__actions" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button type="button" className="btn primary" onClick={() => openModuleWithExampleHint(item.id)}>
                      Otevřít {DASH_CALC_LABEL[item.id]} ({DASH_OPEN_MODULE_EXAMPLE_BUTTON_SUFFIX})
                    </button>
                    <button type="button" className="btn ghost" onClick={() => openModuleForOwnData(item.id)}>
                      Otevřít {DASH_CALC_LABEL[item.id]} – {DASH_OPEN_MODULE_OWN_DATA_BUTTON_SUFFIX}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card card--accent section-card section-card--guide" aria-labelledby="dash-user-first-heading">
          <h2 id="dash-user-first-heading" className="section-title">
            Začněte uživatelsky nejdříve tady
          </h2>
            <p className="muted-text" style={{ marginBottom: 12 }}>
              V každé kalkulačce můžete zvolit <strong>Příkladové výpočty</strong> pro orientaci, nebo rovnou vyplnit
              vlastní údaje – formulář není jen pro čtení. Tlačítko <strong>Nápověda</strong> v hero liště průvodce znovu zobrazí; u ZŠ může navíc pomoci rozcestník v expertním režimu. V tabulkách PHmax používejte rozbalení{" "}
            <strong>„Proč tyto vstupy ovlivní PHmax?“</strong> (viz PV, ŠD, ZŠ, NV75) – u <strong>SŠ</strong> doplňuje stejný smysl tlačítko „Proč?“ u každého řádku přehledu.
          </p>
          <p className="muted-text" style={{ marginBottom: 12 }}>
            Rychlé otevření kalkulačky (stav zůstává v paměti tohoto prohlížeče):
          </p>
          <div className="toolbar" style={{ flexWrap: "wrap", gap: 8 }}>
            {DASH_QUICK_IDS.map((id) => (
              <button key={id} type="button" className="btn ghost" title={PRODUCT_CALCULATOR_TITLES[id]} onClick={() => setProductView(id)}>
                Otevřít {DASH_CALC_LABEL[id]}
              </button>
            ))}
          </div>
        </section>

        <section className="card muted section-card">
          <h2 className="section-title">Přehled podle uloženého stavu v prohlížeči</h2>
          <p className="muted-text" style={{ marginBottom: 8 }}>
            Slouží jen k orientaci v tomto prohlížeči. Metriky počítám stejnou logikou jako v příslušné kartě (kde je k tomu dostupná data).
          </p>
          <p className="dash-overview-summary muted-text">
            Moduly s uloženými daty: <strong>{modulesWithData}</strong> z {rows.length} · poslední návštěva modulu je u každé karty níže.
            {modulesWithData === 0 ? (
              <>
                {" "}
                Zatím nic neuloženo v tomto prohlížeči – u každého modulu můžete začít tlačítkem <strong>Začít u ukázky</strong>.
              </>
            ) : null}
          </p>
          <div className="dash-kpi-strip" aria-label="Souhrnné KPI modulů">
            {rows.map((row) => (
              <article
                key={row.id}
                className={["dash-kpi-tile", "dash-kpi-tile--clickable", row.hasData ? "" : "dash-kpi-tile--empty"]
                  .filter(Boolean)
                  .join(" ")}
                role="button"
                tabIndex={0}
                aria-label={`Otevřít ${DASH_CALC_LABEL[row.id]}${row.hasData ? "" : " – začít u ukázky"}`}
                onClick={() => openDashboardKpiModule(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDashboardKpiModule(row);
                  }
                }}
              >
                <span className="dash-kpi-tile__module">{DASH_CALC_LABEL[row.id]}</span>
                <FillStatusBadge
                  kind={dashboardRowFillStatusKind(row.hasData, row.verdict?.tone)}
                  label={row.status}
                  className="dash-kpi-tile__fill-badge"
                />
                <strong className="dash-kpi-tile__value">{row.primaryKpi.value}</strong>
                <span className="dash-kpi-tile__hint">{row.primaryKpi.label}</span>
                <span className={`dash-kpi-tile__status ${dashboardKpiStatusClass(row)}`}>{row.status}</span>
                {row.hasData && row.verdict?.detail ? (
                  <span className="dash-kpi-tile__detail">{row.verdict.detail}</span>
                ) : null}
              </article>
            ))}
          </div>
          <div className="dash-cards">
            {rows.map((row) => (
              <article key={row.id} className="dash-card">
                <h3 className="dash-card__title">{row.title}</h3>
                <FillStatusBadge
                  kind={dashboardRowFillStatusKind(row.hasData, row.verdict?.tone)}
                  label={row.status}
                  className="dash-card__fill-badge"
                />
                {row.verdict ? (
                  <p className={`dash-card__verdict dash-card__verdict--${row.verdict.tone}`}>{row.status}</p>
                ) : (
                  <p className={`dash-card__verdict ${row.hasData ? "" : "dash-card__verdict--warning"}`}>{row.status}</p>
                )}
                <p className="dash-card__metric">
                  {row.primaryKpi.label}: {row.primaryKpi.value}
                </p>
                <div className="dash-card__kpis" aria-label="Doplňkové metriky">
                  {row.secondaryKpis.map((kpi) => (
                    <span key={kpi.label} className="dash-card__kpi-pill">
                      {kpi.label}: <strong>{kpi.value}</strong>
                    </span>
                  ))}
                </div>
                <p className="dash-card__meta">{row.detail}</p>
                <p className="dash-card__meta">Naposledy otevřeno: {row.lastVisit}</p>
                <p className="dash-card__meta">Pojmenované zálohy: {row.namedBackups}</p>
                <div className="dash-card__actions">
                  <button type="button" className="btn primary" onClick={() => openDashboardModule(row)}>
                    Otevřít
                  </button>
                  {!row.hasData ? (
                    <button type="button" className="btn ghost" onClick={() => openModuleWithExampleHint(row.id)}>
                      Začít u ukázky
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        </main>

        <footer className="zs-app-footer">
          <HeroStatusBar
            variant="dash"
            placement="footer"
            productLabel={PRODUCT_CALCULATOR_TITLES.dash}
            lastSavedAt={refreshAt.toLocaleString("cs-CZ")}
            notice={notice}
          />
          <AuthorCreditFooter />
        </footer>
      </div>
    </div>
  );
}
