import { generateSection14Draft, isSection14IncompleteDraft } from "./vyrocni-zprava-section14-local-generator";

export function isAnnualReportSection14Family(sectionId: string): boolean {
  return sectionId === "14";
}

export function shouldUseSection14Generator(sectionId: string): boolean {
  return isAnnualReportSection14Family(sectionId);
}

export { buildSection14GeneratorInput, getSection14Readiness } from "./vyrocni-zprava-section14-generator-input";
export { generateSection14Draft, isSection14IncompleteDraft };
