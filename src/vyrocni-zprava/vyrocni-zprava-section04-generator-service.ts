import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";
import {
  generateSection04Draft,
  isSection04IncompleteDraft,
  type Section04DraftResult,
} from "./vyrocni-zprava-section04-local-generator";
import type { AnnualReportSection04Data } from "./vyrocni-zprava-section04-types";

export type Section04GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section04Data: AnnualReportSection04Data;
};

export type Section04GenerationOutcome = Section04DraftResult & {
  usesSection04Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection04DraftWithAi(
  input: ReturnType<typeof buildSection04GeneratorInput>,
): Promise<Section04DraftResult> {
  return generateSection04Draft(input);
}

/** Vygeneruje návrh kapitoly 04 nebo vrátí chybový text při neúplných datech. */
export async function generateSection04ChapterDraft(
  context: Section04GenerationContext,
): Promise<Section04GenerationOutcome> {
  const generatorInput = buildSection04GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    section04Data: context.section04Data,
  });
  const draft = await generateSection04DraftWithAi(generatorInput);
  return { ...draft, usesSection04Generator: true };
}

export function isAnnualReportSection04Family(sectionId: string): boolean {
  return sectionId === "04";
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 04. */
export function shouldUseSection04Generator(sectionId: string): boolean {
  return isAnnualReportSection04Family(sectionId);
}

export { buildSection04GeneratorInput, getSection04Readiness } from "./vyrocni-zprava-section04-generator-input";
export { generateSection04Draft, isSection04IncompleteDraft } from "./vyrocni-zprava-section04-local-generator";
