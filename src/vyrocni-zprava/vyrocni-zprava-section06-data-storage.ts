import { useCallback, useSyncExternalStore } from "react";

import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION06_LS_KEY,
  createDefaultSection06ClassResultRow,
  createDefaultSection06Data,
  getSection06Readiness,
  normalizeSection06Data,
} from "./vyrocni-zprava-section06-data-logic";
import type {
  AnnualReportSection06ClassResultRow,
  AnnualReportSection06Data,
  Section06StorageEnvelope,
} from "./vyrocni-zprava-section06-types";

export { VYROCNI_ZPRAVA_SECTION06_LS_KEY };

type Section06Listener = () => void;

type Section06StoreState = {
  data: AnnualReportSection06Data;
  savedAt: string | null;
};

let cachedState: Section06StoreState = loadSection06StoreState();
const listeners = new Set<Section06Listener>();

function emitSection06Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection06(listener: Section06Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection06Snapshot(): Section06StoreState {
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

export function loadSection06DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section06StoreState {
  if (!storage) return { data: createDefaultSection06Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION06_LS_KEY);
    if (!raw) return { data: createDefaultSection06Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection06Data(), savedAt: null };
    const envelope = parsed as Partial<Section06StorageEnvelope>;
    const normalized = normalizeSection06Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection06Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection06Data(), savedAt: null };
  }
}

function loadSection06StoreState(): Section06StoreState {
  return loadSection06DataFromStorage();
}

export function saveSection06DataToStorage(
  data: AnnualReportSection06Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section06StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION06_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection06DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION06_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection06DataState(
  data: AnnualReportSection06Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection06DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection06Change();
}

export function getSection06StoreSnapshot(): Section06StoreState {
  return cachedState;
}

function updateArrayRow<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  if (index < 0 || index >= rows.length) return rows;
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
}

function calcTermTotals(rows: AnnualReportSection06ClassResultRow[]) {
  return rows.reduce(
    (acc, row) => ({
      pupilsTotal: acc.pupilsTotal + (row.pupilsTotal ?? 0),
      passedWithHonours: acc.passedWithHonours + (row.passedWithHonours ?? 0),
      passed: acc.passed + (row.passed ?? 0),
      failed: acc.failed + (row.failed ?? 0),
      notAssessed: acc.notAssessed + (row.notAssessed ?? 0),
    }),
    {
      pupilsTotal: 0,
      passedWithHonours: 0,
      passed: 0,
      failed: 0,
      notAssessed: 0,
    },
  );
}

export function useVyrocniZpravaSection06Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection06, getSection06Snapshot, () => ({
    data: createDefaultSection06Data(),
    savedAt: null,
  }));

  const saveSection06Data = useCallback((nextData: AnnualReportSection06Data) => {
    replaceSection06DataState(nextData);
  }, []);

  const updateSection06Data = useCallback((patch: Partial<AnnualReportSection06Data>) => {
    replaceSection06DataState({ ...cachedState.data, ...patch });
  }, []);

  const addFirstTermClassRow = useCallback((row?: Partial<AnnualReportSection06ClassResultRow>) => {
    replaceSection06DataState({
      ...cachedState.data,
      firstTermClassResults: [
        ...cachedState.data.firstTermClassResults,
        { ...createDefaultSection06ClassResultRow(), ...row },
      ],
    });
  }, []);

  const removeFirstTermClassRow = useCallback((index: number) => {
    replaceSection06DataState({
      ...cachedState.data,
      firstTermClassResults: cachedState.data.firstTermClassResults.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const updateFirstTermClassRow = useCallback((index: number, patch: Partial<AnnualReportSection06ClassResultRow>) => {
    replaceSection06DataState({
      ...cachedState.data,
      firstTermClassResults: updateArrayRow(cachedState.data.firstTermClassResults, index, patch),
    });
  }, []);

  const addSecondTermClassRow = useCallback((row?: Partial<AnnualReportSection06ClassResultRow>) => {
    replaceSection06DataState({
      ...cachedState.data,
      secondTermClassResults: [
        ...cachedState.data.secondTermClassResults,
        { ...createDefaultSection06ClassResultRow(), ...row },
      ],
    });
  }, []);

  const removeSecondTermClassRow = useCallback((index: number) => {
    replaceSection06DataState({
      ...cachedState.data,
      secondTermClassResults: cachedState.data.secondTermClassResults.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const updateSecondTermClassRow = useCallback((index: number, patch: Partial<AnnualReportSection06ClassResultRow>) => {
    replaceSection06DataState({
      ...cachedState.data,
      secondTermClassResults: updateArrayRow(cachedState.data.secondTermClassResults, index, patch),
    });
  }, []);

  const resetSection06Data = useCallback(() => {
    clearSection06DataStorage();
    cachedState = { data: createDefaultSection06Data(), savedAt: null };
    emitSection06Change();
  }, []);

  const readiness = getSection06Readiness({
    section06Data: state.data,
    schoolProfile: profile,
  });

  const totals = {
    firstTerm: calcTermTotals(state.data.firstTermClassResults),
    secondTerm: calcTermTotals(state.data.secondTermClassResults),
  };

  return {
    section06Data: state.data,
    savedAt: state.savedAt,
    readiness,
    totals,
    saveSection06Data,
    updateSection06Data,
    addFirstTermClassRow,
    removeFirstTermClassRow,
    updateFirstTermClassRow,
    addSecondTermClassRow,
    removeSecondTermClassRow,
    updateSecondTermClassRow,
    resetSection06Data,
  };
}
