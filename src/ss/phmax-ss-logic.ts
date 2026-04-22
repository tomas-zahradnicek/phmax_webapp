/**
 * Výpočetní a validační jádro SŠ – přeneseno z docs/zdroje do src/ss.
 */

export { phmaxSsDataset } from "./phmax-ss-dataset";
export type { Dataset, Interval, ProgramRecord, ValidationIssue } from "./phmax-ss-validator";
export { validateDataset, summarizeValidation } from "./phmax-ss-validator";

export type { StudyForm, ModeKey, ResolvedInterval } from "./phmax-ss-helpers";
export {
  PHMAX_SS_STUDY_FORM_OPTIONS,
  getProgram,
  listAvailableModes,
  calculateProgramPhmax,
  getIntervalForAverage,
} from "./phmax-ss-helpers";

export type {
  ServiceRowInput,
  ServiceResolvedRow,
  CalculatorSummary,
  SingleCalculationResult,
  BatchCalculationResult,
  AutoModeContext,
} from "./phmax-ss-service";
export {
  chooseDefaultMode,
  calculatePhmaxRow,
  calculateSchoolPhmax,
  buildCalculationPayload,
} from "./phmax-ss-service";

export type {
  BusinessRuleOborInput,
  BusinessRulesInput,
  RuleMessage,
  BusinessRulesResult,
} from "./phmax-ss-business-rules";
export { evaluateBusinessRules } from "./phmax-ss-business-rules";
