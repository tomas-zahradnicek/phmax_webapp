import type { CalculatorViewMode } from "../calculator-view-mode";
import { INLINE_VALIDATION_MSG_POSITIVE_INTEGER } from "../calculator-ui-constants";
import { FieldWhyPhmaxDetails } from "../FieldWhyPhmax";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import { round2 } from "../phmax-zs-logic";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import { ZsModuleGate } from "../ZsModuleGate";
import { formatPhmaxHours, type ZsPhmaxBand } from "./ZsPhmaxBasicSection";

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

function Sec16StageCard({
  title,
  classesLabel,
  pupilsLabel,
  classes,
  pupils,
  onClassesChange,
  onPupilsChange,
  avg,
  band,
  avgLabel,
  bandLabel,
  hoursLabel,
  stageLabel,
  stagePhmax,
}: {
  title: string;
  classesLabel: string;
  pupilsLabel: string;
  classes: number;
  pupils: number;
  onClassesChange: (value: number) => void;
  onPupilsChange: (value: number) => void;
  avg: number;
  band: ZsPhmaxBand;
  avgLabel: string;
  bandLabel: string;
  hoursLabel: string;
  stageLabel: string;
  stagePhmax: number;
}) {
  return (
    <div className="subcard zs-phmax-stage">
      <h3>{title}</h3>
      <div className="zs-phmax-stage__inputs">
        <p className="zs-phmax-stage__kicker">Zadání</p>
        <div className="grid two">
          <NumberField label={classesLabel} value={classes} onChange={onClassesChange} />
          <NumberField label={pupilsLabel} value={pupils} onChange={onPupilsChange} />
        </div>
      </div>
      <div className="zs-phmax-stage__results zs-phmax-stage__results--derive">
        <p className="zs-phmax-stage__kicker">Průměr a pásmo</p>
        <div className="grid two">
          <ResultCard label={avgLabel} value={round2(avg)} tone="primary" />
          <ResultCard label={bandLabel} value={band.label} tone="primary" />
        </div>
      </div>
      <div className="zs-phmax-stage__results">
        <p className="zs-phmax-stage__kicker">Hodiny</p>
        <div className="grid two">
          <ResultCard label={hoursLabel} value={band.value} tone="success" />
          <ResultCard label={stageLabel} value={stagePhmax} tone="success" />
        </div>
      </div>
    </div>
  );
}

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

  const classCount = (showFirst ? firstClasses : 0) + (showSecond ? secondClasses : 0);
  const pupilCount = (showFirst ? firstPupils : 0) + (showSecond ? secondPupils : 0);
  const statusText =
    classCount !== 0 || pupilCount !== 0 || totalPhmax !== 0
      ? `${classCount} tříd · ${pupilCount} žáků · ${formatPhmaxHours(totalPhmax)} h`
      : undefined;

  return (
    <ZsModuleGate
      sectionId="sec16"
      title="Třídy podle § 16 odst. 9"
      viewMode={viewMode}
      statusText={statusText}
    >
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
        <div className="grid two zs-phmax-stage-row">
          {showFirst ? (
            <Sec16StageCard
              title="1. stupeň"
              classesLabel="1. stupeň – třídy"
              pupilsLabel="1. stupeň – žáci"
              classes={firstClasses}
              pupils={firstPupils}
              onClassesChange={onFirstClassesChange}
              onPupilsChange={onFirstPupilsChange}
              avg={firstAvg}
              band={firstBand}
              avgLabel="1. stupeň – průměrný počet žáků"
              bandLabel="1. stupeň – pásmo"
              hoursLabel="1. stupeň – PHmax na 1 třídu"
              stageLabel="1. stupeň – výsledek PHmax"
              stagePhmax={firstPhmax}
            />
          ) : null}
          {showSecond ? (
            <Sec16StageCard
              title="2. stupeň"
              classesLabel="2. stupeň – třídy"
              pupilsLabel="2. stupeň – žáci"
              classes={secondClasses}
              pupils={secondPupils}
              onClassesChange={onSecondClassesChange}
              onPupilsChange={onSecondPupilsChange}
              avg={secondAvg}
              band={secondBand}
              avgLabel="2. stupeň – průměrný počet žáků"
              bandLabel="2. stupeň – pásmo"
              hoursLabel="2. stupeň – PHmax na 1 třídu"
              stageLabel="2. stupeň – výsledek PHmax"
              stagePhmax={secondPhmax}
            />
          ) : null}
        </div>
        {(showFirst && (firstClasses <= 0 || firstPupils <= 0)) ||
        (showSecond && (secondClasses <= 0 || secondPupils <= 0)) ? (
          <p className="muted-text field-validation-warning">
            {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} Pro výpočet tříd podle § 16/9 vyplňte třídy i žáky v aktivní části.
          </p>
        ) : null}
        <div className="zs-phmax-stage-total">
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
