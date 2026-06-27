import { useCallback, useSyncExternalStore } from "react";

import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION02_LS_KEY,
  createDefaultSection02Data,
  createDefaultSection02EducationField,
  detectSection02MissingFields,
  getSection02Readiness,
  normalizeSection02Data,
} from "./vyrocni-zprava-section02-data-logic";
import type {
  AnnualReportSection02Data,
  AnnualReportSection02EducationField,
  Section02StorageEnvelope,
} from "./vyrocni-zprava-section02-types";

export { VYROCNI_ZPRAVA_SECTION02_LS_KEY };

type Section02Listener = () => void;

type Section02StoreState = {
  data: AnnualReportSection02Data;
  savedAt: string | null;
};

let cachedState: Section02StoreState = loadSection02StoreState();
const listeners = new Set<Section02Listener>();

function emitSection02Change(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSection02(listener: Section02Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection02Snapshot(): Section02StoreState {
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

export function loadSection02DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section02StoreState {
  if (!storage) {
    return { data: createDefaultSection02Data(), savedAt: null };
  }

  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION02_LS_KEY);
    if (!raw) return { data: createDefaultSection02Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection02Data(), savedAt: null };
    const envelope = parsed as Partial<Section02StorageEnvelope>;
    const normalized = normalizeSection02Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection02Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection02Data(), savedAt: null };
  }
}

function loadSection02StoreState(): Section02StoreState {
  return loadSection02DataFromStorage();
}

export function saveSection02DataToStorage(
  data: AnnualReportSection02Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;

  const envelope: Section02StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };

  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION02_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }

  return savedAt;
}

export function clearSection02DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION02_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection02DataState(
  data: AnnualReportSection02Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection02DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection02Change();
}

export function getSection02StoreSnapshot(): Section02StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection02Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection02, getSection02Snapshot, () => ({
    data: createDefaultSection02Data(),
    savedAt: null,
  }));

  const saveSection02Data = useCallback((nextData: AnnualReportSection02Data) => {
    replaceSection02DataState(nextData);
  }, []);

  const updateSection02Data = useCallback((patch: Partial<AnnualReportSection02Data>) => {
    replaceSection02DataState({ ...cachedState.data, ...patch });
  }, []);

  const addEducationField = useCallback((field?: Partial<AnnualReportSection02EducationField>) => {
    const nextField = { ...createDefaultSection02EducationField(), ...field };
    replaceSection02DataState({
      ...cachedState.data,
      educationFields: [...cachedState.data.educationFields, nextField],
    });
  }, []);

  const removeEducationField = useCallback((index: number) => {
    if (index < 0 || index >= cachedState.data.educationFields.length) return;
    replaceSection02DataState({
      ...cachedState.data,
      educationFields: cachedState.data.educationFields.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const updateEducationField = useCallback((index: number, patch: Partial<AnnualReportSection02EducationField>) => {
    if (index < 0 || index >= cachedState.data.educationFields.length) return;
    replaceSection02DataState({
      ...cachedState.data,
      educationFields: cachedState.data.educationFields.map((field, rowIndex) =>
        rowIndex === index ? { ...field, ...patch } : field,
      ),
    });
  }, []);

  const resetSection02Data = useCallback(() => {
    clearSection02DataStorage();
    cachedState = { data: createDefaultSection02Data(), savedAt: null };
    emitSection02Change();
  }, []);

  const missingFields = detectSection02MissingFields(state.data);
  const readiness = getSection02Readiness({
    section02Data: state.data,
    schoolProfile: profile,
  });

  return {
    section02Data: state.data,
    savedAt: state.savedAt,
    missingFields,
    readiness,
    saveSection02Data,
    updateSection02Data,
    addEducationField,
    removeEducationField,
    updateEducationField,
    resetSection02Data,
  };
}
