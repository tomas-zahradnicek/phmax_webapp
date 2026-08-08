import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  downloadBackupBeforeFullReset,
  executeFullApplicationReset,
  type FullResetBackupAttemptResult,
} from "../application-full-reset-flow";
import { useModalDialogA11y } from "../modal-dialog-a11y";

const FULL_RESET_CONFIRMATION_TOKEN = "SMAZAT";

type BackupState =
  | { status: "idle" }
  | { status: "running" }
  | FullResetBackupAttemptResult;

type ResetPhase = "ready" | "running" | "failed";

type DashboardFullResetDialogProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export function DashboardFullResetDialog({
  open,
  onClose,
  triggerRef,
}: DashboardFullResetDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backupStatusRef = useRef<HTMLParagraphElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const resetLockRef = useRef(false);
  const [confirmationToken, setConfirmationToken] = useState("");
  const [backupState, setBackupState] = useState<BackupState>({ status: "idle" });
  const [resetPhase, setResetPhase] = useState<ResetPhase>("ready");

  const canClose = resetPhase === "ready";
  const handleClose = useCallback(() => {
    if (!canClose) return;
    setConfirmationToken("");
    setBackupState({ status: "idle" });
    resetLockRef.current = false;
    onClose();
  }, [canClose, onClose]);

  useModalDialogA11y({
    open,
    onClose: handleClose,
    panelRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: triggerRef,
  });

  useEffect(() => {
    if (
      backupState.status === "partial" ||
      backupState.status === "error"
    ) {
      backupStatusRef.current?.focus();
    }
  }, [backupState.status]);

  useEffect(() => {
    if (resetPhase === "failed") {
      retryButtonRef.current?.focus();
    }
  }, [resetPhase]);

  const handleBackup = useCallback(() => {
    if (backupState.status === "running" || resetPhase !== "ready") return;
    setBackupState({ status: "running" });
    setBackupState(downloadBackupBeforeFullReset());
  }, [backupState.status, resetPhase]);

  const runReset = useCallback(() => {
    if (resetLockRef.current) return;
    resetLockRef.current = true;
    setResetPhase("running");

    const finishFailedAttempt = () => {
      setResetPhase("failed");
      queueMicrotask(() => {
        resetLockRef.current = false;
      });
    };

    try {
      const result = executeFullApplicationReset();
      if (!result.ok) {
        finishFailedAttempt();
      }
    } catch {
      finishFailedAttempt();
    }
  }, []);

  const handleInitialReset = useCallback(() => {
    if (
      confirmationToken !== FULL_RESET_CONFIRMATION_TOKEN ||
      resetPhase !== "ready"
    ) {
      return;
    }
    runReset();
  }, [confirmationToken, resetPhase, runReset]);

  if (!open) return null;

  const resetFailed = resetPhase === "failed";
  const resetRunning = resetPhase === "running";
  const backupRunning = backupState.status === "running";

  const dialog = (
    <div
      className="glossary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="full-reset-dialog"
    >
      <div
        className="glossary-modal__backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="glossary-modal__panel dashboard-full-reset-dialog"
        tabIndex={-1}
      >
        <div className="glossary-modal__head">
          <div>
            <h2 className="section-title" id={titleId}>
              Odstranit všechna data aplikace
            </h2>
            <p id={descriptionId} className="muted-text">
              Odstraní data Ředitelského průvodce uložená v tomto prohlížeči.
              Netýká se jiného zařízení ani případného serverového účtu.
            </p>
          </div>
          {!resetFailed ? (
            <button
              ref={closeButtonRef}
              type="button"
              className="btn ghost"
              onClick={handleClose}
              disabled={resetRunning}
            >
              Zavřít
            </button>
          ) : null}
        </div>

        {resetFailed ? (
          <div className="dashboard-full-reset-dialog__recovery">
            <p
              className="dashboard-full-reset-dialog__error"
              role="alert"
              data-testid="full-reset-error"
            >
              Nepodařilo se odstranit všechna data aplikace. Část dat již mohla
              být odstraněna a část může v tomto prohlížeči zůstat.
            </p>
            <p className="muted-text">
              Zkuste reset znovu, nebo aplikaci výslovně obnovte. Do té doby
              nelze dialog běžně zavřít.
            </p>
            <div className="dashboard-full-reset-dialog__actions">
              <button
                ref={retryButtonRef}
                type="button"
                className="btn danger"
                onClick={runReset}
                data-testid="full-reset-retry"
              >
                Zkusit znovu
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => window.location.reload()}
                data-testid="full-reset-reload"
              >
                Obnovit stránku
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="dashboard-full-reset-dialog__scope">
              <p>
                Odstraní se profil školy, data kalkulaček, uložené varianty,
                výroční zpráva a další data Ředitelského průvodce uložená v
                tomto prohlížeči.
              </p>
              <p>
                Operaci nelze vrátit zpět bez dostupné zálohy. Některá lokální
                nastavení, pomocná data ani rozpracované údaje v rychlých
                kalkulačkách nejsou součástí centrální zálohy.
              </p>
              <p>
                Pokud máte Ředitelského průvodce otevřeného v jiném panelu nebo
                okně, nejprve jej zavřete.
              </p>
              <details>
                <summary>Co obsahuje centrální záloha</summary>
                <p className="muted-text">
                  Centrální záloha obsahuje hlavní data aplikace, například
                  profil školy, identitu, data kalkulaček, uložené varianty a
                  výroční zprávu. Obnovu ze zálohy lze provést v části
                  Záloha a obnova dat na Dashboardu.
                </p>
              </details>
            </div>

            <div className="dashboard-full-reset-dialog__backup">
              <h3 className="dashboard-full-reset-dialog__subtitle">
                Doporučená záloha
              </h3>
              <p className="muted-text">
                Před resetem doporučujeme uložit hlavní data mimo prohlížeč.
                Reset můžete provést i bez nové zálohy.
              </p>
              <button
                type="button"
                className="btn primary"
                onClick={handleBackup}
                disabled={backupRunning || resetRunning}
                data-testid="full-reset-backup"
              >
                {backupRunning
                  ? "Připravuji centrální zálohu…"
                  : "Stáhnout centrální zálohu"}
              </button>
              <p
                ref={backupStatusRef}
                className={
                  backupState.status === "partial" ||
                  backupState.status === "error"
                    ? "dashboard-full-reset-dialog__error"
                    : "muted-text"
                }
                role={
                  backupState.status === "partial" ||
                  backupState.status === "error"
                    ? "alert"
                    : "status"
                }
                aria-live={
                  backupState.status === "partial" ||
                  backupState.status === "error"
                    ? undefined
                    : "polite"
                }
                tabIndex={-1}
                data-testid="full-reset-backup-status"
              >
                {backupState.status === "complete"
                  ? "Stažení centrální zálohy bylo zahájeno."
                  : backupState.status === "partial"
                    ? "Stažení centrální zálohy bylo zahájeno, ale některá data se do ní nepodařilo zahrnout."
                    : backupState.status === "error"
                      ? "Centrální zálohu se nepodařilo stáhnout. Reset nebyl spuštěn."
                      : ""}
              </p>
            </div>

            <div className="dashboard-full-reset-dialog__confirmation">
              <label
                className="field"
                htmlFor="full-reset-confirmation-token"
              >
                <span className="field__label">
                  Pro potvrzení napište SMAZAT
                </span>
                <input
                  id="full-reset-confirmation-token"
                  className="input"
                  value={confirmationToken}
                  onChange={(event) =>
                    setConfirmationToken(event.target.value)
                  }
                  autoComplete="off"
                  disabled={resetRunning}
                  data-testid="full-reset-token"
                />
              </label>
              <div className="dashboard-full-reset-dialog__actions">
                <button
                  type="button"
                  className="btn danger"
                  disabled={
                    confirmationToken !== FULL_RESET_CONFIRMATION_TOKEN ||
                    resetRunning
                  }
                  onClick={handleInitialReset}
                  data-testid="full-reset-confirm"
                >
                  {resetRunning
                    ? "Odstraňuji data…"
                    : "Odstranit všechna data aplikace"}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleClose}
                  disabled={resetRunning}
                >
                  Zrušit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
