import type { CalculatorViewMode } from "../calculator-view-mode";
import { MixedStageTable } from "../MixedStageTable";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import { ZsModuleGate } from "../ZsModuleGate";
import { ZsFieldHint } from "./zs-field-hint";
import type { ZsPhmaxBand } from "./ZsPhmaxBasicSection";

export type ZsPhmaxMixedSectionProps = {
  viewMode: CalculatorViewMode;
  validationHighlight: boolean;
  mixedMethodFirstZsPupils: number;
  mixedMethodFirstZsClasses: number;
  mixedMethodFirstSpecialPupils: number;
  mixedMethodFirstSpecialClasses: number;
  mixedMethodSecondZsPupils: number;
  mixedMethodSecondZsClasses: number;
  mixedMethodSecondSpecialPupils: number;
  mixedMethodSecondSpecialClasses: number;
  mixedMethodFirstZsAvg: number;
  mixedMethodSecondZsAvg: number;
  mixedMethodFirstSpecialAvg: number;
  mixedMethodSecondSpecialAvg: number;
  mixedMethodFirstZsBand: ZsPhmaxBand;
  mixedMethodSecondZsBand: ZsPhmaxBand;
  mixedMethodFirstSpecialBand: ZsPhmaxBand;
  mixedMethodSecondSpecialBand: ZsPhmaxBand;
  mixedMethodFirstZsResult: number;
  mixedMethodSecondZsResult: number;
  mixedMethodFirstSpecialResult: number;
  mixedMethodSecondSpecialResult: number;
  mixedMethodFirstTotal: number;
  mixedMethodSecondTotal: number;
  mixedMethodTotal: number;
  onMixedMethodFirstZsPupilsChange: (value: number) => void;
  onMixedMethodFirstZsClassesChange: (value: number) => void;
  onMixedMethodFirstSpecialPupilsChange: (value: number) => void;
  onMixedMethodFirstSpecialClassesChange: (value: number) => void;
  onMixedMethodSecondZsPupilsChange: (value: number) => void;
  onMixedMethodSecondZsClassesChange: (value: number) => void;
  onMixedMethodSecondSpecialPupilsChange: (value: number) => void;
  onMixedMethodSecondSpecialClassesChange: (value: number) => void;
};

