import type { SchoolProfile } from "../school-profile/school-profile-types";
import { resolveSchoolTypeCode } from "../school-profile/school-profile-school-type";

export type AnnualReportApplicabilityLevel =
  | "DIRECTLY_APPLICABLE"
  | "NOT_STANDARDLY_REQUIRED"
  | "UNKNOWN";

export type AnnualReportApplicability = {
  level: AnnualReportApplicabilityLevel;
  title: string;
  message: string;
  recommendedAction: string;
  legalNote: string;
};

const DIRECTLY_APPLICABLE_TYPES: ReadonlySet<string> = new Set([
  "ZAKLADNI_SKOLA",
  "STREDNI_SKOLA",
  "KONZERVATOR",
  "VYSSI_ODBORNA_SKOLA",
] as const);

const NOT_STANDARDLY_REQUIRED_TYPES: ReadonlySet<string> = new Set([
  "MATERSKA_SKOLA",
  "ZAKLADNI_UMELECKA_SKOLA",
  "JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY",
  "SKOLSKE_ZARIZENI",
] as const);

const DIRECTLY_APPLICABLE_MESSAGE: AnnualReportApplicability = {
  level: "DIRECTLY_APPLICABLE",
  title: "Výroční zpráva je pro tento typ školy standardně povinná.",
  message: "Modul je určen pro přípravu výroční zprávy o činnosti školy podle školského zákona a vyhlášky č. 15/2005 Sb.",
  recommendedAction: "Pokračujte ve vyplňování jednotlivých kapitol výroční zprávy.",
  legalNote: "Povinnost se vztahuje na základní školy, střední školy, konzervatoře a vyšší odborné školy.",
};

const NOT_STANDARDLY_REQUIRED_MESSAGE: AnnualReportApplicability = {
  level: "NOT_STANDARDLY_REQUIRED",
  title: "Výroční zpráva podle tohoto režimu nemusí být pro tento typ organizace standardně povinná.",
  message:
    "Modul lze použít jako dobrovolnou nebo zřizovatelem požadovanou strukturu, ale doporučujeme ověřit konkrétní povinnost u zřizovatele.",
  recommendedAction:
    "Pokračujte pouze tehdy, pokud výroční zprávu požaduje zřizovatel, interní pravidla organizace nebo pokud ji chcete zpracovat dobrovolně.",
  legalNote:
    "Mateřské školy, základní umělecké školy, jazykové školy s právem státní jazykové zkoušky a školská zařízení zpravidla nezpracovávají výroční zprávu o činnosti školy v tomto režimu.",
};

const UNKNOWN_MESSAGE: AnnualReportApplicability = {
  level: "UNKNOWN",
  title: "Typ školy není jednoznačně určen.",
  message: "Pro posouzení použitelnosti výroční zprávy doplňte typ školy v Profilu školy.",
  recommendedAction: "Přejděte do Profilu školy a vyberte typ školy.",
  legalNote: "Bez určení typu školy nelze automaticky posoudit, zda je modul přímo použitelný.",
};

export function getAnnualReportApplicability(
  schoolProfile: Pick<SchoolProfile, "schoolType"> | null | undefined,
): AnnualReportApplicability {
  const schoolTypeCode = resolveSchoolTypeCode(schoolProfile?.schoolType);
  if (!schoolTypeCode || schoolTypeCode === "JINE") {
    return UNKNOWN_MESSAGE;
  }
  if (DIRECTLY_APPLICABLE_TYPES.has(schoolTypeCode)) {
    return DIRECTLY_APPLICABLE_MESSAGE;
  }
  if (NOT_STANDARDLY_REQUIRED_TYPES.has(schoolTypeCode)) {
    return NOT_STANDARDLY_REQUIRED_MESSAGE;
  }
  return UNKNOWN_MESSAGE;
}
