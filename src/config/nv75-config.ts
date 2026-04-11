export type Nv75TeacherMode =
  | "teacher_standard"
  | "teacher_first_grade"
  | "teacher_sec16_first_stage_school"
  | "teacher_sec16_first_stage_class"
  | "teacher_prep_class"
  | "teacher_prep_special_stage";

export type Nv75HeadteacherMode =
  | "head_first_stage"
  | "head_second_stage"
  | "head_first_and_second"
  | "head_sec16_first_stage"
  | "head_sec16_first_and_second";

export type Nv75OtherStaffMode =
  | "psychologist"
  | "special_educator"
  | "speech_therapist"
  | "social_educator"
  | "trainer"
  | "assistant";

export const NV75_TEACHER_VALUES: Record<Nv75TeacherMode, { label: string; value: string }> = {
  teacher_standard: { label: "Učitel ZŠ", value: "22" },
  teacher_first_grade: { label: "Učitel 1. ročníku ZŠ", value: "20 až 22" },
  teacher_sec16_first_stage_school: { label: "Učitel 1. stupně ZŠ zřízené podle § 16 odst. 9", value: "20 až 22" },
  teacher_sec16_first_stage_class: { label: "Učitel třídy zřízené podle § 16 odst. 9 na 1. stupni ZŠ", value: "20 až 22" },
  teacher_prep_class: { label: "Učitel přípravné třídy ZŠ", value: "20 až 22" },
  teacher_prep_special_stage: { label: "Učitel přípravného stupně ZŠ speciální", value: "20 až 22" },
};

export const NV75_DEPUTY_RULES = [
  { min: 5, max: 6, value: 9 },
  { min: 7, max: 14, value: 11 },
  { min: 15, max: 17, value: 15 },
  { min: 18, max: 26, value: 22 },
  { min: 27, max: 35, value: 33 },
] as const;

export const NV75_OTHER_STAFF_VALUES = {
  psychologist: { label: "Psycholog", value: "24" },
  special_educator: { label: "Speciální pedagog", value: "24" },
  speech_therapist: { label: "Školský logoped", value: "24" },
  social_educator: { label: "Sociální pedagog", value: "24" },
  trainer: { label: "Trenér", value: "21 až 26" },
  assistant: { label: "Asistent pedagoga", value: "36" },
} as const;
