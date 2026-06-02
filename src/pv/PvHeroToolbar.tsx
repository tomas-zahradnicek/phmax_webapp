import React from "react";
import { HeroExampleSelect, type HeroExampleSelectGroup } from "../HeroExampleSelect";
import { HeroActionsDrawer } from "../HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSpinner,
} from "../HeroActionIconButton";
import { HeroCompactToolbar, HeroToolbarSaveButton } from "../HeroCompactToolbar";
import { OwnDataHint } from "../OwnDataHint";
import { CompareVariantsPanel } from "../CompareVariantsPanel";
import type { CompareProductVariantsResult } from "../phmax-product-compare";
import {
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_DELETE_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_RESTORE_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
  namedBackupsMicrocopy,
} from "../calculator-ui-constants";
import type { PvHeroExampleKey } from "../phmax-pv-hero-examples";

export type PvHeroToolbarProps = {
  selectedExample: PvHeroExampleKey | "";
  exampleGroups: HeroExampleSelectGroup[];
  exampleLegend: string;
  selectedExampleMetaTitle: string | null;
  onExampleChange: (key: PvHeroExampleKey) => void;
  maxNamedSnapshots: number;
  onSaveSnapshot: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void | Promise<void>;
  xlsxExportBusy: boolean;
  onPrintSummary: () => void;
  onRestoreSnapshot: () => void;
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
};

export function PvHeroToolbar({
  selectedExample,
  exampleGroups,
  exampleLegend,
  selectedExampleMetaTitle,
  onExampleChange,
  maxNamedSnapshots,
  onSaveSnapshot,
  onExportCsv,
  onExportXlsx,
  xlsxExportBusy,
  onPrintSummary,
  onRestoreSnapshot,
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
}: PvHeroToolbarProps) {
  return (
    <section className="hero-zone-actions hero-zone-actions--toolbar" aria-label="Akce výpočtu">
      <OwnDataHint variant="hero" />
      <div className="hero-zone-actions__toolbar-row">
        <div className="field field--hero-select hero-actions__example hero-pv-example-select">
          <span className="field__label field__label--hero" id="pv-hero-example-label">
            Ukázkový příklad
          </span>
          <HeroExampleSelect
            id="pv-hero-example-select"
            aria-labelledby="pv-hero-example-label"
            aria-describedby="pv-hero-example-legend"
            title="Ukázkové příklady z metodiky a z přílohy k PHmax / PHAmax u předškolního vzdělávání. Najeďte na řádek pro detaily."
            value={selectedExample}
            groups={exampleGroups}
            onChange={(key) => onExampleChange(key as PvHeroExampleKey)}
          />
          <p
            id="pv-hero-example-legend"
            className="muted-text"
            style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "48rem", lineHeight: 1.5 }}
          >
            {exampleLegend}
          </p>
          {selectedExampleMetaTitle ? (
            <p className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "48rem", lineHeight: 1.5 }}>
              <strong>Očekávaný výsledek vybrané ukázky:</strong> {selectedExampleMetaTitle}
            </p>
          ) : null}
        </div>

        <HeroActionsDrawer>
          <HeroCompactToolbar
            primary={
              <>
                <HeroToolbarSaveButton onClick={onSaveSnapshot} />
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
                <div className="hero-named-grid hero-named-grid--simple hero-actions-tiered__named" aria-label="Pojmenované zálohy">
                  <p className="hero-actions-tiered__hint">
                    {namedBackupsMicrocopy(maxNamedSnapshots, "kompletní stav pracovišť předškolního výpočtu")}
                  </p>
                  <label className="hero-named-field hero-named-field--backup-name">
                    <span className="field__label field__label--hero-named">{NAMED_BACKUPS_NAME_LABEL}</span>
                    <input
                      type="text"
                      className="input"
                      placeholder="např. varianta A"
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
                    emptyHint="Vyberte pojmenovanou zálohu pro porovnání s aktuálním stavem."
                    exportSlug="pv"
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
