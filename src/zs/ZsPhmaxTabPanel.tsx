import React from "react";
import type { FormSection } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import type { CalculatorMode } from "../config/calculator-config";
import { PhmaxZsPhmaxSubNav, type PhmaxZsPhmaxPane } from "../PhmaxZsPhmaxSubNav";
import type { PhmaxZsMethodologyHighlights } from "../phmax-zs-methodology-tables";
import { PhmaxZsMethodologyReferenceTables } from "../phmax-zs-methodology-tables";
import type {
  BasicType,
  GymRow,
  HealthRow,
  PsychRow,
  ZsMinorityBandKind,
} from "../phmax-zs-logic";
import { ZsPhmaxBasicSection, type ZsPhmaxBand } from "./ZsPhmaxBasicSection";
import { ZsPhmaxBreakdownTable } from "./ZsPhmaxBreakdownTable";
import { ZsPhmaxExtrasSection } from "./ZsPhmaxExtrasSection";
import { ZsPhmaxGymSection, type ZsPhmaxGymComputedRow } from "./ZsPhmaxGymSection";
import { ZsPhmaxHealthSection, type ZsPhmaxHealthComputedRow } from "./ZsPhmaxHealthSection";
import { ZsPhmaxMinoritySection } from "./ZsPhmaxMinoritySection";
import { ZsPhmaxMixedSection } from "./ZsPhmaxMixedSection";
import { ZsPhmaxPsychSection, type ZsPhmaxPsychComputedRow } from "./ZsPhmaxPsychSection";
import { ZsPhmaxSec16Section } from "./ZsPhmaxSec16Section";
import { ZsPhmaxSpecialSection } from "./ZsPhmaxSpecialSection";
import { ZsPhmaxSummarySection } from "./ZsPhmaxSummarySection";

export type ZsPhmaxTabPanelProps = {
  viewMode: "basic" | "expert";
  mode: CalculatorMode;
  hasSection: (section: FormSection) => boolean;
  hasIssue: (sectionId: string) => boolean;
  showPhmaxSubNav: boolean;
  effectivePhmaxPane: PhmaxZsPhmaxPane;
  onPhmaxSubTabChange: (pane: PhmaxZsPhmaxPane) => void;
  zsBasicWizardActive: boolean;
  zsWizardStep: number;
  zsWizardHasExceptions: boolean;
  validationHighlight: boolean;
  onResetPhmax: () => void;
  zsMethodologyHighlights: PhmaxZsMethodologyHighlights;
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
  sec16FirstClasses: number;
  sec16FirstPupils: number;
  sec16SecondClasses: number;
  sec16SecondPupils: number;
  onSec16FirstClassesChange: (value: number) => void;
  onSec16FirstPupilsChange: (value: number) => void;
  onSec16SecondClassesChange: (value: number) => void;
  onSec16SecondPupilsChange: (value: number) => void;
  incl1Avg: number;
  incl2Avg: number;
  sec16FirstBand: ZsPhmaxBand;
  sec16SecondBand: ZsPhmaxBand;
  incl1Phmax: number;
  incl2Phmax: number;
  inclPhmax: number;
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
  psychComputedRows: ZsPhmaxPsychComputedRow[];
  onAddPsych: () => void;
  onUpdatePsych: (id: number, key: keyof PsychRow, value: string | number) => void;
  onRemovePsych: (id: number) => void;
  healthComputedRows: ZsPhmaxHealthComputedRow[];
  onAddHealth: () => void;
  onUpdateHealth: (id: number, key: keyof HealthRow, value: string | number) => void;
  onRemoveHealth: (id: number) => void;
  minorityType: ZsMinorityBandKind;
  onMinorityTypeChange: (value: ZsMinorityBandKind) => void;
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
  gymComputedRows: ZsPhmaxGymComputedRow[];
  onAddGym: () => void;
  onUpdateGym: (id: number, key: keyof GymRow, value: string | number) => void;
  onRemoveGym: (id: number) => void;
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
  psychPhmax: number;
  healthPhmax: number;
  gymPhmax: number;
  mixedForTotal: number;
  extrasPhmax: number;
  totalPhmax: number;
};

