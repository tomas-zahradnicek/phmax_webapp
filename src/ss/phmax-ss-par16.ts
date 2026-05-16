import type { PhmaxSsUnitRow } from "./phmax-ss-types";

/** Upozornění v kontrole pravidel a v UI, dokud není implementována větev výpočtu § 16. */
export const PHMAX_SS_PAR16_CALC_LIMITATION_WARNING =
  "Plný výpočet PHmax podle § 16 odst. 9 (pásma metodiky) zatím není v aplikaci – PHmax níže je orientační hodnota z běžného datasetu NV.";

const PAR16_CLASS_TYPE_RE =
  /§\s*16|par\.?\s*16|odst\.?\s*9|podle\s+§\s*16|zřízen[áa]\s+podle\s+§\s*16/i;

/** Rozpozná § 16/9 ve volném poli „Typ třídy“ (starší zálohy, hero příklady). */
export function inferPar16FromClassType(classType: string): boolean {
  const t = classType.trim();
  if (!t) return false;
  return PAR16_CLASS_TYPE_RE.test(t);
}

/** Přepínač na řádku má přednost; bez něj se použije heuristika z typu třídy. */
export function resolveIsPar16Class(row: Pick<PhmaxSsUnitRow, "isPar16Class" | "classType">): boolean {
  if (row.isPar16Class) return true;
  return inferPar16FromClassType(row.classType);
}

export function countPar16MarkedRows(rows: readonly PhmaxSsUnitRow[]): number {
  return rows.filter((r) => resolveIsPar16Class(r)).length;
}
