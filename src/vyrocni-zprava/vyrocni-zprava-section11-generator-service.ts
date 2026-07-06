import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection11GeneratorInput } from "./vyrocni-zprava-section11-generator-input";
import {
  generateSection11Draft,
  type Section11DraftResult,
} from "./vyrocni-zprava-section11-local-generator";
import type { AnnualReportSection11Data } from "./vyrocni-zprava-section11-types";

export type Section11GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section11Data: AnnualReportSection11Data;
};

export type Section11GenerationOutcome = Section11DraftResult & {
  usesSection11Generator: boolean;
};

/** Hranice pro budoucí AI integraci – aktuálně deleguje na lokální deterministic generátor. */
export async function generateSection11DraftWithAi(
  input: ReturnType<typeof buildSection11GeneratorInput>,
): Promise<Section11DraftResult> {
  return generateSection11Draft(input);
}

export async function generateSection11ChapterDraft(
  context: Section11GenerationContext,
): Promise<Section11GenerationOutcome> {
  const generatorInput = buildSection11GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section11Data: context.section11Data,
  });
  const draft = await generateSection11DraftWithAi(generatorInput);
  return { ...draft, usesSection11Generator: true };
}

export function isAnnualReportSection11Family(sectionId: string): boolean {
  return sectionId === "11";
}

export function shouldUseSection11Generator(sectionId: string): boolean {
  return isAnnualReportSection11Family(sectionId);
}

export { buildSection11GeneratorInput, getSection11Readiness } from "./vyrocni-zprava-section11-generator-input";
export { generateSection11Draft, isSection11IncompleteDraft } from "./vyrocni-zprava-section11-local-generator";
