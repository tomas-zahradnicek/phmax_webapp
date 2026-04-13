import type { ModeKey, StudyForm } from "./phmax-ss-helpers";

export type PhmaxSsUnitRow = {
  id: number;
  /** Označení třídy nebo skupiny v evidenci školy. */
  label: string;
  /** Kód oboru vzdělání (RVP), např. 82-51-L/51. */
  educationField: string;
  studyForm: StudyForm;
  /** Prázdné = automatický výběr režimu podle `oborCountInClass` a `isArt82TalentClass`. */
  phmaxMode: "" | ModeKey;
  /** Počet oborů v jedné třídě (pro automatický režim). */
  oborCountInClass: string;
  /** Další kódy oborů ve stejné třídě (čárka / středník / nový řádek). */
  additionalOborCodes: string;
  /** Volitelně počty žáků: `KÓD:15` na řádek nebo čárkou; jinak se použije průměr žáků z řádku pro všechny. */
  oborStudentCountsRaw: string;
  /** Pro automatiku u skupiny 82 / talentových oborů. */
  isArt82TalentClass: boolean;
  /** Typ třídy – volný text podle metodiky / evidence. */
  classType: string;
  note: string;
  /** Průměrný počet žáků (řetězec z inputu). */
  averageStudents: string;
  /** Počet tříd (řetězec z inputu). */
  classCount: string;
};

export function createEmptyPhmaxSsUnitRow(id: number): PhmaxSsUnitRow {
  return {
    id,
    label: "",
    educationField: "",
    studyForm: "denni",
    phmaxMode: "",
    oborCountInClass: "1",
    additionalOborCodes: "",
    oborStudentCountsRaw: "",
    isArt82TalentClass: false,
    classType: "",
    note: "",
    averageStudents: "",
    classCount: "1",
  };
}

const STUDY_FORMS: readonly StudyForm[] = [
  "denni",
  "vecerni",
  "kombinovana",
  "kombinovana_konzervator",
  "dalkova",
  "distancni",
];

const MODE_KEYS: readonly ModeKey[] = [
  "oneObor",
  "twoObory",
  "threeObory",
  "twoObory82",
  "threePlusObory82",
];

function parseStudyForm(raw: unknown): StudyForm {
  const s = typeof raw === "string" ? raw : "";
  return STUDY_FORMS.includes(s as StudyForm) ? (s as StudyForm) : "denni";
}

function parsePhmaxMode(raw: unknown): "" | ModeKey {
  const s = typeof raw === "string" ? raw : "";
  if (s === "") return "";
  return MODE_KEYS.includes(s as ModeKey) ? (s as ModeKey) : "";
}

/** Migrace uložených dat (starší verze bez studyForm / čísel). */
export function revivePhmaxSsUnitRow(o: Record<string, unknown>, fallbackId: number): PhmaxSsUnitRow {
  return {
    id: typeof o.id === "number" ? o.id : fallbackId,
    label: String(o.label ?? ""),
    educationField: String(o.educationField ?? ""),
    studyForm: parseStudyForm(o.studyForm ?? o.form),
    phmaxMode: parsePhmaxMode(o.phmaxMode),
    oborCountInClass: String(o.oborCountInClass ?? "1"),
    additionalOborCodes: String(o.additionalOborCodes ?? ""),
    oborStudentCountsRaw: String(o.oborStudentCountsRaw ?? ""),
    isArt82TalentClass: Boolean(o.isArt82TalentClass),
    classType: String(o.classType ?? ""),
    note: String(o.note ?? ""),
    averageStudents: String(o.averageStudents ?? ""),
    classCount: String(o.classCount ?? "1"),
  };
}
