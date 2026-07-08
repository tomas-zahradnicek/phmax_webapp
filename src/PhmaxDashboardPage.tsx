import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashHeroHeader } from "./dashboard/DashHeroHeader";
import { DashboardNewUserChecklist } from "./dashboard/DashboardNewUserChecklist";
import { DashboardQuickTour } from "./dashboard/DashboardQuickTour";
import { DashboardSchoolProfile } from "./dashboard/DashboardSchoolProfile";
import { DashboardBackupExportCard } from "./dashboard/DashboardBackupExportCard";
import { DashboardZsScenariosCard } from "./dashboard/DashboardZsScenariosCard";
import { buildDashboardSchoolProfile } from "./dashboard/build-dashboard-school-profile";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { PhmaxModuleSeoSection } from "./PhmaxModuleSeoSection";
import {
  DASH_IMPORT_HINT,
  DASH_IMPORT_LABEL,
  DASH_IMPORT_STEPS,
  DASH_IMPORT_TEMPLATE_LABEL,
  DASH_IMPORT_UPLOAD_LABEL,
  PRODUCT_CALCULATOR_TITLES,
  PRODUCT_USER_GUIDE_LABEL,
  USER_GUIDE_PATH,
} from "./calculator-ui-constants";
import { DashboardSchoolImportDialog } from "./DashboardSchoolImportDialog";
import { dispatchPhmaxImportApplied } from "./phmax-import-applied-event";
import { downloadPhmaxImportTemplateXlsx } from "./phmax-import-template-xlsx";
import {
  FillStatusBadge,
  dashboardRowFillStatusKind,
  dashboardUnusedModuleFillStatusKind,
} from "./FillStatusBadge";
import { APP_VERSION } from "./app-version";
import {
  buildSchoolReviewPrintHtml,
  openSchoolReviewPrintWindow,
} from "./phmax-dashboard-school-review-print";
import {
  buildSchoolProfilePrintHtml,
  openSchoolProfilePrintWindow,
} from "./phmax-dashboard-school-profile-print";
import { buildDashboardBandHints } from "./phmax-dashboard-band-hints";
import { PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE } from "./app-author-print";
import { HeroStatusBar } from "./HeroStatusBar";
import type { ProductView } from "./ProductViewPills";
import { CS_HOURS_PER_WEEK_SHORT, formatCsNumberOrDash } from "./cs-format";
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
import { requestFocusModuleInputs, type ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";
import { sortByDashModuleOrder } from "./phmax-dashboard-sort";
import {
  buildCrossPhmaxSummary,
  formatCrossPhmaxSliceLabel,
  parseDashboardKpiPhmax,
} from "./phmax-dashboard-cross-phmax";
import { coherenceWarningFocusHint } from "./phmax-cross-phmax-coherence-nav";
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
import { buildPhmaxIsHandoffPayload, type PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import type { HandoffApplyResult, PhmaxModuleId } from "./phmax-is-handoff-apply";
import { parseImportHandoffFileList } from "./phmax-import-handoff-file";
import {
  formatDashboardLastExportLabel,
  readDashboardLastExport,
  recordDashboardLastExport,
} from "./phmax-dashboard-last-export";
import { crossPhmaxAuditCoherenceWarnings } from "./phmax-cross-phmax-coherence";
import { buildDashboardExportChecklist } from "./phmax-dashboard-export-checklist";
import {
  postPhmaxIsHandoff,
  readPhmaxIsEndpoint,
  writePhmaxIsEndpoint,
} from "./phmax-is-handoff-client";
import { downloadTextFile, exportFilenameStamped } from "./export-utils";
import { useUiNotice } from "./useUiNotice";

/** Moduly pro dashboard deep-link na vstupy. */
const DASH_INPUT_FOCUS_IDS = ["pv", "sd", "zs", "ss", "nv75"] as const satisfies readonly Exclude<ProductView, "dash">[];

const DASH_ROLE_LS_KEY = "phmax-dash-role-v1";

type DashAudienceRole = "director" | "methodologist" | "it";

const DASH_PRIMARY_ACTIONS: ReadonlyArray<{
  id: Exclude<ProductView, "dash">;
  cta: string;
}> = [
  { id: "pv", cta: "Spočítat PHmax PV" },
  { id: "sd", cta: "Spočítat PHmax ŠD" },
  { id: "zs", cta: "Spočítat PHmax ZŠ" },
  { id: "ss", cta: "Spočítat PHmax SŠ" },
  { id: "nv75", cta: "Banka odpočtů NV75" },
];

function readDashAudienceRole(): DashAudienceRole {
  try {
    const stored = localStorage.getItem(DASH_ROLE_LS_KEY);
    if (stored === "methodologist" || stored === "it" || stored === "director") return stored;
  } catch {
    /* ignore */
  }
  return "director";
}

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
  onOpenPvLite?: () => void;
  onOpenSdLite?: () => void;
  onOpenZsLite?: () => void;
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
  if (!hasData) return "Nepoužíváte – volitelný modul";
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
        pv.phmax != null ? formatCsNumberOrDash(pv.phmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: formatCsNumberOrDash(pv.phmax),
      },
      secondaryKpis: [
        { label: "PHAmax", value: formatCsNumberOrDash(pv.pha) },
        { label: "Pracoviště", value: String(pv.rowCount) },
      ],
      detail: pv.present
        ? `Pracoviště: ${pv.rowCount}${pv.incomplete ? " · součet PHmax může být neúplný" : ""} · PHmax: ${formatCsNumberOrDash(pv.phmax)} · PHAmax: ${formatCsNumberOrDash(pv.pha)}`
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
        value: sd?.phmax != null ? formatCsNumberOrDash(sd.phmax) : sd ? String(sd.departments) : "–",
      },
      secondaryKpis: [
        { label: "Účastníci", value: sd ? String(sd.pupils) : "–" },
        { label: sd?.phmax != null ? "Oddělení" : "Režim", value: sd ? (sd.phmax != null ? String(sd.departments) : sd.inputMode === "detail" ? "detailní" : "souhrnný") : "–" },
        ...(sd?.pha != null ? [{ label: "PHAmax", value: formatCsNumberOrDash(sd.pha) }] : []),
      ],
      detail: sd
        ? sd.phmax != null
          ? `PHmax ${formatCsNumberOrDash(sd.phmax)}${sd.pha != null ? `, PHAmax ${formatCsNumberOrDash(sd.pha)}` : ""} · účastníci ${sd.pupils}, oddělení ${sd.departments}, režim ${sd.inputMode === "detail" ? "detailní" : "souhrnný"}.`
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
        zsTotals != null ? formatCsNumberOrDash(zsTotals.totalPhmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: formatCsNumberOrDash(zsTotals?.totalPhmax),
      },
      secondaryKpis: [
        { label: "PHAmax", value: formatCsNumberOrDash(zsTotals?.totalPha) },
        { label: "PHPmax", value: formatCsNumberOrDash(zsTotals?.totalPhp) },
      ],
      detail: zsTotals
        ? `Součty z autosave (záložka ${String(zsTotals.tab ?? "–")}): PHmax ${formatCsNumberOrDash(zsTotals.totalPhmax)}, PHAmax ${formatCsNumberOrDash(zsTotals.totalPha)}, PHPmax ${formatCsNumberOrDash(zsTotals.totalPhp)}.`
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
              detail: `PHmax ${formatCsNumberOrDash(zsTotals.totalPhmax)}, PHAmax ${formatCsNumberOrDash(zsTotals.totalPha)}, PHPmax ${formatCsNumberOrDash(zsTotals.totalPhp)} (záložka ${String(zsTotals.tab ?? "phmax")}).`,
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
        ss.phmax != null ? formatCsNumberOrDash(ss.phmax) : undefined,
      ),
      primaryKpi: {
        label: "PHmax",
        value: formatCsNumberOrDash(ss.phmax),
      },
      secondaryKpis: [
        {
          label: "PHAmax PrŠ",
          value: formatCsNumberOrDash(ss.phamaxPractical),
        },
        { label: "Řádky", value: String(ss.rowCount) },
      ],
      detail: ss.present
        ? `Řádky evidence: ${ss.rowCount}, součet PHmax (platné řádky): ${formatCsNumberOrDash(ss.phmax)}${ss.phamaxPractical != null ? `, PHAmax (PrŠ, denní): ${formatCsNumberOrDash(ss.phamaxPractical)}` : ""}`
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
        label: "Banka h./týd.",
        value: formatCsNumberOrDash(nv.bankTotal),
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

