import type { FormSection } from "./config/calculator-config";
import type { PhmaxZsMethodologyHighlights, ZsMethodologyConnectedBlock } from "./phmax-zs-methodology-tables";
import type { ZsMinorityBandKind } from "./phmax-zs-logic";

export type BuildZsConnectedBlocksInput = {
  hasSection: (section: FormSection) => boolean;
  basicType: string;
  basic1Classes: number;
  basic2Classes: number;
  incl1Classes: number;
  incl2Classes: number;
  hasHealthRows: boolean;
  hasPsychRows: boolean;
  minorityType: ZsMinorityBandKind;
  minority1Classes: number;
  hasGymRows: boolean;
  special1Classes: number;
  special2Classes: number;
  specialIIClasses: number;
  hasMixedLegacyInput: boolean;
  hasMixedMethodTableData: boolean;
  mixedForTotal: number;
  prepClasses: number;
  prepSpecialClasses: number;
  p38First: number;
  p38Second: number;
  p41First: number;
  p41Second: number;
  hasPhaUi: boolean;
  hasPhaSec16Row: boolean;
  hasPhaZssRow: boolean;
  hasPhpUi: boolean;
  phpExcludedSchool: boolean;
};

export function buildZsConnectedBlocks(input: BuildZsConnectedBlocksInput): {
  connectedBlocks: ZsMethodologyConnectedBlock[];
  mixedReferenceNote?: PhmaxZsMethodologyHighlights["mixedReferenceNote"];
} {
  const connectedBlocks: ZsMethodologyConnectedBlock[] = [];
  const {
    hasSection,
    basicType,
    basic1Classes,
    basic2Classes,
    incl1Classes,
    incl2Classes,
    hasHealthRows,
    hasPsychRows,
    minorityType,
    minority1Classes,
    hasGymRows,
    special1Classes,
    special2Classes,
    specialIIClasses,
    hasMixedLegacyInput,
    hasMixedMethodTableData,
    mixedForTotal,
    prepClasses,
    prepSpecialClasses,
    p38First,
    p38Second,
    p41First,
    p41Second,
    hasPhaUi,
    hasPhaSec16Row,
    hasPhaZssRow,
    hasPhpUi,
    phpExcludedSchool,
  } = input;

  const isFullBasic = basicType === "full_more_than_2" || basicType === "full_max_2";
  const hasBasicUi = hasSection("basic_first") || hasSection("basic_second") || hasSection("school_variant_first_stage_only");
  const hasBasicData = basic1Classes > 0 || (isFullBasic && basic2Classes > 0);
  if (hasBasicUi && hasBasicData) {
    if (basicType === "full_more_than_2") connectedBlocks.push("basic_b1b2");
    else if (basicType === "full_max_2") connectedBlocks.push("basic_b3b4");
    else if (basicType === "first_only_1") connectedBlocks.push("basic_b5");
    else if (basicType === "first_only_2") connectedBlocks.push("basic_b6");
    else if (basicType === "first_only_3") connectedBlocks.push("basic_b7");
    else if (basicType === "first_only_4") connectedBlocks.push("basic_b8");
  }

  if ((hasSection("sec16_first") || hasSection("sec16_second")) && (incl1Classes > 0 || incl2Classes > 0)) {
    connectedBlocks.push("sec16");
  }

  if (hasSection("health_groups") && hasHealthRows) connectedBlocks.push("health");
  if (hasSection("psych_groups") && hasPsychRows) connectedBlocks.push("psych");

  if (hasSection("minority_first") && minority1Classes > 0) {
    if (minorityType === "minority1") connectedBlocks.push("minority_b17");
    else if (minorityType === "minority2") connectedBlocks.push("minority_b18");
    else if (minorityType === "minority3") connectedBlocks.push("minority_b19");
    else if (minorityType === "minorityFull1") connectedBlocks.push("minority_b20b21");
  }

  if (hasSection("gym_groups") && hasGymRows) connectedBlocks.push("gym");

  if (
    (hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) &&
    (special1Classes > 0 || special2Classes > 0 || specialIIClasses > 0)
  ) {
    connectedBlocks.push("special_b26_28");
    connectedBlocks.push("special_combo");
  }

  const hasMixedSection =
    hasSection("dominant_c_first") ||
    hasSection("dominant_c_second") ||
    hasSection("dominant_b_first") ||
    hasSection("dominant_b_second");
  let mixedReferenceNote: PhmaxZsMethodologyHighlights["mixedReferenceNote"] = undefined;
  if (hasMixedSection && (hasMixedLegacyInput || hasMixedMethodTableData || mixedForTotal > 0)) {
    connectedBlocks.push("mixed_explain");
    mixedReferenceNote = { total: mixedForTotal, usesMethodTable: hasMixedMethodTableData };
  }

  if (hasSection("prep_class") && prepClasses > 0) connectedBlocks.push("prep_b29");
  if (hasSection("prep_special") && prepSpecialClasses > 0) connectedBlocks.push("prep_b30");
  if (hasSection("par38") && (p38First > 0 || p38Second > 0)) connectedBlocks.push("par38");
  if (hasSection("par41") && (p41First > 0 || p41Second > 0)) connectedBlocks.push("par41");

  if (hasPhaUi) {
    if (hasPhaSec16Row) connectedBlocks.push("pha_b35_38");
    if (hasPhaZssRow) connectedBlocks.push("pha_b39_45");
  }
  if (hasPhpUi && !phpExcludedSchool) connectedBlocks.push("php_b46");

  return { connectedBlocks, mixedReferenceNote };
}
