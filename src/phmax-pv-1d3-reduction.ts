import { round2 } from "./phmax-zs-logic";

/**
 * PV § 1d odst. 3 vyhl. 14/2005 Sb. – orientační krácení PHmax.
 * Finální výsledek vždy vyžaduje ověření vůči rozhodnutí KÚ a plnému znění vyhlášky.
 */

export type Pv1d3ReductionInput = {
  /** Počet dětí / žáků na pracovišti (skutečnost). */
  actualChildren?: number;
  /** Nejnižší počet dětí dle vyhlášky nebo rozhodnutí KÚ pro toto pracoviště. */
  minimumChildren?: number;
  /** PHmax určený KÚ (h/týden) – má přednost před poměrným krácením. */
  kuPhmaxCap?: number;
  /** Uživatel potvrdil, že § 1d odst. 3 se na pracoviště nevztahuje. */
  exemptionConfirmed?: boolean;
};

export type Pv1d3ReductionResult =
  | { status: "not_applicable"; reason: string }
  | { status: "no_reduction"; reason: string; phmaxAfter: number }
  | {
      status: "reduced";
      reason: string;
      reductionHours: number;
      phmaxAfter: number;
      factor: number;
      method: "ku_cap" | "proportional";
    };

const ORIENTACIONAL_DISCLAIMER =
  "Orientační výpočet – závazné je rozhodnutí krajského úřadu a plné znění vyhlášky č. 14/2005 Sb.";

export function computePv1d3Reduction(basePhmax: number, input: Pv1d3ReductionInput): Pv1d3ReductionResult {
  if (basePhmax <= 0) {
    return { status: "not_applicable", reason: "Bez základního PHmax nelze krácení § 1d odst. 3 posoudit." };
  }

  if (input.exemptionConfirmed) {
    return {
      status: "not_applicable",
      reason: "Označeno, že § 1d odst. 3 se na toto pracoviště nevztahuje.",
    };
  }

  const kuCap =
    typeof input.kuPhmaxCap === "number" && Number.isFinite(input.kuPhmaxCap) && input.kuPhmaxCap >= 0
      ? input.kuPhmaxCap
      : null;

  if (kuCap != null && kuCap < basePhmax) {
    const phmaxAfter = round2(kuCap);
    return {
      status: "reduced",
      reason: `PHmax dle rozhodnutí KÚ (${phmaxAfter} h/týden). ${ORIENTACIONAL_DISCLAIMER}`,
      reductionHours: round2(basePhmax - phmaxAfter),
      phmaxAfter,
      factor: round2(phmaxAfter / basePhmax),
      method: "ku_cap",
    };
  }

  const actual =
    typeof input.actualChildren === "number" && Number.isFinite(input.actualChildren)
      ? Math.max(0, input.actualChildren)
      : null;
  const minimum =
    typeof input.minimumChildren === "number" && Number.isFinite(input.minimumChildren)
      ? Math.max(0, input.minimumChildren)
      : null;

  if (actual == null || minimum == null || minimum <= 0) {
    return {
      status: "no_reduction",
      reason:
        "Doplňte skutečný a nejnižší počet dětí pro orientační poměrné krácení, nebo PHmax z rozhodnutí KÚ.",
      phmaxAfter: basePhmax,
    };
  }

  if (actual >= minimum) {
    return {
      status: "no_reduction",
      reason: `Počet dětí (${actual}) splňuje nejnižší počet (${minimum}) – krácení § 1d odst. 3 se neuplatní.`,
      phmaxAfter: basePhmax,
    };
  }

  const factor = actual / minimum;
  const phmaxAfter = round2(basePhmax * factor);
  return {
    status: "reduced",
    reason: `Poměrné krácení: ${actual} / ${minimum} × PHmax. ${ORIENTACIONAL_DISCLAIMER}`,
    reductionHours: round2(basePhmax - phmaxAfter),
    phmaxAfter,
    factor: round2(factor),
    method: "proportional",
  };
}
