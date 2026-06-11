import type { CalculatorMode } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";

/** Zkrácený popisek režimu do hero KPI (plný text v title). */
export function shortZsHeroModeLabel(mode: CalculatorMode): string {
  const full = MODE_CONFIG[mode].label;
  const stripped = full.replace(/^(PHmax|PHAmax|PHPmax)\s*[–-]\s*/i, "").trim();
  if (stripped.length <= 32) return stripped;
  return `${stripped.slice(0, 29)}…`;
}
