import React from "react";
import { HeroExampleSelect, type HeroExampleSelectGroup } from "../HeroExampleSelect";
import { HeroActionsDrawer } from "../HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconAddTableRow,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconRemoveTableRow,
  IconResetAll,
  IconRestoreQuick,
  IconSpinner,
} from "../HeroActionIconButton";
import { HeroCompactToolbar, HeroToolbarSaveButton } from "../HeroCompactToolbar";
import { OwnDataHint } from "../OwnDataHint";
import { CompareVariantsPanel } from "../CompareVariantsPanel";
import type { CompareProductVariantsResult } from "../phmax-product-compare";
import {
  HERO_EXAMPLE_FIELD_LABEL,
  HERO_EXPORT_TOOLS_LABEL,
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_DELETE_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_RESTORE_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
  namedBackupsMicrocopy,
} from "../calculator-ui-constants";
import type { SsHeroExampleKey } from "./phmax-ss-hero-examples";

export type SsHeroToolbarProps = {
  selectedExample: SsHeroExampleKey | "";
  exampleGroups: HeroExampleSelectGroup[];
  exampleLegend: string;
  selectedExampleMetaTitle: string | null;
  onExampleChange: (key: SsHeroExampleKey) => void;
  maxNamedSnapshots: number;
  addRowLabel: string;
  removeLastRowLabel: string;
  removeLastRowTitle: string;
  onSaveSnapshot: () => void;
  onAddRow: () => void;
  onRemoveLastRow: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void | Promise<void>;
  xlsxExportBusy: boolean;
  onPrintSummary: () => void;
  onRestoreSnapshot: () => void;
  exportLabel: string;
  setExportLabel: (value: string) => void;
  namedSaveName: string;
  setNamedSaveName: (value: string) => void;
  namedSnapshots: { id: string; name: string; savedAt: string }[];
  selectedNamedId: string;
  setSelectedNamedId: (id: string) => void;
  onSaveNamedSnapshot: () => void;
  onRestoreNamedSnapshot: () => void;
  onDeleteNamedSnapshot: () => void;
  onCompareWithNamedSnapshot: () => void;
  onExportAuditJson: () => void;
  comparePreview: CompareProductVariantsResult | null;
  onCopySummary: () => void;
  onClearStored: () => void;
  onResetAll: () => void;
  suppressOwnDataHint?: boolean;
};

export function SsHeroToolbar({
  selectedExample,
  exampleGroups,
  exampleLegend,
  selectedExampleMetaTitle,
  onExampleChange,
  maxNamedSnapshots,
  addRowLabel,
  removeLastRowLabel,
  removeLastRowTitle,
  onSaveSnapshot,
  onAddRow,
  onRemoveLastRow,
  onExportCsv,
  onExportXlsx,
  xlsxExportBusy,
  onPrintSummary,
  onRestoreSnapshot,
  exportLabel,
  setExportLabel,
  namedSaveName,
  setNamedSaveName,
  namedSnapshots,
  selectedNamedId,
  setSelectedNamedId,
  onSaveNamedSnapshot,
  onRestoreNamedSnapshot,
  onDeleteNamedSnapshot,
  onCompareWithNamedSnapshot,
  onExportAuditJson,
  comparePreview,
  onCopySummary,
  onClearStored,
  onResetAll,
  suppressOwnDataHint = false,
}: SsHeroToolbarProps) {
  return (
    <section className="hero-zone-actions hero-zone-actions--toolbar calculator-hero-work-card__body" aria-label="Akce výpočtu">
      {suppressOwnDataHint ? null : <OwnDataHint variant="hero" />}
      <div className="calculator-hero-work-card__start">
        <div className="field field--hero-select hero-actions__example hero-ss-example-select">
          <span className="field__label field__label--hero" id="ss-hero-example-label">
            {HERO_EXAMPLE_FIELD_LABEL}
          </span>
          <HeroExampleSelect
            id="ss-hero-example-select"
            aria-labelledby="ss-hero-example-label"
            aria-describedby="ss-hero-example-legend"
            title="Ukázkový orientační příklad pro SŠ. Po načtení upravte vstupy podle reálné evidence tříd školy."
            value={selectedExample}
            groups={exampleGroups}
            onChange={(key) => onExampleChange(key as SsHeroExampleKey)}
          />
          <p
            id="ss-hero-example-legend"
            className="muted-text"
            style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}
          >
            {exampleLegend}
          </p>
          {selectedExampleMetaTitle ? (
            <p className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}>
              <strong>Tento příklad ilustruje:</strong> {selectedExampleMetaTitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="calculator-hero-work-card__exports">
        <span className="calculator-hero-work-card__section-label">{HERO_EXPORT_TOOLS_LABEL}</span>
        <HeroActionsDrawer>
          <HeroCompactToolbar
            primary={
              <>
                <HeroToolbarSaveButton onClick={onSaveSnapshot} />
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label={addRowLabel}
                  title="Přidá nový řádek na konec tabulky evidence dílčích jednotek níže."
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
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label="Obnovit uložený průběh"
                  icon={<IconRestoreQuick />}
                  onClick={onRestoreSnapshot}
                />
                <div className="hero-named-grid hero-actions-tiered__named" aria-label="Pojmenované zálohy">
                  <p className="hero-actions-tiered__hint">
                    {namedBackupsMicrocopy(maxNamedSnapshots, "kompletní stav řádkové evidence SŠ a označení pro export")}
                  </p>
                  <label className="hero-named-field hero-named-field--export">
                    <span className="field__label field__label--hero-named">Označení pro export</span>
                    <input
                      type="text"
                      className="input"
                      placeholder="např. název školy, školní rok…"
                      value={exportLabel}
                      onChange={(e) => setExportLabel(e.target.value)}
                      aria-label="Označení pro export a shrnutí"
                    />
                  </label>
                  <label className="hero-named-field hero-named-field--backup-name">
                    <span className="field__label field__label--hero-named">{NAMED_BACKUPS_NAME_LABEL}</span>
                    <input
                      type="text"
                      className="input"
                      placeholder="např. stav 2026/27"
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
                      {namedSnapshots.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hero-named-field hero-named-field--restore-delete">
                    <button type="button" className="btn ghost btn--hero-named" onClick={onRestoreNamedSnapshot}>
                      {NAMED_BACKUPS_RESTORE_LABEL}
                    </button>
                    <button type="button" className="btn ghost btn--hero-named" onClick={onDeleteNamedSnapshot}>
                      {NAMED_BACKUPS_DELETE_LABEL}
                    </button>
                  </div>
                </div>
              </>
            }
            technical={
              <>
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label={removeLastRowLabel}
                  title={removeLastRowTitle}
                  icon={<IconRemoveTableRow />}
                  onClick={onRemoveLastRow}
                />
                <button type="button" className="btn ghost btn--hero-named ux-expert-only" onClick={onCompareWithNamedSnapshot}>
                  {NAMED_BACKUPS_COMPARE_JSON_LABEL}
                </button>
                <button type="button" className="btn ghost btn--hero-named ux-expert-only" onClick={onExportAuditJson}>
                  Stáhnout audit (JSON)
                </button>
                <div className="ux-expert-only hero-actions-tiered__compare">
                  <CompareVariantsPanel
                    title="Porovnání 2 variant (náhled)"
                    result={comparePreview}
                    emptyHint="Vyberte pojmenovanou zálohu s validními řádky pro porovnání s aktuálním stavem."
                    exportSlug="ss"
                  />
                </div>
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
                  label="Vymazat uložená data"
                  icon={<IconClearStored />}
                  onClick={onClearStored}
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
