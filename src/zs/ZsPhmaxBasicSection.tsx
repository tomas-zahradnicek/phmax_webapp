import React from "react";
import { sectionNeedsAttentionClass } from "../calculator-section-focus";
import { INLINE_VALIDATION_MSG_POSITIVE_INTEGER } from "../calculator-ui-constants";
import { FieldWhyPhmaxDetails } from "../FieldWhyPhmax";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import type { BasicType } from "../phmax-zs-logic";
import { round2 } from "../phmax-zs-logic";

export type ZsPhmaxBand = {
  label: string;
  value: number;
};

export type ZsPhmaxCompositionPart = {
  label: string;
  hours: number;
};

/** Hodiny z už spočteného výsledku. Celá čísla bez desetinné čárky. */
export function formatPhmaxHours(value: number): string {
  if (Number.isFinite(value) && Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }
  return value.toLocaleString("cs-CZ", { maximumFractionDigits: 4 });
}

function compositionSentence(
  parts: readonly ZsPhmaxCompositionPart[] | undefined,
  totalPhmax: number | undefined,
): string | null {
  if (!parts || totalPhmax == null) return null;
  const ordinary = parts.find((part) => part.label === "Běžné třídy");
  const extras = parts.filter((part) => part.label !== "Běžné třídy" && part.hours !== 0);
  if (extras.length === 0) return null;
  const pieces = [
    ...(ordinary && ordinary.hours !== 0 ? [`Běžné třídy ${formatPhmaxHours(ordinary.hours)} h`] : []),
    ...extras.map((part) => `${part.label} ${formatPhmaxHours(part.hours)} h`),
  ];
  return `${pieces.join(" + ")} = PHmax ${formatPhmaxHours(totalPhmax)} h`;
}

export type ZsPhmaxBasicSectionProps = {
  hasBasicIssue: boolean;
  showBasicFirst: boolean;
  showBasicSecond: boolean;
  showSchoolVariantFirstOnly: boolean;
  showPrepClass: boolean;
  showPrepSpecial: boolean;
  showPar38: boolean;
  showPar41: boolean;
  basicType: BasicType;
  onBasicTypeChange: (value: BasicType) => void;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  onBasic1ClassesChange: (value: number) => void;
  onBasic1PupilsChange: (value: number) => void;
  onBasic2ClassesChange: (value: number) => void;
  onBasic2PupilsChange: (value: number) => void;
  basic1Avg: number;
  basic2Avg: number;
  basicFirstBand: ZsPhmaxBand;
  basicSecondBand: ZsPhmaxBand;
  basic1Phmax: number;
  basic2Phmax: number;
  basicPhmax: number;
  prepClassPhmax: number;
  prepSpecialPhmax: number;
  par38Phmax: number;
  par41Phmax: number;
  /** Už spočtené složky PHmax. Nulové složky kromě běžných tříd se do věty neberou. */
  compositionParts?: readonly ZsPhmaxCompositionPart[];
  totalPhmax?: number;
};

function BasicStageCard({
  title,
  classes,
  pupils,
  onClassesChange,
  onPupilsChange,
  avg,
  band,
  stagePhmax,
  stageLabel,
  warning,
}: {
  title: string;
  classes: number;
  pupils: number;
  onClassesChange: (value: number) => void;
  onPupilsChange: (value: number) => void;
  avg: number;
  band: ZsPhmaxBand;
  stagePhmax: number;
  stageLabel: string;
  warning: string | null;
}) {
  return (
    <div className="subcard zs-phmax-stage">
      <h3>{title}</h3>
      <div className="zs-phmax-stage__inputs">
        <p className="zs-phmax-stage__kicker">Zadání</p>
        <div className="grid two">
          <NumberField label="Počet tříd" value={classes} onChange={onClassesChange} />
          <NumberField label="Počet žáků" value={pupils} onChange={onPupilsChange} />
        </div>
        {warning ? <p className="muted-text field-validation-warning">{warning}</p> : null}
      </div>
      <div className="zs-phmax-stage__results">
        <p className="zs-phmax-stage__kicker">Výpočet</p>
        <div className="grid two">
          <ResultCard label="Průměrný počet žáků ve třídě" value={round2(avg)} tone="primary" />
          <ResultCard label="Pásmo" value={band.label} tone="primary" />
          <ResultCard label="PHmax na 1 třídu" value={band.value} tone="primary" />
          <ResultCard label={stageLabel} value={stagePhmax} tone="success" />
        </div>
      </div>
    </div>
  );
}

