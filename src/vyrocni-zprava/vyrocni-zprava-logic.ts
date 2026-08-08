import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { isAnnualReportSection03Family } from "./vyrocni-zprava-calculator-data-bridge";
import { isAnnualReportSection01Family } from "./vyrocni-zprava-section01-generator-service";
import { isAnnualReportSection02Family } from "./vyrocni-zprava-section02-generator-service";
import { isAnnualReportSection04Family } from "./vyrocni-zprava-section04-generator-service";
import { isAnnualReportSection05Family } from "./vyrocni-zprava-section05-generator-service";
import { isAnnualReportSection06Family } from "./vyrocni-zprava-section06-generator-service";
import { isAnnualReportSection07Family } from "./vyrocni-zprava-section07-generator-service";
import { isAnnualReportSection08Family } from "./vyrocni-zprava-section08-generator-service";
import { isAnnualReportSection09Family } from "./vyrocni-zprava-section09-generator-service";
import { isAnnualReportSection10Family } from "./vyrocni-zprava-section10-generator-service";
import { isAnnualReportSection11Family } from "./vyrocni-zprava-section11-generator-service";
import { isSection01IncompleteDraft } from "./vyrocni-zprava-section01-local-generator";
import { isSection02IncompleteDraft } from "./vyrocni-zprava-section02-local-generator";
import { isSection04IncompleteDraft } from "./vyrocni-zprava-section04-local-generator";
import { isSection05IncompleteDraft } from "./vyrocni-zprava-section05-local-generator";
import { isSection06IncompleteDraft } from "./vyrocni-zprava-section06-local-generator";
import { isSection07IncompleteDraft } from "./vyrocni-zprava-section07-local-generator";
import { isSection08IncompleteDraft } from "./vyrocni-zprava-section08-local-generator";
import { isSection09IncompleteDraft } from "./vyrocni-zprava-section09-local-generator";
import { isSection10IncompleteDraft } from "./vyrocni-zprava-section10-local-generator";
import { isSection11IncompleteDraft } from "./vyrocni-zprava-section11-local-generator";
import { isSection12IncompleteDraft } from "./vyrocni-zprava-section12-local-generator";
import { isSection13IncompleteDraft } from "./vyrocni-zprava-section13-local-generator";
import { isSection14IncompleteDraft } from "./vyrocni-zprava-section14-local-generator";
import { isAnnualReportSection12Family } from "./vyrocni-zprava-section12-generator-service";
import { isAnnualReportSection13Family } from "./vyrocni-zprava-section13-generator-service";
import { isAnnualReportSection14Family } from "./vyrocni-zprava-section14-generator-service";
import { isSection03IncompleteDraft } from "./vyrocni-zprava-section03-local-generator";
import { mergeSavedSectionFields } from "./vyrocni-zprava-generated-text-logic";

import type { SchoolProfile } from "../school-profile/school-profile-types";

import type {

  AnnualReport,

  AnnualReportSection,

  AnnualReportSectionStatus,

  AnnualReportSectionTreeNode,

  AnnualReportStatus,

  RequiredFieldKey,

} from "./vyrocni-zprava-types";

import { REQUIRED_FIELD_LABELS } from "./vyrocni-zprava-types";



