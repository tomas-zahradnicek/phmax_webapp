export type MethodStep = "A" | "B" | "C" | "D" | "E";

export type CalculatorMode =
  | "phmax_full_zs"
  | "phmax_first_stage_only"
  | "phmax_full_zs_sec16"
  | "phmax_dominant_field"
  | "phmax_psychiatric"
  | "phmax_minority_language"
  | "phmax_multiyear_gym"
  | "phmax_extras_38_41_prep"
  | "phamax_zs_sec16_special"
  | "phpmax_basic_school"
  | "nv75_teacher"
  | "nv75_headteacher"
  | "nv75_deputy"
  | "nv75_other_staff";

export type FormSection =
  | "basic_first"
  | "basic_second"
  | "school_variant_first_stage_only"
  | "sec16_first"
  | "sec16_second"
  | "special_i_first"
  | "special_i_second"
  | "special_ii"
  | "dominant_c_first"
  | "dominant_c_second"
  | "dominant_b_first"
  | "dominant_b_second"
  | "psych_groups"
  | "minority_variant"
  | "minority_first"
  | "minority_second"
  | "gym_groups"
  | "prep_class"
  | "prep_special"
  | "par38"
  | "par41"
  | "pha_rvp_zs_first"
  | "pha_rvp_zs_second"
  | "pha_rvp_zss_i_first"
  | "pha_rvp_zss_i_second"
  | "pha_rvp_zss_ii"
  | "pha_disability_flags"
  | "php_years"
  | "php_options"
  | "nv75_teacher_type"
  | "nv75_headteacher_type"
  | "nv75_units"
  | "nv75_deputy_units"
  | "nv75_other_staff_type";

export type FieldKey =
  | "basicType"
  | "basic1Classes"
  | "basic1Pupils"
  | "basic2Classes"
  | "basic2Pupils"
  | "sec16FirstClasses"
  | "sec16FirstPupils"
  | "sec16SecondClasses"
  | "sec16SecondPupils"
  | "dominantCFirstClasses"
  | "dominantCFirstPupils"
  | "dominantCSecondClasses"
  | "dominantCSecondPupils"
  | "dominantBFirstClasses"
  | "dominantBFirstPupils"
  | "dominantBSecondClasses"
  | "dominantBSecondPupils"
  | "minorityVariant"
  | "minority1Classes"
  | "minority1Pupils"
  | "minority2Classes"
  | "minority2Pupils"
  | "prepClasses"
  | "prepChildren"
  | "prepSpecialClasses"
  | "prepSpecialChildren"
  | "p38First"
  | "p38Second"
  | "p41First"
  | "p41Second"
  | "phpYear1"
  | "phpYear2"
  | "phpYear3"
  | "phpShortPeriod"
  | "phpExcludedSchool"
  | "teacherMode"
  | "headteacherMode"
  | "units"
  | "otherStaffMode";

export type BreakdownCategory =
  | "basic_first"
  | "basic_second"
  | "sec16_first"
  | "sec16_second"
  | "dominant_c_first"
  | "dominant_c_second"
  | "dominant_b_first"
  | "dominant_b_second"
  | "psych_first"
  | "psych_second"
  | "psych_mix"
  | "minority_first"
  | "minority_second"
  | "gym_first"
  | "gym_second"
  | "special_i_first"
  | "special_i_second"
  | "special_ii"
  | "prep"
  | "prep_special"
  | "par38_first"
  | "par38_second"
  | "par41_first"
  | "par41_second"
  | "pha_rvp_zs_first_ad1"
  | "pha_rvp_zs_first_ad2"
  | "pha_rvp_zs_second_ad1"
  | "pha_rvp_zs_second_ad2"
  | "pha_rvp_zss_i_first_ad1"
  | "pha_rvp_zss_i_first_ad2"
  | "pha_rvp_zss_i_second_ad1"
  | "pha_rvp_zss_i_second_ad2"
  | "pha_rvp_zss_ii_ad1"
  | "pha_rvp_zss_ii_ad2"
  | "php_total"
  | "nv75_teacher"
  | "nv75_headteacher"
  | "nv75_deputy"
  | "nv75_other_staff";

