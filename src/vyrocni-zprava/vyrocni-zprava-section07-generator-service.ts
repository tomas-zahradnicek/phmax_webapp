import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection07GeneratorInput } from "./vyrocni-zprava-section07-generator-input";
import {
  generateSection07Draft,
  isSection07IncompleteDraft,
  type Section07DraftResult,
} from "./vyrocni-zprava-section07-local-generator";
import type { AnnualReportSection07Data } from "./vyrocni-zprava-section07-types";

export type Section07GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section07Data: AnnualReportSection07Data;
};

export type Section07GenerationOutcome = Section07DraftResult & {
  usesSection07Generator: boolean;
};

/** Hranice pro budoucí AI integraci – aktuálně deleguje na lokální deterministic generátor. */
export async function generateSection07DraftWithAi(
  input: ReturnType<typeof buildSection07GeneratorInput>,
): Promise<Section07DraftResult> {
  return generateSection07Draft(input);
}

export async function generateSection07ChapterDraft(
  context: Section07GenerationContext,
): Promise<Section07GenerationOutcome> {
  const generatorInput = buildSection07GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section07Data: context.section07Data,
  });
  const draft = await generateSection07DraftWithAi(generatorInput);
  return { ...draft, usesSection07Generator: true };
}

export function isAnnualReportSection07Family(sectionId: string): boolean {
  return sectionId === "07";
}

export function shouldUseSection07Generator(sectionId: string): boolean {
  return isAnnualReportSection07Family(sectionId);
}

export { buildSection07GeneratorInput, getSection07Readiness } from "./vyrocni-zprava-section07-generator-input";
export { generateSection07Draft, isSection07IncompleteDraft } from "./vyrocni-zprava-section07-local-generator";