export function PhmaxDashboardPage({
  productView,
  setProductView,
  onOpenPvLite,
  onOpenSdLite,
  onOpenZsLite,
}: PhmaxDashboardPageProps) {
  const [refreshAt, setRefreshAt] = useState(() => new Date());
  const [notice, publishNotice] = useUiNotice();
  const [scenarioLabel, setScenarioLabel] = useState(() => readSchoolScenarioLabel());
  const [isEndpoint, setIsEndpoint] = useState(() => readPhmaxIsEndpoint());
  const [exportDisclaimerConfirmed, setExportDisclaimerConfirmed] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTemplateBusy, setImportTemplateBusy] = useState(false);
  const [importUploadBusy, setImportUploadBusy] = useState(false);
  const [importPendingPreview, setImportPendingPreview] = useState<PhmaxIsHandoffPayload | null>(null);
  const [importFollowUpModule, setImportFollowUpModule] = useState<PhmaxModuleId | null>(null);
  const [audienceRole, setAudienceRole] = useState<DashAudienceRole>(() => readDashAudienceRole());
  const importTriggerRef = React.useRef<HTMLButtonElement>(null);
  const importCardFileRef = React.useRef<HTMLInputElement>(null);

  const persistAudienceRole = useCallback((role: DashAudienceRole) => {
    setAudienceRole(role);
    try {
      localStorage.setItem(DASH_ROLE_LS_KEY, role);
    } catch {
      /* ignore */
    }
  }, []);

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
    (notice: string, exportKind: string) => {
      recordDashboardLastExport(exportKind);
      setRefreshAt(new Date());
      publishNotice(notice, { assertive: true });
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

  const rows = sortByDashModuleOrder(buildDashboardRows());
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

  const handleImportFilePick = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setImportUploadBusy(true);
      try {
        const payload = await parseImportHandoffFileList(Array.from(fileList));
        setImportPendingPreview(payload);
        setImportDialogOpen(true);
      } catch (e) {
        publishNotice(e instanceof Error ? e.message : "Soubor se nepodařilo načíst.", { assertive: true });
      } finally {
        setImportUploadBusy(false);
        if (importCardFileRef.current) importCardFileRef.current.value = "";
      }
    },
    [publishNotice],
  );

  const handleDownloadImportTemplate = useCallback(async () => {
    if (importTemplateBusy) return;
    setImportTemplateBusy(true);
    try {
      await downloadPhmaxImportTemplateXlsx();
      publishNotice("Šablona phmax-import-skola-v2.xlsx byla stažena do složky Stažené soubory.", { assertive: true });
    } catch (e) {
      publishNotice(e instanceof Error ? e.message : "Stažení šablony se nepodařilo.", { assertive: true });
    } finally {
      setImportTemplateBusy(false);
    }
  }, [importTemplateBusy, publishNotice]);

  const handleImportApplied = useCallback(
    (payload: PhmaxIsHandoffPayload, result: HandoffApplyResult) => {
      const label = payload.schoolScenario.scenarioLabel?.trim();
      if (label) {
        localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, label);
        setScenarioLabel(label);
      }
      setRefreshAt(new Date());
      dispatchPhmaxImportApplied();
      setImportFollowUpModule(result.appliedModules[0] ?? null);
      const mods = result.appliedModules.map((m) => DASH_CALC_LABEL[m]).join(", ");
      let msg = `Import dokončen (${mods}). Scénář: ${result.scenarioLabel ?? "–"}. Součet PHmax: ${formatCsNumberOrDash(payload.schoolScenario.summary.totalPhmax)} ${CS_HOURS_PER_WEEK_SHORT}`;
      if (result.warnings.length > 0) {
        msg += ` Varování: ${result.warnings.join(" ")}`;
      }
      publishNotice(msg, { assertive: true });
      requestAnimationFrame(() => document.getElementById("dash-import-followup")?.scrollIntoView({ behavior: "smooth" }));
    },
    [publishNotice],
  );

  const openModuleWithInputsFocus = useCallback(
    (id: Exclude<ProductView, "dash">, focusOverride?: ModuleInputsFocusHint) => {
      if (dashboardRowSupportsInputFocus(id)) {
        const hint = focusOverride ?? getDashboardFocusHint(id, { preferIssue: true });
        requestFocusModuleInputs(hint ?? focusOverride);
      } else {
        requestFocusModuleInputs(focusOverride);
      }
      setProductView(id);
    },
    [setProductView],
  );

  const openModuleForCoherenceWarning = useCallback(
    (warning: string) => {
      const coherence = coherenceWarningFocusHint(warning);
      if (!coherence) return;
      const { moduleId, ...coherenceHint } = coherence;
      const dashboardHint = getDashboardFocusHint(moduleId, { preferIssue: true });
      openModuleWithInputsFocus(moduleId, {
        ...dashboardHint,
        ...coherenceHint,
        sectionId: dashboardHint?.sectionId ?? coherenceHint.sectionId,
        rowKey: dashboardHint?.rowKey,
        rowId: dashboardHint?.rowId,
      });
    },
    [openModuleWithInputsFocus],
  );

  const openModuleWithExampleHint = useCallback(
    (id: Exclude<ProductView, "dash">) => {
      requestFocusExampleSelect();
      setProductView(id);
      publishNotice(
        `Otevřen modul ${DASH_CALC_LABEL[id]} – vyberte ukázkový scénář v horní liště (Příkladové výpočty).`,
      );
    },
    [publishNotice, setProductView],
  );

  const openModuleForOwnData = useCallback(
    (id: Exclude<ProductView, "dash">) => {
      openModuleWithInputsFocus(id);
    },
    [openModuleWithInputsFocus],
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

  const attentionRows = rows.filter(
    (row) => dashboardRowSupportsInputFocus(row.id) && row.hasData && dashboardVerdictNeedsAttention(row.verdict),
  );

  const modulesCompleted = rows.filter((r) => r.hasData && r.verdict?.tone === "ok").length;
  const hasUnusedModules = rows.some((r) => !r.hasData);
  const lastRefreshLabel = refreshAt.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const crossPhmax = buildCrossPhmaxSummary(rows, DASH_CALC_LABEL);
  const lastExport = useMemo(() => {
    void refreshAt;
    return readDashboardLastExport();
  }, [refreshAt]);
  const schoolProfile = useMemo(
    () =>
      buildDashboardSchoolProfile({
        moduleLabels: DASH_CALC_LABEL,
        rows,
        crossPhmax,
        scenarioLabel,
        attentionCount: attentionRows.length,
        modulesOk: modulesCompleted,
        lastExport,
        formatLastExport: formatDashboardLastExportLabel,
        hasUnusedModules,
      }),
    [
      rows,
      crossPhmax,
      scenarioLabel,
      attentionRows.length,
      modulesCompleted,
      lastExport,
      hasUnusedModules,
    ],
  );
  const dashboardBandHints = useMemo(() => {
    void refreshAt;
    return buildDashboardBandHints();
  }, [refreshAt]);

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

  const printSchoolProfile = useCallback(() => {
    const html = buildSchoolProfilePrintHtml({
      generatedAt: new Date().toLocaleString("cs-CZ"),
      appVersion: APP_VERSION,
      profile: schoolProfile,
      coherenceWarnings: auditCoherenceWarnings,
    });
    const printResult = openSchoolProfilePrintWindow(html);
    if (!printResult.ok) {
      publishNotice(printResult.reason === "blocked" ? PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE : "Tisk se nepodařil otevřít.");
      return;
    }
    publishNotice("Otevřeno okno pro tisk školního profilu.");
  }, [schoolProfile, auditCoherenceWarnings, publishNotice]);

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
    const printResult = openSchoolReviewPrintWindow(html);
    if (!printResult.ok) {
      publishNotice(printResult.reason === "blocked" ? PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE : "Tisk se nepodařil otevřít.");
      return;
    }
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
      displayForHumansCs: {
        totalPhmax:
          crossPhmax.totalPhmax != null
            ? `${formatCsNumberOrDash(crossPhmax.totalPhmax)} ${CS_HOURS_PER_WEEK_SHORT}`
            : null,
        modules: crossPhmax.slices.map((s) => formatCrossPhmaxSliceLabel(s)),
      },
    };
    downloadTextFile(
      exportFilenameStamped("phmax-cross-phmax", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport("Stažen orientační JSON součtu PHmax.", "JSON součtu PHmax");
  }, [crossPhmax, attentionModuleLabels, auditCoherenceWarnings, afterDashboardJsonExport]);

  const downloadSchoolScenarioJson = useCallback(() => {
    const scenario = buildSchoolScenarioExportPayload(
      crossPhmax,
      attentionModuleLabels,
      scenarioLabel,
      auditCoherenceWarnings,
    );
    const payload = {
      ...scenario,
      displayForHumansCs: {
        totalPhmax:
          scenario.summary.totalPhmax != null
            ? `${formatCsNumberOrDash(scenario.summary.totalPhmax)} ${CS_HOURS_PER_WEEK_SHORT}`
            : null,
        modules: scenario.summary.slices.map((s) => formatCrossPhmaxSliceLabel(s)),
      },
    };
    downloadTextFile(
      exportFilenameStamped("phmax-skola-scenar", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport("Stažen scénář celá škola (JSON + autosave modulů).", "Scénář celá škola");
  }, [crossPhmax, attentionModuleLabels, scenarioLabel, auditCoherenceWarnings, afterDashboardJsonExport]);

  const downloadIsHandoffJson = useCallback(() => {
    const scenario = buildSchoolScenarioExportPayload(
      crossPhmax,
      attentionModuleLabels,
      scenarioLabel,
      auditCoherenceWarnings,
    );
    const payload = {
      ...buildPhmaxIsHandoffPayload(scenario),
      schoolScenario: {
        ...scenario,
        displayForHumansCs: {
          totalPhmax:
            scenario.summary.totalPhmax != null
              ? `${formatCsNumberOrDash(scenario.summary.totalPhmax)} ${CS_HOURS_PER_WEEK_SHORT}`
              : null,
          modules: scenario.summary.slices.map((s) => formatCrossPhmaxSliceLabel(s)),
        },
      },
    };
    downloadTextFile(
      exportFilenameStamped("phmax-is-handoff", "json"),
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    afterDashboardJsonExport(
      "Stažen export JSON pro IS školy – viz docs/phmax-is-integration.md.",
      "Handoff JSON",
    );
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
    publishNotice(result.ok ? `Handoff odeslán (HTTP ${result.status}).` : result.message, { assertive: true });
  }, [crossPhmax, attentionModuleLabels, scenarioLabel, auditCoherenceWarnings, isEndpoint, publishNotice]);

  return (
    <div className="app-shell app-shell--gradient dash-page">
      <div className="container container--app">
        <DashHeroHeader
          productView={productView}
          setProductView={setProductView}
          phmaxTotalDisplay={
            crossPhmax.totalPhmax != null
              ? `${formatCsNumberOrDash(crossPhmax.totalPhmax)} ${CS_HOURS_PER_WEEK_SHORT}`
              : "–"
          }
          modulesWithData={modulesWithData}
          attentionCount={attentionRows.length}
          continueModuleLabel={continueRow ? DASH_CALC_LABEL[continueRow.id] : "–"}
          statusLabel={
            modulesWithData === 0
              ? "Začněte výpočtem"
              : attentionRows.length > 0
                ? "Vyžaduje pozornost"
                : "V pořádku"
          }
          statusTone={schoolProfile.tone === "neutral" ? "ok" : schoolProfile.tone}
          toolbar={{
            lastRefreshLabel,
            onRefresh: refresh,
            onClearLocalData: handleClearLocalData,
          }}
        />

        <main id={PHMAX_DASHBOARD_MAIN_ID} tabIndex={-1}>
        <DashboardSchoolProfile
          profile={schoolProfile}
          onPrintProfile={modulesWithData > 0 ? printSchoolProfile : undefined}
          onModuleChipClick={(id) => {
            const row = rows.find((r) => r.id === id);
            if (row) openDashboardModule(row);
          }}
        />
        {modulesWithData === 0 ? (
          <DashboardNewUserChecklist
            onScrollToModules={() => document.getElementById("dash-overview-heading")?.scrollIntoView({ behavior: "smooth" })}
          />
        ) : null}
        <DashboardZsScenariosCard
          namedBackupCount={zsNamedBackupCount}
          onCompare={() => setProductView("zs")}
        />
        <DashboardBackupExportCard />
        <DashboardQuickTour />

        <div
          className="dash-role-segmented"
          role="radiogroup"
          aria-labelledby="dash-role-heading"
        >
          <span id="dash-role-heading" className="dash-role-segmented__label">
            Role
          </span>
          {(
            [
              { id: "director" as const, label: "Ředitel" },
              { id: "methodologist" as const, label: "Metodik" },
              { id: "it" as const, label: "IT" },
            ] as const
          ).map((role) => (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={audienceRole === role.id}
              className={[
                "dash-role-segmented__btn",
                audienceRole === role.id ? "dash-role-segmented__btn--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => persistAudienceRole(role.id)}
            >
              {role.label}
            </button>
          ))}
        </div>
        {audienceRole === "director" ? (
          <div className="dash-role-hint">
            <button type="button" className="btn ghost" onClick={scrollToSchool15Min}>
              Celá škola za 15 min
            </button>
            <button type="button" className="btn ghost" onClick={printSchoolProfile}>
              Tisk profilu školy
            </button>
            <button type="button" className="btn ghost" onClick={printSchoolReview}>
              Kontrola před jednáním (tisk)
            </button>
          </div>
        ) : null}
        {audienceRole === "methodologist" ? (
          <div className="dash-role-hint">
            <button type="button" className="btn ghost" onClick={() => openModuleForOwnData("zs")}>
              Otevřít ZŠ – vlastní data
            </button>
            {zsNamedBackupCount > 0 ? (
              <button
                type="button"
                className="btn ghost"
                data-testid="dash-open-zs-compare"
                onClick={() => setProductView("zs")}
              >
                Porovnat zálohy ZŠ ({zsNamedBackupCount})
              </button>
            ) : null}
          </div>
        ) : null}
        {audienceRole === "it" ? (
          <div className="dash-role-hint">
            <button type="button" className="btn ghost" onClick={() => document.getElementById("dash-advanced-tools")?.scrollIntoView({ behavior: "smooth" })}>
              Import a export (níže)
            </button>
          </div>
        ) : null}

        <section className="card section-card dash-browser-overview" aria-labelledby="dash-overview-heading">
          <h2 id="dash-overview-heading" className="section-title">
            Moje kalkulačky
          </h2>
          {modulesWithData === 0 ? (
            <p className="muted-text dash-overview-summary">
              Zatím žádná uložená data – začněte u modulu, který vaše škola provozuje (např. PV nebo ZŠ), v sekci{" "}
              <strong>Co chcete dnes udělat?</strong>
            </p>
          ) : hasUnusedModules ? (
            <p className="muted-text dash-overview-summary">
              Moduly bez dat nemusíte vyplňovat – použijte jen ty, které provozujete. NV75 (banka odpočtů) je volitelná.
            </p>
          ) : null}
          <div className="dash-cards" data-dash-tour="module-cards">
            {rows.map((row) => (
              <article key={row.id} className="dash-card">
                <div className="dash-card__body">
                  <h3 className="dash-card__title">{row.title}</h3>
                  <FillStatusBadge
                    kind={
                      row.hasData
                        ? dashboardRowFillStatusKind(row.hasData, row.verdict?.tone)
                        : dashboardUnusedModuleFillStatusKind()
                    }
                    label={row.status}
                    className="dash-card__fill-badge"
                  />
                  <div className="dash-card__metric" aria-label={row.primaryKpi.label}>
                    <strong className="dash-card__metric-value">{row.primaryKpi.value}</strong>
                    <span className="dash-card__metric-label">{row.primaryKpi.label}</span>
                  </div>
                  {row.lastVisit !== "Nikdy" ? (
                    <p className="dash-card__meta">Naposledy: {row.lastVisit}</p>
                  ) : null}
                  {row.namedBackups > 0 ? (
                    <p className="dash-card__meta">Zálohy: {row.namedBackups}</p>
                  ) : null}
                  {row.id === "nv75" ? (
                    <p className="dash-card__context muted-text">
                      Banka odpočtů — nezapočítává se do součtu PHmax, slouží k plánování zástupů.
                    </p>
                  ) : null}
                </div>
                <div className="dash-card__actions">
                  <button type="button" className="btn primary" onClick={() => openDashboardModule(row)}>
                    Otevřít
                  </button>
                  {row.id === "pv" && onOpenPvLite ? (
                    <button type="button" className="btn ghost" onClick={onOpenPvLite}>
                      Rychlý PHmax
                    </button>
                  ) : null}
                  {row.id === "sd" && onOpenSdLite ? (
                    <button type="button" className="btn ghost" onClick={onOpenSdLite}>
                      Rychlý PHmax
                    </button>
                  ) : null}
                  {row.id === "zs" && onOpenZsLite ? (
                    <button type="button" className="btn ghost" onClick={onOpenZsLite}>
                      Rychlý PHmax
                    </button>
                  ) : null}
                  <button type="button" className="btn ghost" onClick={() => openModuleWithExampleHint(row.id)}>
                    Začít u ukázky
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

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

        {crossPhmax.modulesWithPhmax >= 2 ? (
          <section
            id="dash-school-15min"
            className="card section-card dash-cross-phmax"
            aria-labelledby="dash-cross-phmax-heading"
          >
            <h2 id="dash-cross-phmax-heading" className="section-title">
              Souhrnný PHmax
            </h2>
            <div className="dash-cross-phmax__hero">
              <span className="dash-cross-phmax__hero-label">Celkem PHmax</span>
              <div className="dash-cross-phmax__hero-value">
                <strong>{formatCsNumberOrDash(crossPhmax.totalPhmax)}</strong>
                <span>{CS_HOURS_PER_WEEK_SHORT}</span>
              </div>
              {crossPhmax.hasIncomplete ? (
                <p className="dash-cross-phmax__hero-note muted-text">Některé moduly mají neúplný výpočet – součet může být nižší.</p>
              ) : null}
            </div>
            <div className="dash-cross-phmax__breakdown" aria-label="PHmax podle modulu">
              {crossPhmax.slices.map((slice) => (
                <div
                  key={slice.id}
                  className={[
                    "dash-cross-phmax__slice",
                    slice.incomplete ? "dash-cross-phmax__slice--incomplete" : "",
                    attentionIds.has(slice.id) ? "dash-cross-phmax__slice--attention" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="dash-cross-phmax__slice-label">{DASH_CALC_LABEL[slice.id]}</span>
                  <strong className="dash-cross-phmax__slice-value">
                    {slice.hasData && slice.phmax != null ? formatCsNumberOrDash(slice.phmax) : "–"}
                  </strong>
                </div>
              ))}
            </div>
            <details className="dash-cross-phmax__details muted-text">
              <summary>Metodická upozornění a rozpad</summary>
              <p style={{ marginTop: 10 }}>
                Souhrn z uložených výsledků v tomto prohlížeči – orientační, neoficiální. NV75 a krácení PV § 1d v součtu nejsou.
              </p>
              {crossPhmaxMismatches.length > 0 ? (
                <p className="dash-coherence-warnings dash-coherence-warnings--lead">
                  <strong>Upozornění:</strong> modul(y) {crossPhmaxMismatches.join(", ")} jsou ve Vyžaduje pozornost –
                  opravte vstupy před použitím součtu.
                </p>
              ) : null}
              {dashboardBandHints.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <strong>Orientace k vyššímu PHmax</strong>
                  <ul style={{ marginTop: 6, paddingLeft: "1.25rem" }}>
                    {dashboardBandHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {auditCoherenceWarnings.length > 0 ? (
                <ul className="dash-coherence-warnings dash-coherence-warnings--list">
                  {auditCoherenceWarnings.map((w) => {
                    const focus = coherenceWarningFocusHint(w);
                    return (
                      <li key={w}>
                        {w}
                        {focus ? (
                          <>
                            {" "}
                            <button
                              type="button"
                              className="btn ghost"
                              style={{ display: "inline", padding: "0 4px", fontSize: "inherit", verticalAlign: "baseline" }}
                              onClick={() => openModuleForCoherenceWarning(w)}
                            >
                              Přejít k opravě ({DASH_CALC_LABEL[focus.moduleId]})
                            </button>
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <ul className="dash-cross-phmax__list" style={{ marginTop: 10, paddingLeft: "1.25rem" }}>
                {crossPhmax.slices.map((slice) => (
                  <li key={slice.id}>
                    {formatCrossPhmaxSliceLabel(slice)}
                    {slice.incomplete ? " (neúplný)" : ""}
                    {attentionIds.has(slice.id) ? " (vyžaduje pozornost)" : ""}
                  </li>
                ))}
              </ul>
            </details>
            <p className="muted-text dash-cross-phmax__footnote" style={{ marginTop: 10, fontSize: "0.88rem" }}>
              Export JSON, import ze školy a integrace IS jsou v sekci{" "}
              <button
                type="button"
                className="btn ghost"
                style={{ display: "inline", padding: "0 4px", fontSize: "inherit", verticalAlign: "baseline" }}
                onClick={() => document.getElementById("dash-advanced-tools")?.scrollIntoView({ behavior: "smooth" })}
              >
                Pokročilé nástroje
              </button>{" "}
              níže na stránce.
            </p>
          </section>
        ) : null}

        <section className="card card--accent section-card dash-quick-start" aria-labelledby="dash-quick-start-heading">
          <h2 id="dash-quick-start-heading" className="section-title">
            Co chcete dnes udělat?
          </h2>
          <p className="muted-text dash-quick-start__guide-link">
            <a href={USER_GUIDE_PATH}>{PRODUCT_USER_GUIDE_LABEL}</a> – kompletní průvodce moduly, postupem a exporty.
          </p>
          {showNewUserGuide ? (
            <p className="muted-text" style={{ marginBottom: 10 }}>
              Ukázku spustíte tlačítkem <strong>Začít u ukázky</strong> u karty modulu v sekci{" "}
              <strong>Moje kalkulačky</strong> výše. Vlastní školu vyplníte přes tlačítka níže nebo{" "}
              <strong>Otevřít</strong> u příslušné karty.
            </p>
          ) : null}
          <div className="dash-quick-start__grid">
            {DASH_PRIMARY_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="btn primary dash-quick-start__btn"
                onClick={() => openModuleForOwnData(action.id)}
              >
                {action.cta}
              </button>
            ))}
          </div>
        </section>

        {importFollowUpModule ? (
          <section
            id="dash-import-followup"
            className="card card--accent section-card dash-import-followup"
            aria-live="polite"
            data-testid="dash-import-followup"
          >
            <p className="dash-import-followup__lead">
              <strong>Import dokončen.</strong> Ověřte načtená data v modulu nebo zkontrolujte souhrn PHmax na Přehledu.
            </p>
            <div className="dash-import-followup__actions">
              <button
                type="button"
                className="btn primary"
                data-testid="dash-import-followup-module"
                onClick={() => {
                  openModuleWithInputsFocus(importFollowUpModule);
                  setImportFollowUpModule(null);
                }}
              >
                Otevřít {DASH_CALC_LABEL[importFollowUpModule]}
              </button>
              <button
                type="button"
                className="btn ghost"
                data-testid="dash-import-followup-summary"
                onClick={() => {
                  scrollToSchool15Min();
                  setImportFollowUpModule(null);
                }}
              >
                Zkontrolovat souhrn PHmax
              </button>
              <button type="button" className="btn ghost" onClick={() => setImportFollowUpModule(null)}>
                Zavřít
              </button>
            </div>
          </section>
        ) : null}

        <DashboardSchoolImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onApplied={handleImportApplied}
          triggerRef={importTriggerRef}
          pendingPreview={importPendingPreview}
          onPendingPreviewConsumed={() => setImportPendingPreview(null)}
        />

        {continueRow ? (
          <section
            className="card card--accent section-card dash-continue-card dash-continue-card--compact"
            aria-labelledby="dash-continue-heading"
          >
            <div className="dash-continue-card__compact-head">
              <h2 id="dash-continue-heading" className="section-title dash-continue-card__compact-title">
                Rozpracovaná práce – {DASH_CALC_LABEL[continueRow.id]}
              </h2>
              <dl className="dash-continue-card__compact-facts">
                <div>
                  <dt>{continueRow.primaryKpi.label}</dt>
                  <dd>{continueRow.primaryKpi.value}</dd>
                </div>
                <div>
                  <dt>Stav</dt>
                  <dd>{continueRow.status}</dd>
                </div>
              </dl>
              <div className="dash-continue-card__compact-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => openDashboardModule(continueRow)}
                >
                  {continueRow.hasData ? "Pokračovat" : "Otevřít a ukázku"}
                </button>
                <button type="button" className="btn ghost" onClick={() => openModuleWithExampleHint(continueRow.id)}>
                  Začít u ukázky
                </button>
              </div>
            </div>
            <details className="dash-continue-card__more muted-text">
              <summary>Detail z uloženého stavu</summary>
              <p className="muted-text" style={{ marginTop: 10 }}>
                Modul <strong>{continueRow.title}</strong> · uloženo v tomto prohlížeči.
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
              {continueRow.secondaryKpis.length > 0 ? (
                <div className="dash-card__kpis" style={{ marginTop: 10 }} aria-label="Doplňkové metriky">
                  {continueRow.secondaryKpis.map((kpi) => (
                    <span key={kpi.label} className="dash-card__kpi-pill">
                      {kpi.label}: <strong>{kpi.value}</strong>
                    </span>
                  ))}
                </div>
              ) : null}
            </details>
          </section>
        ) : null}

        <details id="dash-advanced-tools" className="card section-card dash-advanced-tools dash-advanced-tools--highlight">
          <summary className="section-title dash-advanced-tools__summary">
            <span className="dash-advanced-tools__summary-label">Pokročilé nástroje – import, export a integrace</span>
          </summary>
          <div className="dash-advanced-tools__body">
            <section
              id="dash-school-import"
              className="dash-school-import dash-advanced-tools__block"
              aria-labelledby="dash-import-heading"
            >
              <h3 id="dash-import-heading" className="dash-advanced-tools__subtitle">
                Import ze školy
              </h3>
              <p className="muted-text">{DASH_IMPORT_HINT}</p>
              <ol className="dash-school-import__steps muted-text">
                {DASH_IMPORT_STEPS.map((step, i) => (
                  <li key={step}>
                    <strong>{i + 1}.</strong> {step}
                  </li>
                ))}
              </ol>
              <div className="dash-card__actions dash-school-import__actions">
                <input
                  ref={importCardFileRef}
                  type="file"
                  data-testid="dash-import-file-card"
                  accept=".xlsx,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json"
                  multiple
                  disabled={importUploadBusy}
                  style={{ display: "none" }}
                  onChange={(e) => void handleImportFilePick(e.target.files)}
                />
                <button
                  ref={importTriggerRef}
                  type="button"
                  className="btn primary"
                  data-testid="dash-import-open-main"
                  disabled={importUploadBusy}
                  aria-busy={importUploadBusy}
                  title="Krok 3 – nahrát vyplněný Excel nebo CSV"
                  onClick={() => importCardFileRef.current?.click()}
                >
                  {importUploadBusy ? "Načítám soubor…" : DASH_IMPORT_UPLOAD_LABEL}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  data-testid="dash-import-download-template"
                  disabled={importTemplateBusy}
                  aria-busy={importTemplateBusy}
                  onClick={() => void handleDownloadImportTemplate()}
                >
                  {importTemplateBusy ? "Připravuji šablonu…" : DASH_IMPORT_TEMPLATE_LABEL}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  data-testid="dash-import-open"
                  title={DASH_IMPORT_HINT}
                  onClick={openImportDialog}
                >
                  {DASH_IMPORT_LABEL} (náhled)
                </button>
              </div>
            </section>

            {crossPhmax.modulesWithPhmax >= 2 ? (
              <section className="dash-advanced-tools__block" aria-labelledby="dash-export-heading">
                <h3 id="dash-export-heading" className="dash-advanced-tools__subtitle">
                  Export a scénář školy
                </h3>
                <p className="muted-text">
                  Orientační JSON pro metodika / IT – viz{" "}
                  <code className="methodology-strip__code">docs/phmax-is-integration.md</code>.
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
                <details className="dash-export-checklist" style={{ marginTop: 12 }}>
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
                      <strong>Krok 1:</strong> Stáhněte JSON (součet, scénář nebo export pro IS) – orientační, neoficiální.
                    </p>
                    <p className="dash-export-wizard__step">
                      <strong>Krok 2 – IT:</strong> předejte soubor, verzi aplikace ({APP_VERSION}), název scénáře a varování k
                      nesouladu výpočtů (pole{" "}
                      <code className="methodology-strip__code">coherenceWarnings</code> ve formátu JSON).
                    </p>
                    <p className="dash-export-wizard__step">
                      <strong>Krok 3:</strong> Na sdíleném PC po exportu zvažte smazání lokálních dat.
                    </p>
                  </div>
                ) : null}
                <div className="dash-card__actions" style={{ marginTop: 12 }}>
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
                      Odeslat export na IS (POST)
                    </button>
                  ) : null}
                </div>
              </section>
            ) : (
              <p className="muted-text dash-advanced-tools__block">
                Export scénáře školy se zobrazí po vyplnění alespoň dvou modulů s PHmax (PV, ŠD, ZŠ nebo SŠ).
              </p>
            )}
          </div>
        </details>

        </main>

        <PhmaxModuleSeoSection view="dash" setProductView={setProductView} />

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
