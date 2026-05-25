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
};

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
}: ZsPhmaxBasicSectionProps) {
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

      <div className="grid two">
        {showBasicFirst && (
          <div className="subcard">
            <h3>1. stupeň</h3>
            <div className="grid two">
              <NumberField label="Počet tříd" value={basic1Classes} onChange={onBasic1ClassesChange} />
              <NumberField label="Počet žáků" value={basic1Pupils} onChange={onBasic1PupilsChange} />
              <ResultCard label="Průměrný počet žáků ve třídě" value={round2(basic1Avg)} tone="primary" />
              <ResultCard
                label="Pásmo a PHmax na 1 třídu"
                value={`${basicFirstBand.label} / ${basicFirstBand.value}`}
                tone="primary"
              />
              <ResultCard label="Výsledek PHmax – 1. stupeň" value={basic1Phmax} tone="success" />
              <ResultCard label="Počet tříd × PHmax" value={`${basic1Classes} × ${basicFirstBand.value}`} tone="success" />
            </div>
            {basic1Classes <= 0 || basic1Pupils <= 0 ? (
              <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
                {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} U 1. stupně doplňte počet tříd i počet žáků.
              </p>
            ) : null}
          </div>
        )}

        {showBasicSecond && (
          <div className="subcard">
            <h3>2. stupeň</h3>
            <div className="grid two">
              <NumberField label="Počet tříd" value={basic2Classes} onChange={onBasic2ClassesChange} />
              <NumberField label="Počet žáků" value={basic2Pupils} onChange={onBasic2PupilsChange} />
              <ResultCard label="Průměrný počet žáků ve třídě" value={round2(basic2Avg)} tone="primary" />
              <ResultCard
                label="Pásmo a PHmax na 1 třídu"
                value={`${basicSecondBand.label} / ${basicSecondBand.value}`}
                tone="primary"
              />
              <ResultCard label="Výsledek PHmax – 2. stupeň" value={basic2Phmax} tone="success" />
              <ResultCard label="Počet tříd × PHmax" value={`${basic2Classes} × ${basicSecondBand.value}`} tone="success" />
            </div>
            {basic2Classes <= 0 || basic2Pupils <= 0 ? (
              <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
                {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} U 2. stupně doplňte počet tříd i počet žáků.
              </p>
            ) : null}
          </div>
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
        <div className="grid three section-results-strip">
          {showBasicFirst ? <ResultCard label="PHmax – 1. stupeň" value={basic1Phmax} tone="success" /> : null}
          {showBasicSecond ? <ResultCard label="PHmax – 2. stupeň" value={basic2Phmax} tone="success" /> : null}
          <ResultCard label="PHmax – běžné třídy celkem" value={basicPhmax} tone="success" />
        </div>
      )}
    </section>
  );
}
