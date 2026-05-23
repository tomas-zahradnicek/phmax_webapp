import type { PhmaxSsUnitRow } from "./phmax-ss-types";

/** Krátká poznámka v UI u přepínače § 16/9. */
/** Krátká poznámka v UI u přepínače § 16/9. */
export const PHMAX_SS_PAR16_CHECKBOX_HINT =
  "Třída zřízená podle § 16 odst. 9 školského zákona – PHmax se počítá podle pásem metodiky (§ 4 bod 4), ne běžným jednooborovým pásmem dle skutečného průměru.";

/** Jedna věta u řádku § 16 v přehledu výsledků (scénář E checklistu). */
export const PHMAX_SS_PAR16_ROW_SUMMARY =
  "Aplikace spočítala orientační PHmax dle pásem metodiky § 4 bod 4; ověřte kategorii oborů, formu studia a plný postup v metodice MŠMT před oficiálním výkazem.";

/** Upozornění v docku Kontext výpočtu, pokud jsou řádky § 16/9 (stejný tón jako u řádků). */
export const PHMAX_SS_PAR16_DOCK_HINT =
  "Řádky § 16 odst. 9: zobrazený PHmax je orientační náhled dle pásem metodiky, ne plný výpočet podle celého postupu MŠMT.";

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
