import type { CalculatorMode, FormSection } from "../config/calculator-config";
import type { PhmaxZsMethodologyHighlights } from "../phmax-zs-methodology-tables";
import type {
  BasicType,
  GymRow,
  HealthRow,
  PsychRow,
  ZsMinorityBandKind,
} from "../phmax-zs-logic";
import type { PhmaxZsPhmaxPane } from "../PhmaxZsPhmaxSubNav";
import type { ZsPhmaxBand } from "./ZsPhmaxBasicSection";
import type { ZsPhmaxGymComputedRow } from "./ZsPhmaxGymSection";
import type { ZsPhmaxHealthComputedRow } from "./ZsPhmaxHealthSection";
import type { ZsPhmaxPsychComputedRow } from "./ZsPhmaxPsychSection";
import type { ZsPhmaxTabPanelProps } from "./ZsPhmaxTabPanel";

export type BuildZsPhmaxTabPanelPropsInput = {
  viewMode: "basic" | "expert";
  mode: CalculatorMode;
  hasSection: (section: FormSection) => boolean;
  hasIssue: (sectionId: string) => boolean;
  showPhmaxSubNav: boolean;
  effectivePhmaxPane: PhmaxZsPhmaxPane;
  handlePhmaxSubTabChange: (pane: PhmaxZsPhmaxPane) => void;
  zsBasicWizardActive: boolean;
  zsWizardStep: number;
  zsWizardHasExceptions: boolean;
  validationHighlight: boolean;
  resetPhmax: () => void;
  zsMethodologyHighlights: PhmaxZsMethodologyHighlights;
  basicType: BasicType;
  setBasicType: (value: BasicType) => void;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  setBasic1Classes: (value: number) => void;
  setBasic1Pupils: (value: number) => void;
  setBasic2Classes: (value: number) => void;
  setBasic2Pupils: (value: number) => void;
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
  setSec16FirstClasses: (value: number) => void;
  setSec16FirstPupils: (value: number) => void;
  setSec16SecondClasses: (value: number) => void;
  setSec16SecondPupils: (value: number) => void;
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
  setSpecial1Classes: (value: number) => void;
  setSpecial1Pupils: (value: number) => void;
  setSpecial2Classes: (value: number) => void;
  setSpecial2Pupils: (value: number) => void;
  setSpecialIIClasses: (value: number) => void;
  setSpecialIIPupils: (value: number) => void;
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
  addPsych: () => void;
  updatePsych: (id: number, key: keyof PsychRow, value: string | number) => void;
  removePsych: (id: number) => void;
  healthComputedRows: ZsPhmaxHealthComputedRow[];
  addHealth: () => void;
  updateHealth: (id: number, key: keyof HealthRow, value: string | number) => void;
  removeHealth: (id: number) => void;
  minorityType: ZsMinorityBandKind;
  setMinorityType: (value: ZsMinorityBandKind) => void;
  minority1Classes: number;
  minority1Pupils: number;
  minority2Classes: number;
  minority2Pupils: number;
  setMinority1Classes: (value: number) => void;
  setMinority1Pupils: (value: number) => void;
  setMinority2Classes: (value: number) => void;
  setMinority2Pupils: (value: number) => void;
  minority1Avg: number;
  minority2Avg: number;
  minority1Band: ZsPhmaxBand;
  minority2Band: ZsPhmaxBand;
  minority1Phmax: number;
  minority2Phmax: number;
  minorityPhmax: number;
  gymComputedRows: ZsPhmaxGymComputedRow[];
  addGym: () => void;
  updateGym: (id: number, key: keyof GymRow, value: string | number) => void;
  removeGym: (id: number) => void;
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
  setMixedMethodFirstZsPupils: (value: number) => void;
  setMixedMethodFirstZsClasses: (value: number) => void;
  setMixedMethodFirstSpecialPupils: (value: number) => void;
  setMixedMethodFirstSpecialClasses: (value: number) => void;
  setMixedMethodSecondZsPupils: (value: number) => void;
  setMixedMethodSecondZsClasses: (value: number) => void;
  setMixedMethodSecondSpecialPupils: (value: number) => void;
  setMixedMethodSecondSpecialClasses: (value: number) => void;
  prepClasses: number;
  prepChildren: number;
  prepSpecialClasses: number;
  prepSpecialChildren: number;
  p38First: number;
  p38Second: number;
  p41First: number;
  p41Second: number;
  setPrepClasses: (value: number) => void;
  setPrepChildren: (value: number) => void;
  setPrepSpecialClasses: (value: number) => void;
  setPrepSpecialChildren: (value: number) => void;
  setP38First: (value: number) => void;
  setP38Second: (value: number) => void;
  setP41First: (value: number) => void;
  setP41Second: (value: number) => void;
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

/** Sestaví props pro ZsPhmaxTabPanel z page state. */
export function buildZsPhmaxTabPanelProps(input: BuildZsPhmaxTabPanelPropsInput): ZsPhmaxTabPanelProps {
  return {
    viewMode: input.viewMode,
    mode: input.mode,
    hasSection: input.hasSection,
    hasIssue: input.hasIssue,
    showPhmaxSubNav: input.showPhmaxSubNav,
    effectivePhmaxPane: input.effectivePhmaxPane,
    onPhmaxSubTabChange: input.handlePhmaxSubTabChange,
    zsBasicWizardActive: input.zsBasicWizardActive,
    zsWizardStep: input.zsWizardStep,
    zsWizardHasExceptions: input.zsWizardHasExceptions,
    validationHighlight: input.validationHighlight,
    onResetPhmax: input.resetPhmax,
    zsMethodologyHighlights: input.zsMethodologyHighlights,
    basicType: input.basicType,
    onBasicTypeChange: input.setBasicType,
    basic1Classes: input.basic1Classes,
    basic1Pupils: input.basic1Pupils,
    basic2Classes: input.basic2Classes,
    basic2Pupils: input.basic2Pupils,
    onBasic1ClassesChange: input.setBasic1Classes,
    onBasic1PupilsChange: input.setBasic1Pupils,
    onBasic2ClassesChange: input.setBasic2Classes,
    onBasic2PupilsChange: input.setBasic2Pupils,
    basic1Avg: input.basic1Avg,
    basic2Avg: input.basic2Avg,
    basicFirstBand: input.basicFirstBand,
    basicSecondBand: input.basicSecondBand,
    basic1Phmax: input.basic1Phmax,
    basic2Phmax: input.basic2Phmax,
    basicPhmax: input.basicPhmax,
    prepClassPhmax: input.prepClassPhmax,
    prepSpecialPhmax: input.prepSpecialPhmax,
    par38Phmax: input.par38Phmax,
    par41Phmax: input.par41Phmax,
    sec16FirstClasses: input.sec16FirstClasses,
    sec16FirstPupils: input.sec16FirstPupils,
    sec16SecondClasses: input.sec16SecondClasses,
    sec16SecondPupils: input.sec16SecondPupils,
    onSec16FirstClassesChange: input.setSec16FirstClasses,
    onSec16FirstPupilsChange: input.setSec16FirstPupils,
    onSec16SecondClassesChange: input.setSec16SecondClasses,
    onSec16SecondPupilsChange: input.setSec16SecondPupils,
    incl1Avg: input.incl1Avg,
    incl2Avg: input.incl2Avg,
    sec16FirstBand: input.sec16FirstBand,
    sec16SecondBand: input.sec16SecondBand,
    incl1Phmax: input.incl1Phmax,
    incl2Phmax: input.incl2Phmax,
    inclPhmax: input.inclPhmax,
    special1Classes: input.special1Classes,
    special1Pupils: input.special1Pupils,
    special2Classes: input.special2Classes,
    special2Pupils: input.special2Pupils,
    specialIIClasses: input.specialIIClasses,
    specialIIPupils: input.specialIIPupils,
    onSpecial1ClassesChange: input.setSpecial1Classes,
    onSpecial1PupilsChange: input.setSpecial1Pupils,
    onSpecial2ClassesChange: input.setSpecial2Classes,
    onSpecial2PupilsChange: input.setSpecial2Pupils,
    onSpecialIIClassesChange: input.setSpecialIIClasses,
    onSpecialIIPupilsChange: input.setSpecialIIPupils,
    special1Avg: input.special1Avg,
    special2Avg: input.special2Avg,
    specialIIAvg: input.specialIIAvg,
    special1Band: input.special1Band,
    special2Band: input.special2Band,
    specialIIBand: input.specialIIBand,
    special1PhmaxPart: input.special1PhmaxPart,
    special2PhmaxPart: input.special2PhmaxPart,
    specialIIPhmaxPart: input.specialIIPhmaxPart,
    specialPhmax: input.specialPhmax,
    psychComputedRows: input.psychComputedRows,
    onAddPsych: input.addPsych,
    onUpdatePsych: input.updatePsych,
    onRemovePsych: input.removePsych,
    healthComputedRows: input.healthComputedRows,
    onAddHealth: input.addHealth,
    onUpdateHealth: input.updateHealth,
    onRemoveHealth: input.removeHealth,
    minorityType: input.minorityType,
    onMinorityTypeChange: input.setMinorityType,
    minority1Classes: input.minority1Classes,
    minority1Pupils: input.minority1Pupils,
    minority2Classes: input.minority2Classes,
    minority2Pupils: input.minority2Pupils,
    onMinority1ClassesChange: input.setMinority1Classes,
    onMinority1PupilsChange: input.setMinority1Pupils,
    onMinority2ClassesChange: input.setMinority2Classes,
    onMinority2PupilsChange: input.setMinority2Pupils,
    minority1Avg: input.minority1Avg,
    minority2Avg: input.minority2Avg,
    minority1Band: input.minority1Band,
    minority2Band: input.minority2Band,
    minority1Phmax: input.minority1Phmax,
    minority2Phmax: input.minority2Phmax,
    minorityPhmax: input.minorityPhmax,
    gymComputedRows: input.gymComputedRows,
    onAddGym: input.addGym,
    onUpdateGym: input.updateGym,
    onRemoveGym: input.removeGym,
    mixedMethodFirstZsPupils: input.mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses: input.mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils: input.mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses: input.mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils: input.mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses: input.mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils: input.mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses: input.mixedMethodSecondSpecialClasses,
    mixedMethodFirstZsAvg: input.mixedMethodFirstZsAvg,
    mixedMethodSecondZsAvg: input.mixedMethodSecondZsAvg,
    mixedMethodFirstSpecialAvg: input.mixedMethodFirstSpecialAvg,
    mixedMethodSecondSpecialAvg: input.mixedMethodSecondSpecialAvg,
    mixedMethodFirstZsBand: input.mixedMethodFirstZsBand,
    mixedMethodSecondZsBand: input.mixedMethodSecondZsBand,
    mixedMethodFirstSpecialBand: input.mixedMethodFirstSpecialBand,
    mixedMethodSecondSpecialBand: input.mixedMethodSecondSpecialBand,
    mixedMethodFirstZsResult: input.mixedMethodFirstZsResult,
    mixedMethodSecondZsResult: input.mixedMethodSecondZsResult,
    mixedMethodFirstSpecialResult: input.mixedMethodFirstSpecialResult,
    mixedMethodSecondSpecialResult: input.mixedMethodSecondSpecialResult,
    mixedMethodFirstTotal: input.mixedMethodFirstTotal,
    mixedMethodSecondTotal: input.mixedMethodSecondTotal,
    mixedMethodTotal: input.mixedMethodTotal,
    onMixedMethodFirstZsPupilsChange: input.setMixedMethodFirstZsPupils,
    onMixedMethodFirstZsClassesChange: input.setMixedMethodFirstZsClasses,
    onMixedMethodFirstSpecialPupilsChange: input.setMixedMethodFirstSpecialPupils,
    onMixedMethodFirstSpecialClassesChange: input.setMixedMethodFirstSpecialClasses,
    onMixedMethodSecondZsPupilsChange: input.setMixedMethodSecondZsPupils,
    onMixedMethodSecondZsClassesChange: input.setMixedMethodSecondZsClasses,
    onMixedMethodSecondSpecialPupilsChange: input.setMixedMethodSecondSpecialPupils,
    onMixedMethodSecondSpecialClassesChange: input.setMixedMethodSecondSpecialClasses,
    prepClasses: input.prepClasses,
    prepChildren: input.prepChildren,
    prepSpecialClasses: input.prepSpecialClasses,
    prepSpecialChildren: input.prepSpecialChildren,
    p38First: input.p38First,
    p38Second: input.p38Second,
    p41First: input.p41First,
    p41Second: input.p41Second,
    onPrepClassesChange: input.setPrepClasses,
    onPrepChildrenChange: input.setPrepChildren,
    onPrepSpecialClassesChange: input.setPrepSpecialClasses,
    onPrepSpecialChildrenChange: input.setPrepSpecialChildren,
    onP38FirstChange: input.setP38First,
    onP38SecondChange: input.setP38Second,
    onP41FirstChange: input.setP41First,
    onP41SecondChange: input.setP41Second,
    prepAvg: input.prepAvg,
    prepPh: input.prepPh,
    prepSpecialAvg: input.prepSpecialAvg,
    prepSpecialPh: input.prepSpecialPh,
    psychPhmax: input.psychPhmax,
    healthPhmax: input.healthPhmax,
    gymPhmax: input.gymPhmax,
    mixedForTotal: input.mixedForTotal,
    extrasPhmax: input.extrasPhmax,
    totalPhmax: input.totalPhmax,
  };
}
