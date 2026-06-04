import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DASH_IMPORT_CONFIRM_HINT,
  DASH_IMPORT_DIALOG_LEAD,
  DASH_IMPORT_SCOPE_NOTE,
  DASH_IMPORT_TEMPLATE_LABEL,
  DASH_IMPORT_UPLOAD_LABEL,
} from "./calculator-ui-constants";
import { useModalDialogA11y } from "./modal-dialog-a11y";
import { applyPhmaxIsHandoffToLocalStorage, type HandoffApplyResult } from "./phmax-is-handoff-apply";
import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import { buildImportPreviewSummary } from "./phmax-import-pv-zs";
import { parseImportFileList } from "./phmax-import-xlsx";
import { CS_HOURS_PER_WEEK_SHORT, formatCsNumberOrDash } from "./cs-format";
import { downloadPhmaxImportTemplateXlsx } from "./phmax-import-template-xlsx";

type DashboardSchoolImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onApplied: (payload: PhmaxIsHandoffPayload, result: HandoffApplyResult) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Náhled z uploadu na kartě dashboardu – po otevření dialogu se aplikuje. */
  pendingPreview?: PhmaxIsHandoffPayload | null;
  onPendingPreviewConsumed?: () => void;
};

export function DashboardSchoolImportDialog({
  open,
  onClose,
  onApplied,
  triggerRef,
  pendingPreview = null,
  onPendingPreviewConsumed,
}: DashboardSchoolImportDialogProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PhmaxIsHandoffPayload | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useModalDialogA11y({
    open,
    onClose,
    panelRef,
    initialFocusRef: closeBtnRef,
    returnFocusRef: triggerRef,
  });

  const resetPreview = useCallback(() => {
    setPreview(null);
    setConfirmed(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    resetPreview();
    onClose();
  }, [onClose, resetPreview]);

  useEffect(() => {
    if (!open || !pendingPreview) return;
    setPreview(pendingPreview);
    setConfirmed(false);
    setError(null);
    onPendingPreviewConsumed?.();
  }, [open, onPendingPreviewConsumed, pendingPreview]);

  const handleDownloadTemplate = useCallback(async () => {
    if (templateBusy) return;
    setTemplateBusy(true);
    setError(null);
    try {
      await downloadPhmaxImportTemplateXlsx();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Šablonu se nepodařilo vytvořit.");
    } finally {
      setTemplateBusy(false);
    }
  }, [templateBusy]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    setConfirmed(false);
    try {
      const payload = await parseImportFileList(Array.from(fileList));
      setPreview(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soubor se nepodařilo načíst.");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleApply = useCallback(() => {
    if (!preview || !confirmed) return;
    try {
      const result = applyPhmaxIsHandoffToLocalStorage(preview);
      onApplied(preview, result);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import se nepodařilo uložit.");
    }
  }, [confirmed, handleClose, onApplied, preview]);

  if (!open) return null;

  const summary = preview ? buildImportPreviewSummary(preview) : null;

  const modal = (
    <div className="glossary-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="glossary-modal__backdrop" onClick={handleClose} aria-hidden="true" />
      <div ref={panelRef} className="glossary-modal__panel dash-import-dialog" tabIndex={-1}>
        <div className="glossary-modal__head">
          <div>
            <h2 className="section-title" id={titleId}>
              Import ze školy (PV + ZŠ)
            </h2>
            <p className="muted-text">{DASH_IMPORT_DIALOG_LEAD}</p>
          </div>
          <button ref={closeBtnRef} type="button" className="btn ghost" onClick={handleClose}>
            Zavřít
          </button>
        </div>

        <div className="dash-import-dialog__body">
          <p className="muted-text" style={{ fontSize: "0.88rem", marginBottom: 10 }}>
            <strong>Krok 1:</strong> šablona · <strong>Krok 2:</strong> vyplnit v Excelu · <strong>Krok 3:</strong> nahrát
            soubor níže
          </p>
          <div className="dash-import-dialog__actions">
            <label className="btn primary" style={{ cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Načítám soubor…" : DASH_IMPORT_UPLOAD_LABEL}
              <input
                ref={fileInputRef}
                type="file"
                data-testid="dash-import-file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                multiple
                disabled={busy}
                style={{ display: "none" }}
                onChange={(e) => void handleFiles(e.target.files)}
              />
            </label>
            <button
              type="button"
              className="btn ghost"
              data-testid="dash-import-download-template-dialog"
              disabled={templateBusy}
              onClick={() => void handleDownloadTemplate()}
            >
              {templateBusy ? "Připravuji šablonu…" : DASH_IMPORT_TEMPLATE_LABEL}
            </button>
          </div>
          <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
            Doporučeno: jeden soubor <code className="methodology-strip__code">phmax-import-skola-v2.xlsx</code> (české
            názvy sloupců a hodnot). Povinné listy Meta, PV, ZŠ souhrn; volitelně ŠD, SŠ, ZŠ psycholog / zdravotní.
          </p>
          <p className="muted-text" style={{ marginTop: 6, fontSize: "0.88rem" }}>
            {DASH_IMPORT_SCOPE_NOTE}
          </p>

          {error ? (
            <p className="dash-import-dialog__error" role="alert">
              {error}
            </p>
          ) : null}

          {summary ? (
            <div className="card card--accent" style={{ marginTop: 12, padding: 12 }}>
              <h3 className="section-title" style={{ fontSize: "1rem" }}>
                Náhled před načtením
              </h3>
              <ul className="muted-text" style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                <li>
                  Scénář: <strong>{summary.scenarioLabel}</strong>
                  {summary.schoolId ? (
                    <>
                      {" "}
                      · ID školy: <strong>{summary.schoolId}</strong>
                    </>
                  ) : null}
                </li>
                <li>
                  PV: <strong>{summary.pvRowCount}</strong> pracovišť, PHmax{" "}
                  <strong>{formatCsNumberOrDash(summary.pvPhmax)}</strong>
                </li>
                <li>
                  ZŠ souhrn: PHmax <strong>{formatCsNumberOrDash(summary.zsPhmax)}</strong>
                  {(summary.zsPsychRowCount > 0 || summary.zsHealthRowCount > 0) && (
                    <>
                      {" "}
                      (psycholog {summary.zsPsychRowCount}, zdravotní {summary.zsHealthRowCount})
                    </>
                  )}
                </li>
                {summary.sdPhmax != null ? (
                  <li>
                    ŠD: PHmax <strong>{formatCsNumberOrDash(summary.sdPhmax)}</strong>
                  </li>
                ) : null}
                {summary.ssPhmax != null ? (
                  <li>
                    SŠ: PHmax <strong>{formatCsNumberOrDash(summary.ssPhmax)}</strong>
                  </li>
                ) : null}
                <li>
                  Orientační součet: <strong>{formatCsNumberOrDash(summary.totalPhmax)}</strong> {CS_HOURS_PER_WEEK_SHORT}
                </li>
              </ul>
              {summary.coherenceWarnings.length > 0 ? (
                <div role="status" style={{ marginTop: 8 }}>
                  <p className="muted-text" style={{ margin: "0 0 4px" }}>
                    Upozornění k souboru:
                  </p>
                  <ul className="muted-text" style={{ paddingLeft: "1.25rem", margin: 0 }}>
                    {summary.coherenceWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <label className="field" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8 }}>
                <input
                  type="checkbox"
                  data-testid="dash-import-confirm"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span className="muted-text">{DASH_IMPORT_CONFIRM_HINT}</span>
              </label>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn primary"
                  data-testid="dash-import-apply"
                  disabled={!confirmed}
                  onClick={handleApply}
                >
                  Načíst do kalkulaček
                </button>
                <button type="button" className="btn ghost" onClick={resetPreview}>
                  Zvolit jiný soubor
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
