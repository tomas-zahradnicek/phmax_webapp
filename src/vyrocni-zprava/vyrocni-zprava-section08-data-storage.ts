import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION08_LS_KEY,
  createDefaultSection08Data,
  createDefaultSection08NonTeachingStaffDevelopment,
  createDefaultSection08ProfessionalDevelopmentTraining,
  createDefaultSection08QualificationStudy,
  getSection08Readiness,
  normalizeSection08Data,
} from "./vyrocni-zprava-section08-data-logic";
import type {
  AnnualReportSection08Data,
  AnnualReportSection08NonTeachingStaffDevelopment,
  AnnualReportSection08ProfessionalDevelopmentTraining,
  AnnualReportSection08QualificationStudy,
  Section08StorageEnvelope,
} from "./vyrocni-zprava-section08-types";

export { VYROCNI_ZPRAVA_SECTION08_LS_KEY };

type Section08Listener = () => void;

type Section08StoreState = {
  data: AnnualReportSection08Data;
  savedAt: string | null;
};

let cachedState: Section08StoreState = loadSection08StoreState();
const listeners = new Set<Section08Listener>();

function emitSection08Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection08(listener: Section08Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection08Snapshot(): Section08StoreState {
  return cachedState;
}

function resolveStorage(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null): Storage | null {
  if (storage !== undefined) return storage as Storage | null;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function formatSavedAt(date: Date): string {
  return date.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function loadSection08DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section08StoreState {
  if (!storage) return { data: createDefaultSection08Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION08_LS_KEY);
    if (!raw) return { data: createDefaultSection08Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection08Data(), savedAt: null };
    const envelope = parsed as Partial<Section08StorageEnvelope>;
    const normalized = normalizeSection08Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection08Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection08Data(), savedAt: null };
  }
}

function loadSection08StoreState(): Section08StoreState {
  return loadSection08DataFromStorage();
}

export function saveSection08DataToStorage(
  data: AnnualReportSection08Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section08StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION08_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection08DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION08_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection08DataState(
  data: AnnualReportSection08Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection08DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection08Change();
}

export function getSection08StoreSnapshot(): Section08StoreState {
  return cachedState;
}

function sumHours(rows: Array<{ hours?: number }>): number {
  return rows.reduce((sum, row) => sum + (row.hours ?? 0), 0);
}

export function useVyrocniZpravaSection08Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection08, getSection08Snapshot, () => ({
    data: createDefaultSection08Data(),
    savedAt: null,
  }));

  const saveSection08Data = useCallback((nextData: AnnualReportSection08Data) => {
    replaceSection08DataState(nextData);
  }, []);

  const updateSection08Data = useCallback((patch: Partial<AnnualReportSection08Data>) => {
    replaceSection08DataState({ ...cachedState.data, ...patch });
  }, []);

  const addQualificationStudyRow = useCallback((row?: Partial<AnnualReportSection08QualificationStudy>) => {
    replaceSection08DataState({
      ...cachedState.data,
      qualificationStudies: [...cachedState.data.qualificationStudies, { ...createDefaultSection08QualificationStudy(), ...row }],
    });
  }, []);

  const removeQualificationStudyRow = useCallback((index: number) => {
    replaceSection08DataState({
      ...cachedState.data,
      qualificationStudies: cachedState.data.qualificationStudies.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const addAdditionalQualificationStudyRow = useCallback((row?: Partial<AnnualReportSection08QualificationStudy>) => {
    replaceSection08DataState({
      ...cachedState.data,
      additionalQualificationStudies: [
        ...cachedState.data.additionalQualificationStudies,
        { ...createDefaultSection08QualificationStudy(), ...row },
      ],
    });
  }, []);

  const removeAdditionalQualificationStudyRow = useCallback((index: number) => {
    replaceSection08DataState({
      ...cachedState.data,
      additionalQualificationStudies: cachedState.data.additionalQualificationStudies.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const addProfessionalDevelopmentTrainingRow = useCallback(
    (row?: Partial<AnnualReportSection08ProfessionalDevelopmentTraining>) => {
      replaceSection08DataState({
        ...cachedState.data,
        professionalDevelopmentTrainings: [
          ...cachedState.data.professionalDevelopmentTrainings,
          { ...createDefaultSection08ProfessionalDevelopmentTraining(), ...row },
        ],
      });
    },
    [],
  );

  const removeProfessionalDevelopmentTrainingRow = useCallback((index: number) => {
    replaceSection08DataState({
      ...cachedState.data,
      professionalDevelopmentTrainings: cachedState.data.professionalDevelopmentTrainings.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    });
  }, []);

  const addNonTeachingStaffDevelopmentRow = useCallback((row?: Partial<AnnualReportSection08NonTeachingStaffDevelopment>) => {
    replaceSection08DataState({
      ...cachedState.data,
      nonTeachingStaffDevelopment: [
        ...cachedState.data.nonTeachingStaffDevelopment,
        { ...createDefaultSection08NonTeachingStaffDevelopment(), ...row },
      ],
    });
  }, []);

  const removeNonTeachingStaffDevelopmentRow = useCallback((index: number) => {
    replaceSection08DataState({
      ...cachedState.data,
      nonTeachingStaffDevelopment: cachedState.data.nonTeachingStaffDevelopment.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const resetSection08Data = useCallback(() => {
    clearSection08DataStorage();
    cachedState = { data: createDefaultSection08Data(), savedAt: null };
    emitSection08Change();
  }, []);

  const readiness = getSection08Readiness({
    section08Data: state.data,
    schoolProfile: profile,
  });

  const totals = {
    qualificationStudiesCount: state.data.qualificationStudies.length,
    additionalQualificationStudiesCount: state.data.additionalQualificationStudies.length,
    professionalDevelopmentTrainingsCount: state.data.professionalDevelopmentTrainings.length,
    nonTeachingStaffDevelopmentCount: state.data.nonTeachingStaffDevelopment.length,
    professionalDevelopmentHoursTotal: sumHours(state.data.professionalDevelopmentTrainings),
    nonTeachingStaffDevelopmentHoursTotal: sumHours(state.data.nonTeachingStaffDevelopment),
  };

  return {
    section08Data: state.data,
    savedAt: state.savedAt,
    readiness,
    totals,
    saveSection08Data,
    updateSection08Data,
    addQualificationStudyRow,
    removeQualificationStudyRow,
    addAdditionalQualificationStudyRow,
    removeAdditionalQualificationStudyRow,
    addProfessionalDevelopmentTrainingRow,
    removeProfessionalDevelopmentTrainingRow,
    addNonTeachingStaffDevelopmentRow,
    removeNonTeachingStaffDevelopmentRow,
    resetSection08Data,
  };
}
