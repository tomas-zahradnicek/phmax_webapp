import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION13_LS_KEY,
  createDefaultSection13Data,
  getSection13Readiness,
  normalizeSection13Data,
} from "./vyrocni-zprava-section13-data-logic";
import type { AnnualReportSection13Data, Section13StorageEnvelope } from "./vyrocni-zprava-section13-types";

export { VYROCNI_ZPRAVA_SECTION13_LS_KEY };

type Section13Listener = () => void;
type Section13StoreState = { data: AnnualReportSection13Data; savedAt: string | null };

let cachedState: Section13StoreState = loadSection13StoreState();
const listeners = new Set<Section13Listener>();

function emitSection13Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection13(listener: Section13Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection13Snapshot(): Section13StoreState {
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

export function loadSection13DataFromStorage(storage: Pick<Storage, "getItem"> | null = resolveStorage()): Section13StoreState {
  if (!storage) return { data: createDefaultSection13Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION13_LS_KEY);
    if (!raw) return { data: createDefaultSection13Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection13Data(), savedAt: null };
    const envelope = parsed as Partial<Section13StorageEnvelope>;
    const normalized = normalizeSection13Data(envelope.data);
    return { data: normalized ?? createDefaultSection13Data(), savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null };
  } catch {
    return { data: createDefaultSection13Data(), savedAt: null };
  }
}

function loadSection13StoreState(): Section13StoreState {
  return loadSection13DataFromStorage();
}

export function replaceSection13DataState(data: AnnualReportSection13Data, options?: { persist?: boolean; savedAt?: string | null }): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) {
    const storage = resolveStorage();
    if (storage) {
      const envelope: Section13StorageEnvelope = { version: 1, data, savedAt: savedAt ?? formatSavedAt(new Date()) };
      try {
        storage.setItem(VYROCNI_ZPRAVA_SECTION13_LS_KEY, JSON.stringify(envelope));
      } catch {
        /* ignore */
      }
    }
  }
  emitSection13Change();
}

export function getSection13StoreSnapshot(): Section13StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection13Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection13, getSection13Snapshot, () => ({ data: createDefaultSection13Data(), savedAt: null }));

  const saveSection13Data = useCallback((nextData: AnnualReportSection13Data) => {
    replaceSection13DataState(nextData);
  }, []);

  const resetSection13Data = useCallback(() => {
    const storage = resolveStorage();
    if (storage) {
      try {
        storage.removeItem(VYROCNI_ZPRAVA_SECTION13_LS_KEY);
      } catch {
        /* ignore */
      }
    }
    cachedState = { data: createDefaultSection13Data(), savedAt: null };
    emitSection13Change();
  }, []);

  const readiness = getSection13Readiness({ section13Data: state.data, schoolProfile: profile });

  return { section13Data: state.data, savedAt: state.savedAt, readiness, saveSection13Data, resetSection13Data };
}
