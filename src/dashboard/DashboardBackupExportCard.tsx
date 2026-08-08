import React, { useCallback, useEffect, useRef, useState } from "react";
import { exportAppBackup, previewBackupModuleStatuses } from "../backup/backup-export";
import type { BackupModuleStatus } from "../backup/backup-types";
import { DashboardFullResetDialog } from "./DashboardFullResetDialog";

const BACKUP_STATUS_MESSAGES = {
  storage_unavailable:
    "Ukládání v prohlížeči není dostupné. Zkuste jiný prohlížeč nebo vypněte režim soukromého prohlížení.",
  download_failed: "Stažení zálohy se nepodařilo. Zkuste to znovu nebo použijte jiný prohlížeč.",
  no_modules: "Export zálohy se nepodařil.",
} as const;

function moduleStatusLabel(status: BackupModuleStatus): string {
  if (status.error) return "Nepodařilo se načíst";
  return status.hasData ? "Obsahuje data" : "Bez uložených dat";
}

/** Centrální export JSON zálohy dat aplikace (fáze 1 – bez importu). */
export function DashboardBackupExportCard() {
  const [moduleStatuses, setModuleStatuses] = useState<BackupModuleStatus[]>(() => previewBackupModuleStatuses());
  const [exportBusy, setExportBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [fullResetOpen, setFullResetOpen] = useState(false);
  const fullResetTriggerRef = useRef<HTMLButtonElement>(null);

  const refreshStatuses = useCallback(() => {
    setModuleStatuses(previewBackupModuleStatuses());
  }, []);

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const handleDownload = useCallback(() => {
    setExportBusy(true);
    setStatusMessage("");
    try {
      const result = exportAppBackup();
      if (!result.ok) {
        setStatusMessage(BACKUP_STATUS_MESSAGES[result.reason] ?? "Export zálohy se nepodařil.");
        return;
      }
      setStatusMessage(`Záloha byla stažena jako soubor ${result.filename}.`);
      refreshStatuses();
    } finally {
      setExportBusy(false);
    }
  }, [refreshStatuses]);

  const modulesWithData = moduleStatuses.filter((status) => status.hasData).length;

  return (
    <section
      className="card section-card dash-backup-export"
      aria-labelledby="dash-backup-export-heading"
      data-testid="dash-backup-export-card"
    >
      <h2 id="dash-backup-export-heading" className="section-title">
        Záloha a obnova dat
      </h2>
      <p className="muted-text">
        Stáhněte bezpečnou JSON zálohu podporovaných modulů aplikace. Soubor může obsahovat údaje o škole — uložte
        ho na zabezpečené místo (šifrovaný disk, školní úložiště s přístupovými právy). Data se neodesílají na
        server.
      </p>

      <h3 className="dash-backup-export__subtitle">Co bude zahrnuto do zálohy</h3>
      <ul className="dash-backup-export__module-list" data-testid="dash-backup-module-list">
        {moduleStatuses.map((status) => (
          <li key={status.id} className="dash-backup-export__module-item" data-testid={`dash-backup-module-${status.id}`}>
            <span className="dash-backup-export__module-label">{status.label}</span>
            <span
              className={
                status.hasData
                  ? "dash-backup-export__module-state dash-backup-export__module-state--has-data"
                  : "dash-backup-export__module-state"
              }
            >
              {moduleStatusLabel(status)}
            </span>
          </li>
        ))}
      </ul>

      <p className="muted-text dash-backup-export__summary" data-testid="dash-backup-export-summary">
        {modulesWithData > 0
          ? `Do zálohy bude zahrnuto ${modulesWithData} modulů s uloženými daty. Moduly bez dat se do souboru nezapisují.`
          : "Aktuálně nemáte uložená data v podporovaných modulech — stažený soubor bude obsahovat prázdný obal zálohy."}
      </p>

      <div className="dash-card__actions dash-backup-export__actions">
        <button
          type="button"
          className="btn primary"
          data-testid="dash-backup-download"
          aria-label="Stáhnout zálohu dat aplikace"
          disabled={exportBusy}
          onClick={handleDownload}
        >
          {exportBusy ? "Připravuji zálohu…" : "Stáhnout zálohu"}
        </button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="dash-backup-export__status"
        data-testid="dash-backup-export-status"
      >
        {statusMessage}
      </div>

      <div className="dash-backup-export__import-placeholder" data-testid="dash-backup-import-placeholder">
        <h3 className="dash-backup-export__subtitle">Obnova ze zálohy</h3>
        <p className="muted-text">
          Import a výběr modulů pro obnovu připravujeme v další verzi. Zatím použijte export pro bezpečné uložení
          dat mimo prohlížeč.
        </p>
      </div>

      <div
        id="sprava-dat-prohlizece"
        className="dash-backup-export__full-reset"
        data-testid="dash-full-reset-entry"
      >
        <h3 className="dash-backup-export__subtitle">Správa dat v tomto prohlížeči</h3>
        <p className="muted-text">
          Full Reset odstraní data Ředitelského průvodce uložená v tomto prohlížeči. Netýká se jiného zařízení ani
          případného serverového účtu.
        </p>
        <button
          ref={fullResetTriggerRef}
          type="button"
          className="btn danger"
          onClick={() => setFullResetOpen(true)}
          data-testid="full-reset-open"
        >
          Odstranit všechna data aplikace
        </button>
      </div>

      <DashboardFullResetDialog
        open={fullResetOpen}
        onClose={() => setFullResetOpen(false)}
        triggerRef={fullResetTriggerRef}
      />
    </section>
  );
}
