import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_RESET_FORM_ALL,
  confirmDestructive,
  msgConfirmDeleteNamedBackup,
} from "../confirm-destructive";
import { downloadTextFile, exportCsvLocalized, exportFilenameStamped } from "../export-utils";
import { buildExportMetaRows, EXPORT_CSV_SEPARATOR_ROW } from "../export-metadata";
import { createSsProductAuditProtocol } from "../phmax-product-audit";
import { comparePhmaxProductVariants } from "../phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "../phmax-product-audit-download";
import {
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
} from "../calculator-ui-constants";
import { getAppAuthorPrintFooterHtml } from "../app-author-print";
import {
  PHMAX_SS_MAX_NAMED_SNAPSHOTS,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  PHMAX_SS_UNITS_SECTION,
  PHMAX_SS_UNITS_STORAGE_KEY,
} from "./phmax-ss-constants";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { explainFullPhmaxDecision } from "./phmax-ss-explainability";
import {
  buildSsAuditProtocolInput,
  deriveSsUnitsBrulesPreview,
  deriveSsUnitsPreview,
} from "./phmax-ss-units-derive";
import { createEmptyPhmaxSsUnitRow, revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./phmax-ss-types";

function parseStoredRows(raw: string | null): PhmaxSsUnitRow[] {
  if (!raw) return [createEmptyPhmaxSsUnitRow(1)];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data) || data.length === 0) return [createEmptyPhmaxSsUnitRow(1)];
    return data.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
  } catch {
    return [createEmptyPhmaxSsUnitRow(1)];
  }
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
): [string, string | number][] {
  const sec = PHMAX_SS_UNITS_SECTION;
  const out: [string, string | number][] = [];
  if (exportLabel.trim()) {
    out.push(["Označení pro export", exportLabel.trim()]);
  }
  out.push(["Součet PHmax (orientačně, platné řádky)", roundedTotal]);
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
    out.push([`${prefix} – ${sec.colNote}`, r.note]);
  });
  return out;
}

