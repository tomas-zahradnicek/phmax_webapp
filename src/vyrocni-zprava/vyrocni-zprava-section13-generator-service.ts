import { generateSection13Draft, isSection13IncompleteDraft } from "./vyrocni-zprava-section13-local-generator";

export function isAnnualReportSection13Family(sectionId: string): boolean {
  return sectionId === "13";
}

export function shouldUseSection13Generator(sectionId: string): boolean {
  return isAnnualReportSection13Family(sectionId);
}

export { buildSection13GeneratorInput, getSection13Readiness } from "./vyrocni-zprava-section13-generator-input";
export { generateSection13Draft, isSection13IncompleteDraft };
