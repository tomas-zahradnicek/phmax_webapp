import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection09GeneratorInput } from "./vyrocni-zprava-section09-generator-input";
import {
  generateSection09Draft,
  type Section09DraftResult,
} from "./vyrocni-zprava-section09-local-generator";
import type { AnnualReportSection09Data } from "./vyrocni-zprava-section09-types";

export type Section09GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section09Data: AnnualReportSection09Data;
};

export type Section09GenerationOutcome = Section09DraftResult & {
  usesSection09Generator: boolean;
};

/** Hranice pro budoucí AI integraci – aktuálně deleguje na lokální deterministic generátor. */
export async function generateSection09DraftWithAi(
  input: ReturnType<typeof buildSection09GeneratorInput>,
): Promise<Section09DraftResult> {
  return generateSection09Draft(input);
}

export async function generateSection09ChapterDraft(
  context: Section09GenerationContext,
): Promise<Section09GenerationOutcome> {
  const generatorInput = buildSection09GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section09Data: context.section09Data,
  });
  const draft = await generateSection09DraftWithAi(generatorInput);
  return { ...draft, usesSection09Generator: true };
}

export function isAnnualReportSection09Family(sectionId: string): boolean {
  return sectionId === "09";
}

export function shouldUseSection09Generator(sectionId: string): boolean {
  return isAnnualReportSection09Family(sectionId);
}

export { buildSection09GeneratorInput, getSection09Readiness } from "./vyrocni-zprava-section09-generator-input";
export { generateSection09Draft, isSection09IncompleteDraft } from "./vyrocni-zprava-section09-local-generator";
