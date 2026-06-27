import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection02GeneratorInput } from "./vyrocni-zprava-section02-generator-input";
import {
  generateSection02Draft,
  isSection02IncompleteDraft,
  type Section02DraftResult,
} from "./vyrocni-zprava-section02-local-generator";
import type { AnnualReportSection02Data } from "./vyrocni-zprava-section02-types";

export type Section02GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section02Data: AnnualReportSection02Data;
};

export type Section02GenerationOutcome = Section02DraftResult & {
  usesSection02Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection02DraftWithAi(
  input: ReturnType<typeof buildSection02GeneratorInput>,
): Promise<Section02DraftResult> {
  return generateSection02Draft(input);
}

/** Vygeneruje návrh kapitoly 02 nebo vrátí chybový text při neúplných datech. */
export async function generateSection02ChapterDraft(
  context: Section02GenerationContext,
): Promise<Section02GenerationOutcome> {
  const generatorInput = buildSection02GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section02Data: context.section02Data,
  });
  const draft = await generateSection02DraftWithAi(generatorInput);
  return { ...draft, usesSection02Generator: true };
}

export function isAnnualReportSection02Family(sectionId: string): boolean {
  return sectionId === "02";
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 02. */
export function shouldUseSection02Generator(sectionId: string): boolean {
  return isAnnualReportSection02Family(sectionId);
}

export { buildSection02GeneratorInput, getSection02Readiness } from "./vyrocni-zprava-section02-generator-input";
export { generateSection02Draft, isSection02IncompleteDraft } from "./vyrocni-zprava-section02-local-generator";
