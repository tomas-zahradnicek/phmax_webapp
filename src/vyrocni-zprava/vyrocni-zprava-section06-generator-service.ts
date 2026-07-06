import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection06GeneratorInput } from "./vyrocni-zprava-section06-generator-input";
import {
  generateSection06Draft,
  type Section06DraftResult,
} from "./vyrocni-zprava-section06-local-generator";
import type { AnnualReportSection06Data } from "./vyrocni-zprava-section06-types";

export type Section06GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section06Data: AnnualReportSection06Data;
};

export type Section06GenerationOutcome = Section06DraftResult & {
  usesSection06Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection06DraftWithAi(
  input: ReturnType<typeof buildSection06GeneratorInput>,
): Promise<Section06DraftResult> {
  return generateSection06Draft(input);
}

/** Vygeneruje návrh kapitoly 06 nebo vrátí chybový text při neúplných datech. */
export async function generateSection06ChapterDraft(
  context: Section06GenerationContext,
): Promise<Section06GenerationOutcome> {
  const generatorInput = buildSection06GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section06Data: context.section06Data,
  });
  const draft = await generateSection06DraftWithAi(generatorInput);
  return { ...draft, usesSection06Generator: true };
}

export function isAnnualReportSection06Family(sectionId: string): boolean {
  return sectionId === "06";
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 06. */
export function shouldUseSection06Generator(sectionId: string): boolean {
  return isAnnualReportSection06Family(sectionId);
}

export { buildSection06GeneratorInput, getSection06Readiness } from "./vyrocni-zprava-section06-generator-input";
export { generateSection06Draft, isSection06IncompleteDraft } from "./vyrocni-zprava-section06-local-generator";
