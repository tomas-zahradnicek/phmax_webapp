import { useCallback, useSyncExternalStore } from "react";

import {
  VYROCNI_ZPRAVA_SECTION01_LS_KEY,
  createDefaultSection01Data,
  getSection01Readiness,
  normalizeSection01Data,
} from "./vyrocni-zprava-section01-data-logic";
import type { Section01StorageEnvelope, VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";
import { useSchoolProfile } from "../school-profile/use-school-profile";

export { VYROCNI_ZPRAVA_SECTION01_LS_KEY };

type Section01Listener = () => void;

type Section01StoreState = {
  data: VyrocniZpravaSection01Data;
  savedAt: string | null;
};

let cachedState: Section01StoreState = loadSection01StoreState();
const listeners = new Set<Section01Listener>();

function emitSection01Change(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSection01(listener: Section01Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection01Snapshot(): Section01StoreState {
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

export function loadSection01DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section01StoreState {
  if (!storage) {
    return { data: createDefaultSection01Data(), savedAt: null };
  }

  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION01_LS_KEY);
    if (!raw) return { data: createDefaultSection01Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection01Data(), savedAt: null };
    const envelope = parsed as Partial<Section01StorageEnvelope>;
    const normalized = normalizeSection01Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection01Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection01Data(), savedAt: null };
  }
}

function loadSection01StoreState(): Section01StoreState {
  return loadSection01DataFromStorage();
}

export function saveSection01DataToStorage(
  data: VyrocniZpravaSection01Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;

  const envelope: Section01StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };

  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION01_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }

  return savedAt;
}

export function clearSection01DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION01_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection01DataState(
  data: VyrocniZpravaSection01Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection01DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection01Change();
}

export function getSection01StoreSnapshot(): Section01StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection01Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection01, getSection01Snapshot, () => ({
    data: createDefaultSection01Data(),
    savedAt: null,
  }));

  const saveSection01Data = useCallback((nextData: VyrocniZpravaSection01Data) => {
    replaceSection01DataState(nextData);
  }, []);

  const resetSection01Data = useCallback(() => {
    clearSection01DataStorage();
    cachedState = { data: createDefaultSection01Data(), savedAt: null };
    emitSection01Change();
  }, []);

  const readiness = getSection01Readiness({
    schoolProfile: profile,
    section01Data: state.data,
  });

  return {
    section01Data: state.data,
    savedAt: state.savedAt,
    saveSection01Data,
    resetSection01Data,
    readiness,
  };
}
