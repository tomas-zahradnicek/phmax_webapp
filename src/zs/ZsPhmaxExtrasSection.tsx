import type { CalculatorViewMode } from "../calculator-view-mode";
import { round2 } from "../phmax-zs-logic";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import { ZsModuleGate } from "../ZsModuleGate";
import { ZsFieldHint } from "./zs-field-hint";

export type ZsPhmaxExtrasSectionProps = {
  viewMode: CalculatorViewMode;
  gateTitle: string;
  showPrepClass: boolean;
  showPrepSpecial: boolean;
  showPar38: boolean;
  showPar41: boolean;
  prepClasses: number;
  prepChildren: number;
  prepSpecialClasses: number;
  prepSpecialChildren: number;
  p38First: number;
  p38Second: number;
  p41First: number;
  p41Second: number;
  onPrepClassesChange: (value: number) => void;
  onPrepChildrenChange: (value: number) => void;
  onPrepSpecialClassesChange: (value: number) => void;
  onPrepSpecialChildrenChange: (value: number) => void;
  onP38FirstChange: (value: number) => void;
  onP38SecondChange: (value: number) => void;
  onP41FirstChange: (value: number) => void;
  onP41SecondChange: (value: number) => void;
  prepAvg: number;
  prepPh: number;
  prepSpecialAvg: number;
  prepSpecialPh: number;
  prepClassPhmax: number;
  prepSpecialPhmax: number;
  par38Phmax: number;
  par41Phmax: number;
};

export function ZsPhmaxExtrasSection({
  viewMode,
  gateTitle,
  showPrepClass,
  showPrepSpecial,
  showPar38,
  showPar41,
  prepClasses,
  prepChildren,
  prepSpecialClasses,
  prepSpecialChildren,
  p38First,
  p38Second,
  p41First,
  p41Second,
  onPrepClassesChange,
  onPrepChildrenChange,
  onPrepSpecialClassesChange,
  onPrepSpecialChildrenChange,
  onP38FirstChange,
  onP38SecondChange,
  onP41FirstChange,
  onP41SecondChange,
  prepAvg,
  prepPh,
  prepSpecialAvg,
  prepSpecialPh,
  prepClassPhmax,
  prepSpecialPhmax,
  par38Phmax,
  par41Phmax,
}: ZsPhmaxExtrasSectionProps) {
  const headingIsPrep =
    showPrepClass || showPrepSpecial;

  return (
    <ZsModuleGate sectionId="extras" title={gateTitle} viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-extras"
        data-section="extras"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>
          {headingIsPrep ? (
            "Samostatné položky PHmax"
          ) : (
            <>
              <ZsLegisRef citeId="zs-par38" label="§ 38" /> a <ZsLegisRef citeId="zs-par41" label="§ 41" /> školského
              zákona (navýšení PHmax)
            </>
          )}{" "}
          <ZsFieldHint text="Za žáka podle § 38 nebo § 41 se celkové PHmax školy navyšuje o 0,25 h (1. stupeň) nebo 0,5 h (2. stupeň) na žáka; tito žáci se nezapočítávají do průměru třídy pro tabulky B1–B28. Aplikace neřeší rozvržení hodin do týdnů – k přímé pedagogické činnosti a úvazku viz výklad MŠMT: https://www.msmt.cz/dokumenty/pravni-vyklad-k-23-zakona-opedagogickych-pracovnicich" />
        </h2>
        <div className="grid four">
          {showPrepClass ? (
            <>
              <NumberField label="Přípravné třídy – počet tříd" value={prepClasses} onChange={onPrepClassesChange} />
              <NumberField label="Přípravné třídy – počet dětí" value={prepChildren} onChange={onPrepChildrenChange} />
              <ResultCard
                label="Přípravná třída – pásmo a PHmax na 1 třídu"
                value={`${prepAvg < 10 ? "méně než 10 dětí" : "10 a více dětí"} / ${prepPh}`}
                tone="primary"
              />
              <ResultCard label="Výsledek – přípravná třída" value={round2(prepClasses * prepPh)} tone="success" />
            </>
          ) : null}

          {showPrepSpecial ? (
            <>
              <NumberField
                label="Přípravný stupeň ZŠS – počet tříd"
                value={prepSpecialClasses}
                onChange={onPrepSpecialClassesChange}
              />
              <NumberField
                label="Přípravný stupeň ZŠS – počet dětí"
                value={prepSpecialChildren}
                onChange={onPrepSpecialChildrenChange}
              />
              <ResultCard
                label="Přípravný stupeň – pásmo a PHmax na 1 třídu"
                value={`${prepSpecialAvg < 4 ? "méně než 4 žáci" : "4 a více žáků"} / ${prepSpecialPh}`}
                tone="primary"
              />
              <ResultCard
                label="Výsledek – přípravný stupeň ZŠS"
                value={round2(prepSpecialClasses * prepSpecialPh)}
                tone="success"
              />
            </>
          ) : null}

          {showPar38 ? (
            <>
              <NumberField
                label={
                  <>
                    <ZsLegisRef citeId="zs-par38" label="§ 38" /> – 1. stupeň
                  </>
                }
                value={p38First}
                onChange={onP38FirstChange}
              />
              <NumberField
                label={
                  <>
                    <ZsLegisRef citeId="zs-par38" label="§ 38" /> – 2. stupeň
                  </>
                }
                value={p38Second}
                onChange={onP38SecondChange}
              />
            </>
          ) : null}

          {showPar41 ? (
            <>
              <NumberField
                label={
                  <>
                    <ZsLegisRef citeId="zs-par41" label="§ 41" /> – 1. stupeň
                  </>
                }
                value={p41First}
                onChange={onP41FirstChange}
              />
              <NumberField
                label={
                  <>
                    <ZsLegisRef citeId="zs-par41" label="§ 41" /> – 2. stupeň
                  </>
                }
                value={p41Second}
                onChange={onP41SecondChange}
              />
            </>
          ) : null}
        </div>
        <div className="grid four section-results-strip">
          {showPrepClass ? <ResultCard label="PHmax – přípravná třída" value={prepClassPhmax} tone="success" /> : null}
          {showPrepSpecial ? (
            <ResultCard label="PHmax – přípravný stupeň ZŠS" value={prepSpecialPhmax} tone="success" />
          ) : null}
          {showPar38 ? (
            <ResultCard
              methodStepLabel="PHmax – § 38"
              label={
                <>
                  PHmax – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                </>
              }
              value={par38Phmax}
              tone="success"
            />
          ) : null}
          {showPar41 ? (
            <ResultCard
              methodStepLabel="PHmax – § 41"
              label={
                <>
                  PHmax – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                </>
              }
              value={par41Phmax}
              tone="success"
            />
          ) : null}
        </div>
      </section>
    </ZsModuleGate>
  );
}
