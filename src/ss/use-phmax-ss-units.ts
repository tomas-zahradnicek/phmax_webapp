import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUiNotice } from "../useUiNotice";
import {
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_RESET_FORM_ALL,
  confirmDestructive,
  msgConfirmDeleteNamedBackup,
} from "../confirm-destructive";
import { downloadTextFile, exportCsvLocalized, exportFilenameStamped } from "../export-utils";
import { buildExportContextRows, buildExportCsvPreamble } from "../export-metadata";
import { createSsProductAuditProtocol } from "../phmax-product-audit";
import { comparePhmaxProductVariants } from "../phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "../phmax-product-audit-download";
import {
  BROWSER_ERROR_NEXT_STEP_HINT,
  MSG_DATA_UNEXPECTED_SHAPE,
  MSG_SS_AUDIT_NEEDS_VALID_ROW,
  MSG_SS_COMPARE_CURRENT_INVALID,
  MSG_SS_COMPARE_NAMED_INVALID,
  MSG_NAMED_BACKUP_PICK_FIRST,
  MSG_NAMED_BACKUP_PICK_TO_COMPARE,
  MSG_NAMED_BACKUP_PICK_TO_DELETE,
  namedBackupSavedNotice,
} from "../calculator-ui-constants";
import { printPlainSummaryDocument, PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE } from "../app-author-print";
import {
  PHMAX_SS_MAX_NAMED_SNAPSHOTS,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  PHMAX_SS_UNITS_SECTION,
  PHMAX_SS_UNITS_STORAGE_KEY,
} from "./phmax-ss-constants";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { explainFullPhmaxDecision } from "./phmax-ss-explainability";
import { sumPracticalSchoolPhaMaxFromRows } from "./phmax-ss-practical-phamax";
import {
  buildSsAuditProtocolInput,
  deriveSsUnitsBrulesPreview,
  deriveSsUnitsPreview,
} from "./phmax-ss-units-derive";
import { createEmptyPhmaxSsUnitRow, revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./phmax-ss-types";
import { buildSsDraftStoragePayload, parseSsDraftRowsFromLs } from "./ss-draft-storage";
import { computeSsPhmaxTotalFromSnapshot } from "./ss-compute-phmax-total-from-snapshot";
import { PHMAX_IMPORT_APPLIED_EVENT } from "../phmax-import-applied-event";

function parseStoredRows(raw: string | null): PhmaxSsUnitRow[] {
  const rows = parseSsDraftRowsFromLs(raw);
  return rows.length > 0 ? rows : [createEmptyPhmaxSsUnitRow(1)];
}

function nextRowId(rows: PhmaxSsUnitRow[]): number {
  return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

export type SsNamedSnapshot = {
  id: string;
  name: string;
  savedAt: string;
  snapshot: { rows: PhmaxSsUnitRow[] };
};

function readNamedSsSnapshotsFromLs(): SsNamedSnapshot[] {
  try {
    const raw = localStorage.getItem(PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: SsNamedSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeNamedSsSnapshotsToLs(items: SsNamedSnapshot[]) {
  try {
    localStorage.setItem(PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

function parseSsNamedRowsPayload(data: unknown): PhmaxSsUnitRow[] | null {
  if (!data || typeof data !== "object") return null;
  const rowsRaw = (data as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return null;
  return rowsRaw.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
}

function buildSsExportValueRows(
  rows: PhmaxSsUnitRow[],
  roundedTotal: number,
  exportLabel: string,
  phamaxPracticalTotal: number | null,
): [string, string | number][] {
  const sec = PHMAX_SS_UNITS_SECTION;
  const out: [string, string | number][] = [];
  if (exportLabel.trim()) {
    out.push(["Označení pro export", exportLabel.trim()]);
  }
  out.push(["Součet PHmax (orientačně, platné řádky)", roundedTotal]);
  if (phamaxPracticalTotal != null) {
    out.push([
      "Součet PHAmax (PrŠ 78-62-C/01, 78-62-C/02, denní forma – tabulka metodiky)",
      phamaxPracticalTotal,
    ]);
  }
  out.push(["Počet řádků ve formuláři", rows.length]);
  rows.forEach((r, i) => {
    const prefix = `Řádek ${i + 1} (id ${r.id})`;
    out.push([`${prefix} – ${sec.colLabel}`, r.label]);
    out.push([`${prefix} – ${sec.colEducationField}`, r.educationField]);
    out.push([`${prefix} – ${sec.colAvgStudents}`, r.averageStudents]);
    out.push([`${prefix} – ${sec.colClassCount}`, r.classCount]);
    out.push([`${prefix} – ${sec.colStudyForm}`, r.studyForm]);
    out.push([`${prefix} – ${sec.colPhmaxMode}`, r.phmaxMode]);
    out.push([`${prefix} – ${sec.colOborCountInClass}`, r.oborCountInClass]);
    out.push([`${prefix} – ${sec.colArt82Talent}`, r.isArt82TalentClass ? "ano" : "ne"]);
    out.push([`${prefix} – ${sec.colAdditionalObors}`, r.additionalOborCodes]);
    out.push([`${prefix} – ${sec.colOborStudentCounts}`, r.oborStudentCountsRaw]);
    out.push([`${prefix} – ${sec.colClassType}`, r.classType]);
    out.push([`${prefix} – ${sec.colPar16Class}`, r.isPar16Class ? "ano" : "ne"]);
    out.push([`${prefix} – ${sec.colNote}`, r.note]);
  });
  return out;
}

function buildSsPlainSummary(params: {
  exportLabel: string;
  roundedTotal: number;
  rowCount: number;
  phamaxPracticalTotal: number | null;
}): string {
  const lines = [
    "PHmax SŠ – textové shrnutí (orientační)",
    params.exportLabel.trim() ? `Označení pro export: ${params.exportLabel.trim()}` : null,
    `Počet řádků: ${params.rowCount}`,
    `Součet PHmax (platné řádky): ${params.roundedTotal}`,
    params.phamaxPracticalTotal != null
      ? `Součet PHAmax (PrŠ, denní, tabulka metodiky): ${params.phamaxPracticalTotal}`
      : null,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export type SsDashboardMetrics = {
  rowCount: number;
  phmaxTotal: number;
  /** Součet PHAmax jen pro Praktickou školu (kódy 78-62-C/01, 78-62-C/02, denní forma); jinak `null`. */
  phamaxTotal: number | null;
};

export function usePhmaxSsUnits(
  onDashboardMetrics?: (m: SsDashboardMetrics) => void,
) {
  const [rows, setRows] = useState<PhmaxSsUnitRow[]>(() => {
    try {
      return parseStoredRows(localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY));
    } catch {
      return [createEmptyPhmaxSsUnitRow(1)];
    }
  });

  const [whyPhmaxRowId, setWhyPhmaxRowId] = useState<number | null>(null);
  const [whyBrulesRowId, setWhyBrulesRowId] = useState<number | null>(null);
  const [namedSnapshots, setNamedSnapshots] = useState<SsNamedSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
  const [exportLabel, setExportLabel] = useState("");
  const [uiNotice, setUiNotice] = useUiNotice();
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const setUiNoticeRef = useRef(setUiNotice);

  useEffect(() => {
    setUiNoticeRef.current = setUiNotice;
  }, [setUiNotice]);

  useEffect(() => {
    setNamedSnapshots(readNamedSsSnapshotsFromLs());
  }, []);

  useEffect(() => {
    const onImport = () => {
      try {
        setRows(parseStoredRows(localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(PHMAX_IMPORT_APPLIED_EVENT, onImport);
    return () => window.removeEventListener(PHMAX_IMPORT_APPLIED_EVENT, onImport);
  }, []);

  useEffect(() => {
    try {
      const total = computeSsPhmaxTotalFromSnapshot(rows);
      localStorage.setItem(
        PHMAX_SS_UNITS_STORAGE_KEY,
        JSON.stringify(buildSsDraftStoragePayload(rows, total)),
      );
    } catch {
      /* ignore */
    }
  }, [rows]);

  const updateRow = useCallback((id: number, patch: Partial<PhmaxSsUnitRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyPhmaxSsUnitRow(nextRowId(prev))]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [createEmptyPhmaxSsUnitRow(1)] : next;
    });
  }, []);

  /** Stejné pravidlo jako u jediného řádku po „Odstranit“ – vždy zůstane alespoň jeden řádek. */
  const removeLastRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length <= 1) return [createEmptyPhmaxSsUnitRow(1)];
      return prev.slice(0, -1);
    });
  }, []);

  const preview = useMemo(() => deriveSsUnitsPreview(rows), [rows]);
  const brulesPreview = useMemo(() => deriveSsUnitsBrulesPreview(rows), [rows]);

  const computedRows = preview.filter((p) => !p.skipped && "resolved" in p);
  const totalPhmax = computedRows.reduce((s, p) => s + (p.resolved?.totalPhmax ?? 0), 0);
  const roundedTotal = Math.round((totalPhmax + Number.EPSILON) * 100) / 100;

  const phamaxPracticalTotal = useMemo(() => sumPracticalSchoolPhaMaxFromRows(rows), [rows]);

  useEffect(() => {
    onDashboardMetrics?.({
      rowCount: rows.length,
      phmaxTotal: roundedTotal,
      phamaxTotal: phamaxPracticalTotal,
    });
  }, [rows.length, roundedTotal, phamaxPracticalTotal, onDashboardMetrics]);

  const auditProtocolInput = useMemo(() => buildSsAuditProtocolInput(rows), [rows]);

  const schoolPhmaxExplain = useMemo(() => {
    const input = auditProtocolInput;
    if (!input) return null;
    try {
      return explainFullPhmaxDecision(phmaxSsDataset, {
        rows: input.rows,
        ...(input.businessRules ? { businessRules: input.businessRules } : {}),
      });
    } catch {
      return null;
    }
  }, [auditProtocolInput]);

  const buildSsRowsSnapshot = useCallback((): { rows: PhmaxSsUnitRow[] } => ({ rows }), [rows]);

  const applySsRowsSnapshot = useCallback((data: unknown) => {
    const next = parseSsNamedRowsPayload(data);
    if (next) {
      setRows(next);
      setUiNoticeRef.current("Data byla obnovena.");
    } else {
      setUiNoticeRef.current(MSG_DATA_UNEXPECTED_SHAPE);
    }
  }, []);

  const saveNamedSsSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const id = `n-${Date.now()}`;
    const item: SsNamedSnapshot = {
      id,
      name,
      savedAt: new Date().toISOString(),
      snapshot: buildSsRowsSnapshot(),
    };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, PHMAX_SS_MAX_NAMED_SNAPSHOTS);
      writeNamedSsSnapshotsToLs(next);
      return next;
    });
    setNamedSaveName("");
    setUiNoticeRef.current(namedBackupSavedNotice(name, PHMAX_SS_MAX_NAMED_SNAPSHOTS));
  }, [buildSsRowsSnapshot, namedSaveName]);

  const restoreNamedSsSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_FIRST);
      return;
    }
    applySsRowsSnapshot(item.snapshot);
    setUiNoticeRef.current(`Obnovena záloha „${item.name}“.`);
  }, [applySsRowsSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSsSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_TO_DELETE);
      return;
    }
    const toDelete = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!toDelete) return;
    if (!confirmDestructive(msgConfirmDeleteNamedBackup(toDelete.name))) return;
    setNamedSnapshots((prev) => {
      const next = prev.filter((x) => x.id !== selectedNamedId);
      writeNamedSsSnapshotsToLs(next);
      return next;
    });
    setSelectedNamedId("");
    setUiNoticeRef.current("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId]);

  const handleExportSsAuditJson = useCallback(() => {
    if (!auditProtocolInput) {
      setUiNoticeRef.current(MSG_SS_AUDIT_NEEDS_VALID_ROW);
      return;
    }
    downloadPhmaxProductAuditJson(createSsProductAuditProtocol(phmaxSsDataset, auditProtocolInput), "ss");
    setUiNoticeRef.current("Stažen auditní protokol (JSON).");
  }, [auditProtocolInput]);

  const handleCompareSsWithNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_TO_COMPARE);
      return;
    }
    const inputCurrent = auditProtocolInput;
    const inputNamed = buildSsAuditProtocolInput(item.snapshot.rows);
    if (!inputCurrent) {
      setUiNoticeRef.current(MSG_SS_COMPARE_CURRENT_INVALID);
      return;
    }
    if (!inputNamed) {
      setUiNoticeRef.current(MSG_SS_COMPARE_NAMED_INVALID);
      return;
    }
    const cmp = comparePhmaxProductVariants([
      {
        id: "current",
        label: "Aktuální stav",
        protocol: createSsProductAuditProtocol(phmaxSsDataset, inputCurrent),
      },
      {
        id: "named",
        label: item.name,
        protocol: createSsProductAuditProtocol(phmaxSsDataset, inputNamed),
      },
    ]);
    downloadPhmaxProductCompareJson(cmp, "ss");
    setUiNoticeRef.current(`Staženo srovnání: aktuální stav vs „${item.name}“ (JSON).`);
  }, [auditProtocolInput, namedSnapshots, selectedNamedId]);

  const saveSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(PHMAX_SS_UNITS_STORAGE_KEY, JSON.stringify(rows));
      setUiNoticeRef.current("Rozpracované údaje byly uloženy do prohlížeče.");
    } catch {
      setUiNoticeRef.current(`Uložení se nepodařilo (úložiště prohlížeče). ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [rows]);

  const restoreSnapshot = useCallback(() => {
    setRows(parseStoredRows(localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY)));
    setUiNoticeRef.current("Obnoveno z automatického úložiště prohlížeče.");
  }, []);

  const clearStoredSnapshot = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    try {
      localStorage.removeItem(PHMAX_SS_UNITS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUiNoticeRef.current("Uložená data evidence SŠ v tomto prohlížeči byla smazána.");
  }, []);

  const resetAll = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_RESET_FORM_ALL)) return;
    setRows([createEmptyPhmaxSsUnitRow(1)]);
    setUiNoticeRef.current("Formulář byl vyčištěn.");
  }, []);

  const exportValueRows = useMemo(
    () => buildSsExportValueRows(rows, roundedTotal, exportLabel, phamaxPracticalTotal),
    [rows, roundedTotal, exportLabel, phamaxPracticalTotal],
  );

  const handleExportCsv = useCallback(() => {
    const rowsCsv = [...buildExportCsvPreamble("ss"), ...exportValueRows];
    downloadTextFile(exportFilenameStamped("phmax-ss", "csv"), exportCsvLocalized(rowsCsv), "text/csv;charset=utf-8");
    setUiNoticeRef.current("Export CSV byl stažen.");
  }, [exportValueRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("../export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", "PHmax / PHAmax – střední školy (dílčí jednotky)"],
          ...buildExportContextRows("ss"),
        ],
        valueRows: exportValueRows,
        filename: exportFilenameStamped("phmax-ss", "xlsx"),
      });
      setUiNoticeRef.current("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNoticeRef.current(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportValueRows, xlsxExportBusy]);

  const copySummaryToClipboard = useCallback(async () => {
    const text = buildSsPlainSummary({
      exportLabel,
      roundedTotal,
      rowCount: rows.length,
      phamaxPracticalTotal,
    });
    try {
      await navigator.clipboard.writeText(text);
      setUiNoticeRef.current("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNoticeRef.current(`Kopírování do schránky se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [exportLabel, roundedTotal, rows.length, phamaxPracticalTotal]);

  const printSummaryWindow = useCallback(() => {
    const result = printPlainSummaryDocument({
      pageTitle: "Shrnutí PHmax SŠ",
      heading: "Shrnutí PHmax SŠ",
      plainSummary: buildSsPlainSummary({
        exportLabel,
        roundedTotal,
        rowCount: rows.length,
        phamaxPracticalTotal,
      }),
      layout: "box",
    });
    if (!result.ok) {
      setUiNoticeRef.current(
        result.reason === "blocked" ? PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE : "Tisk shrnutí se nepodařil otevřít.",
      );
    }
  }, [exportLabel, roundedTotal, rows.length, phamaxPracticalTotal]);

  return {
    rows,
    updateRow,
    addRow,
    removeRow,
    removeLastRow,
    whyPhmaxRowId,
    setWhyPhmaxRowId,
    whyBrulesRowId,
    setWhyBrulesRowId,
    namedSnapshots,
    selectedNamedId,
    setSelectedNamedId,
    namedSaveName,
    setNamedSaveName,
    exportLabel,
    setExportLabel,
    uiNotice,
    setUiNotice,
    preview,
    brulesPreview,
    computedRows,
    roundedTotal,
    auditProtocolInput,
    schoolPhmaxExplain,
    applySsRowsSnapshot,
    saveNamedSsSnapshot,
    restoreNamedSsSnapshot,
    deleteNamedSsSnapshot,
    handleExportSsAuditJson,
    handleCompareSsWithNamedSnapshot,
    saveSnapshotManually,
    restoreSnapshot,
    clearStoredSnapshot,
    resetAll,
    handleExportCsv,
    handleExportXlsx,
    copySummaryToClipboard,
    printSummaryWindow,
    xlsxExportBusy,
  };
}

export type PhmaxSsUnitsModel = ReturnType<typeof usePhmaxSsUnits>;
