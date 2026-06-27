import { useCallback, useSyncExternalStore } from "react";

import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION04_LS_KEY,
  createDefaultSection04Data,
  createDefaultSection04GradeCountRow,
  createDefaultSection04PupilCountRow,
  getSection04Readiness,
  normalizeSection04Data,
} from "./vyrocni-zprava-section04-data-logic";
import type {
  AnnualReportSection04Data,
  AnnualReportSection04GradeCount,
  AnnualReportSection04PupilCountRow,
  AnnualReportSection04SecondaryAdmission,
  Section04StorageEnvelope,
} from "./vyrocni-zprava-section04-types";

export { VYROCNI_ZPRAVA_SECTION04_LS_KEY };

type Section04Listener = () => void;

type Section04StoreState = {
  data: AnnualReportSection04Data;
  savedAt: string | null;
};

let cachedState: Section04StoreState = loadSection04StoreState();
const listeners = new Set<Section04Listener>();

function emitSection04Change(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSection04(listener: Section04Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection04Snapshot(): Section04StoreState {
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

export function loadSection04DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section04StoreState {
  if (!storage) return { data: createDefaultSection04Data(), savedAt: null };

  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION04_LS_KEY);
    if (!raw) return { data: createDefaultSection04Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection04Data(), savedAt: null };
    const envelope = parsed as Partial<Section04StorageEnvelope>;
    const normalized = normalizeSection04Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection04Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection04Data(), savedAt: null };
  }
}

function loadSection04StoreState(): Section04StoreState {
  return loadSection04DataFromStorage();
}

export function saveSection04DataToStorage(
  data: AnnualReportSection04Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;

  const envelope: Section04StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };

  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION04_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }

  return savedAt;
}

export function clearSection04DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION04_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection04DataState(
  data: AnnualReportSection04Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection04DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection04Change();
}

export function getSection04StoreSnapshot(): Section04StoreState {
  return cachedState;
}

function updateArrayItem<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  if (index < 0 || index >= rows.length) return rows;
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
}

