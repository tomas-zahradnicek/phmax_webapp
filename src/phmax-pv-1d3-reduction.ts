/**
 * PV § 1d odst. 3 vyhl. 14/2005 Sb. – krácení PHmax.
 * Plný výpočet zatím mimo scope; typy a stub pro budoucí doplnění právních vstupů.
 */

export type Pv1d3ReductionInput = {
  /** Nejnižší počet dětí podle rozhodnutí (pokud znám). */
  minimumChildrenDecision?: number;
  /** Zda škola spadá pod výjimku dle metodiky (uživatelské potvrzení). */
  exemptionConfirmed?: boolean;
};

export type Pv1d3ReductionResult =
  | { status: "not_applicable"; reason: string }
  | { status: "unimplemented"; reason: string }
  | { status: "reduced"; reductionHours: number; phmaxAfter: number };

/** Orientační výpočet krácení – zatím vždy unimplemented (metodický box v UI zůstává). */
export function computePv1d3Reduction(
  _basePhmax: number,
  _input: Pv1d3ReductionInput,
): Pv1d3ReductionResult {
  return {
    status: "unimplemented",
    reason:
      "Automatický výpočet krácení dle § 1d odst. 3 vyžaduje právní parametry (nejnižší počet dětí, rozhodnutí KÚ) mimo tabulku PV. Použijte metodický box u pracoviště a plný postup MŠMT.",
  };
}
