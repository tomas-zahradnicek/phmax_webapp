import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION09_LS_KEY,
  createDefaultSection09Competition,
  createDefaultSection09Data,
  createDefaultSection09ProjectOrCooperation,
  createDefaultSection09SchoolEvent,
  getSection09Readiness,
  normalizeSection09Data,
} from "./vyrocni-zprava-section09-data-logic";
import type {
  AnnualReportSection09Competition,
  AnnualReportSection09Data,
  AnnualReportSection09ProjectOrCooperation,
  AnnualReportSection09SchoolEvent,
  Section09StorageEnvelope,
} from "./vyrocni-zprava-section09-types";

export { VYROCNI_ZPRAVA_SECTION09_LS_KEY };

type Section09Listener = () => void;

type Section09StoreState = {
  data: AnnualReportSection09Data;
  savedAt: string | null;
};

let cachedState: Section09StoreState = loadSection09StoreState();
const listeners = new Set<Section09Listener>();

function emitSection09Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection09(listener: Section09Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection09Snapshot(): Section09StoreState {
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

export function loadSection09DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section09StoreState {
  if (!storage) return { data: createDefaultSection09Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION09_LS_KEY);
    if (!raw) return { data: createDefaultSection09Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection09Data(), savedAt: null };
    const envelope = parsed as Partial<Section09StorageEnvelope>;
    const normalized = normalizeSection09Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection09Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection09Data(), savedAt: null };
  }
}

function loadSection09StoreState(): Section09StoreState {
  return loadSection09DataFromStorage();
}

export function saveSection09DataToStorage(
  data: AnnualReportSection09Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section09StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION09_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection09DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION09_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection09DataState(
  data: AnnualReportSection09Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection09DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection09Change();
}

export function getSection09StoreSnapshot(): Section09StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection09Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection09, getSection09Snapshot, () => ({
    data: createDefaultSection09Data(),
    savedAt: null,
  }));

  const saveSection09Data = useCallback((nextData: AnnualReportSection09Data) => {
    replaceSection09DataState(nextData);
  }, []);

  const updateSection09Data = useCallback((patch: Partial<AnnualReportSection09Data>) => {
    replaceSection09DataState({ ...cachedState.data, ...patch });
  }, []);

  const addSchoolEventRow = useCallback((row?: Partial<AnnualReportSection09SchoolEvent>) => {
    replaceSection09DataState({
      ...cachedState.data,
      schoolEvents: [...cachedState.data.schoolEvents, { ...createDefaultSection09SchoolEvent(), ...row }],
    });
  }, []);

  const removeSchoolEventRow = useCallback((index: number) => {
    replaceSection09DataState({
      ...cachedState.data,
      schoolEvents: cachedState.data.schoolEvents.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const addCompetitionRow = useCallback((row?: Partial<AnnualReportSection09Competition>) => {
    replaceSection09DataState({
      ...cachedState.data,
      competitions: [...cachedState.data.competitions, { ...createDefaultSection09Competition(), ...row }],
    });
  }, []);

  const removeCompetitionRow = useCallback((index: number) => {
    replaceSection09DataState({
      ...cachedState.data,
      competitions: cachedState.data.competitions.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const addProjectOrCooperationRow = useCallback((row?: Partial<AnnualReportSection09ProjectOrCooperation>) => {
    replaceSection09DataState({
      ...cachedState.data,
      projectsAndCooperation: [
        ...cachedState.data.projectsAndCooperation,
        { ...createDefaultSection09ProjectOrCooperation(), ...row },
      ],
    });
  }, []);

  const removeProjectOrCooperationRow = useCallback((index: number) => {
    replaceSection09DataState({
      ...cachedState.data,
      projectsAndCooperation: cachedState.data.projectsAndCooperation.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const resetSection09Data = useCallback(() => {
    clearSection09DataStorage();
    cachedState = { data: createDefaultSection09Data(), savedAt: null };
    emitSection09Change();
  }, []);

  const readiness = getSection09Readiness({
    section09Data: state.data,
    schoolProfile: profile,
  });

  return {
    section09Data: state.data,
    savedAt: state.savedAt,
    readiness,
    saveSection09Data,
    updateSection09Data,
    addSchoolEventRow,
    removeSchoolEventRow,
    addCompetitionRow,
    removeCompetitionRow,
    addProjectOrCooperationRow,
    removeProjectOrCooperationRow,
    resetSection09Data,
  };
}
