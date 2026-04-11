import type { CalculatorMode, FormSection } from "./calculator-config";
import { MODE_CONFIG } from "./calculator-config";

export function getVisibleSections(mode: CalculatorMode): FormSection[] {
  return MODE_CONFIG[mode].visibleSections;
}

export function isSectionVisible(mode: CalculatorMode, section: FormSection): boolean {
  return MODE_CONFIG[mode].visibleSections.includes(section);
}

export function getRequiredFields(mode: CalculatorMode) {
  return MODE_CONFIG[mode].requiredFields;
}

export function getMethodSteps(mode: CalculatorMode) {
  return MODE_CONFIG[mode].methodSteps;
}