export function ZsPhmaxMixedSection({
  viewMode,
  validationHighlight,
  mixedMethodFirstZsPupils,
  mixedMethodFirstZsClasses,
  mixedMethodFirstSpecialPupils,
  mixedMethodFirstSpecialClasses,
  mixedMethodSecondZsPupils,
  mixedMethodSecondZsClasses,
  mixedMethodSecondSpecialPupils,
  mixedMethodSecondSpecialClasses,
  mixedMethodFirstZsAvg,
  mixedMethodSecondZsAvg,
  mixedMethodFirstSpecialAvg,
  mixedMethodSecondSpecialAvg,
  mixedMethodFirstZsBand,
  mixedMethodSecondZsBand,
  mixedMethodFirstSpecialBand,
  mixedMethodSecondSpecialBand,
  mixedMethodFirstZsResult,
  mixedMethodSecondZsResult,
  mixedMethodFirstSpecialResult,
  mixedMethodSecondSpecialResult,
  mixedMethodFirstTotal,
  mixedMethodSecondTotal,
  mixedMethodTotal,
  onMixedMethodFirstZsPupilsChange,
  onMixedMethodFirstZsClassesChange,
  onMixedMethodFirstSpecialPupilsChange,
  onMixedMethodFirstSpecialClassesChange,
  onMixedMethodSecondZsPupilsChange,
  onMixedMethodSecondZsClassesChange,
  onMixedMethodSecondSpecialPupilsChange,
  onMixedMethodSecondSpecialClassesChange,
}: ZsPhmaxMixedSectionProps) {
  return (
    <ZsModuleGate sectionId="mixed" title="Smíšené třídy a ZŠ speciální" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-mixed mixed-module"
        data-section="mixed"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>
          Smíšené třídy <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" /> a ZŠ speciální{" "}
          <ZsFieldHint text="Podle metodiky se tyto třídy posuzují samostatně podle převažujícího oboru vzdělání. Pokud ve třídě převažuje obor 79-01-C/01, použijí se řádky B9 až B10. Pokud převažuje 79-01-B/01 nebo je počet žáků shodný, použijí se řádky B26 až B28." />
        </h2>
        <p className="muted-text mixed-module__lead">
          Přehled v tabulkách: každý řádek je jeden obor (C/01 běžná ZŠ, B/01 ZŠ speciální). Sloupce vedou od vstupů přes
          průměr a pásmo až po dílčí PHmax; dole je součet za stupeň.
        </p>

        <div className="mixed-module__tables">
          <MixedStageTable
            stageTitle="1. stupeň"
            methodNote="Metodika: řádky B9 (obor 79-01-C/01) a B26 (obor 79-01-B/01), 1. stupeň."
            zsPupils={mixedMethodFirstZsPupils}
            zsClasses={mixedMethodFirstZsClasses}
            zsAvg={mixedMethodFirstZsAvg}
            zsBand={mixedMethodFirstZsBand}
            zsResult={mixedMethodFirstZsResult}
            specPupils={mixedMethodFirstSpecialPupils}
            specClasses={mixedMethodFirstSpecialClasses}
            specAvg={mixedMethodFirstSpecialAvg}
            specBand={mixedMethodFirstSpecialBand}
            specResult={mixedMethodFirstSpecialResult}
            stageTotal={mixedMethodFirstTotal}
            setZsPupils={onMixedMethodFirstZsPupilsChange}
            setZsClasses={onMixedMethodFirstZsClassesChange}
            setSpecPupils={onMixedMethodFirstSpecialPupilsChange}
            setSpecClasses={onMixedMethodFirstSpecialClassesChange}
            emphasizeEmpty={validationHighlight}
          />
          <MixedStageTable
            stageTitle="2. stupeň"
            methodNote="Metodika: řádky B10 (obor 79-01-C/01) a B27 (obor 79-01-B/01), 2. stupeň."
            zsPupils={mixedMethodSecondZsPupils}
            zsClasses={mixedMethodSecondZsClasses}
            zsAvg={mixedMethodSecondZsAvg}
            zsBand={mixedMethodSecondZsBand}
            zsResult={mixedMethodSecondZsResult}
            specPupils={mixedMethodSecondSpecialPupils}
            specClasses={mixedMethodSecondSpecialClasses}
            specAvg={mixedMethodSecondSpecialAvg}
            specBand={mixedMethodSecondSpecialBand}
            specResult={mixedMethodSecondSpecialResult}
            stageTotal={mixedMethodSecondTotal}
            setZsPupils={onMixedMethodSecondZsPupilsChange}
            setZsClasses={onMixedMethodSecondZsClassesChange}
            setSpecPupils={onMixedMethodSecondSpecialPupilsChange}
            setSpecClasses={onMixedMethodSecondSpecialClassesChange}
            emphasizeEmpty={validationHighlight}
          />
        </div>

        <div className="mixed-totals-bar" role="group" aria-label="Souhrn PHmax – smíšené třídy">
          <div className="mixed-totals-bar__cell">
            <span className="mixed-totals-bar__label">1. stupeň</span>
            <span className="mixed-totals-bar__value">{mixedMethodFirstTotal}</span>
          </div>
          <div className="mixed-totals-bar__cell">
            <span className="mixed-totals-bar__label">2. stupeň</span>
            <span className="mixed-totals-bar__value">{mixedMethodSecondTotal}</span>
          </div>
          <div className="mixed-totals-bar__cell mixed-totals-bar__cell--grand">
            <span className="mixed-totals-bar__label">Celkem – smíšené třídy</span>
            <span className="mixed-totals-bar__value">{mixedMethodTotal}</span>
          </div>
        </div>
      </section>
    </ZsModuleGate>
  );
}
