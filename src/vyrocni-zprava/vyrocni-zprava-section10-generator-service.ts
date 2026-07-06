import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection10GeneratorInput } from "./vyrocni-zprava-section10-generator-input";
import {
  generateSection10Draft,
  type Section10DraftResult,
} from "./vyrocni-zprava-section10-local-generator";
import type { AnnualReportSection10Data } from "./vyrocni-zprava-section10-types";

export type Section10GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section10Data: AnnualReportSection10Data;
};

export type Section10GenerationOutcome = Section10DraftResult & {
  usesSection10Generator: boolean;
};

/** Hranice pro budoucí AI integraci – aktuálně deleguje na lokální deterministic generátor. */
export async function generateSection10DraftWithAi(
  input: ReturnType<typeof buildSection10GeneratorInput>,
): Promise<Section10DraftResult> {
  return generateSection10Draft(input);
}

export async function generateSection10ChapterDraft(
  context: Section10GenerationContext,
): Promise<Section10GenerationOutcome> {
  const generatorInput = buildSection10GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section10Data: context.section10Data,
  });
  const draft = await generateSection10DraftWithAi(generatorInput);
  return { ...draft, usesSection10Generator: true };
}

export function isAnnualReportSection10Family(sectionId: string): boolean {
  return sectionId === "10";
}

export function shouldUseSection10Generator(sectionId: string): boolean {
  return isAnnualReportSection10Family(sectionId);
}

export { buildSection10GeneratorInput, getSection10Readiness } from "./vyrocni-zprava-section10-generator-input";
export { generateSection10Draft, isSection10IncompleteDraft } from "./vyrocni-zprava-section10-local-generator";
