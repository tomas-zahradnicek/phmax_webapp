import type { SchoolProfile } from "../school-profile/school-profile-types";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import {
  generateSection01Draft,
  isSection01IncompleteDraft,
  type Section01DraftResult,
} from "./vyrocni-zprava-section01-local-generator";
import type { VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";

export type Section01GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section01Data: VyrocniZpravaSection01Data;
};

export type Section01GenerationOutcome = Section01DraftResult & {
  usesSection01Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection01DraftWithAi(
  input: ReturnType<typeof buildSection01GeneratorInput>,
): Promise<Section01DraftResult> {
  return generateSection01Draft(input);
}

/** Vygeneruje návrh kapitoly 01 nebo vrátí chybový text při neúplných datech. */
export async function generateSection01ChapterDraft(
  context: Section01GenerationContext,
): Promise<Section01GenerationOutcome> {
  const generatorInput = buildSection01GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    sectionInputs: context.section01Data,
  });
  const draft = await generateSection01DraftWithAi(generatorInput);
  return { ...draft, usesSection01Generator: true };
}

export function isAnnualReportSection01Family(sectionId: string): boolean {
  return sectionId === "01" || sectionId.startsWith("1.");
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 01. */
export function shouldUseSection01Generator(sectionId: string): boolean {
  return isAnnualReportSection01Family(sectionId);
}

export { buildSection01GeneratorInput, getSection01Readiness } from "./vyrocni-zprava-section01-generator-input";
export { generateSection01Draft, isSection01IncompleteDraft } from "./vyrocni-zprava-section01-local-generator";