function createId(): string {

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {

    return crypto.randomUUID();

  }

  return `vz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

}



export function createSectionFromDefinition(

  definition: (typeof ANNUAL_REPORT_SECTION_DEFINITIONS)[number],

): AnnualReportSection {

  return {

    id: definition.id,

    number: definition.number,

    parentNumber: definition.parentNumber,

    title: definition.title,

    description: definition.description,

    requiredFields: [...definition.requiredFields],

    userNotes: "",

    generatedText: "",

    originalGeneratedText: undefined,

    editedByUser: false,

    status: "NEVYPLNENO",

    missingFields: [],

    approved: false,

    approvedAt: null,

    updatedAt: null,

    order: definition.order,

  };

}



/** Fresh VZ schoolYear is empty until the user sets a canonical label (0G-0). */
export function createDefaultAnnualReport(schoolYear = ""): AnnualReport {

  const now = new Date().toISOString();

  return {

    id: createId(),

    schoolYear,

    sections: ANNUAL_REPORT_SECTION_DEFINITIONS.map(createSectionFromDefinition),

    createdAt: now,

    updatedAt: now,

    status: "ROZPRACOVANA",

  };

}



function readSchoolField(profile: SchoolProfile, key: RequiredFieldKey): string {

  switch (key) {

    case "school.name":

      return profile.name;

    case "school.ico":

      return profile.ico;

    case "school.redIzo":

      return profile.redIzo;

    case "school.izo":

      return profile.izo;

    case "school.address":

      return profile.address;

    case "school.municipality":

      return profile.municipality;

    case "school.region":

      return profile.region;

    case "school.founder":

      return profile.founder;

    case "school.principalName":

      return profile.principalName;

    case "school.website":

      return profile.website;

    case "school.email":

      return profile.email;

    case "school.schoolType":

      return profile.schoolType;

    case "school.phone":

      return profile.phone;

    case "school.dataBox":

      return profile.dataBox;

    default:

      return "";

  }

}



function isFieldFilled(value: string): boolean {

  return value.trim().length > 0;

}



export function computeMissingFields(

  section: AnnualReportSection,

  schoolProfile: SchoolProfile,

): string[] {

  const missing: string[] = [];

  for (const key of section.requiredFields) {

    const value =

      key === "section.userNotes" ? section.userNotes : readSchoolField(schoolProfile, key);

    if (!isFieldFilled(value)) {

      missing.push(REQUIRED_FIELD_LABELS[key]);

    }

  }

  return missing;

}



export function hasAnySectionInput(section: AnnualReportSection, schoolProfile: SchoolProfile): boolean {

  if (section.userNotes.trim()) return true;

  if (section.generatedText.trim()) return true;

  return section.requiredFields.some((key) => {

    if (key === "section.userNotes") return false;

    return isFieldFilled(readSchoolField(schoolProfile, key));

  });

}



export function computeSectionStatus(

  section: AnnualReportSection,

  schoolProfile: SchoolProfile,

): AnnualReportSectionStatus {

  if (section.approved) return "SCHVALENO";

  const generated = section.generatedText.trim();
  if (generated) {
    if (isAnnualReportSection01Family(section.id) && isSection01IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection02Family(section.id) && isSection02IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection04Family(section.id) && isSection04IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection05Family(section.id) && isSection05IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection06Family(section.id) && isSection06IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection07Family(section.id) && isSection07IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection08Family(section.id) && isSection08IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection09Family(section.id) && isSection09IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection10Family(section.id) && isSection10IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection11Family(section.id) && isSection11IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection12Family(section.id) && isSection12IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection13Family(section.id) && isSection13IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection14Family(section.id) && isSection14IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (isAnnualReportSection03Family(section.id) && isSection03IncompleteDraft(section.generatedText)) {
      return "CHYBI_UDAJE";
    }
    if (section.editedByUser) return "UPRAVENO_UZIVATELEM";
    return "VYGENEROVANO";
  }



  const missing = computeMissingFields(section, schoolProfile);

  if (missing.length === 0) return "PRIPRAVENO";

  if (hasAnySectionInput(section, schoolProfile)) return "CHYBI_UDAJE";

  return "NEVYPLNENO";

}



export function refreshSectionState(

  section: AnnualReportSection,

  schoolProfile: SchoolProfile,

): AnnualReportSection {

  const missingFields = computeMissingFields(section, schoolProfile);

  const status = computeSectionStatus({ ...section, missingFields }, schoolProfile);

  return { ...section, missingFields, status };

}



export function refreshAllSections(report: AnnualReport, schoolProfile: SchoolProfile): AnnualReport {

  const sections = report.sections.map((section) => refreshSectionState(section, schoolProfile));

  const status = computeReportStatus(sections);

  return {

    ...report,

    sections,

    status,

    updatedAt: new Date().toISOString(),

  };

}



export function computeReportStatus(sections: AnnualReportSection[]): AnnualReportStatus {

  if (sections.length > 0 && sections.every((section) => section.approved)) {

    return "SCHVALENA";

  }

  return "ROZPRACOVANA";

}



export function countApprovedSections(sections: AnnualReportSection[]): { approved: number; total: number } {

  return {

    approved: sections.filter((section) => section.approved).length,

    total: sections.length,

  };

}



export function findAnnualReportSection(

  sections: AnnualReportSection[],

  id: string,

): AnnualReportSection | undefined {

  return sections.find((section) => section.id === id);

}



export function updateAnnualReportSection(

  sections: AnnualReportSection[],

  id: string,

  patch: Partial<AnnualReportSection>,

): AnnualReportSection[] {

  return sections.map((section) => (section.id === id ? { ...section, ...patch } : section));

}



export function getSectionListTitle(section: AnnualReportSection): string {

  const definition = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === section.id);

  return definition?.listTitle ?? section.title;

}



export function buildAnnualReportSectionTree(sections: AnnualReportSection[]): AnnualReportSectionTreeNode[] {

  const byNumber = new Map(sections.map((section) => [section.number, section]));

  const childrenByParent = new Map<string, AnnualReportSection[]>();



  for (const section of sections) {

    if (!section.parentNumber) continue;

    const siblings = childrenByParent.get(section.parentNumber) ?? [];

    siblings.push(section);

    childrenByParent.set(section.parentNumber, siblings);

  }



  const roots = sections

    .filter((section) => !section.parentNumber || !byNumber.has(section.parentNumber))

    .sort((a, b) => a.order - b.order);



  const toNode = (section: AnnualReportSection): AnnualReportSectionTreeNode => ({

    ...section,

    children: (childrenByParent.get(section.number) ?? [])

      .sort((a, b) => a.order - b.order)

      .map(toNode),

  });



  return roots.map(toNode);

}



export function mergeSectionDefinitions(report: AnnualReport, schoolProfile: SchoolProfile): AnnualReport {

  const existing = new Map(report.sections.map((section) => [section.id, section]));

  const sections = ANNUAL_REPORT_SECTION_DEFINITIONS.map((definition) => {

    const saved = existing.get(definition.id);

    if (!saved) return createSectionFromDefinition(definition);

    return refreshSectionState(mergeSavedSectionFields(createSectionFromDefinition(definition), saved), schoolProfile);

  });

  return refreshAllSections({ ...report, sections }, schoolProfile);

}


