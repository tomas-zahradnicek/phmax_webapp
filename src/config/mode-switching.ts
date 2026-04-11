import type { CalculatorMode } from "./calculator-config";

export function normalizeStateForMode<T extends Record<string, unknown>>(mode: CalculatorMode, state: T): T {
  const next = { ...state, mode };

  if (mode === "phmax_first_stage_only") {
    next.basicType = "first_only_3";
    next.basic2Classes = 0;
    next.basic2Pupils = 0;
    next.sec16SecondClasses = 0;
    next.sec16SecondPupils = 0;
  }

  if (mode === "phmax_full_zs_sec16") {
    next.basicType = "full_more_than_2";
  }

  if (mode === "phpmax_basic_school") {
    next.phpExcludedSchool = false;
  }

  return next;
}