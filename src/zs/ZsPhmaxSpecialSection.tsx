import type { CalculatorViewMode } from "../calculator-view-mode";
import { NumberField, ResultCard } from "../phmax-zs-ui";
import { round2 } from "../phmax-zs-logic";
import { ZsModuleGate } from "../ZsModuleGate";
import type { ZsPhmaxBand } from "./ZsPhmaxBasicSection";

export type ZsPhmaxSpecialSectionProps = {
  viewMode: CalculatorViewMode;
  special1Classes: number;
  special1Pupils: number;
  special2Classes: number;
  special2Pupils: number;
  specialIIClasses: number;
  specialIIPupils: number;
  onSpecial1ClassesChange: (value: number) => void;
  onSpecial1PupilsChange: (value: number) => void;
  onSpecial2ClassesChange: (value: number) => void;
  onSpecial2PupilsChange: (value: number) => void;
  onSpecialIIClassesChange: (value: number) => void;
  onSpecialIIPupilsChange: (value: number) => void;
  special1Avg: number;
  special2Avg: number;
  specialIIAvg: number;
  special1Band: ZsPhmaxBand;
  special2Band: ZsPhmaxBand;
  specialIIBand: ZsPhmaxBand;
  special1PhmaxPart: number;
  special2PhmaxPart: number;
  specialIIPhmaxPart: number;
  specialPhmax: number;
};

export function ZsPhmaxSpecialSection(props: ZsPhmaxSpecialSectionProps) {
  const {
    viewMode,
    special1Classes,
    special1Pupils,
    special2Classes,
    special2Pupils,
    specialIIClasses,
    specialIIPupils,
    onSpecial1ClassesChange,
    onSpecial1PupilsChange,
    onSpecial2ClassesChange,
    onSpecial2PupilsChange,
    onSpecialIIClassesChange,
    onSpecialIIPupilsChange,
    special1Avg,
    special2Avg,
    specialIIAvg,
    special1Band,
    special2Band,
    specialIIBand,
    special1PhmaxPart,
    special2PhmaxPart,
    specialIIPhmaxPart,
    specialPhmax,
  } = props;

  return (
    <ZsModuleGate sectionId="special" title="ZŠ speciální" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-special"
        data-section="special"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>ZŠ speciální</h2>
        <div className="grid two">
          <NumberField label="I. díl 1. stupeň – třídy" value={special1Classes} onChange={onSpecial1ClassesChange} />
          <NumberField label="I. díl 1. stupeň – žáci" value={special1Pupils} onChange={onSpecial1PupilsChange} />
          <ResultCard label="I. díl 1. stupeň – průměrný počet žáků" value={round2(special1Avg)} tone="primary" />
          <ResultCard
            label="I. díl 1. stupeň – pásmo a PHmax na 1 třídu"
            value={`${special1Band.label} / ${special1Band.value}`}
            tone="primary"
          />
          <NumberField label="I. díl 2. stupeň – třídy" value={special2Classes} onChange={onSpecial2ClassesChange} />
          <NumberField label="I. díl 2. stupeň – žáci" value={special2Pupils} onChange={onSpecial2PupilsChange} />
          <ResultCard label="I. díl 2. stupeň – průměrný počet žáků" value={round2(special2Avg)} tone="primary" />
          <ResultCard
            label="I. díl 2. stupeň – pásmo a PHmax na 1 třídu"
            value={`${special2Band.label} / ${special2Band.value}`}
            tone="primary"
          />
          <NumberField label="II. díl – třídy" value={specialIIClasses} onChange={onSpecialIIClassesChange} />
          <NumberField label="II. díl – žáci" value={specialIIPupils} onChange={onSpecialIIPupilsChange} />
          <ResultCard label="II. díl – průměrný počet žáků" value={round2(specialIIAvg)} tone="primary" />
          <ResultCard
            label="II. díl – pásmo a PHmax na 1 třídu"
            value={`${specialIIBand.label} / ${specialIIBand.value}`}
            tone="primary"
          />
        </div>
        <div className="grid four section-results-strip">
          <ResultCard label="PHmax ZŠ speciální – I. díl 1. stupeň" value={special1PhmaxPart} tone="success" />
          <ResultCard label="PHmax ZŠ speciální – I. díl 2. stupeň" value={special2PhmaxPart} tone="success" />
          <ResultCard label="PHmax ZŠ speciální – II. díl" value={specialIIPhmaxPart} tone="success" />
          <ResultCard label="PHmax ZŠ speciální – celkem" value={specialPhmax} tone="success" />
        </div>
      </section>
    </ZsModuleGate>
  );
}