export interface BreakdownRow {
  id: string;
  mode: CalculatorMode;
  step: MethodStep;
  category: BreakdownCategory;
  label: string;
  formulaLabel: string;
  calcText: string;
  subtotal: number;
  unitLabel?: string;
  units?: number;
  perUnit?: number;
  avg?: number;
  bandLabel?: string;
  tableCode?: string;
  note?: string;
}

export interface ModeConfig {
  id: CalculatorMode;
  label: string;
  group: "phmax" | "phamax" | "phpmax" | "nv75";
  description: string;
  visibleSections: FormSection[];
  requiredFields: FieldKey[];
  methodSteps: MethodStep[];
  supportsMethodView: boolean;
  supportsSimpleView: boolean;
  hideTotalsFromOtherModules: boolean;
  phpEligibility?: "eligible" | "ineligible" | "not_applicable";
  notes?: string[];
}

export const MODE_CONFIG: Record<CalculatorMode, ModeConfig> = {
  phmax_full_zs: {
    id: "phmax_full_zs",
    label: "PHmax – úplná ZŠ",
    group: "phmax",
    description: "Úplná základní škola s 1. i 2. stupněm bez zvláštních režimů.",
    visibleSections: ["basic_first", "basic_second"],
    requiredFields: ["basic1Classes", "basic1Pupils", "basic2Classes", "basic2Pupils"],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "eligible",
  },
  phmax_first_stage_only: {
    id: "phmax_first_stage_only",
    label: "PHmax – ZŠ tvořená třídami 1. stupně",
    group: "phmax",
    description: "Škola tvořená pouze třídami 1. stupně; varianta 1 / 2 / 3 / 4+ tříd.",
    visibleSections: ["school_variant_first_stage_only", "basic_first", "sec16_first"],
    requiredFields: ["basicType", "basic1Classes", "basic1Pupils"],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "eligible",
  },
  phmax_full_zs_sec16: {
    id: "phmax_full_zs_sec16",
    label: "PHmax – úplná ZŠ s třídami dle § 16 odst. 9",
    group: "phmax",
    description: "Běžné třídy 1. a 2. stupně a samostatně třídy podle § 16 odst. 9.",
    visibleSections: ["basic_first", "basic_second", "sec16_first", "sec16_second"],
    requiredFields: [
      "basic1Classes", "basic1Pupils", "basic2Classes", "basic2Pupils",
      "sec16FirstClasses", "sec16FirstPupils", "sec16SecondClasses", "sec16SecondPupils",
    ],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "ineligible",
  },
  phmax_dominant_field: {
    id: "phmax_dominant_field",
    label: "PHmax – třídy s převažujícím oborem vzdělání",
    group: "phmax",
    description: "Smíšené třídy s převažujícím oborem 79-01-C/01 nebo 79-01-B/01.",
    visibleSections: ["dominant_c_first", "dominant_c_second", "dominant_b_first", "dominant_b_second"],
    requiredFields: [
      "dominantCFirstClasses", "dominantCFirstPupils", "dominantCSecondClasses", "dominantCSecondPupils",
      "dominantBFirstClasses", "dominantBFirstPupils", "dominantBSecondClasses", "dominantBSecondPupils",
    ],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "not_applicable",
  },
  phmax_psychiatric: {
    id: "phmax_psychiatric",
    label: "PHmax – škola při psychiatrické nemocnici",
    group: "phmax",
    description: "Průměr se bere jako vyšší z předchozího roku a aktuálního sběru dat.",
    visibleSections: ["psych_groups"],
    requiredFields: [],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "ineligible",
  },
  phmax_minority_language: {
    id: "phmax_minority_language",
    label: "PHmax – ZŠ s jazykem národnostní menšiny",
    group: "phmax",
    description: "Samostatný výpočet pro B17–B21.",
    visibleSections: ["minority_variant", "minority_first", "minority_second"],
    requiredFields: ["minorityVariant", "minority1Classes", "minority1Pupils"],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "not_applicable",
  },
  phmax_multiyear_gym: {
    id: "phmax_multiyear_gym",
    label: "PHmax – nižší ročníky víceletých gymnázií",
    group: "phmax",
    description: "Šestileté, osmileté a sportovní gymnázium.",
    visibleSections: ["gym_groups"],
    requiredFields: [],
    methodSteps: ["A", "B", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "not_applicable",
  },
  phmax_extras_38_41_prep: {
    id: "phmax_extras_38_41_prep",
    label: "PHmax – přípravné třídy, přípravný stupeň, § 38 a § 41",
    group: "phmax",
    description: "Samostatné položky PHmax mimo běžné třídy B1–B28.",
    visibleSections: ["prep_class", "prep_special", "par38", "par41"],
    requiredFields: [],
    methodSteps: ["A", "C", "D"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "not_applicable",
  },
  phamax_zs_sec16_special: {
    id: "phamax_zs_sec16_special",
    label: "PHAmax – ZŠ dle § 16 odst. 9 a ZŠ speciální",
    group: "phamax",
    description: "RVP ZŠ, RVP ZŠS I. díl, RVP ZŠS II. díl a rozdělení tříd podle příznaku.",
    visibleSections: [
      "pha_rvp_zs_first", "pha_rvp_zs_second", "pha_rvp_zss_i_first", "pha_rvp_zss_i_second", "pha_rvp_zss_ii",
      "pha_disability_flags",
    ],
    requiredFields: [],
    methodSteps: ["A", "B", "C", "D", "E"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "not_applicable",
  },
  phpmax_basic_school: {
    id: "phpmax_basic_school",
    label: "PHPmax – základní škola",
    group: "phpmax",
    description: "Výpočet podle průměrného počtu žáků za 3 roky nebo kratší období.",
    visibleSections: ["php_years", "php_options"],
    requiredFields: ["phpYear1", "phpYear2", "phpYear3"],
    methodSteps: ["A", "B", "C"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
    phpEligibility: "eligible",
  },
  nv75_teacher: {
    id: "nv75_teacher",
    label: "NV 75/2005 – učitel",
    group: "nv75",
    description: "Týdenní rozsah přímé pedagogické činnosti učitele ZŠ.",
    visibleSections: ["nv75_teacher_type"],
    requiredFields: ["teacherMode"],
    methodSteps: ["A", "B", "C"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
  },
  nv75_headteacher: {
    id: "nv75_headteacher",
    label: "NV 75/2005 – ředitel školy",
    group: "nv75",
    description: "Týdenní rozsah přímé pedagogické činnosti ředitele podle typu školy a počtu jednotek.",
    visibleSections: ["nv75_headteacher_type", "nv75_units"],
    requiredFields: ["headteacherMode", "units"],
    methodSteps: ["A", "B", "C"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
  },
  nv75_deputy: {
    id: "nv75_deputy",
    label: "NV 75/2005 – zástupce ředitele",
    group: "nv75",
    description: "Snížení týdenního rozsahu přímé pedagogické činnosti zástupce ředitele školy.",
    visibleSections: ["nv75_deputy_units"],
    requiredFields: ["units"],
    methodSteps: ["A", "B", "C"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
  },
  nv75_other_staff: {
    id: "nv75_other_staff",
    label: "NV 75/2005 – ostatní pedagogičtí pracovníci",
    group: "nv75",
    description: "Psycholog, speciální pedagog, školský logoped, sociální pedagog, trenér, asistent pedagoga.",
    visibleSections: ["nv75_other_staff_type"],
    requiredFields: ["otherStaffMode"],
    methodSteps: ["A", "C"],
    supportsMethodView: true,
    supportsSimpleView: true,
    hideTotalsFromOtherModules: true,
  },
};