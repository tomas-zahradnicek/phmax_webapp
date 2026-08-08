import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildRestorePreviewFromBackupText } from "../backup/restore/restore-preview-model";
import { useModalDialogA11y } from "../modal-dialog-a11y";
import {
  canEnableRestoreApply,
  executeRestoreApply,
  acquireRestoreApplyLock,
  isRestoreBlockingRecoveryPhase,
  refreshRestorePreviewFromValidated,
  RESTORE_CONFIRMATION_TOKEN,
  restoreDialogCanClose,
  runRestoreCurrentBackupDownload,
  shouldShowFullResetSoftCta,
  type RestoreApplyDependencies,
  type RestoreCurrentBackupStatus,
  type RestoreDialogPhase,
} from "./dashboard-restore-dialog-apply";
import {
  beginRestoreFileReadGeneration,
  invalidateRestoreFileReadGeneration,
  processRestoreFileRead,
} from "./dashboard-restore-dialog-file-read";

type DashboardRestoreDialogProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onNavigateToFullReset?: () => void;
  applyDependencies?: RestoreApplyDependencies;
};

function createInitialBackupStatus(): RestoreCurrentBackupStatus {
  return { status: "idle" };
}

export function DashboardRestoreDialog({
  open,
  onClose,
  triggerRef,
  onNavigateToFullReset,
  applyDependencies,
}: DashboardRestoreDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmationInputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const backupStatusRef = useRef<HTMLParagraphElement>(null);
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileReadGenerationRef = useRef(0);
  const applyLockRef = useRef(false);

  const [phase, setPhase] = useState<RestoreDialogPhase>({ status: "idle" });
  const [confirmationToken, setConfirmationToken] = useState("");
  const [backupStatus, setBackupStatus] = useState<RestoreCurrentBackupStatus>(createInitialBackupStatus);

  const canClose = restoreDialogCanClose(phase);
  const isApplying = phase.status === "applying";
  const isBlockingRecovery = isRestoreBlockingRecoveryPhase(phase);
  const controlsDisabled = !canClose || isApplying;

  const resetDialogState = useCallback(() => {
    invalidateRestoreFileReadGeneration(fileReadGenerationRef);
    applyLockRef.current = false;
    setConfirmationToken("");
    setBackupStatus(createInitialBackupStatus());
    setPhase({ status: "idle" });
  }, []);

  const requestClose = useCallback(() => {
    if (!restoreDialogCanClose(phase)) return;
    resetDialogState();
    onClose();
  }, [onClose, phase, resetDialogState]);

  useModalDialogA11y({
    open,
    onClose: requestClose,
    panelRef,
    initialFocusRef: isBlockingRecovery ? recoveryHeadingRef : closeButtonRef,
    returnFocusRef: triggerRef,
  });

  useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open, resetDialogState]);

  useEffect(() => {
    if (
      backupStatus.status === "partial" ||
      backupStatus.status === "error"
    ) {
      backupStatusRef.current?.focus();
    }
  }, [backupStatus.status]);

  useEffect(() => {
    if (isBlockingRecovery) {
      recoveryHeadingRef.current?.focus();
    }
  }, [isBlockingRecovery]);

  useEffect(() => {
    if (
      phase.status === "file_error" ||
      phase.status === "parse_error" ||
      phase.status === "no_changes" ||
      phase.status === "rejected" ||
      phase.status === "snapshot_failed"
    ) {
      statusRef.current?.focus();
    }
  }, [phase.status]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || controlsDisabled) return;

    setConfirmationToken("");
    const generation = beginRestoreFileReadGeneration(fileReadGenerationRef);
    setPhase({ status: "loading" });

    const outcome = await processRestoreFileRead(
      file,
      generation,
      fileReadGenerationRef,
      buildRestorePreviewFromBackupText,
    );
    if (!outcome.applied) return;

    setConfirmationToken("");
    setPhase(outcome.phase);
  }, [controlsDisabled]);

  const handleChooseFile = useCallback(() => {
    if (controlsDisabled) return;
    fileInputRef.current?.click();
  }, [controlsDisabled]);

  const handleCurrentBackup = useCallback(() => {
    if (controlsDisabled || backupStatus.status === "running") return;
    setBackupStatus({ status: "running" });
    setBackupStatus(runRestoreCurrentBackupDownload());
  }, [backupStatus.status, controlsDisabled]);

  const handleRefreshPreview = useCallback(() => {
    if (phase.status !== "rejected") return;
    setConfirmationToken("");
    const refresh = refreshRestorePreviewFromValidated(phase.validated);
    if (refresh.status === "error") {
      setPhase({ status: "file_error", message: refresh.message });
      return;
    }
    setPhase({
      status: "preview",
      validated: refresh.validated,
      preview: refresh.preview,
    });
  }, [phase]);

  const handleApply = useCallback(async () => {
    if (!canEnableRestoreApply(phase, confirmationToken, applyLockRef.current)) return;
    if (!acquireRestoreApplyLock(applyLockRef)) return;
    if (phase.status !== "preview") {
      applyLockRef.current = false;
      return;
    }
    invalidateRestoreFileReadGeneration(fileReadGenerationRef);

    const { validated, preview } = phase;
    setPhase({ status: "applying", validated, preview });

    const outcome = await executeRestoreApply(validated, preview, applyDependencies);
    if (outcome.kind === "reloaded") return;

    setPhase(outcome.phase);
    if (outcome.resetConfirmationToken) {
      setConfirmationToken("");
    }
    if (outcome.releaseApplyLock) {
      applyLockRef.current = false;
    }
  }, [applyDependencies, confirmationToken, phase]);

  const handleFullResetSoftCta = useCallback(() => {
    resetDialogState();
    onClose();
    onNavigateToFullReset?.();
  }, [onClose, onNavigateToFullReset, resetDialogState]);

  const handleExplicitReload = useCallback(() => {
    const reload = applyDependencies?.reload ?? (() => window.location.reload());
    reload();
  }, [applyDependencies]);

  if (!open) return null;

  const preview =
    phase.status === "preview" || phase.status === "applying" || phase.status === "rejected"
      ? phase.preview
      : null;
  const blocked =
    preview != null &&
    (preview.blockedMessage != null ||
      preview.conflictCategory != null ||
      !preview.hasRestorableModules);
  const showWarnings =
    preview != null &&
    (preview.warnings.length > 0 || preview.unknownModuleWarning || preview.invalidModules.length > 0);
  const showConfirmation =
    phase.status === "preview" &&
    preview != null &&
    preview.canApply &&
    preview.hasRestorableModules &&
    preview.conflictCategory == null;
  const applyEnabled = canEnableRestoreApply(phase, confirmationToken, applyLockRef.current);

  const dialog = (
    <div
      className="glossary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={phase.status === "loading" || isApplying ? true : undefined}
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
        {isBlockingRecovery ? (
          <div
            className="dashboard-restore-dialog__recovery"
            data-testid="restore-recovery"
          >
            <h2
              ref={recoveryHeadingRef}
              className="section-title"
              id={titleId}
              tabIndex={-1}
            >
              {phase.status === "rolled_back"
                ? "Obnovu se nepodařilo dokončit"
                : "Obnovu se nepodařilo bezpečně dokončit"}
            </h2>
            <p
              className="dashboard-restore-dialog__error"
              role="alert"
              data-testid="restore-recovery-message"
            >
              {phase.status === "rolled_back"
                ? "Obnovu se nepodařilo dokončit. Původní data se podařilo obnovit."
                : phase.status === "fatal_partial"
                  ? "Obnovu se nepodařilo dokončit a původní stav se nepodařilo zcela obnovit."
                  : "Obnovu se nepodařilo bezpečně dokončit. Před další prací obnovte stránku."}
            </p>
            {phase.status === "fatal_partial" ? (
              <p className="muted-text">
                Obnovení stránky stav neopraví; pouze znovu načte data, která jsou nyní v
                úložišti. Po obnovení stránky můžete použít Správu dat nebo smazání všech dat
                aplikace.
              </p>
            ) : (
              <p className="muted-text">
                Zobrazená data nemusí odpovídat úložišti. Pokračujte až po obnovení stránky.
              </p>
            )}
            <div className="dashboard-restore-dialog__actions">
              <button
                type="button"
                className="btn primary"
                onClick={handleExplicitReload}
                data-testid="restore-reload-page"
              >
                Obnovit stránku
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="glossary-modal__head">
              <div>
                <h2 className="section-title" id={titleId}>
                  Obnova ze zálohy
                </h2>
                <p id={descriptionId} className="muted-text">
                  Vyberte JSON soubor centrální zálohy, zkontrolujte náhled a potvrďte obnovu.
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

            {phase.status === "applying" ? (
              <p className="muted-text" role="status" data-testid="restore-applying">
                Obnovuji data… Nezavírejte stránku.
              </p>
            ) : null}

            {phase.status === "no_changes" ? (
              <p
                ref={statusRef}
                className="muted-text"
                role="status"
                tabIndex={-1}
                data-testid="restore-no-changes"
              >
                Záloha neobsahovala žádná data, která by bylo potřeba změnit.
              </p>
            ) : null}

            {phase.status === "rejected" ? (
              <div data-testid="restore-rejected">
                <p
                  ref={statusRef}
                  className="dashboard-restore-dialog__error"
                  role="alert"
                  tabIndex={-1}
                >
                  Stav aplikace se od vytvoření náhledu změnil a obnovu nyní nelze bezpečně
                  provést.
                </p>
                <div className="dashboard-restore-dialog__actions">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleRefreshPreview}
                    data-testid="restore-refresh-preview"
                  >
                    Načíst náhled znovu
                  </button>
                </div>
              </div>
            ) : null}

            {phase.status === "snapshot_failed" ? (
              <p
                ref={statusRef}
                className="dashboard-restore-dialog__error"
                role="alert"
                tabIndex={-1}
                data-testid="restore-snapshot-failed"
              >
                Obnovu se nepodařilo zahájit. Data nebyla změněna.
              </p>
            ) : null}

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

            {phase.status !== "applying" ? (
              <>
                <div className="dashboard-restore-dialog__file">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    disabled={controlsDisabled}
                    style={{ display: "none" }}
                    data-testid="restore-file-input"
                  />
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleChooseFile}
                    disabled={controlsDisabled}
                    data-testid="restore-choose-file"
                  >
                    {phase.status === "loading" ? "Načítám soubor…" : "Vybrat soubor zálohy"}
                  </button>
                </div>

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
                          Data modulů, které v záloze nejsou, zůstanou v tomto prohlížeči beze
                          změny.
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
                            {preview.blockedMessage ??
                              "Záloha obsahuje poškozená nebo nepodporovaná data."}
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
                        {shouldShowFullResetSoftCta(preview.conflictCategory) ? (
                          <div className="dashboard-restore-dialog__actions">
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={handleFullResetSoftCta}
                              data-testid="restore-full-reset-soft-cta"
                            >
                              Přejít ke smazání všech dat
                            </button>
                          </div>
                        ) : null}
                      </section>
                    ) : null}

                    {showConfirmation ? (
                      <>
                        <section
                          className="dashboard-restore-dialog__section dashboard-restore-dialog__current-backup"
                          data-testid="restore-current-backup"
                        >
                          <h3 className="dashboard-restore-dialog__subtitle">
                            Před obnovením doporučujeme stáhnout současnou zálohu
                          </h3>
                          <p className="muted-text">
                            Můžete pokračovat i bez stažení — obnova vyžaduje pouze explicitní
                            potvrzení níže.
                          </p>
                          <button
                            type="button"
                            className="btn primary"
                            onClick={handleCurrentBackup}
                            disabled={controlsDisabled || backupStatus.status === "running"}
                            data-testid="restore-current-backup-cta"
                          >
                            {backupStatus.status === "running"
                              ? "Připravuji zálohu…"
                              : "Stáhnout současnou zálohu"}
                          </button>
                          <p
                            ref={backupStatusRef}
                            className={
                              backupStatus.status === "partial" || backupStatus.status === "error"
                                ? "dashboard-restore-dialog__error"
                                : "muted-text"
                            }
                            role={
                              backupStatus.status === "partial" || backupStatus.status === "error"
                                ? "alert"
                                : "status"
                            }
                            aria-live={
                              backupStatus.status === "partial" || backupStatus.status === "error"
                                ? undefined
                                : "polite"
                            }
                            tabIndex={-1}
                            data-testid="restore-current-backup-status"
                          >
                            {backupStatus.status === "download_started"
                              ? "Stažení zálohy bylo zahájeno."
                              : backupStatus.status === "partial"
                                ? "Stažení zálohy bylo zahájeno, ale některá data se do ní nepodařilo zahrnout."
                                : backupStatus.status === "error"
                                  ? "Současnou zálohu se nepodařilo stáhnout. Obnovu můžete zkusit znovu po novém potvrzení."
                                  : ""}
                          </p>
                        </section>

                        <section
                          className="dashboard-restore-dialog__section dashboard-restore-dialog__safety"
                          data-testid="restore-safety-warnings"
                        >
                          <p className="muted-text">
                            Než budete pokračovat, zavřete ostatní panely nebo okna Ředitelského
                            průvodce.
                          </p>
                          <p className="muted-text">
                            Během obnovy stránku nezavírejte ani neobnovujte.
                          </p>
                        </section>

                        <section
                          className="dashboard-restore-dialog__section dashboard-restore-dialog__confirmation"
                          data-testid="restore-confirmation"
                        >
                          <label className="field" htmlFor={confirmationInputId}>
                            <span className="field__label">
                              Pro potvrzení obnovy napište {RESTORE_CONFIRMATION_TOKEN}
                            </span>
                            <input
                              id={confirmationInputId}
                              className="input"
                              value={confirmationToken}
                              onChange={(event) => setConfirmationToken(event.target.value)}
                              autoComplete="off"
                              disabled={controlsDisabled}
                              data-testid="restore-confirmation-token"
                            />
                          </label>
                          <div className="dashboard-restore-dialog__actions">
                            <button
                              type="button"
                              className="btn primary"
                              disabled={!applyEnabled}
                              onClick={handleApply}
                              data-testid="restore-apply"
                            >
                              Obnovit data
                            </button>
                          </div>
                        </section>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
