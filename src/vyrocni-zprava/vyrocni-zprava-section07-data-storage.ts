import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  createDefaultSection07Data,
  createDefaultSection07PreventionProgramme,
  createDefaultSection07RiskBehaviourIncident,
  getSection07Readiness,
  normalizeSection07Data,
  VYROCNI_ZPRAVA_SECTION07_LS_KEY,
} from "./vyrocni-zprava-section07-data-logic";
import type {
  AnnualReportSection07Data,
  AnnualReportSection07PreventionProgramme,
  AnnualReportSection07RiskBehaviourIncident,
  Section07StorageEnvelope,
} from "./vyrocni-zprava-section07-types";

export { VYROCNI_ZPRAVA_SECTION07_LS_KEY };

type Section07Listener = () => void;

type Section07StoreState = {
  data: AnnualReportSection07Data;
  savedAt: string | null;
};

let cachedState: Section07StoreState = loadSection07StoreState();
const listeners = new Set<Section07Listener>();

function emitSection07Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection07(listener: Section07Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection07Snapshot(): Section07StoreState {
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

export function loadSection07DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section07StoreState {
  if (!storage) return { data: createDefaultSection07Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION07_LS_KEY);
    if (!raw) return { data: createDefaultSection07Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection07Data(), savedAt: null };
    const envelope = parsed as Partial<Section07StorageEnvelope>;
    const normalized = normalizeSection07Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection07Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection07Data(), savedAt: null };
  }
}

function loadSection07StoreState(): Section07StoreState {
  return loadSection07DataFromStorage();
}

export function saveSection07DataToStorage(
  data: AnnualReportSection07Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section07StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION07_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection07DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION07_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection07DataState(
  data: AnnualReportSection07Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection07DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection07Change();
}

export function getSection07StoreSnapshot(): Section07StoreState {
  return cachedState;
}

function calcTotals(data: AnnualReportSection07Data) {
  const incidentsTotalCount = data.riskBehaviourIncidents.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const supportNeedsEnteredCount = [
    data.pupilsWithSupportNeeds.pupilsWithSvpTotal,
    data.pupilsWithSupportNeeds.pupilsWithSupportMeasures,
    data.pupilsWithSupportNeeds.pupilsWithIndividualEducationPlan,
    data.pupilsWithSupportNeeds.pupilsWithPedagogicalIntervention,
    data.pupilsWithSupportNeeds.pupilsWithTeachingAssistantSupport,
    data.pupilsWithSupportNeeds.pupilsGifted,
    data.pupilsWithSupportNeeds.pupilsExceptionallyGifted,
  ].filter((value) => value !== undefined).length;
  return {
    incidentsTotalCount,
    preventionProgrammesCount: data.prevention.preventionProgrammes?.length ?? 0,
    supportNeedsEnteredCount,
  };
}

export function useVyrocniZpravaSection07Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection07, getSection07Snapshot, () => ({
    data: createDefaultSection07Data(),
    savedAt: null,
  }));

  const saveSection07Data = useCallback((nextData: AnnualReportSection07Data) => {
    replaceSection07DataState(nextData);
  }, []);

  const updateSection07Data = useCallback((patch: Partial<AnnualReportSection07Data>) => {
    replaceSection07DataState({ ...cachedState.data, ...patch });
  }, []);

  const addPreventionProgrammeRow = useCallback((row?: Partial<AnnualReportSection07PreventionProgramme>) => {
    replaceSection07DataState({
      ...cachedState.data,
      prevention: {
        ...cachedState.data.prevention,
        preventionProgrammes: [
          ...(cachedState.data.prevention.preventionProgrammes ?? []),
          { ...createDefaultSection07PreventionProgramme(), ...row },
        ],
      },
    });
  }, []);

  const removePreventionProgrammeRow = useCallback((index: number) => {
    replaceSection07DataState({
      ...cachedState.data,
      prevention: {
        ...cachedState.data.prevention,
        preventionProgrammes: (cachedState.data.prevention.preventionProgrammes ?? []).filter(
          (_, rowIndex) => rowIndex !== index,
        ),
      },
    });
  }, []);

  const addRiskBehaviourIncidentRow = useCallback((row?: Partial<AnnualReportSection07RiskBehaviourIncident>) => {
    replaceSection07DataState({
      ...cachedState.data,
      riskBehaviourIncidents: [...cachedState.data.riskBehaviourIncidents, { ...createDefaultSection07RiskBehaviourIncident(), ...row }],
    });
  }, []);

  const removeRiskBehaviourIncidentRow = useCallback((index: number) => {
    replaceSection07DataState({
      ...cachedState.data,
      riskBehaviourIncidents: cachedState.data.riskBehaviourIncidents.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const resetSection07Data = useCallback(() => {
    clearSection07DataStorage();
    cachedState = { data: createDefaultSection07Data(), savedAt: null };
    emitSection07Change();
  }, []);

  const readiness = getSection07Readiness({
    section07Data: state.data,
    schoolProfile: profile,
  });

  const totals = calcTotals(state.data);

  return {
    section07Data: state.data,
    savedAt: state.savedAt,
    readiness,
    totals,
    saveSection07Data,
    updateSection07Data,
    addPreventionProgrammeRow,
    removePreventionProgrammeRow,
    addRiskBehaviourIncidentRow,
    removeRiskBehaviourIncidentRow,
    resetSection07Data,
  };
}
