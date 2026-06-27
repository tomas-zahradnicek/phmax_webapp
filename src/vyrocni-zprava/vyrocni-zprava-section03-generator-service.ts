import type { SchoolProfile } from "../school-profile/school-profile-types";
import {
  getAnnualReportCalculatorData,
  isAnnualReportSection03Family,
} from "./vyrocni-zprava-calculator-data-bridge";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import {
  generateSection03Draft,
  isSection03IncompleteDraft,
  type Section03DraftResult,
} from "./vyrocni-zprava-section03-local-generator";

export type Section03GenerationContext = {
  sectionId: string;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  personnelData: AnnualReportPersonnelData;
  storage?: Pick<Storage, "getItem"> | null;
};

export type Section03GenerationOutcome = Section03DraftResult & {
  usesSection03Generator: boolean;
};

/** Hranice pro budoucí napojení AI – zatím deleguje na lokální generátor. */
export async function generateSection03DraftWithAi(
  input: ReturnType<typeof buildSection03GeneratorInput>,
): Promise<Section03DraftResult> {
  return generateSection03Draft(input);
}

/** Vygeneruje návrh kapitoly 03 nebo vrátí chybový text při neúplných datech. */
export async function generateSection03ChapterDraft(
  context: Section03GenerationContext,
): Promise<Section03GenerationOutcome> {
  const calculatorData = getAnnualReportCalculatorData(context.storage);
  const generatorInput = buildSection03GeneratorInput({
    schoolProfile: context.schoolProfile,
    schoolYear: context.schoolYear,
    personnelData: context.personnelData,
    calculatorData,
  });
  const draft = await generateSection03DraftWithAi(generatorInput);
  return { ...draft, usesSection03Generator: true };
}

/** Rozhodne, zda se má pro danou kapitolu použít generátor 03. */
export function shouldUseSection03Generator(sectionId: string): boolean {
  return isAnnualReportSection03Family(sectionId);
}

export { buildSection03GeneratorInput, generateSection03Draft, isSection03IncompleteDraft };
