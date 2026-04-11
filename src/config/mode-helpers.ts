import type { CalculatorMode } from "./calculator-config";

export function isPhpEligibleMode(mode: CalculatorMode): boolean {
  return mode === "phmax_full_zs" || mode === "phmax_first_stage_only" || mode === "phpmax_basic_school";
}

export function isSec16Mode(mode: CalculatorMode): boolean {
  return mode === "phmax_full_zs_sec16" || mode === "phamax_zs_sec16_special";
}

export function isMethodViewSupported(_mode: CalculatorMode): boolean {
  return true;
}

export function isNv75Mode(mode: CalculatorMode): boolean {
  return mode === "nv75_teacher" || mode === "nv75_headteacher" || mode === "nv75_deputy" || mode === "nv75_other_staff";
}

export function isPhmaxMode(mode: CalculatorMode): boolean {
  return [
    "phmax_full_zs",
    "phmax_first_stage_only",
    "phmax_full_zs_sec16",
    "phmax_dominant_field",
    "phmax_psychiatric",
    "phmax_minority_language",
    "phmax_multiyear_gym",
    "phmax_extras_38_41_prep",
  ].includes(mode);
}
