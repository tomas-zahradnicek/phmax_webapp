import { useCallback, useSyncExternalStore } from "react";
import { useSchoolProfile } from "../school-profile/use-school-profile";
import {
  calculateExpensesSubtotal,
  calculateProfitOrLoss,
  calculateRevenueSubtotal,
} from "./vyrocni-zprava-section11-finance-helpers";
import {
  VYROCNI_ZPRAVA_SECTION11_LS_KEY,
  createDefaultSection11Data,
  createDefaultSection11GrantRow,
  createDefaultSection11InvestmentRow,
  getSection11Readiness,
  normalizeSection11Data,
} from "./vyrocni-zprava-section11-data-logic";
import type {
  AnnualReportSection11Data,
  AnnualReportSection11GrantOrSubsidy,
  AnnualReportSection11InvestmentOrRepair,
  Section11StorageEnvelope,
} from "./vyrocni-zprava-section11-types";

export { VYROCNI_ZPRAVA_SECTION11_LS_KEY };

type Section11Listener = () => void;

type Section11StoreState = {
  data: AnnualReportSection11Data;
  savedAt: string | null;
};

let cachedState: Section11StoreState = loadSection11StoreState();
const listeners = new Set<Section11Listener>();

function emitSection11Change(): void {
  for (const listener of listeners) listener();
}

function subscribeSection11(listener: Section11Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSection11Snapshot(): Section11StoreState {
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

export function loadSection11DataFromStorage(
  storage: Pick<Storage, "getItem"> | null = resolveStorage(),
): Section11StoreState {
  if (!storage) return { data: createDefaultSection11Data(), savedAt: null };
  try {
    const raw = storage.getItem(VYROCNI_ZPRAVA_SECTION11_LS_KEY);
    if (!raw) return { data: createDefaultSection11Data(), savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { data: createDefaultSection11Data(), savedAt: null };
    const envelope = parsed as Partial<Section11StorageEnvelope>;
    const normalized = normalizeSection11Data(envelope.data);
    return {
      data: normalized ?? createDefaultSection11Data(),
      savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : null,
    };
  } catch {
    return { data: createDefaultSection11Data(), savedAt: null };
  }
}

function loadSection11StoreState(): Section11StoreState {
  return loadSection11DataFromStorage();
}

export function saveSection11DataToStorage(
  data: AnnualReportSection11Data,
  storage: Pick<Storage, "setItem"> | null = resolveStorage(),
  savedAt = formatSavedAt(new Date()),
): string {
  if (!storage) return savedAt;
  const envelope: Section11StorageEnvelope = {
    version: 1,
    data,
    savedAt,
  };
  try {
    storage.setItem(VYROCNI_ZPRAVA_SECTION11_LS_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore */
  }
  return savedAt;
}

export function clearSection11DataStorage(storage: Pick<Storage, "removeItem"> | null = resolveStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(VYROCNI_ZPRAVA_SECTION11_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function replaceSection11DataState(
  data: AnnualReportSection11Data,
  options?: { persist?: boolean; savedAt?: string | null },
): void {
  const persist = options?.persist !== false;
  const savedAt = persist ? (options?.savedAt ?? formatSavedAt(new Date())) : (options?.savedAt ?? cachedState.savedAt);
  cachedState = { data, savedAt };
  if (persist) saveSection11DataToStorage(data, resolveStorage(), savedAt ?? formatSavedAt(new Date()));
  emitSection11Change();
}

export function getSection11StoreSnapshot(): Section11StoreState {
  return cachedState;
}

export function useVyrocniZpravaSection11Data() {
  const { profile } = useSchoolProfile();
  const state = useSyncExternalStore(subscribeSection11, getSection11Snapshot, () => ({
    data: createDefaultSection11Data(),
    savedAt: null,
  }));

  const saveSection11Data = useCallback((nextData: AnnualReportSection11Data) => {
    replaceSection11DataState(nextData);
  }, []);

  const updateSection11Data = useCallback((patch: Partial<AnnualReportSection11Data>) => {
    replaceSection11DataState({ ...cachedState.data, ...patch });
  }, []);

  const addGrantOrSubsidyRow = useCallback((row?: Partial<AnnualReportSection11GrantOrSubsidy>) => {
    replaceSection11DataState({
      ...cachedState.data,
      grantsAndSubsidies: [...cachedState.data.grantsAndSubsidies, { ...createDefaultSection11GrantRow(), ...row }],
    });
  }, []);

  const removeGrantOrSubsidyRow = useCallback((index: number) => {
    replaceSection11DataState({
      ...cachedState.data,
      grantsAndSubsidies: cachedState.data.grantsAndSubsidies.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const addInvestmentOrRepairRow = useCallback((row?: Partial<AnnualReportSection11InvestmentOrRepair>) => {
    replaceSection11DataState({
      ...cachedState.data,
      investmentsAndRepairs: [...cachedState.data.investmentsAndRepairs, { ...createDefaultSection11InvestmentRow(), ...row }],
    });
  }, []);

  const removeInvestmentOrRepairRow = useCallback((index: number) => {
    replaceSection11DataState({
      ...cachedState.data,
      investmentsAndRepairs: cachedState.data.investmentsAndRepairs.filter((_, rowIndex) => rowIndex !== index),
    });
  }, []);

  const resetSection11Data = useCallback(() => {
    clearSection11DataStorage();
    cachedState = { data: createDefaultSection11Data(), savedAt: null };
    emitSection11Change();
  }, []);

  const readiness = getSection11Readiness({
    section11Data: state.data,
    schoolProfile: profile,
  });

  const suggestedTotals = {
    revenueSubtotal: calculateRevenueSubtotal(state.data.revenue),
    expensesSubtotal: calculateExpensesSubtotal(state.data.expenses),
    profitOrLossFromTotals: calculateProfitOrLoss(state.data.revenue.totalRevenue, state.data.expenses.totalExpenses),
  };

  return {
    section11Data: state.data,
    savedAt: state.savedAt,
    readiness,
    suggestedTotals,
    saveSection11Data,
    updateSection11Data,
    addGrantOrSubsidyRow,
    removeGrantOrSubsidyRow,
    addInvestmentOrRepairRow,
    removeInvestmentOrRepairRow,
    resetSection11Data,
  };
}
