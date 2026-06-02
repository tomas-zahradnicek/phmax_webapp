import React from "react";
import { HeroActionsDrawer } from "../HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconAddTableRow,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconSpinner,
} from "../HeroActionIconButton";
import { HeroCompactToolbar } from "../HeroCompactToolbar";
import { OwnDataHint } from "../OwnDataHint";
import {
  ADVANCED_AUDIT_GROUP_LABEL,
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
} from "../calculator-ui-constants";

export type Nv75HeroToolbarProps = {
  onAddRow: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void | Promise<void>;
  xlsxExportBusy: boolean;
  onPrintSummary: () => void;
  lastSavedAt: string;
  namedSaveName: string;
  setNamedSaveName: (value: string) => void;
  namedSnapshots: { id: string; name: string; savedAt: string }[];
  selectedNamedId: string;
  setSelectedNamedId: (id: string) => void;
  onSaveNamedSnapshot: () => void;
  onRestoreNamedSnapshot: () => void;
  onCompareWithNamedSnapshot: () => void;
  onCopySummary: () => void;
  onResetAll: () => void;
};

export function Nv75HeroToolbar({
  onAddRow,
  onExportCsv,
  onExportXlsx,
  xlsxExportBusy,
  onPrintSummary,
  lastSavedAt,
  namedSaveName,
  setNamedSaveName,
  namedSnapshots,
  selectedNamedId,
  setSelectedNamedId,
  onSaveNamedSnapshot,
  onRestoreNamedSnapshot,
  onCompareWithNamedSnapshot,
  onCopySummary,
  onResetAll,
}: Nv75HeroToolbarProps) {
  return (
    <section className="hero-zone-actions hero-zone-actions--toolbar" aria-label="Akce výpočtu NV75">
      <OwnDataHint variant="hero" />
      <div className="hero-zone-actions__toolbar-row">
        <HeroActionsDrawer>
          <HeroCompactToolbar
            primary={
              <>
                <HeroIconActionButton
                  showLabel
                  className="btn ghost hero-actions-tiered__cta"
                  label="Přidat řádek"
                  icon={<IconAddTableRow />}
                  onClick={onAddRow}
                />
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label="Export CSV"
                  icon={<IconCsv />}
                  onClick={onExportCsv}
                />
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label={xlsxExportBusy ? "Připravuji Excel…" : "Export Excel"}
                  icon={xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                  disabled={xlsxExportBusy}
                  aria-busy={xlsxExportBusy}
                  onClick={() => void onExportXlsx()}
                />
                <HeroIconActionButton
                  showLabel
                  className="btn btn--light"
                  label="Tisk stránky"
                  icon={<IconPrint />}
                  onClick={() => window.print()}
                />
                <HeroIconActionButton
                  showLabel
                  className="btn btn--light"
                  label="Tisk shrnutí"
                  icon={<IconPrintSummary />}
                  onClick={onPrintSummary}
                />
              </>
            }
            backups={
              <>
                <p className="hero-actions-tiered__hint">
                  Průběh se ukládá automaticky v prohlížeči
                  {lastSavedAt ? ` (naposledy ${lastSavedAt})` : ""}. Pojmenované scénáře pro porovnání variant:
                </p>
                <div className="hero-named-grid hero-named-grid--simple hero-actions-tiered__named" aria-label="Pojmenované scénáře">
                  <label className="hero-named-field hero-named-field--backup-name">
                    <span className="field__label field__label--hero-named">{NAMED_BACKUPS_NAME_LABEL}</span>
                    <input
                      type="text"
                      className="input"
                      placeholder="např. varianta 2026/27"
                      value={namedSaveName}
                      onChange={(e) => setNamedSaveName(e.target.value)}
                      aria-label="Název pojmenované zálohy"
                    />
                  </label>
                  <div className="hero-named-field hero-named-field--save">
                    <button type="button" className="btn ghost btn--hero-named" onClick={onSaveNamedSnapshot}>
                      {NAMED_BACKUPS_SAVE_LABEL}
                    </button>
                  </div>
                  <div className="hero-named-field hero-named-field--select">
                    <select
                      className="input"
                      value={selectedNamedId}
                      onChange={(e) => setSelectedNamedId(e.target.value)}
                      aria-label="Vybrat uloženou zálohu"
                    >
                      <option value="">{NAMED_BACKUPS_SELECT_PLACEHOLDER}</option>
                      {namedSnapshots.map((snap) => (
                        <option key={snap.id} value={snap.id}>
                          {snap.name} ({new Date(snap.savedAt).toLocaleString("cs-CZ")})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hero-named-field hero-named-field--restore-delete">
                    <button type="button" className="btn ghost btn--hero-named" onClick={onRestoreNamedSnapshot}>
                      Obnovit scénář
                    </button>
                  </div>
                </div>
              </>
            }
            technical={
              <>
                <button type="button" className="btn ghost btn--hero-named ux-expert-only" onClick={onCompareWithNamedSnapshot}>
                  {NAMED_BACKUPS_COMPARE_JSON_LABEL}
                </button>
                <p className="hero-actions-tiered__hint ux-expert-only">{ADVANCED_AUDIT_GROUP_LABEL}</p>
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label="Kopírovat shrnutí"
                  icon={<IconCopy />}
                  onClick={() => void onCopySummary()}
                />
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label="Vymazat formulář"
                  icon={<IconResetAll />}
                  onClick={onResetAll}
                />
              </>
            }
          />
        </HeroActionsDrawer>
      </div>
    </section>
  );
}
