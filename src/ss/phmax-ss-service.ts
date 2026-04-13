import type { Dataset } from './phmax-ss-validator';
import type { ModeKey, StudyForm } from './phmax-ss-helpers';
import {
  calculateProgramPhmax,
  getProgram,
  listAvailableModes,
} from './phmax-ss-helpers';

export type ServiceRowInput = {
  code: string;
  averageStudents: number;
  classCount: number;
  mode?: ModeKey;
  form?: StudyForm;
  note?: string;
  /** Použije se jen při automatickém výběru režimu (`mode` není zadán). */
  oborCountInClass?: number;
  isArt82TalentClass?: boolean;
};

export type ServiceSingleInput = ServiceRowInput;

export type ServiceResolvedRow = {
  code: string;
  name: string;
  category: string;
  modeKey: ModeKey;
  form: StudyForm;
  averageStudents: number;
  classCount: number;
  intervalLabel: string;
  phmaxPerClass: number;
  coefficient: number;
  adjustedPhmaxPerClass: number;
  totalPhmax: number;
  note?: string;
};

export type CalculatorSummary = {
  rowCount: number;
  totalClasses: number;
  totalPhmax: number;
  byCategory: Record<string, number>;
};

export type SingleCalculationResult = {
  input: ServiceSingleInput;
  row: ServiceResolvedRow;
};

export type BatchCalculationResult = {
  inputs: ServiceRowInput[];
  rows: ServiceResolvedRow[];
  summary: CalculatorSummary;
};

export type AutoModeContext = {
  code: string;
  oborCountInClass?: number;
  isArt82TalentClass?: boolean;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} musí být nezáporné konečné číslo.`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} musí být kladné celé číslo.`);
  }
}

export function chooseDefaultMode(dataset: Dataset, context: AutoModeContext): ModeKey {
  const { code, oborCountInClass = 1, isArt82TalentClass = false } = context;
  assertPositiveInteger(oborCountInClass, 'Počet oborů ve třídě');

  const program = getProgram(dataset, code);
  const available = new Set(listAvailableModes(program));

  if (oborCountInClass === 1 && available.has('oneObor')) return 'oneObor';

  if (program.group === '82' || isArt82TalentClass) {
    if (oborCountInClass === 2 && available.has('twoObory82')) return 'twoObory82';
    if (oborCountInClass >= 3 && available.has('threePlusObory82')) return 'threePlusObory82';
  }

  if (oborCountInClass === 2 && available.has('twoObory')) return 'twoObory';
  if (oborCountInClass === 3 && available.has('threeObory')) return 'threeObory';

  if (oborCountInClass >= 3 && available.has('threeObory')) return 'threeObory';
  if (oborCountInClass >= 2 && available.has('twoObory')) return 'twoObory';
  if (available.has('oneObor')) return 'oneObor';

  const fallback = listAvailableModes(program)[0];
  if (!fallback) {
    throw new Error(`Obor ${code} nemá v datasetu žádný dostupný režim.`);
  }
  return fallback;
}

export function calculatePhmaxRow(
  dataset: Dataset,
  input: ServiceSingleInput,
): SingleCalculationResult {
  const form: StudyForm = input.form ?? 'denni';
  assertFiniteNonNegative(input.averageStudents, 'Průměrný počet žáků');
  assertPositiveInteger(input.classCount, 'Počet tříd');

  const mode =
    input.mode ??
    chooseDefaultMode(dataset, {
      code: input.code,
      oborCountInClass: input.oborCountInClass ?? 1,
      isArt82TalentClass: input.isArt82TalentClass ?? false,
    });

  const result = calculateProgramPhmax(dataset, {
    code: input.code,
    averageStudents: input.averageStudents,
    classCount: input.classCount,
    mode,
    form,
  });

  return {
    input,
    row: {
      code: result.code,
      name: result.name,
      category: result.category,
      modeKey: result.modeKey,
      form,
      averageStudents: input.averageStudents,
      classCount: input.classCount,
      intervalLabel: result.intervalLabel,
      phmaxPerClass: result.phmaxPerClass,
      coefficient: result.coefficient,
      adjustedPhmaxPerClass: round2(result.adjustedPhmaxPerClass),
      totalPhmax: round2(result.totalPhmax),
      note: input.note,
    },
  };
}

export function calculateSchoolPhmax(
  dataset: Dataset,
  inputs: ServiceRowInput[],
): BatchCalculationResult {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('Vstup musí obsahovat alespoň jeden řádek.');
  }

  const rows = inputs.map((input) => calculatePhmaxRow(dataset, input).row);

  const summary: CalculatorSummary = {
    rowCount: rows.length,
    totalClasses: rows.reduce((sum, row) => sum + row.classCount, 0),
    totalPhmax: round2(rows.reduce((sum, row) => sum + row.totalPhmax, 0)),
    byCategory: {},
  };

  for (const row of rows) {
    summary.byCategory[row.category] = round2(
      (summary.byCategory[row.category] ?? 0) + row.totalPhmax,
    );
  }

  return {
    inputs,
    rows,
    summary,
  };
}

export function buildCalculationPayload(
  dataset: Dataset,
  input: ServiceRowInput,
  context?: Omit<AutoModeContext, 'code'>,
): ServiceRowInput {
  const mode =
    input.mode ??
    chooseDefaultMode(dataset, {
      code: input.code,
      oborCountInClass: context?.oborCountInClass ?? input.oborCountInClass ?? 1,
      isArt82TalentClass: context?.isArt82TalentClass ?? input.isArt82TalentClass ?? false,
    });

  return {
    ...input,
    mode,
    form: input.form ?? 'denni',
  };
}
