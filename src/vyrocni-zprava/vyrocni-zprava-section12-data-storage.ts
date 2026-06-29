import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION12_LS_KEY,
  createDefaultSection12Data,
  createDefaultSection12ProjectRecord,
  getSection12Readiness,
  normalizeSection12Data,
} from "./vyrocni-zprava-section12-data-logic";
import type { AnnualReportSection12Data, AnnualReportSection12ProjectRecord, Section12StorageEnvelope } from "./vyrocni-zprava-section12-types";

export { VYROCNI_ZPRAVA_SECTION12_LS_KEY };

type Section12Listener = () => void;
type Section12StoreState = { data: AnnualReportSection12Data; savedAt: string | null };

let cachedState: Section12StoreState = loadSection12StoreState();
const listeners = new Set<Section12Listener>();

function emitSection12Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection12(listener: Section12Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection12Snapshot(): Section12StoreState {
  return cachedState;
}

function resolveStorage(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null): Storage | null {
  if (storage !== undefined) return storage as Storage | null;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function formatSavedAt(date: Date): string {
  return date.toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function loadSection12DataFromStorage(storage: Pick<Storage, "getItem"> | null = resolveStorage()): Section12StoreState {
  if (!storage) return { data: createDefaultSection12Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION12_LS_KEY);
    if (!raw) return { data: createDefaultSection12Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection12Data(), savedAt: null };
    const envelope = parsed as Partial<Section12StorageEnvelope>;
    const normalized = normalizeSection12Data(envelope.data);
    return { data: normalized ?? createDefaultSection12Data(), savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null };
  } catch {
    return { data: createDefaultSection12Data(), savedAt: null };
  }
}

function loadSection12StoreState(): Section12StoreState {
  return loadSection12DataFromStorage();
}

export function saveSection12DataToStorage(
  data: AnnualReportSection12Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section12StorageEnvelope = { version: 1, data, savedAt };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION12_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection12DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION12_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection12DataState(data: AnnualReportSection12Data, options?: { persist?: boolean; savedAt?: string | null }): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection12DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection12Change();
}

export function getSection12StoreSnapshot(): Section12StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection12Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection12, getSection12Snapshot, () => ({ data: createDefaultSection12Data(), savedAt: null }));

  const saveSection12Data = useCallback((nextData: AnnualReportSection12Data) => {
    replaceSection12DataState(nextData);
  }, []);

  const addProjectRow = useCallback((row?: Partial<AnnualReportSection12ProjectRecord>) => {
    replaceSection12DataState({
      ...cachedState.data,
      projects: [...cachedState.data.projects, { ...createDefaultSection12ProjectRecord(), ...row }],
    });
  }, []);

  const resetSection12Data = useCallback(() => {
    clearSection12DataStorage();
    cachedState = { data: createDefaultSection12Data(), savedAt: null };
    emitSection12Change();
  }, []);

  const readiness = getSection12Readiness({ section12Data: state.data, schoolProfile: profile });

  return { section12Data: state.data, savedAt: state.savedAt, readiness, saveSection12Data, addProjectRow, resetSection12Data };
}
