import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { getSection01StoreSnapshot } from "./vyrocni-zprava-section01-data-storage";
import { buildSection02GeneratorInput } from "./vyrocni-zprava-section02-generator-input";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { getSection02StoreSnapshot } from "./vyrocni-zprava-section02-data-storage";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { getPersonnelStoreSnapshot } from "./vyrocni-zprava-personnel-storage";
import { buildSection04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { getSection04StoreSnapshot } from "./vyrocni-zprava-section04-data-storage";
import { buildSection05GeneratorInput } from "./vyrocni-zprava-section05-generator-input";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { getSection05StoreSnapshot } from "./vyrocni-zprava-section05-data-storage";
import { buildSection06GeneratorInput } from "./vyrocni-zprava-section06-generator-input";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { getSection06StoreSnapshot } from "./vyrocni-zprava-section06-data-storage";
import { buildSection07GeneratorInput } from "./vyrocni-zprava-section07-generator-input";
import { shouldUseSection07Generator } from "./vyrocni-zprava-section07-generator-service";
import { getSection07StoreSnapshot } from "./vyrocni-zprava-section07-data-storage";
import { buildSection08GeneratorInput } from "./vyrocni-zprava-section08-generator-input";
import { shouldUseSection08Generator } from "./vyrocni-zprava-section08-generator-service";
import { getSection08StoreSnapshot } from "./vyrocni-zprava-section08-data-storage";
import { buildSection09GeneratorInput } from "./vyrocni-zprava-section09-generator-input";
import { shouldUseSection09Generator } from "./vyrocni-zprava-section09-generator-service";
import { getSection09StoreSnapshot } from "./vyrocni-zprava-section09-data-storage";
import { buildSection10GeneratorInput } from "./vyrocni-zprava-section10-generator-input";
import { shouldUseSection10Generator } from "./vyrocni-zprava-section10-generator-service";
import { getSection10StoreSnapshot } from "./vyrocni-zprava-section10-data-storage";
import { buildSection11GeneratorInput } from "./vyrocni-zprava-section11-generator-input";
import { shouldUseSection11Generator } from "./vyrocni-zprava-section11-generator-service";
import { getSection11StoreSnapshot } from "./vyrocni-zprava-section11-data-storage";
import { buildSection12GeneratorInput } from "./vyrocni-zprava-section12-generator-input";
import { shouldUseSection12Generator } from "./vyrocni-zprava-section12-generator-service";
import { getSection12StoreSnapshot } from "./vyrocni-zprava-section12-data-storage";
import { buildSection13GeneratorInput } from "./vyrocni-zprava-section13-generator-input";
import { shouldUseSection13Generator } from "./vyrocni-zprava-section13-generator-service";
import { getSection13StoreSnapshot } from "./vyrocni-zprava-section13-data-storage";
import { buildSection14GeneratorInput } from "./vyrocni-zprava-section14-generator-input";
import { shouldUseSection14Generator } from "./vyrocni-zprava-section14-generator-service";
import { getSection14StoreSnapshot } from "./vyrocni-zprava-section14-data-storage";
import type { AnnualReportSection, GeneratedTextStatus } from "./vyrocni-zprava-types";

export function buildSectionGeneratorInput(sectionId: string, schoolProfile: SchoolProfile, schoolYear: string): unknown | null {
  if (shouldUseSection01Generator(sectionId)) {
    return buildSection01GeneratorInput({ schoolProfile, schoolYear, sectionInputs: getSection01StoreSnapshot().data });
  }
  if (shouldUseSection02Generator(sectionId)) {
    return buildSection02GeneratorInput({ schoolProfile, schoolYear, section02Data: getSection02StoreSnapshot().data });
  }
  if (shouldUseSection03Generator(sectionId)) {
    return buildSection03GeneratorInput({
      schoolProfile,
      schoolYear,
      personnelData: getPersonnelStoreSnapshot().data,
      calculatorData: getAnnualReportCalculatorData(),
    });
  }
  if (shouldUseSection04Generator(sectionId)) {
    return buildSection04GeneratorInput({ schoolProfile, schoolYear, section04Data: getSection04StoreSnapshot().data });
  }
  if (shouldUseSection05Generator(sectionId)) {
    return buildSection05GeneratorInput({ schoolProfile, schoolYear, section05Data: getSection05StoreSnapshot().data });
  }
  if (shouldUseSection06Generator(sectionId)) {
    return buildSection06GeneratorInput({ schoolProfile, schoolYear, section06Data: getSection06StoreSnapshot().data });
  }
  if (shouldUseSection07Generator(sectionId)) {
    return buildSection07GeneratorInput({ schoolProfile, schoolYear, section07Data: getSection07StoreSnapshot().data });
  }
  if (shouldUseSection08Generator(sectionId)) {
    return buildSection08GeneratorInput({ schoolProfile, schoolYear, section08Data: getSection08StoreSnapshot().data });
  }
  if (shouldUseSection09Generator(sectionId)) {
    return buildSection09GeneratorInput({ schoolProfile, schoolYear, section09Data: getSection09StoreSnapshot().data });
  }
  if (shouldUseSection10Generator(sectionId)) {
    return buildSection10GeneratorInput({ schoolProfile, schoolYear, section10Data: getSection10StoreSnapshot().data });
  }
  if (shouldUseSection11Generator(sectionId)) {
    return buildSection11GeneratorInput({ schoolProfile, schoolYear, section11Data: getSection11StoreSnapshot().data });
  }
  if (shouldUseSection12Generator(sectionId)) {
    return buildSection12GeneratorInput({ schoolProfile, schoolYear, section12Data: getSection12StoreSnapshot().data });
  }
  if (shouldUseSection13Generator(sectionId)) {
    return buildSection13GeneratorInput({ schoolProfile, schoolYear, section13Data: getSection13StoreSnapshot().data });
  }
  if (shouldUseSection14Generator(sectionId)) {
    return buildSection14GeneratorInput({ schoolProfile, schoolYear, section14Data: getSection14StoreSnapshot().data });
  }
  return null;
}

export function resolveGeneratedTextStatus(params: {
  section: AnnualReportSection;
  schoolProfile: SchoolProfile;
  schoolYear: string;
}): GeneratedTextStatus {
  const hasGeneratedText = params.section.generatedText.trim().length > 0;
  if (!hasGeneratedText) return "not_generated";
  if (!params.section.generatedInputFingerprint) return "stale";

  const input = buildSectionGeneratorInput(params.section.id, params.schoolProfile, params.schoolYear);
  if (!input) return "stale";
  const currentFingerprint = buildAnnualReportInputFingerprint(input);
  return currentFingerprint === params.section.generatedInputFingerprint ? "current" : "stale";
}
