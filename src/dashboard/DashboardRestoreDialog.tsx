import React, { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildRestorePreviewFromBackupText } from "../backup/restore/restore-preview-model";
import { useModalDialogA11y } from "../modal-dialog-a11y";
import {
  beginRestoreFileReadGeneration,
  invalidateRestoreFileReadGeneration,
  processRestoreFileRead,
  restoreDialogCanClose,
  type RestoreDialogPhase,
} from "./dashboard-restore-dialog-file-read";

type DashboardRestoreDialogProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export function DashboardRestoreDialog({
  open,
  onClose,
  triggerRef,
}: DashboardRestoreDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const fileReadGenerationRef = useRef(0);
  const [phase, setPhase] = useState<RestoreDialogPhase>({ status: "idle" });

  const canClose = restoreDialogCanClose(phase);

  const requestClose = useCallback(() => {
    if (!restoreDialogCanClose(phase)) return;
    invalidateRestoreFileReadGeneration(fileReadGenerationRef);
    setPhase({ status: "idle" });
    onClose();
  }, [onClose, phase]);

  useModalDialogA11y({
    open,
    onClose: requestClose,
    panelRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: triggerRef,
  });

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const generation = beginRestoreFileReadGeneration(fileReadGenerationRef);
    setPhase({ status: "loading" });

    const outcome = await processRestoreFileRead(
      file,
      generation,
      fileReadGenerationRef,
      buildRestorePreviewFromBackupText,
    );
    if (!outcome.applied) return;

    setPhase(outcome.phase);
    if (outcome.phase.status === "file_error" || outcome.phase.status === "parse_error") {
      queueMicrotask(() => statusRef.current?.focus());
    }
  }, []);

  const handleChooseFile = useCallback(() => {
    if (phase.status === "loading") return;
    fileInputRef.current?.click();
  }, [phase.status]);

  if (!open) return null;

  const preview = phase.status === "preview" ? phase.preview : null;
  const blocked = preview != null && (preview.blockedMessage != null || !preview.hasRestorableModules);
  const showWarnings =
    preview != null &&
    (preview.warnings.length > 0 || preview.unknownModuleWarning || preview.invalidModules.length > 0);

  const dialog = (
    <div
      className="glossary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="restore-dialog"
    >
      <div
        className="glossary-modal__backdrop"
        onClick={() => {
          if (canClose) requestClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="glossary-modal__panel dashboard-restore-dialog"
        tabIndex={-1}
      >
        <div className="glossary-modal__head">
          <div>
            <h2 className="section-title" id={titleId}>
              Obnova ze zálohy
            </h2>
            <p id={descriptionId} className="muted-text">
              Vyberte JSON soubor centrální zálohy. Tento krok pouze zobrazí náhled — data se zatím
              nemění.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn ghost"
            onClick={requestClose}
            disabled={!canClose}
            data-testid="restore-dialog-close"
          >
            Zavřít
          </button>
        </div>

        <div className="dashboard-restore-dialog__file">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            disabled={phase.status === "loading"}
            style={{ display: "none" }}
            data-testid="restore-file-input"
          />
          <button
            type="button"
            className="btn primary"
            onClick={handleChooseFile}
            disabled={phase.status === "loading"}
            data-testid="restore-choose-file"
          >
            {phase.status === "loading" ? "Načítám soubor…" : "Vybrat soubor zálohy"}
          </button>
        </div>

        {phase.status === "file_error" || phase.status === "parse_error" ? (
          <p
            ref={statusRef}
            className="dashboard-restore-dialog__error"
            role="alert"
            tabIndex={-1}
            data-testid="restore-dialog-error"
          >
            {phase.message}
            {phase.status === "parse_error" &&
            phase.schemaVersion !== undefined &&
            phase.schemaVersion !== null &&
            typeof phase.schemaVersion !== "object"
              ? ` (verze ${String(phase.schemaVersion)})`
              : null}
          </p>
        ) : null}

        {preview ? (
          <div className="dashboard-restore-dialog__preview" data-testid="restore-preview">
            <section className="dashboard-restore-dialog__section">
              <h3 className="dashboard-restore-dialog__subtitle">Informace o záloze</h3>
              <ul className="dashboard-restore-dialog__list muted-text">
                <li>Datum zálohy: {preview.exportedAtLabel}</li>
                <li>Verze formátu: {preview.schemaVersionLabel}</li>
                {preview.schoolName ? <li>Škola: {preview.schoolName}</li> : null}
              </ul>
            </section>

            {preview.restoreModules.length > 0 ? (
              <section className="dashboard-restore-dialog__section">
                <h3 className="dashboard-restore-dialog__subtitle">Co bude obnoveno</h3>
                <p className="muted-text dashboard-restore-dialog__note">
                  Tato část nahradí současná lokální data stejné části.
                </p>
                <ul className="dashboard-restore-dialog__list">
                  {preview.restoreModules.map((module) => (
                    <li key={module.label}>{module.label}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {preview.preserveModules.length > 0 ? (
              <section className="dashboard-restore-dialog__section">
                <h3 className="dashboard-restore-dialog__subtitle">Co zůstane beze změny</h3>
                <p className="muted-text dashboard-restore-dialog__note">
                  Data modulů, které v záloze nejsou, zůstanou v tomto prohlížeči beze změny.
                </p>
                <ul className="dashboard-restore-dialog__list muted-text">
                  {preview.preserveModules.map((module) => (
                    <li key={module.label}>{module.label}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {showWarnings ? (
              <section
                className="dashboard-restore-dialog__section dashboard-restore-dialog__warnings"
                data-testid="restore-preview-warnings"
              >
                <h3 className="dashboard-restore-dialog__subtitle">Upozornění</h3>
                {preview.warnings.map((warning) => (
                  <p key={warning} className="muted-text">
                    {warning}
                  </p>
                ))}
                {preview.invalidModules.length > 0 ? (
                  <p className="dashboard-restore-dialog__error" role="alert">
                    {preview.blockedMessage ?? "Záloha obsahuje poškozená nebo nepodporovaná data."}
                    {preview.invalidModules.length === 1
                      ? ` (${preview.invalidModules[0]!.label})`
                      : null}
                  </p>
                ) : null}
              </section>
            ) : null}

            {blocked ? (
              <section
                className="dashboard-restore-dialog__section dashboard-restore-dialog__blocked"
                data-testid="restore-preview-blocked"
              >
                <p className="dashboard-restore-dialog__error" role="alert">
                  {preview.emptyBackupMessage ?? preview.blockedMessage}
                </p>
              </section>
            ) : null}

            {!blocked && preview.canApply ? (
              <p
                className="muted-text dashboard-restore-dialog__next-step"
                role="status"
                aria-live="polite"
                data-testid="restore-preview-ready"
              >
                Náhled je připraven. Potvrzení a obnova dat budou dostupné v dalším kroku.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
