import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection05GeneratorInput } from "./vyrocni-zprava-section05-generator-input";
import {
  generateSection05Draft,
  isSection05IncompleteDraft,
  type Section05DraftResult,
} from "./vyrocni-zprava-section05-local-generator";
import type { AnnualReportSection05Data } from "./vyrocni-zprava-section05-types";

export type Section05GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section05Data: AnnualReportSection05Data;
};

export type Section05GenerationOutcome = Section05DraftResult & {
  usesSection05Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection05DraftWithAi(
  input: ReturnType<typeof buildSection05GeneratorInput>,
): Promise<Section05DraftResult> {
  return generateSection05Draft(input);
}

/** Vygeneruje návrh kapitoly 05 nebo vrátí chybový text při neúplných datech. */
export async function generateSection05ChapterDraft(
  context: Section05GenerationContext,
): Promise<Section05GenerationOutcome> {
  const generatorInput = buildSection05GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section05Data: context.section05Data,
  });
  const draft = await generateSection05DraftWithAi(generatorInput);
  return { ...draft, usesSection05Generator: true };
}

export function isAnnualReportSection05Family(sectionId: string): boolean {
  return sectionId === "05";
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 05. */
export function shouldUseSection05Generator(sectionId: string): boolean {
  return isAnnualReportSection05Family(sectionId);
}

export { buildSection05GeneratorInput, getSection05Readiness } from "./vyrocni-zprava-section05-generator-input";
export { generateSection05Draft, isSection05IncompleteDraft } from "./vyrocni-zprava-section05-local-generator";
