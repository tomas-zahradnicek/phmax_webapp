import type { CalculatorMode, BreakdownCategory } from "./calculator-config";

export interface BreakdownPreset {
  mode: CalculatorMode;
  categories: BreakdownCategory[];
}

export const BREAKDOWN_PRESETS: Record<CalculatorMode, BreakdownPreset> = {
  phmax_full_zs: { mode: "phmax_full_zs", categories: ["basic_first", "basic_second"] },
  phmax_first_stage_only: { mode: "phmax_first_stage_only", categories: ["basic_first", "sec16_first"] },
  phmax_full_zs_sec16: { mode: "phmax_full_zs_sec16", categories: ["basic_first", "basic_second", "sec16_first", "sec16_second"] },
  phmax_dominant_field: { mode: "phmax_dominant_field", categories: ["dominant_c_first", "dominant_c_second", "dominant_b_first", "dominant_b_second"] },
  phmax_psychiatric: { mode: "phmax_psychiatric", categories: ["psych_first", "psych_second", "psych_mix"] },
  phmax_minority_language: { mode: "phmax_minority_language", categories: ["minority_first", "minority_second"] },
  phmax_multiyear_gym: { mode: "phmax_multiyear_gym", categories: ["gym_first", "gym_second"] },
  phmax_extras_38_41_prep: { mode: "phmax_extras_38_41_prep", categories: ["prep", "prep_special", "par38_first", "par38_second", "par41_first", "par41_second"] },
  phamax_zs_sec16_special: {
    mode: "phamax_zs_sec16_special",
    categories: [
      "pha_rvp_zs_first_ad1","pha_rvp_zs_first_ad2","pha_rvp_zs_second_ad1","pha_rvp_zs_second_ad2",
      "pha_rvp_zss_i_first_ad1","pha_rvp_zss_i_first_ad2","pha_rvp_zss_i_second_ad1","pha_rvp_zss_i_second_ad2",
      "pha_rvp_zss_ii_ad1","pha_rvp_zss_ii_ad2",
    ],
  },
  phpmax_basic_school: { mode: "phpmax_basic_school", categories: ["php_total"] },
  nv75_teacher: { mode: "nv75_teacher", categories: ["nv75_teacher"] },
  nv75_headteacher: { mode: "nv75_headteacher", categories: ["nv75_headteacher"] },
  nv75_deputy: { mode: "nv75_deputy", categories: ["nv75_deputy"] },
  nv75_other_staff: { mode: "nv75_other_staff", categories: ["nv75_other_staff"] },
};
