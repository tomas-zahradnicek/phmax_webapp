import { useCallback, useEffect, useRef, useState } from "react";

import { useSchoolProfile } from "../school-profile/use-school-profile";

import {
  countApprovedSections,
  findAnnualReportSection,
  refreshAllSections,
  updateAnnualReportSection,
} from "./vyrocni-zprava-logic";

import {
  clearVyrocniZpravaStorage,
  createFreshVyrocniZpravaStorage,
  loadVyrocniZpravaStorage,
  saveVyrocniZpravaStorage,
  type VyrocniZpravaStorageLoadIssue,
  type VyrocniZpravaStorageSaveIssue,
} from "./vyrocni-zprava-storage";

import type { AnnualReport, AnnualReportPublicationBlock } from "./vyrocni-zprava-types";
import type { SchoolProfile } from "../school-profile/school-profile-types";

import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { generateSection01Draft } from "./vyrocni-zprava-section01-local-generator";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { getSection01StoreSnapshot } from "./vyrocni-zprava-section01-data-storage";
import { buildSection02GeneratorInput } from "./vyrocni-zprava-section02-generator-input";
import { generateSection02Draft } from "./vyrocni-zprava-section02-local-generator";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { getSection02StoreSnapshot } from "./vyrocni-zprava-section02-data-storage";
import { buildSection04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";
import { generateSection04Draft } from "./vyrocni-zprava-section04-local-generator";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { getSection04StoreSnapshot } from "./vyrocni-zprava-section04-data-storage";
import { buildSection05GeneratorInput } from "./vyrocni-zprava-section05-generator-input";
import { generateSection05Draft } from "./vyrocni-zprava-section05-local-generator";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { getSection05StoreSnapshot } from "./vyrocni-zprava-section05-data-storage";
import { buildSection06GeneratorInput } from "./vyrocni-zprava-section06-generator-input";
import { generateSection06Draft } from "./vyrocni-zprava-section06-local-generator";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { getSection06StoreSnapshot } from "./vyrocni-zprava-section06-data-storage";
import { buildSection07GeneratorInput } from "./vyrocni-zprava-section07-generator-input";
import { generateSection07Draft } from "./vyrocni-zprava-section07-local-generator";
import { shouldUseSection07Generator } from "./vyrocni-zprava-section07-generator-service";
import { getSection07StoreSnapshot } from "./vyrocni-zprava-section07-data-storage";
import { buildSection08GeneratorInput } from "./vyrocni-zprava-section08-generator-input";
import { generateSection08Draft } from "./vyrocni-zprava-section08-local-generator";
import { shouldUseSection08Generator } from "./vyrocni-zprava-section08-generator-service";
import { getSection08StoreSnapshot } from "./vyrocni-zprava-section08-data-storage";
import { buildSection09GeneratorInput } from "./vyrocni-zprava-section09-generator-input";
import { generateSection09Draft } from "./vyrocni-zprava-section09-local-generator";
import { shouldUseSection09Generator } from "./vyrocni-zprava-section09-generator-service";
import { getSection09StoreSnapshot } from "./vyrocni-zprava-section09-data-storage";
import { buildSection10GeneratorInput } from "./vyrocni-zprava-section10-generator-input";
import { generateSection10Draft } from "./vyrocni-zprava-section10-local-generator";
import { shouldUseSection10Generator } from "./vyrocni-zprava-section10-generator-service";
import { getSection10StoreSnapshot } from "./vyrocni-zprava-section10-data-storage";
import { buildSection11GeneratorInput } from "./vyrocni-zprava-section11-generator-input";
import { generateSection11Draft } from "./vyrocni-zprava-section11-local-generator";
import { shouldUseSection11Generator } from "./vyrocni-zprava-section11-generator-service";
import { getSection11StoreSnapshot } from "./vyrocni-zprava-section11-data-storage";
import { buildSection12GeneratorInput } from "./vyrocni-zprava-section12-generator-input";
import { generateSection12Draft } from "./vyrocni-zprava-section12-local-generator";
import { shouldUseSection12Generator } from "./vyrocni-zprava-section12-generator-service";
import { getSection12StoreSnapshot } from "./vyrocni-zprava-section12-data-storage";
import { buildSection13GeneratorInput } from "./vyrocni-zprava-section13-generator-input";
import { generateSection13Draft } from "./vyrocni-zprava-section13-local-generator";
import { shouldUseSection13Generator } from "./vyrocni-zprava-section13-generator-service";
import { getSection13StoreSnapshot } from "./vyrocni-zprava-section13-data-storage";
import { buildSection14GeneratorInput } from "./vyrocni-zprava-section14-generator-input";
import { generateSection14Draft } from "./vyrocni-zprava-section14-local-generator";
import { shouldUseSection14Generator } from "./vyrocni-zprava-section14-generator-service";
import { getSection14StoreSnapshot } from "./vyrocni-zprava-section14-data-storage";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { generateSection03Draft } from "./vyrocni-zprava-section03-local-generator";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { getPersonnelStoreSnapshot } from "./vyrocni-zprava-personnel-storage";
import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";
import {
  REGENERATE_EDITED_SECTION_CONFIRM,
  applyGeneratedDraft,
  approveSectionDraft,
  restoreOriginalGeneratedDraft,
  saveGeneratedTextEdits,
  shouldConfirmRegenerate,
} from "./vyrocni-zprava-generated-text-logic";
import {
  createSerializedVzSchoolYearBindingRunner,
  shouldApplyVzSchoolYearBindingUiOutcome,
} from "./vz-school-year-persist-binding";

export function useVyrocniZpravaReport() {
  const { profile, updateProfile, missingRequiredFields } = useSchoolProfile();

  const initial = useRef(loadVyrocniZpravaStorage());

  const [report, setReport] = useState<AnnualReport>(initial.current.report);

  const [selectedSectionId, setSelectedSectionId] = useState(initial.current.selectedSectionId);

  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loadIssue] = useState<VyrocniZpravaStorageLoadIssue | undefined>(initial.current.loadIssue);
  const [saveIssue, setSaveIssue] = useState<VyrocniZpravaStorageSaveIssue | undefined>(undefined);
  const [schoolYearMetadataNotice, setSchoolYearMetadataNotice] = useState<string | null>(null);

  const [checkVisibleForSectionId, setCheckVisibleForSectionId] = useState<string | null>(null);

  const skipNextSave = useRef(false);
  const bindingRunnerRef = useRef<ReturnType<typeof createSerializedVzSchoolYearBindingRunner> | null>(
    null,
  );
  if (bindingRunnerRef.current == null) {
    bindingRunnerRef.current = createSerializedVzSchoolYearBindingRunner();
  }
  const bindingGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persist = useCallback((nextReport: AnnualReport, nextSelectedId: string) => {
    const result = saveVyrocniZpravaStorage({
      version: 1,
      report: nextReport,
      selectedSectionId: nextSelectedId,
    });
    if (!result.ok) {
      setSaveIssue(result.saveIssue);
      return;
    }

    // Business persistence succeeded independently of SchoolYear metadata sync.
    setSavedAt(new Date().toLocaleString("cs-CZ"));
    setSaveIssue(undefined);

    const generation = ++bindingGenerationRef.current;
    const runner = bindingRunnerRef.current;
    if (!runner) return;
    void runner.afterPersist(result).then((outcome) => {
      if (
        !shouldApplyVzSchoolYearBindingUiOutcome({
          mounted: mountedRef.current,
          generation,
          currentGeneration: bindingGenerationRef.current,
          outcome,
        })
      ) {
        return;
      }
      setSchoolYearMetadataNotice(outcome.metadataNotice);
    });
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    persist(report, selectedSectionId);
  }, [report, selectedSectionId, persist]);

  useEffect(() => {
    setReport((prev) => refreshAllSections(prev, profile));
  }, [profile]);

  const patchSchoolProfile = useCallback(
    (patch: Partial<SchoolProfile>) => {
      updateProfile(patch);
    },
    [updateProfile],
  );

  const setSchoolYear = useCallback(
    (schoolYear: string) => {
      setReport((prev) => refreshAllSections({ ...prev, schoolYear }, profile));
    },
    [profile],
  );

  const updatePublicationBlock = useCallback((patch: Partial<AnnualReportPublicationBlock>) => {
    setReport((prev) => ({
      ...prev,
      publicationBlock: {
        ...(prev.publicationBlock ?? {}),
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateSectionNotes = useCallback(
    (sectionId: string, userNotes: string) => {
      setReport((prev) => {
        const section = findAnnualReportSection(prev.sections, sectionId);
        if (!section) return prev;

        const nextSection = { ...section, userNotes, approved: false, approvedAt: null };
        const sections = updateAnnualReportSection(prev.sections, sectionId, nextSection);
        return refreshAllSections({ ...prev, sections }, profile);
      });
    },
    [profile],
  );

  const checkSectionData = useCallback(
    (sectionId: string) => {
      setReport((prev) => refreshAllSections(prev, profile));
      setCheckVisibleForSectionId(sectionId);
    },
    [profile],
  );

  const generateSectionDraft = useCallback(
    (sectionId: string) => {
      const section = findAnnualReportSection(report.sections, sectionId);
      if (!section) return;

      if (shouldConfirmRegenerate(section)) {
        const confirmed = window.confirm(REGENERATE_EDITED_SECTION_CONFIRM);
        if (!confirmed) return;
      }

      setReport((prev) => {
        const current = findAnnualReportSection(prev.sections, sectionId);
        if (!current) return prev;

        let generatedText = VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER;
        let generatedInputFingerprint: string | undefined = undefined;

        if (shouldUseSection01Generator(sectionId)) {
          const section01Data = getSection01StoreSnapshot().data;
          const generatorInput = buildSection01GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            sectionInputs: section01Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection01Draft(generatorInput).text;
        } else if (shouldUseSection02Generator(sectionId)) {
          const section02Data = getSection02StoreSnapshot().data;
          const generatorInput = buildSection02GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section02Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection02Draft(generatorInput).text;
        } else if (shouldUseSection04Generator(sectionId)) {
          const section04Data = getSection04StoreSnapshot().data;
          const generatorInput = buildSection04GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section04Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection04Draft(generatorInput).text;
        } else if (shouldUseSection05Generator(sectionId)) {
          const section05Data = getSection05StoreSnapshot().data;
          const generatorInput = buildSection05GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section05Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection05Draft(generatorInput).text;
        } else if (shouldUseSection06Generator(sectionId)) {
          const section06Data = getSection06StoreSnapshot().data;
          const generatorInput = buildSection06GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section06Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection06Draft(generatorInput).text;
        } else if (shouldUseSection07Generator(sectionId)) {
          const section07Data = getSection07StoreSnapshot().data;
          const generatorInput = buildSection07GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section07Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection07Draft(generatorInput).text;
        } else if (shouldUseSection08Generator(sectionId)) {
          const section08Data = getSection08StoreSnapshot().data;
          const generatorInput = buildSection08GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section08Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection08Draft(generatorInput).text;
        } else if (shouldUseSection09Generator(sectionId)) {
          const section09Data = getSection09StoreSnapshot().data;
          const generatorInput = buildSection09GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section09Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection09Draft(generatorInput).text;
        } else if (shouldUseSection10Generator(sectionId)) {
          const section10Data = getSection10StoreSnapshot().data;
          const generatorInput = buildSection10GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section10Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection10Draft(generatorInput).text;
        } else if (shouldUseSection11Generator(sectionId)) {
          const section11Data = getSection11StoreSnapshot().data;
          const generatorInput = buildSection11GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section11Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection11Draft(generatorInput).text;
        } else if (shouldUseSection12Generator(sectionId)) {
          const section12Data = getSection12StoreSnapshot().data;
          const generatorInput = buildSection12GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section12Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection12Draft(generatorInput).text;
        } else if (shouldUseSection13Generator(sectionId)) {
          const section13Data = getSection13StoreSnapshot().data;
          const generatorInput = buildSection13GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section13Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection13Draft(generatorInput).text;
        } else if (shouldUseSection14Generator(sectionId)) {
          const section14Data = getSection14StoreSnapshot().data;
          const generatorInput = buildSection14GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            section14Data,
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection14Draft(generatorInput).text;
        } else if (shouldUseSection03Generator(sectionId)) {
          const personnelData = getPersonnelStoreSnapshot().data;
          const generatorInput = buildSection03GeneratorInput({
            schoolProfile: profile,
            schoolYear: prev.schoolYear,
            personnelData,
            calculatorData: getAnnualReportCalculatorData(),
          });
          generatedInputFingerprint = buildAnnualReportInputFingerprint(generatorInput);
          generatedText = generateSection03Draft(generatorInput).text;
        }

        const nextSection = applyGeneratedDraft(current, generatedText, generatedInputFingerprint);
        const sections = updateAnnualReportSection(prev.sections, sectionId, nextSection);
        return refreshAllSections({ ...prev, sections }, profile);
      });
    },
    [profile, report.sections],
  );

  const saveGeneratedText = useCallback(
    (sectionId: string, generatedText: string) => {
      setReport((prev) => {
        const section = findAnnualReportSection(prev.sections, sectionId);
        if (!section) return prev;

        const nextSection = saveGeneratedTextEdits(section, generatedText);
        const sections = updateAnnualReportSection(prev.sections, sectionId, nextSection);
        return refreshAllSections({ ...prev, sections }, profile);
      });
    },
    [profile],
  );

  const restoreGeneratedText = useCallback(
    (sectionId: string) => {
      setReport((prev) => {
        const section = findAnnualReportSection(prev.sections, sectionId);
        if (!section) return prev;

        const restored = restoreOriginalGeneratedDraft(section);
        if (!restored) return prev;

        const sections = updateAnnualReportSection(prev.sections, sectionId, restored);
        return refreshAllSections({ ...prev, sections }, profile);
      });
    },
    [profile],
  );

  const approveSection = useCallback(
    (sectionId: string) => {
      setReport((prev) => {
        const section = findAnnualReportSection(prev.sections, sectionId);
        if (!section) return prev;

        const nextSection = approveSectionDraft(section);
        const sections = updateAnnualReportSection(prev.sections, sectionId, nextSection);
        return refreshAllSections({ ...prev, sections }, profile);
      });
    },
    [profile],
  );

  const clearReport = useCallback(() => {
    const schoolYear = report.schoolYear;

    const fresh = createFreshVyrocniZpravaStorage(schoolYear);

    skipNextSave.current = true;

    clearVyrocniZpravaStorage();

    setReport(fresh.report);

    setSelectedSectionId(fresh.selectedSectionId);

    setCheckVisibleForSectionId(null);

    persist(fresh.report, fresh.selectedSectionId);
  }, [persist, report.schoolYear]);

  const progress = countApprovedSections(report.sections);

  const selectedSection = findAnnualReportSection(report.sections, selectedSectionId);

  return {
    report,
    schoolProfile: profile,
    selectedSectionId,
    selectedSection,
    savedAt,
    loadIssue,
    saveIssue,
    schoolYearMetadataNotice,
    progress,
    missingProfileFields: missingRequiredFields,
    checkVisibleForSectionId,
    setSelectedSectionId,
    patchSchoolProfile,
    setSchoolYear,
    updatePublicationBlock,
    updateSectionNotes,
    checkSectionData,
    generateSectionDraft,
    saveGeneratedText,
    restoreGeneratedText,
    approveSection,
    clearReport,
  };
}
