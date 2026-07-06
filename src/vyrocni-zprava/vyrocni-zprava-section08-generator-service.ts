import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection08GeneratorInput } from "./vyrocni-zprava-section08-generator-input";
import {
  generateSection08Draft,
  type Section08DraftResult,
} from "./vyrocni-zprava-section08-local-generator";
import type { AnnualReportSection08Data } from "./vyrocni-zprava-section08-types";

export type Section08GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section08Data: AnnualReportSection08Data;
};

export type Section08GenerationOutcome = Section08DraftResult & {
  usesSection08Generator: boolean;
};

/** Hranice pro budoucí AI integraci – aktuálně deleguje na lokální deterministic generátor. */
export async function generateSection08DraftWithAi(
  input: ReturnType<typeof buildSection08GeneratorInput>,
): Promise<Section08DraftResult> {
  return generateSection08Draft(input);
}

export async function generateSection08ChapterDraft(
  context: Section08GenerationContext,
): Promise<Section08GenerationOutcome> {
  const generatorInput = buildSection08GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section08Data: context.section08Data,
  });
  const draft = await generateSection08DraftWithAi(generatorInput);
  return { ...draft, usesSection08Generator: true };
}

export function isAnnualReportSection08Family(sectionId: string): boolean {
  return sectionId === "08";
}

export function shouldUseSection08Generator(sectionId: string): boolean {
  return isAnnualReportSection08Family(sectionId);
}

export { buildSection08GeneratorInput, getSection08Readiness } from "./vyrocni-zprava-section08-generator-input";
export { generateSection08Draft, isSection08IncompleteDraft } from "./vyrocni-zprava-section08-local-generator";
