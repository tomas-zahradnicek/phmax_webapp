import type { CalculatorViewMode } from "../calculator-view-mode";
import { INLINE_VALIDATION_MSG_POSITIVE_INTEGER } from "../calculator-ui-constants";
import { FieldWhyPhmaxDetails } from "../FieldWhyPhmax";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import { round2 } from "../phmax-zs-logic";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import { ZsModuleGate } from "../ZsModuleGate";
import type { ZsPhmaxBand } from "./ZsPhmaxBasicSection";

export type ZsPhmaxSec16SectionProps = {
  viewMode: CalculatorViewMode;
  showFirst: boolean;
  showSecond: boolean;
  firstClasses: number;
  firstPupils: number;
  secondClasses: number;
  secondPupils: number;
  onFirstClassesChange: (value: number) => void;
  onFirstPupilsChange: (value: number) => void;
  onSecondClassesChange: (value: number) => void;
  onSecondPupilsChange: (value: number) => void;
  firstAvg: number;
  secondAvg: number;
  firstBand: ZsPhmaxBand;
  secondBand: ZsPhmaxBand;
  firstPhmax: number;
  secondPhmax: number;
  totalPhmax: number;
};

export function ZsPhmaxSec16Section({
  viewMode,
  showFirst,
  showSecond,
  firstClasses,
  firstPupils,
  secondClasses,
  secondPupils,
  onFirstClassesChange,
  onFirstPupilsChange,
  onSecondClassesChange,
  onSecondPupilsChange,
  firstAvg,
  secondAvg,
  firstBand,
  secondBand,
  firstPhmax,
  secondPhmax,
  totalPhmax,
}: ZsPhmaxSec16SectionProps) {
  if (!showFirst && !showSecond) return null;

  return (
    <ZsModuleGate sectionId="sec16" title="Třídy podle § 16 odst. 9" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-support"
        data-section="sec16"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>
          Třídy podle <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />
        </h2>
        <FieldWhyPhmaxDetails summary="Proč má § 16/9 vlastní vstupy a výsledek?">
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              Třídy podle <strong>§ 16 odst. 9 školského zákona</strong> se v metodice ZV vyhodnocují{" "}
              <strong>odděleně od běžných tříd</strong> – mají vlastní tabulku pásma podle průměru žáků a vlastní PHmax za
              stupeň.
            </li>
            <li>
              Počty tříd a žáků zde určí pásmo stejným principem jako u běžných stupňů – výsledek se pak přičítá k celkovému
              PHmax modulu spolu s ostatními sekcemi režimu.
            </li>
            <li>
              Pokud sekci v režimu školy nepotřebujete, ponechte nuly – blok se do součtu nepromítne; při vyplnění jedné strany
              stupně doplňte oba údaje (třídy i žáky).
            </li>
          </ul>
        </FieldWhyPhmaxDetails>
        <div className="grid two">
          {showFirst ? (
            <>
              <NumberField label="1. stupeň – třídy" value={firstClasses} onChange={onFirstClassesChange} />
              <NumberField label="1. stupeň – žáci" value={firstPupils} onChange={onFirstPupilsChange} />
              <ResultCard label="1. stupeň – průměrný počet žáků" value={round2(firstAvg)} tone="primary" />
              <ResultCard
                label="1. stupeň – pásmo a PHmax na 1 třídu"
                value={`${firstBand.label} / ${firstBand.value}`}
                tone="primary"
              />
              <ResultCard label="1. stupeň – výsledek PHmax" value={firstPhmax} tone="success" />
              <ResultCard
                label="1. stupeň – počet tříd × PHmax"
                value={`${firstClasses} × ${firstBand.value}`}
                tone="success"
              />
            </>
          ) : null}
          {showSecond ? (
            <>
              <NumberField label="2. stupeň – třídy" value={secondClasses} onChange={onSecondClassesChange} />
              <NumberField label="2. stupeň – žáci" value={secondPupils} onChange={onSecondPupilsChange} />
              <ResultCard label="2. stupeň – průměrný počet žáků" value={round2(secondAvg)} tone="primary" />
              <ResultCard
                label="2. stupeň – pásmo a PHmax na 1 třídu"
                value={`${secondBand.label} / ${secondBand.value}`}
                tone="primary"
              />
              <ResultCard label="2. stupeň – výsledek PHmax" value={secondPhmax} tone="success" />
              <ResultCard
                label="2. stupeň – počet tříd × PHmax"
                value={`${secondClasses} × ${secondBand.value}`}
                tone="success"
              />
            </>
          ) : null}
        </div>
        {(showFirst && (firstClasses <= 0 || firstPupils <= 0)) ||
        (showSecond && (secondClasses <= 0 || secondPupils <= 0)) ? (
          <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
            {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} Pro výpočet tříd podle § 16/9 vyplňte třídy i žáky v aktivní části.
          </p>
        ) : null}
        <div className="grid three section-results-strip">
          {showFirst ? (
            <ResultCard
              methodStepLabel="PHmax § 16/9 – 1. stupeň"
              label={
                <>
                  PHmax <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> – 1. stupeň
                </>
              }
              value={firstPhmax}
              tone="success"
            />
          ) : null}
          {showSecond ? (
            <ResultCard
              methodStepLabel="PHmax § 16/9 – 2. stupeň"
              label={
                <>
                  PHmax <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> – 2. stupeň
                </>
              }
              value={secondPhmax}
              tone="success"
            />
          ) : null}
          <ResultCard
            methodStepLabel="PHmax § 16/9 – celkem"
            label={
              <>
                PHmax <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> – celkem
              </>
            }
            value={totalPhmax}
            tone="success"
          />
        </div>
      </section>
    </ZsModuleGate>
  );
}