export function ZsPhmaxTabPanel(props: ZsPhmaxTabPanelProps) {
  const {
    viewMode,
    mode,
    hasSection,
    hasIssue,
    showPhmaxSubNav,
    effectivePhmaxPane,
    onPhmaxSubTabChange,
    zsBasicWizardActive,
    zsWizardStep,
    zsWizardHasExceptions,
    validationHighlight,
    onResetPhmax,
    zsMethodologyHighlights,
  } = props;

  return (
    <div className="stack">
      {showPhmaxSubNav ? (
        <PhmaxZsPhmaxSubNav active={effectivePhmaxPane} onChange={onPhmaxSubTabChange} />
      ) : null}
      {zsBasicWizardActive && zsWizardStep === 3 && !zsWizardHasExceptions ? (
        <section className="card muted section-card" data-wizard-step="3" data-section="wizard-exceptions-empty">
          <h2 className="section-title">Výjimky</h2>
          <p className="muted-text" style={{ margin: 0 }}>
            Pro zvolený režim „{MODE_CONFIG[mode].label}“ nejsou v metodice viditelné
            doplňkové moduly (§ 16/9, ZŠ speciální, psychiatrie…). Pokračujte na souhrn nebo změňte režim v kroku 1.
          </p>
        </section>
      ) : null}
      <ZsPhmaxBasicSection
        hasBasicIssue={hasIssue("basic")}
        showBasicFirst={hasSection("basic_first")}
        showBasicSecond={hasSection("basic_second")}
        showSchoolVariantFirstOnly={hasSection("school_variant_first_stage_only")}
        showPrepClass={hasSection("prep_class")}
        showPrepSpecial={hasSection("prep_special")}
        showPar38={hasSection("par38")}
        showPar41={hasSection("par41")}
        basicType={props.basicType}
        onBasicTypeChange={props.onBasicTypeChange}
        basic1Classes={props.basic1Classes}
        basic1Pupils={props.basic1Pupils}
        basic2Classes={props.basic2Classes}
        basic2Pupils={props.basic2Pupils}
        onBasic1ClassesChange={props.onBasic1ClassesChange}
        onBasic1PupilsChange={props.onBasic1PupilsChange}
        onBasic2ClassesChange={props.onBasic2ClassesChange}
        onBasic2PupilsChange={props.onBasic2PupilsChange}
        basic1Avg={props.basic1Avg}
        basic2Avg={props.basic2Avg}
        basicFirstBand={props.basicFirstBand}
        basicSecondBand={props.basicSecondBand}
        basic1Phmax={props.basic1Phmax}
        basic2Phmax={props.basic2Phmax}
        basicPhmax={props.basicPhmax}
        prepClassPhmax={props.prepClassPhmax}
        prepSpecialPhmax={props.prepSpecialPhmax}
        par38Phmax={props.par38Phmax}
        par41Phmax={props.par41Phmax}
      />

      <div className="grid two" data-section="zs-phmax-exceptions">
        <ZsPhmaxSec16Section
          viewMode={viewMode}
          showFirst={hasSection("sec16_first")}
          showSecond={hasSection("sec16_second")}
          firstClasses={props.sec16FirstClasses}
          firstPupils={props.sec16FirstPupils}
          secondClasses={props.sec16SecondClasses}
          secondPupils={props.sec16SecondPupils}
          onFirstClassesChange={props.onSec16FirstClassesChange}
          onFirstPupilsChange={props.onSec16FirstPupilsChange}
          onSecondClassesChange={props.onSec16SecondClassesChange}
          onSecondPupilsChange={props.onSec16SecondPupilsChange}
          firstAvg={props.incl1Avg}
          secondAvg={props.incl2Avg}
          firstBand={props.sec16FirstBand}
          secondBand={props.sec16SecondBand}
          firstPhmax={props.incl1Phmax}
          secondPhmax={props.incl2Phmax}
          totalPhmax={props.inclPhmax}
        />

        {(hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) && (
          <ZsPhmaxSpecialSection
            viewMode={viewMode}
            special1Classes={props.special1Classes}
            special1Pupils={props.special1Pupils}
            special2Classes={props.special2Classes}
            special2Pupils={props.special2Pupils}
            specialIIClasses={props.specialIIClasses}
            specialIIPupils={props.specialIIPupils}
            onSpecial1ClassesChange={props.onSpecial1ClassesChange}
            onSpecial1PupilsChange={props.onSpecial1PupilsChange}
            onSpecial2ClassesChange={props.onSpecial2ClassesChange}
            onSpecial2PupilsChange={props.onSpecial2PupilsChange}
            onSpecialIIClassesChange={props.onSpecialIIClassesChange}
            onSpecialIIPupilsChange={props.onSpecialIIPupilsChange}
            special1Avg={props.special1Avg}
            special2Avg={props.special2Avg}
            specialIIAvg={props.specialIIAvg}
            special1Band={props.special1Band}
            special2Band={props.special2Band}
            specialIIBand={props.specialIIBand}
            special1PhmaxPart={props.special1PhmaxPart}
            special2PhmaxPart={props.special2PhmaxPart}
            specialIIPhmaxPart={props.specialIIPhmaxPart}
            specialPhmax={props.specialPhmax}
          />
        )}
      </div>

      <div className="grid two">
        {hasSection("psych_groups") && (
          <ZsPhmaxPsychSection
            viewMode={viewMode}
            rows={props.psychComputedRows}
            onAdd={props.onAddPsych}
            onUpdate={(id, key, value) => props.onUpdatePsych(id, key as keyof PsychRow, value)}
            onRemove={props.onRemovePsych}
          />
        )}

        {hasSection("health_groups") && (
          <ZsPhmaxHealthSection
            viewMode={viewMode}
            rows={props.healthComputedRows}
            onAdd={props.onAddHealth}
            onUpdate={(id, key, value) => props.onUpdateHealth(id, key as keyof HealthRow, value)}
            onRemove={props.onRemoveHealth}
          />
        )}

        {hasSection("minority_first") && (
          <ZsPhmaxMinoritySection
            viewMode={viewMode}
            minorityType={props.minorityType}
            onMinorityTypeChange={props.onMinorityTypeChange}
            showSecondStage={hasSection("minority_second")}
            minority1Classes={props.minority1Classes}
            minority1Pupils={props.minority1Pupils}
            minority2Classes={props.minority2Classes}
            minority2Pupils={props.minority2Pupils}
            onMinority1ClassesChange={props.onMinority1ClassesChange}
            onMinority1PupilsChange={props.onMinority1PupilsChange}
            onMinority2ClassesChange={props.onMinority2ClassesChange}
            onMinority2PupilsChange={props.onMinority2PupilsChange}
            minority1Avg={props.minority1Avg}
            minority2Avg={props.minority2Avg}
            minority1Band={props.minority1Band}
            minority2Band={props.minority2Band}
            minority1Phmax={props.minority1Phmax}
            minority2Phmax={props.minority2Phmax}
            minorityPhmax={props.minorityPhmax}
          />
        )}
      </div>

      <div className="grid two">
        {hasSection("gym_groups") && (
          <ZsPhmaxGymSection
            viewMode={viewMode}
            rows={props.gymComputedRows}
            onAdd={props.onAddGym}
            onUpdate={props.onUpdateGym}
            onRemove={props.onRemoveGym}
          />
        )}

        {(hasSection("dominant_c_first") || hasSection("dominant_b_first")) && (
          <ZsPhmaxMixedSection
            viewMode={viewMode}
            validationHighlight={validationHighlight}
            mixedMethodFirstZsPupils={props.mixedMethodFirstZsPupils}
            mixedMethodFirstZsClasses={props.mixedMethodFirstZsClasses}
            mixedMethodFirstSpecialPupils={props.mixedMethodFirstSpecialPupils}
            mixedMethodFirstSpecialClasses={props.mixedMethodFirstSpecialClasses}
            mixedMethodSecondZsPupils={props.mixedMethodSecondZsPupils}
            mixedMethodSecondZsClasses={props.mixedMethodSecondZsClasses}
            mixedMethodSecondSpecialPupils={props.mixedMethodSecondSpecialPupils}
            mixedMethodSecondSpecialClasses={props.mixedMethodSecondSpecialClasses}
            mixedMethodFirstZsAvg={props.mixedMethodFirstZsAvg}
            mixedMethodSecondZsAvg={props.mixedMethodSecondZsAvg}
            mixedMethodFirstSpecialAvg={props.mixedMethodFirstSpecialAvg}
            mixedMethodSecondSpecialAvg={props.mixedMethodSecondSpecialAvg}
            mixedMethodFirstZsBand={props.mixedMethodFirstZsBand}
            mixedMethodSecondZsBand={props.mixedMethodSecondZsBand}
            mixedMethodFirstSpecialBand={props.mixedMethodFirstSpecialBand}
            mixedMethodSecondSpecialBand={props.mixedMethodSecondSpecialBand}
            mixedMethodFirstZsResult={props.mixedMethodFirstZsResult}
            mixedMethodSecondZsResult={props.mixedMethodSecondZsResult}
            mixedMethodFirstSpecialResult={props.mixedMethodFirstSpecialResult}
            mixedMethodSecondSpecialResult={props.mixedMethodSecondSpecialResult}
            mixedMethodFirstTotal={props.mixedMethodFirstTotal}
            mixedMethodSecondTotal={props.mixedMethodSecondTotal}
            mixedMethodTotal={props.mixedMethodTotal}
            onMixedMethodFirstZsPupilsChange={props.onMixedMethodFirstZsPupilsChange}
            onMixedMethodFirstZsClassesChange={props.onMixedMethodFirstZsClassesChange}
            onMixedMethodFirstSpecialPupilsChange={props.onMixedMethodFirstSpecialPupilsChange}
            onMixedMethodFirstSpecialClassesChange={props.onMixedMethodFirstSpecialClassesChange}
            onMixedMethodSecondZsPupilsChange={props.onMixedMethodSecondZsPupilsChange}
            onMixedMethodSecondZsClassesChange={props.onMixedMethodSecondZsClassesChange}
            onMixedMethodSecondSpecialPupilsChange={props.onMixedMethodSecondSpecialPupilsChange}
            onMixedMethodSecondSpecialClassesChange={props.onMixedMethodSecondSpecialClassesChange}
          />
        )}
      </div>

      {(hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) && (
        <ZsPhmaxExtrasSection
          viewMode={viewMode}
          gateTitle={
            hasSection("prep_class") || hasSection("prep_special")
              ? "Samostatné položky PHmax"
              : "§ 38 a § 41 (navýšení PHmax)"
          }
          showPrepClass={hasSection("prep_class")}
          showPrepSpecial={hasSection("prep_special")}
          showPar38={hasSection("par38")}
          showPar41={hasSection("par41")}
          prepClasses={props.prepClasses}
          prepChildren={props.prepChildren}
          prepSpecialClasses={props.prepSpecialClasses}
          prepSpecialChildren={props.prepSpecialChildren}
          p38First={props.p38First}
          p38Second={props.p38Second}
          p41First={props.p41First}
          p41Second={props.p41Second}
          onPrepClassesChange={props.onPrepClassesChange}
          onPrepChildrenChange={props.onPrepChildrenChange}
          onPrepSpecialClassesChange={props.onPrepSpecialClassesChange}
          onPrepSpecialChildrenChange={props.onPrepSpecialChildrenChange}
          onP38FirstChange={props.onP38FirstChange}
          onP38SecondChange={props.onP38SecondChange}
          onP41FirstChange={props.onP41FirstChange}
          onP41SecondChange={props.onP41SecondChange}
          prepAvg={props.prepAvg}
          prepPh={props.prepPh}
          prepSpecialAvg={props.prepSpecialAvg}
          prepSpecialPh={props.prepSpecialPh}
          prepClassPhmax={props.prepClassPhmax}
          prepSpecialPhmax={props.prepSpecialPhmax}
          par38Phmax={props.par38Phmax}
          par41Phmax={props.par41Phmax}
        />
      )}

      <div className="toolbar">
        <button type="button" className="btn ghost" onClick={onResetPhmax}>
          Vymazat údaje PHmax
        </button>
      </div>

      <ZsPhmaxSummarySection
        basicPhmax={props.basicPhmax}
        inclPhmax={props.inclPhmax}
        psychPhmax={props.psychPhmax}
        healthPhmax={props.healthPhmax}
        minorityPhmax={props.minorityPhmax}
        gymPhmax={props.gymPhmax}
        mixedForTotal={props.mixedForTotal}
        specialPhmax={props.specialPhmax}
        prepClassPhmax={props.prepClassPhmax}
        prepSpecialPhmax={props.prepSpecialPhmax}
        par38Phmax={props.par38Phmax}
        par41Phmax={props.par41Phmax}
        extrasPhmax={props.extrasPhmax}
        totalPhmax={props.totalPhmax}
      />

      <ZsPhmaxBreakdownTable
        basicPhmax={props.basicPhmax}
        inclPhmax={props.inclPhmax}
        psychPhmax={props.psychPhmax}
        healthPhmax={props.healthPhmax}
        minorityPhmax={props.minorityPhmax}
        gymPhmax={props.gymPhmax}
        mixedForTotal={props.mixedForTotal}
        specialPhmax={props.specialPhmax}
        prepClassPhmax={props.prepClassPhmax}
        prepSpecialPhmax={props.prepSpecialPhmax}
        par38Phmax={props.par38Phmax}
        par41Phmax={props.par41Phmax}
        totalPhmax={props.totalPhmax}
      />

      {viewMode === "expert" ? <PhmaxZsMethodologyReferenceTables highlights={zsMethodologyHighlights} /> : null}
    </div>
  );
}
