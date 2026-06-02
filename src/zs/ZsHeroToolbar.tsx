import React from "react";
import { HeroExampleSelect } from "../HeroExampleSelect";
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
import { NAMED_BACKUPS_COMPARE_JSON_LABEL } from "../calculator-ui-constants";
import type { ZsHeroExampleKey } from "../zs-hero-example-groups";
import { ZS_HERO_EXAMPLE_GROUPS } from "../zs-hero-example-groups";
import { ZsNamedSnapshotsHeroPanel } from "./ZsNamedSnapshotsHeroPanel";

export type ZsHeroToolbarProps = {
  selectedExample: ZsHeroExampleKey | "";
  exampleLegend: string;
  onExampleChange: (key: ZsHeroExampleKey | "") => void;
  onSaveSnapshot: () => void;
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
};

export function ZsHeroToolbar({
  selectedExample,
  exampleLegend,
  onExampleChange,
  onSaveSnapshot,
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
}: ZsHeroToolbarProps) {
  return (
    <section className="hero-zone-actions hero-zone-actions--toolbar" aria-label="Akce výpočtu">
      <OwnDataHint variant="hero" />
      <div className="hero-zone-actions__toolbar-row">
        <div className="field field--hero-select hero-actions__example hero-zs-example-select">
          <span className="field__label field__label--hero" id="zs-hero-example-label">
            Ukázkový příklad
          </span>
          <HeroExampleSelect
            id="zs-hero-example-select"
            aria-labelledby="zs-hero-example-label"
            aria-describedby="zs-hero-example-legend"
            title="Ukázkové příklady z metodiky ZŠ. Najeďte na konkrétní řádek v seznamu pro stručný výklad situace a předpisů."
            value={selectedExample}
            groups={ZS_HERO_EXAMPLE_GROUPS}
            onChange={(key) => onExampleChange(key as ZsHeroExampleKey | "")}
          />
          <p
            id="zs-hero-example-legend"
            className="muted-text"
            style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}
          >
            {exampleLegend}
          </p>
        </div>
        <HeroActionsDrawer>
          <HeroCompactToolbar
            primary={
              <>
                <HeroToolbarSaveButton onClick={onSaveSnapshot} />
                <HeroIconActionButton
                  showLabel
                  className="btn btn--light"
                  label="Tisk stránky"
                  icon={<IconPrint />}
                  onClick={() => window.print()}
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
                <ZsNamedSnapshotsHeroPanel
                  exportLabel={exportLabel}
                  setExportLabel={setExportLabel}
                  namedSaveName={namedSaveName}
                  setNamedSaveName={setNamedSaveName}
                  namedSnapshots={namedSnapshots}
                  selectedNamedId={selectedNamedId}
                  setSelectedNamedId={setSelectedNamedId}
                  onSave={onSaveNamedSnapshot}
                  onRestore={onRestoreNamedSnapshot}
                  onDelete={onDeleteNamedSnapshot}
                />
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
                    emptyHint="Vyberte pojmenovanou zálohu se součty auditního exportu pro porovnání s aktuálním stavem."
                    exportSlug="zs"
                  />
                </div>
                <HeroIconActionButton
                  showLabel
                  className="btn ghost"
                  label="Kopírovat shrnutí"
                  icon={<IconCopy />}
                  onClick={onCopySummary}
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
