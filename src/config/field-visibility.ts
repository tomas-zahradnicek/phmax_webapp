import type { CalculatorMode, FormSection } from "./calculator-config";
import { MODE_CONFIG } from "./calculator-config";
import { DEFAULT_MODE } from "./default-form-state";

function resolveModeConfig(mode: CalculatorMode) {
  return MODE_CONFIG[mode] ?? MODE_CONFIG[DEFAULT_MODE];
}

export function getVisibleSections(mode: CalculatorMode): FormSection[] {
  return resolveModeConfig(mode).visibleSections;
}

export function isSectionVisible(mode: CalculatorMode, section: FormSection): boolean {
  return resolveModeConfig(mode).visibleSections.includes(section);
}

export function getRequiredFields(mode: CalculatorMode) {
  return resolveModeConfig(mode).requiredFields;
}

export function getMethodSteps(mode: CalculatorMode) {
  return resolveModeConfig(mode).methodSteps;
}