export function ZsPhmaxBasicSection({
  hasBasicIssue,
  showBasicFirst,
  showBasicSecond,
  showSchoolVariantFirstOnly,
  showPrepClass,
  showPrepSpecial,
  showPar38,
  showPar41,
  basicType,
  onBasicTypeChange,
  basic1Classes,
  basic1Pupils,
  basic2Classes,
  basic2Pupils,
  onBasic1ClassesChange,
  onBasic1PupilsChange,
  onBasic2ClassesChange,
  onBasic2PupilsChange,
  basic1Avg,
  basic2Avg,
  basicFirstBand,
  basicSecondBand,
  basic1Phmax,
  basic2Phmax,
  basicPhmax,
  prepClassPhmax,
  prepSpecialPhmax,
  par38Phmax,
  par41Phmax,
  compositionParts,
  totalPhmax,
}: ZsPhmaxBasicSectionProps) {
  const composition = compositionSentence(compositionParts, totalPhmax);
  if (!showBasicFirst && !showBasicSecond && !showSchoolVariantFirstOnly) {
    return null;
  }

  return (
    <section
      className={`card section-card section-card--module section-card--module-basic${sectionNeedsAttentionClass(hasBasicIssue)}`}
      data-section="basic"
      data-wizard-step="2"
      data-phmax-pane="classes"
    >
      <h2>Běžné třídy ZŠ</h2>

      {showSchoolVariantFirstOnly ? (
        <select value={basicType} onChange={(e) => onBasicTypeChange(e.target.value as BasicType)}>
          <option value="first_only_1">Neúplná ZŠ – 1 třída 1. stupně</option>
          <option value="first_only_2">Neúplná ZŠ – 2 třídy 1. stupně</option>
          <option value="first_only_3">Neúplná ZŠ – 3 třídy 1. stupně</option>
          <option value="first_only_4">Neúplná ZŠ – 4 a více tříd 1. stupně</option>
        </select>
      ) : (
        <select value={basicType} onChange={(e) => onBasicTypeChange(e.target.value as BasicType)}>
          <option value="full_more_than_2">Úplná ZŠ – více než 2 třídy v některém ročníku</option>
          <option value="full_max_2">Úplná ZŠ – nejvýše 2 třídy v každém ročníku</option>
        </select>
      )}

      <div className="grid two zs-phmax-stage-row">
        {showBasicFirst && (
          <BasicStageCard
            title="1. stupeň"
            classes={basic1Classes}
            pupils={basic1Pupils}
            onClassesChange={onBasic1ClassesChange}
            onPupilsChange={onBasic1PupilsChange}
            avg={basic1Avg}
            band={basicFirstBand}
            stagePhmax={basic1Phmax}
            stageLabel="Výsledek PHmax – 1. stupeň"
            warning={
              basic1Classes <= 0 || basic1Pupils <= 0
                ? `${INLINE_VALIDATION_MSG_POSITIVE_INTEGER} U 1. stupně doplňte počet tříd i počet žáků.`
                : null
            }
          />
        )}

        {showBasicSecond && (
          <BasicStageCard
            title="2. stupeň"
            classes={basic2Classes}
            pupils={basic2Pupils}
            onClassesChange={onBasic2ClassesChange}
            onPupilsChange={onBasic2PupilsChange}
            avg={basic2Avg}
            band={basicSecondBand}
            stagePhmax={basic2Phmax}
            stageLabel="Výsledek PHmax – 2. stupeň"
            warning={
              basic2Classes <= 0 || basic2Pupils <= 0
                ? `${INLINE_VALIDATION_MSG_POSITIVE_INTEGER} U 2. stupně doplňte počet tříd i počet žáků.`
                : null
            }
          />
        )}
      </div>

      {showBasicFirst || showBasicSecond ? (
        <FieldWhyPhmaxDetails>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              <strong>Počty tříd a žáků</strong> stanoví průměr žáků ve třídě; podle něj aplikace vybere{" "}
              <strong>pásmo z tabulek řádků B1/B3 či B4/B13</strong> příslušné varianty metodiky ZV – to určuje PHmax za 1
              třídu.
            </li>
            <li>
              <strong>PHmax za stupeň</strong> pak vychází z násobnosti <em>platný počet tříd × PHmax za třídu</em>; součástí
              modulu mohou být samostatně i § 38, § 41, přípravné skupiny aj.
            </li>
            <li>
              Vedle rámcového výpočtu v tabulce vždy zkontrolujte <strong>upozornění a vstupní validace</strong> pro hraniční
              stavy (např. neúplné vyplnění jedné skupiny vstupů).
            </li>
          </ul>
        </FieldWhyPhmaxDetails>
      ) : null}

      <div className="grid four section-results">
        {showPrepClass && <ResultCard label="Přípravná třída – výsledek" value={prepClassPhmax} tone="success" />}
        {showPrepSpecial && <ResultCard label="Přípravný stupeň ZŠS – výsledek" value={prepSpecialPhmax} tone="success" />}
        {showPar38 && <ResultCard label="§ 38 – výsledek" value={par38Phmax} tone="success" />}
        {showPar41 && <ResultCard label="§ 41 – výsledek" value={par41Phmax} tone="success" />}
      </div>

      {(showBasicFirst || showBasicSecond) && (
        <div className="zs-phmax-stage-total">
          <ResultCard label="PHmax – běžné třídy celkem" value={basicPhmax} tone="success" />
        </div>
      )}
      {composition ? <p className="muted-text">{composition}</p> : null}
    </section>
  );
}
