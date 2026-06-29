import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  VYROCNI_ZPRAVA_SECTION14_LS_KEY,
  createDefaultSection14Data,
  getSection14Readiness,
  normalizeSection14Data,
} from "./vyrocni-zprava-section14-data-logic";
import type { AnnualReportSection14Data, Section14StorageEnvelope } from "./vyrocni-zprava-section14-types";

export { VYROCNI_ZPRAVA_SECTION14_LS_KEY };

type Section14Listener = () => void;
type Section14StoreState = { data: AnnualReportSection14Data; savedAt: string | null };

let cachedState: Section14StoreState = loadSection14StoreState();
const listeners = new Set<Section14Listener>();

function emitSection14Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection14(listener: Section14Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection14Snapshot(): Section14StoreState {
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

export function loadSection14DataFromStorage(storage: Pick<Storage, "getItem"> | null = resolveStorage()): Section14StoreState {
  if (!storage) return { data: createDefaultSection14Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION14_LS_KEY);
    if (!raw) return { data: createDefaultSection14Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection14Data(), savedAt: null };
    const envelope = parsed as Partial<Section14StorageEnvelope>;
    const normalized = normalizeSection14Data(envelope.data);
    return { data: normalized ?? createDefaultSection14Data(), savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null };
  } catch {
    return { data: createDefaultSection14Data(), savedAt: null };
  }
}

function loadSection14StoreState(): Section14StoreState {
  return loadSection14DataFromStorage();
}

export function replaceSection14DataState(data: AnnualReportSection14Data, options?: { persist?: boolean; savedAt?: string | null }): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) {
    const storage = resolveStorage();
    if (storage) {
      const envelope: Section14StorageEnvelope = { version: 1, data, savedAt: savedAt ?? formatSavedAt(new Date()) };
      try {
        storage.setItem(VYROCNI_ZPRAVA_SECTION14_LS_KEY, JSON.stringify(envelope));
      } catch {
        /* ignore */
      }
    }
  }
  emitSection14Change();
}

export function getSection14StoreSnapshot(): Section14StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection14Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection14, getSection14Snapshot, () => ({ data: createDefaultSection14Data(), savedAt: null }));

  const saveSection14Data = useCallback((nextData: AnnualReportSection14Data) => {
    replaceSection14DataState(nextData);
  }, []);

  const resetSection14Data = useCallback(() => {
    const storage = resolveStorage();
    if (storage) {
      try {
        storage.removeItem(VYROCNI_ZPRAVA_SECTION14_LS_KEY);
      } catch {
        /* ignore */
      }
    }
    cachedState = { data: createDefaultSection14Data(), savedAt: null };
    emitSection14Change();
  }, []);

  const readiness = getSection14Readiness({ section14Data: state.data, schoolProfile: profile });

  return { section14Data: state.data, savedAt: state.savedAt, readiness, saveSection14Data, resetSection14Data };
}
