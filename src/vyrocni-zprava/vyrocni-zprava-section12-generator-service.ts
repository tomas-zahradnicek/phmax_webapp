import { generateSection12Draft, isSection12IncompleteDraft } from "./vyrocni-zprava-section12-local-generator";

export function isAnnualReportSection12Family(sectionId: string): boolean {
  return sectionId === "12";
}

export function shouldUseSection12Generator(sectionId: string): boolean {
  return isAnnualReportSection12Family(sectionId);
}

export { buildSection12GeneratorInput, getSection12Readiness } from "./vyrocni-zprava-section12-generator-input";
export { generateSection12Draft, isSection12IncompleteDraft };
