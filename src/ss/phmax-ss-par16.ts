import type { PhmaxSsUnitRow } from "./phmax-ss-types";

/** Krátká poznámka v UI u přepínače § 16/9. */
export const PHMAX_SS_PAR16_CHECKBOX_HINT =
  "Třída zřízená podle § 16 odst. 9 školského zákona – PHmax se počítá podle pásem metodiky (§ 4 bod 4), ne běžným jednooborovým pásmem dle skutečného průměru.";

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
