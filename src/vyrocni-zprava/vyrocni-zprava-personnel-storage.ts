import { useCallback, useSyncExternalStore } from "react";

import {
  VYROCNI_ZPRAVA_PERSONNEL_LS_KEY,
  buildPersonnelAvailableDataLines,
  calculateAgeGenderTotals,
  calculateEducationGenderTotals,
  calculatePersonnelStaffTotals,
  calculateQualificationTotals,
  createDefaultPersonnelData,
  detectMissingPersonnelFields,
  detectPersonnelInconsistencies,
  hasAnyPersonnelData,
  isPersonnelDataComplete,
  normalizePersonnelData,
} from "./vyrocni-zprava-personnel-logic";
import type { AnnualReportPersonnelData, PersonnelStorageEnvelope } from "./vyrocni-zprava-personnel-types";

export { VYROCNI_ZPRAVA_PERSONNEL_LS_KEY };

type PersonnelListener = () => void;

type PersonnelStoreState = {
  data: AnnualReportPersonnelData;
  savedAt: string | null;
};

let cachedState: PersonnelStoreState = loadPersonnelStoreState();
const listeners = new Set<PersonnelListener>();

function emitPersonnelChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribePersonnel(listener: PersonnelListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getPersonnelSnapshot(): PersonnelStoreState {
  return cachedState;
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

export function loadPersonnelDataFromStorage(storage: Pick<Storage, "getItem"> | null = resolveStorage()): PersonnelStoreState {
  if (!storage) {
    return { data: createDefaultPersonnelData(), savedAt: null };
  }

  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY);
    if (!raw) return { data: createDefaultPersonnelData(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultPersonnelData(), savedAt: null };
    const envelope = parsed as Partial<PersonnelStorageEnvelope>;
    const normalized = normalizePersonnelData(envelope.data);
    return {
      data: normalized ?? createDefaultPersonnelData(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultPersonnelData(), savedAt: null };
  }
}

function loadPersonnelStoreState(): PersonnelStoreState {
  return loadPersonnelDataFromStorage();
}

function resolveStorage(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null): Storage | null {
  if (storage !== undefined) return storage as Storage | null;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

export function savePersonnelDataToStorage(
  data: AnnualReportPersonnelData,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;

  const envelope: PersonnelStorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };

  try {
    storage.setItem(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore quota / privacy mode */
  }

  return savedAt;
}

export function clearPersonnelDataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replacePersonnelDataState(
  data: AnnualReportPersonnelData,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) savePersonnelDataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitPersonnelChange();
}

export function getPersonnelStoreSnapshot(): { data: AnnualReportPersonnelData; savedAt: string | null } {
  return cachedState;
}

export function useVyrocniZpravaPersonnelData() {
  const state = useSyncExternalStore(subscribePersonnel, getPersonnelSnapshot, () => ({
    data: createDefaultPersonnelData(),
    savedAt: null,
  }));

  const savePersonnelData = useCallback((nextData: AnnualReportPersonnelData) => {
    replacePersonnelDataState(nextData);
  }, []);

  const resetPersonnelData = useCallback(() => {
    clearPersonnelDataStorage();
    cachedState = { data: createDefaultPersonnelData(), savedAt: null };
    emitPersonnelChange();
  }, []);

  const missingRequiredFields = detectMissingPersonnelFields(state.data);
  const inconsistencies = detectPersonnelInconsistencies(state.data);
  const totals = {
    staff: calculatePersonnelStaffTotals(state.data),
    ageGender: calculateAgeGenderTotals(state.data),
    educationGender: calculateEducationGenderTotals(state.data),
    qualification: calculateQualificationTotals(state.data),
  };

  return {
    personnelData: state.data,
    savedAt: state.savedAt,
    savePersonnelData,
    resetPersonnelData,
    missingRequiredFields,
    inconsistencies,
    totals,
    hasPersonnelData: hasAnyPersonnelData(state.data),
    isPersonnelComplete: isPersonnelDataComplete(state.data),
    availableDataLines: buildPersonnelAvailableDataLines(state.data),
  };
}
