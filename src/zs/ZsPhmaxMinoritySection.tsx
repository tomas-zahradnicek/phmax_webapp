import type { CalculatorViewMode } from "../calculator-view-mode";
import type { ZsMinorityBandKind } from "../phmax-zs-logic";
import { round2 } from "../phmax-zs-logic";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import { ZsModuleGate } from "../ZsModuleGate";
import type { ZsPhmaxBand } from "./ZsPhmaxBasicSection";

export type ZsPhmaxMinoritySectionProps = {
  viewMode: CalculatorViewMode;
  minorityType: ZsMinorityBandKind;
  onMinorityTypeChange: (value: ZsMinorityBandKind) => void;
  showSecondStage: boolean;
  minority1Classes: number;
  minority1Pupils: number;
  minority2Classes: number;
  minority2Pupils: number;
  onMinority1ClassesChange: (value: number) => void;
  onMinority1PupilsChange: (value: number) => void;
  onMinority2ClassesChange: (value: number) => void;
  onMinority2PupilsChange: (value: number) => void;
  minority1Avg: number;
  minority2Avg: number;
  minority1Band: ZsPhmaxBand;
  minority2Band: ZsPhmaxBand;
  minority1Phmax: number;
  minority2Phmax: number;
  minorityPhmax: number;
};

export function ZsPhmaxMinoritySection({
  viewMode,
  minorityType,
  onMinorityTypeChange,
  showSecondStage,
  minority1Classes,
  minority1Pupils,
  minority2Classes,
  minority2Pupils,
  onMinority1ClassesChange,
  onMinority1PupilsChange,
  onMinority2ClassesChange,
  onMinority2PupilsChange,
  minority1Avg,
  minority2Avg,
  minority1Band,
  minority2Band,
  minority1Phmax,
  minority2Phmax,
  minorityPhmax,
}: ZsPhmaxMinoritySectionProps) {
  return (
    <ZsModuleGate sectionId="minority" title="ZŠ s jazykem národnostní menšiny" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-minority"
        data-section="minority"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>ZŠ s jazykem národnostní menšiny</h2>
        <select value={minorityType} onChange={(e) => onMinorityTypeChange(e.target.value as ZsMinorityBandKind)}>
          <option value="minority1">1 třída 1. stupně</option>
          <option value="minority2">2 třídy 1. stupně</option>
          <option value="minority3">3 a více tříd 1. stupně</option>
          <option value="minorityFull1">Ročníky 1. i 2. stupně</option>
        </select>
        <div className="grid two">
          <div className="subcard">
            <h3>1. stupeň</h3>
            <div className="grid two">
              <NumberField label="Počet tříd" value={minority1Classes} onChange={onMinority1ClassesChange} />
              <NumberField label="Počet žáků" value={minority1Pupils} onChange={onMinority1PupilsChange} />
              <ResultCard label="Průměrný počet žáků ve třídě" value={round2(minority1Avg)} tone="primary" />
              <ResultCard
                label="Pásmo a PHmax na 1 třídu"
                value={`${minority1Band.label} / ${minority1Band.value}`}
                tone="primary"
              />
              <ResultCard label="Výsledek PHmax – 1. stupeň" value={minority1Phmax} tone="success" />
              <ResultCard
                label="Počet tříd × PHmax"
                value={`${minority1Classes} × ${minority1Band.value}`}
                tone="success"
              />
            </div>
          </div>
          {minorityType === "minorityFull1" && showSecondStage ? (
            <div className="subcard">
              <h3>2. stupeň</h3>
              <div className="grid two">
                <NumberField label="Počet tříd" value={minority2Classes} onChange={onMinority2ClassesChange} />
                <NumberField label="Počet žáků" value={minority2Pupils} onChange={onMinority2PupilsChange} />
                <ResultCard label="Průměrný počet žáků ve třídě" value={round2(minority2Avg)} tone="primary" />
                <ResultCard
                  label="Pásmo a PHmax na 1 třídu"
                  value={`${minority2Band.label} / ${minority2Band.value}`}
                  tone="primary"
                />
                <ResultCard label="Výsledek PHmax – 2. stupeň" value={minority2Phmax} tone="success" />
                <ResultCard
                  label="Počet tříd × PHmax"
                  value={`${minority2Classes} × ${minority2Band.value}`}
                  tone="success"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid three section-results-strip">
          <ResultCard label="PHmax – jazyk menšiny 1. stupeň" value={minority1Phmax} tone="success" />
          {minorityType === "minorityFull1" && showSecondStage ? (
            <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value={minority2Phmax} tone="success" />
          ) : (
            <ResultCard label="PHmax – jazyk menšiny 2. stupeň" value="–" tone="primary" />
          )}
          <ResultCard label="PHmax – jazyk menšiny celkem" value={minorityPhmax} tone="success" />
        </div>
      </section>
    </ZsModuleGate>
  );
}