export function useVyrocniZpravaSection04Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection04, getSection04Snapshot, () => ({
    data: createDefaultSection04Data(),
    savedAt: null,
  }));

  const saveSection04Data = useCallback((nextData: AnnualReportSection04Data) => {
    replaceSection04DataState(nextData);
  }, []);

  const updateSection04Data = useCallback((patch: Partial<AnnualReportSection04Data>) => {
    replaceSection04DataState({ ...cachedState.data, ...patch });
  }, []);

  const addPupilCountRow = useCallback((target: "september" | "june", row?: Partial<AnnualReportSection04PupilCountRow>) => {
    const nextRow = { ...createDefaultSection04PupilCountRow(), ...row };
    replaceSection04DataState({
      ...cachedState.data,
      ...(target === "september"
        ? { pupilCountsSeptember: [...cachedState.data.pupilCountsSeptember, nextRow] }
        : { pupilCountsJune: [...cachedState.data.pupilCountsJune, nextRow] }),
    });
  }, []);

  const removePupilCountRow = useCallback((target: "september" | "june", index: number) => {
    replaceSection04DataState({
      ...cachedState.data,
      ...(target === "september"
        ? { pupilCountsSeptember: cachedState.data.pupilCountsSeptember.filter((_, rowIndex) => rowIndex !== index) }
        : { pupilCountsJune: cachedState.data.pupilCountsJune.filter((_, rowIndex) => rowIndex !== index) }),
    });
  }, []);

  const updatePupilCountRow = useCallback(
    (target: "september" | "june", index: number, patch: Partial<AnnualReportSection04PupilCountRow>) => {
      replaceSection04DataState({
        ...cachedState.data,
        ...(target === "september"
          ? { pupilCountsSeptember: updateArrayItem(cachedState.data.pupilCountsSeptember, index, patch) }
          : { pupilCountsJune: updateArrayItem(cachedState.data.pupilCountsJune, index, patch) }),
      });
    },
    [],
  );

  const addGradeCountRow = useCallback((target: "admitted" | "left", row?: Partial<AnnualReportSection04GradeCount>) => {
    const nextRow = { ...createDefaultSection04GradeCountRow(), ...row };
    replaceSection04DataState({
      ...cachedState.data,
      ...(target === "admitted"
        ? { pupilsAdmittedDuringYear: [...cachedState.data.pupilsAdmittedDuringYear, nextRow] }
        : { pupilsLeftDuringYear: [...cachedState.data.pupilsLeftDuringYear, nextRow] }),
    });
  }, []);

  const removeGradeCountRow = useCallback((target: "admitted" | "left", index: number) => {
    replaceSection04DataState({
      ...cachedState.data,
      ...(target === "admitted"
        ? { pupilsAdmittedDuringYear: cachedState.data.pupilsAdmittedDuringYear.filter((_, rowIndex) => rowIndex !== index) }
        : { pupilsLeftDuringYear: cachedState.data.pupilsLeftDuringYear.filter((_, rowIndex) => rowIndex !== index) }),
    });
  }, []);

  const updateGradeCountRow = useCallback((target: "admitted" | "left", index: number, patch: Partial<AnnualReportSection04GradeCount>) => {
    replaceSection04DataState({
      ...cachedState.data,
      ...(target === "admitted"
        ? { pupilsAdmittedDuringYear: updateArrayItem(cachedState.data.pupilsAdmittedDuringYear, index, patch) }
        : { pupilsLeftDuringYear: updateArrayItem(cachedState.data.pupilsLeftDuringYear, index, patch) }),
    });
  }, []);

  const addSecondaryAdmissionRow = useCallback((row?: Partial<AnnualReportSection04SecondaryAdmission>) => {
    replaceSection04DataState({
      ...cachedState.data,
      secondarySchoolAdmissions: [...cachedState.data.secondarySchoolAdmissions, { schoolType: "", count: undefined, ...row }],
    });
  }, []);

  const removeSecondaryAdmissionRow = useCallback((index: number) => {
    replaceSection04DataState({
      ...cachedState.data,
      secondarySchoolAdmissions: cachedState.data.secondarySchoolAdmissions.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const updateSecondaryAdmissionRow = useCallback((index: number, patch: Partial<AnnualReportSection04SecondaryAdmission>) => {
    replaceSection04DataState({
      ...cachedState.data,
      secondarySchoolAdmissions: updateArrayItem(cachedState.data.secondarySchoolAdmissions, index, patch),
    });
  }, []);

  const resetSection04Data = useCallback(() => {
    clearSection04DataStorage();
    cachedState = { data: createDefaultSection04Data(), savedAt: null };
    emitSection04Change();
  }, []);

  const readiness = getSection04Readiness({
    section04Data: state.data,
    schoolProfile: profile,
  });

  const totals = {
    pupilCountsSeptemberTotal: state.data.pupilCountsSeptember.reduce((sum, row) => sum + (row.total ?? 0), 0),
    pupilCountsJuneTotal: state.data.pupilCountsJune.reduce((sum, row) => sum + (row.total ?? 0), 0),
    admittedDuringYearTotal: state.data.pupilsAdmittedDuringYear.reduce((sum, row) => sum + (row.count ?? 0), 0),
    leftDuringYearTotal: state.data.pupilsLeftDuringYear.reduce((sum, row) => sum + (row.count ?? 0), 0),
  };

  return {
    section04Data: state.data,
    savedAt: state.savedAt,
    readiness,
    totals,
    saveSection04Data,
    updateSection04Data,
    addPupilCountRow,
    removePupilCountRow,
    updatePupilCountRow,
    addGradeCountRow,
    removeGradeCountRow,
    updateGradeCountRow,
    addSecondaryAdmissionRow,
    removeSecondaryAdmissionRow,
    updateSecondaryAdmissionRow,
    resetSection04Data,
  };
}
