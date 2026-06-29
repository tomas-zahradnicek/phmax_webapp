export const ANNUAL_REPORT_SECTION_STATUSES = [

  "NEVYPLNENO",

  "CHYBI_UDAJE",

  "PRIPRAVENO",

  "VYGENEROVANO",

  "UPRAVENO_UZIVATELEM",

  "SCHVALENO",

] as const;



export type AnnualReportSectionStatus = (typeof ANNUAL_REPORT_SECTION_STATUSES)[number];



export type AnnualReportStatus = "ROZPRACOVANA" | "SCHVALENA";

export type AnnualReportPublicationBlock = {
  discussedByPedagogicalCouncilDate?: string;
  approvedBySchoolCouncilDate?: string;
  sentToFounderDate?: string;
  publishedRemotelyDate?: string;
  placeAndDate?: string;
  principalSignature?: string;
  schoolCouncilChairSignature?: string;
};



export type { SchoolProfile } from "../school-profile/school-profile-types";



export type RequiredFieldKey =

  | "school.name"

  | "school.ico"

  | "school.redIzo"

  | "school.izo"

  | "school.address"

  | "school.municipality"

  | "school.region"

  | "school.founder"

  | "school.principalName"

  | "school.website"

  | "school.email"

  | "school.schoolType"

  | "school.phone"

  | "school.dataBox"

  | "section.userNotes";



export type AnnualReportSectionDefinition = {

  id: string;

  number: string;

  parentNumber?: string;

  title: string;

  /** Kratší titulek pro levý seznam kapitol. */

  listTitle?: string;

  description: string;

  requiredFields: RequiredFieldKey[];

  order: number;

};



export type AnnualReportSection = {

  id: string;

  number: string;

  title: string;

  parentNumber?: string;

  description: string;

  requiredFields: RequiredFieldKey[];

  userNotes: string;

  generatedText: string;

  /** Poslední text vygenerovaný generátorem – pro obnovu po ruční úpravě. */
  originalGeneratedText?: string;

  /** True po ruční úpravě uloženého generatedText. */
  editedByUser?: boolean;

  status: AnnualReportSectionStatus;

  missingFields: string[];

  approved: boolean;

  approvedAt?: string | null;

  /** Čas poslední změny generatedText / schválení kapitoly. */
  updatedAt?: string | null;

  order: number;

};



export type AnnualReport = {

  id: string;

  schoolYear: string;

  sections: AnnualReportSection[];

  createdAt: string;

  updatedAt: string;

  status: AnnualReportStatus;

  publicationBlock?: AnnualReportPublicationBlock;

};



export type AnnualReportSectionTreeNode = AnnualReportSection & {

  children: AnnualReportSectionTreeNode[];

};



export {

  SCHOOL_PROFILE_KRAJE as VYROCNI_ZPRAVA_KRAJE,

  SCHOOL_PROFILE_SCHOOL_TYPES as VYROCNI_ZPRAVA_SCHOOL_TYPES,

} from "../school-profile/school-profile-constants";



export const VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER =

  "Návrh kapitoly bude v další fázi vytvořen pomocí AI asistenta.";



export const ANNUAL_REPORT_SECTION_STATUS_LABELS: Record<AnnualReportSectionStatus, string> = {

  NEVYPLNENO: "Nevyplněno",

  CHYBI_UDAJE: "Chybí údaje",

  PRIPRAVENO: "Připraveno",

  VYGENEROVANO: "Vygenerováno",

  UPRAVENO_UZIVATELEM: "Upraveno uživatelem",

  SCHVALENO: "Schváleno",

};



export const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {

  "school.name": "Název školy",

  "school.ico": "IČO",

  "school.redIzo": "RED IZO",

  "school.izo": "IZO",

  "school.address": "Sídlo školy",

  "school.municipality": "Obec",

  "school.region": "Kraj",

  "school.founder": "Zřizovatel",

  "school.principalName": "Ředitel školy",

  "school.website": "Web školy",

  "school.email": "E-mail školy",

  "school.schoolType": "Typ školy",

  "school.phone": "Telefon",

  "school.dataBox": "Datová schránka",

  "section.userNotes": "Poznámky ke kapitole",

};


