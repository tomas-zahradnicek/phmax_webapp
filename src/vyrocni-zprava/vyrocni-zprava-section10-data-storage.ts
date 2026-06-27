import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION10_LS_KEY,
  createDefaultSection10Data,
  createDefaultSection10InspectionRecord,
  getSection10Readiness,
  normalizeSection10Data,
} from "./vyrocni-zprava-section10-data-logic";
import type {
  AnnualReportSection10Data,
  AnnualReportSection10InspectionRecord,
  Section10StorageEnvelope,
} from "./vyrocni-zprava-section10-types";

export { VYROCNI_ZPRAVA_SECTION10_LS_KEY };

type Section10Listener = () => void;

type Section10StoreState = {
  data: AnnualReportSection10Data;
  savedAt: string | null;
};

let cachedState: Section10StoreState = loadSection10StoreState();
const listeners = new Set<Section10Listener>();

function emitSection10Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection10(listener: Section10Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection10Snapshot(): Section10StoreState {
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

export function loadSection10DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section10StoreState {
  if (!storage) return { data: createDefaultSection10Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION10_LS_KEY);
    if (!raw) return { data: createDefaultSection10Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection10Data(), savedAt: null };
    const envelope = parsed as Partial<Section10StorageEnvelope>;
    const normalized = normalizeSection10Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection10Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection10Data(), savedAt: null };
  }
}

function loadSection10StoreState(): Section10StoreState {
  return loadSection10DataFromStorage();
}

export function saveSection10DataToStorage(
  data: AnnualReportSection10Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section10StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION10_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection10DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION10_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection10DataState(
  data: AnnualReportSection10Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection10DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection10Change();
}

export function getSection10StoreSnapshot(): Section10StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection10Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection10, getSection10Snapshot, () => ({
    data: createDefaultSection10Data(),
    savedAt: null,
  }));

  const saveSection10Data = useCallback((nextData: AnnualReportSection10Data) => {
    replaceSection10DataState(nextData);
  }, []);

  const updateSection10Data = useCallback((patch: Partial<AnnualReportSection10Data>) => {
    replaceSection10DataState({ ...cachedState.data, ...patch });
  }, []);

  const addInspectionRow = useCallback((row?: Partial<AnnualReportSection10InspectionRecord>) => {
    replaceSection10DataState({
      ...cachedState.data,
      inspections: [...cachedState.data.inspections, { ...createDefaultSection10InspectionRecord(), ...row }],
    });
  }, []);

  const removeInspectionRow = useCallback((index: number) => {
    replaceSection10DataState({
      ...cachedState.data,
      inspections: cachedState.data.inspections.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const resetSection10Data = useCallback(() => {
    clearSection10DataStorage();
    cachedState = { data: createDefaultSection10Data(), savedAt: null };
    emitSection10Change();
  }, []);

  const readiness = getSection10Readiness({
    section10Data: state.data,
    schoolProfile: profile,
  });

  return {
    section10Data: state.data,
    savedAt: state.savedAt,
    readiness,
    saveSection10Data,
    updateSection10Data,
    addInspectionRow,
    removeInspectionRow,
    resetSection10Data,
  };
}