function buildSsPlainSummary(params: {
  exportLabel: string;
  roundedTotal: number;
  rowCount: number;
}): string {
  const lines = [
    "PHmax SŠ – textové shrnutí (orientační)",
    params.exportLabel.trim() ? `Označení pro export: ${params.exportLabel.trim()}` : null,
    `Počet řádků: ${params.rowCount}`,
    `Součet PHmax (platné řádky): ${params.roundedTotal}`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export type SsDashboardMetrics = { rowCount: number; phmaxTotal: number };

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
  const [uiNotice, setUiNotice] = useState("");
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);

  useEffect(() => {
    setNamedSnapshots(readNamedSsSnapshotsFromLs());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PHMAX_SS_UNITS_STORAGE_KEY, JSON.stringify(rows));
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

  const preview = useMemo(() => deriveSsUnitsPreview(rows), [rows]);
  const brulesPreview = useMemo(() => deriveSsUnitsBrulesPreview(rows), [rows]);

  const computedRows = preview.filter((p) => !p.skipped && "resolved" in p);
  const totalPhmax = computedRows.reduce((s, p) => s + (p.resolved?.totalPhmax ?? 0), 0);
  const roundedTotal = Math.round((totalPhmax + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    onDashboardMetrics?.({ rowCount: rows.length, phmaxTotal: roundedTotal });
  }, [rows.length, roundedTotal, onDashboardMetrics]);

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
      setUiNotice("Data byla obnovena.");
    } else {
      setUiNotice("Uložená data nejsou ve očekávaném tvaru.");
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
    setUiNotice(`Záloha „${name}“ uložena do seznamu (max. ${PHMAX_SS_MAX_NAMED_SNAPSHOTS}).`);
  }, [buildSsRowsSnapshot, namedSaveName]);

  const restoreNamedSsSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice("Vyberte pojmenovanou zálohu v seznamu.");
      return;
    }
    applySsRowsSnapshot(item.snapshot);
    setUiNotice(`Obnovena záloha „${item.name}“.`);
  }, [applySsRowsSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSsSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNotice("Vyberte zálohu ke smazání.");
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
    setUiNotice("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId]);

  const handleExportSsAuditJson = useCallback(() => {
    if (!auditProtocolInput) {
      setUiNotice("Nejdřív vyplňte alespoň jeden platný řádek PHmax pro export auditu.");
      return;
    }
    downloadPhmaxProductAuditJson(createSsProductAuditProtocol(phmaxSsDataset, auditProtocolInput), "ss");
    setUiNotice("Stažen auditní protokol (JSON).");
  }, [auditProtocolInput]);

  const handleCompareSsWithNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice("Vyberte v seznamu zálohu, kterou chcete porovnat s aktuálním stavem.");
      return;
    }
    const inputCurrent = auditProtocolInput;
    const inputNamed = buildSsAuditProtocolInput(item.snapshot.rows);
    if (!inputCurrent) {
      setUiNotice("Aktuální stav nemá žádný platný řádek PHmax pro srovnání.");
      return;
    }
    if (!inputNamed) {
      setUiNotice("Vybraná záloha neobsahuje platné řádky PHmax pro srovnání.");
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
    setUiNotice(`Staženo srovnání: aktuální stav vs „${item.name}“ (JSON).`);
  }, [auditProtocolInput, namedSnapshots, selectedNamedId]);

  const saveSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(PHMAX_SS_UNITS_STORAGE_KEY, JSON.stringify(rows));
      setUiNotice("Rozpracované údaje byly uloženy do prohlížeče.");
    } catch {
      setUiNotice("Uložení se nepodařilo (úložiště prohlížeče).");
    }
  }, [rows]);

  const restoreSnapshot = useCallback(() => {
    setRows(parseStoredRows(localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY)));
    setUiNotice("Obnoveno z automatického úložiště prohlížeče.");
  }, []);

  const clearStoredSnapshot = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    try {
      localStorage.removeItem(PHMAX_SS_UNITS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUiNotice("Uložená data evidence SŠ v tomto prohlížeči byla smazána.");
  }, []);

  const resetAll = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_RESET_FORM_ALL)) return;
    setRows([createEmptyPhmaxSsUnitRow(1)]);
    setUiNotice("Formulář byl vyčištěn.");
  }, []);

  const exportValueRows = useMemo(
    () => buildSsExportValueRows(rows, roundedTotal, exportLabel),
    [rows, roundedTotal, exportLabel],
  );

  const handleExportCsv = useCallback(() => {
    const rowsCsv = [
      ...buildExportMetaRows("ss"),
      EXPORT_CSV_SEPARATOR_ROW,
      ...exportValueRows,
    ];
    downloadTextFile(exportFilenameStamped("phmax-ss", "csv"), exportCsvLocalized(rowsCsv), "text/csv;charset=utf-8");
    setUiNotice("Export CSV byl stažen.");
  }, [exportValueRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("../export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", "PHmax / PHAmax – střední školy (dílčí jednotky)"],
          ...buildExportMetaRows("ss"),
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportValueRows,
        filename: exportFilenameStamped("phmax-ss", "xlsx"),
      });
      setUiNotice("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNotice("Export do Excelu se nepodařil.");
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportValueRows, xlsxExportBusy]);

  const copySummaryToClipboard = useCallback(async () => {
    const text = buildSsPlainSummary({ exportLabel, roundedTotal, rowCount: rows.length });
    try {
      await navigator.clipboard.writeText(text);
      setUiNotice("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNotice("Kopírování do schránky se nepodařilo.");
    }
  }, [exportLabel, roundedTotal, rows.length]);

  const printSummaryWindow = useCallback(() => {
    const plain = buildSsPlainSummary({ exportLabel, roundedTotal, rowCount: rows.length });
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí PHmax SŠ</title>` +
        `<style>` +
        `@page{margin:10mm 12mm;size:A4}` +
        `body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:0;font-size:9pt;line-height:1.4;color:#0f172a}` +
        `h1{font-size:12pt;margin:0 0 8px;font-weight:800}` +
        `.box{border:1px solid #94a3b8;border-radius:6px;padding:10px 12px;background:#fff}` +
        `</style></head><body><h1>Shrnutí PHmax SŠ</h1><div class="box">${text}</div>${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [exportLabel, roundedTotal, rows.length]);

  return {
    rows,
    updateRow,
    addRow,
    removeRow,
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
