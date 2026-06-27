import { useCallback, useSyncExternalStore } from "react";

import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION05_LS_KEY,
  createDefaultSection05Data,
  createDefaultSection05GoalEvaluation,
  createDefaultSection05WeeklyHourRow,
  getSection05Readiness,
  normalizeSection05Data,
} from "./vyrocni-zprava-section05-data-logic";
import type {
  AnnualReportSection05Data,
  AnnualReportSection05GoalEvaluation,
  AnnualReportSection05WeeklyHourRow,
  Section05StorageEnvelope,
} from "./vyrocni-zprava-section05-types";

export { VYROCNI_ZPRAVA_SECTION05_LS_KEY };

type Section05Listener = () => void;

type Section05StoreState = {
  data: AnnualReportSection05Data;
  savedAt: string | null;
};

let cachedState: Section05StoreState = loadSection05StoreState();
const listeners = new Set<Section05Listener>();

function emitSection05Change(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSection05(listener: Section05Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection05Snapshot(): Section05StoreState {
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

export function loadSection05DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section05StoreState {
  if (!storage) {
    return { data: createDefaultSection05Data(), savedAt: null };
  }

  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION05_LS_KEY);
    if (!raw) return { data: createDefaultSection05Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection05Data(), savedAt: null };
    const envelope = parsed as Partial<Section05StorageEnvelope>;
    const normalized = normalizeSection05Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection05Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection05Data(), savedAt: null };
  }
}

function loadSection05StoreState(): Section05StoreState {
  return loadSection05DataFromStorage();
}

export function saveSection05DataToStorage(
  data: AnnualReportSection05Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;

  const envelope: Section05StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };

  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION05_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }

  return savedAt;
}

export function clearSection05DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION05_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection05DataState(
  data: AnnualReportSection05Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection05DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection05Change();
}

export function getSection05StoreSnapshot(): Section05StoreState {
  return cachedState;
}

function updateArrayRow<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  if (index < 0 || index >= rows.length) return rows;
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
}

export function useVyrocniZpravaSection05Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection05, getSection05Snapshot, () => ({
    data: createDefaultSection05Data(),
    savedAt: null,
  }));

  const saveSection05Data = useCallback((nextData: AnnualReportSection05Data) => {
    replaceSection05DataState(nextData);
  }, []);

  const updateSection05Data = useCallback((patch: Partial<AnnualReportSection05Data>) => {
    replaceSection05DataState({ ...cachedState.data, ...patch });
  }, []);

  const addCurriculumSubjectRow = useCallback((row?: Partial<AnnualReportSection05WeeklyHourRow>) => {
    const nextRow = { ...createDefaultSection05WeeklyHourRow(), ...row };
    const currentRows = cachedState.data.schoolCurriculumPlan.weeklyHourPlan ?? [];
    replaceSection05DataState({
      ...cachedState.data,
      schoolCurriculumPlan: {
        ...cachedState.data.schoolCurriculumPlan,
        weeklyHourPlan: [...currentRows, nextRow],
      },
    });
  }, []);

  const removeCurriculumSubjectRow = useCallback((index: number) => {
    const currentRows = cachedState.data.schoolCurriculumPlan.weeklyHourPlan ?? [];
    replaceSection05DataState({
      ...cachedState.data,
      schoolCurriculumPlan: {
        ...cachedState.data.schoolCurriculumPlan,
        weeklyHourPlan: currentRows.filter((_, rowIndex) => rowIndex !== index),
      },
    });
  }, []);

  const updateCurriculumSubjectRow = useCallback((index: number, patch: Partial<AnnualReportSection05WeeklyHourRow>) => {
    const currentRows = cachedState.data.schoolCurriculumPlan.weeklyHourPlan ?? [];
    replaceSection05DataState({
      ...cachedState.data,
      schoolCurriculumPlan: {
        ...cachedState.data.schoolCurriculumPlan,
        weeklyHourPlan: updateArrayRow(currentRows, index, patch),
      },
    });
  }, []);

  const addGoalRow = useCallback((row?: Partial<AnnualReportSection05GoalEvaluation>) => {
    const nextRow = { ...createDefaultSection05GoalEvaluation(), ...row };
    replaceSection05DataState({
      ...cachedState.data,
      goalsEvaluation: [...cachedState.data.goalsEvaluation, nextRow],
    });
  }, []);

  const removeGoalRow = useCallback((index: number) => {
    replaceSection05DataState({
      ...cachedState.data,
      goalsEvaluation: cachedState.data.goalsEvaluation.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const updateGoalRow = useCallback((index: number, patch: Partial<AnnualReportSection05GoalEvaluation>) => {
    replaceSection05DataState({
      ...cachedState.data,
      goalsEvaluation: updateArrayRow(cachedState.data.goalsEvaluation, index, patch),
    });
  }, []);

  const resetSection05Data = useCallback(() => {
    clearSection05DataStorage();
    cachedState = { data: createDefaultSection05Data(), savedAt: null };
    emitSection05Change();
  }, []);

  const readiness = getSection05Readiness({
    section05Data: state.data,
    schoolProfile: profile,
  });

  return {
    section05Data: state.data,
    savedAt: state.savedAt,
    readiness,
    saveSection05Data,
    updateSection05Data,
    addCurriculumSubjectRow,
    removeCurriculumSubjectRow,
    updateCurriculumSubjectRow,
    addGoalRow,
    removeGoalRow,
    updateGoalRow,
    resetSection05Data,
  };
}
