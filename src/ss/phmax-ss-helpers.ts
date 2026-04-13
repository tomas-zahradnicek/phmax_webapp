import type { Dataset, Interval, ProgramRecord } from './phmax-ss-validator';

export type StudyForm = 'denni' | 'vecerni' | 'kombinovana' | 'kombinovana_konzervator' | 'dalkova' | 'distancni';
export type ModeKey = 'oneObor' | 'twoObory' | 'threeObory' | 'twoObory82' | 'threePlusObory82';

export type ResolvedInterval = Interval & {
  modeKey: ModeKey;
  code: string;
  category: string;
  name: string;
};

function getBool(interval: Interval, camel: keyof Interval, snake: keyof Interval): boolean | undefined {
  const camelValue = interval[camel];
  if (typeof camelValue === 'boolean') return camelValue;
  const snakeValue = interval[snake];
  if (typeof snakeValue === 'boolean') return snakeValue;
  return undefined;
}

export function intervalContains(interval: Interval, value: number): boolean {
  const minExclusive = getBool(interval, 'minExclusive', 'min_exclusive') ?? false;
  const maxExclusive = getBool(interval, 'maxExclusive', 'max_exclusive') ?? false;
  const min = interval.min;
  const max = interval.max;

  if (min !== undefined) {
    if (minExclusive ? value <= min : value < min) return false;
  }
  if (max !== undefined) {
    if (maxExclusive ? value >= max : value > max) return false;
  }
  return true;
}

export function getProgram(dataset: Dataset, code: string): ProgramRecord {
  const program = dataset.programs?.[code];
  if (!program) {
    throw new Error(`Obor ${code} nebyl v datasetu nalezen.`);
  }
  return program;
}

export function listAvailableModes(program: ProgramRecord): ModeKey[] {
  return Object.keys(program.modes) as ModeKey[];
}

export function resolveMode(program: ProgramRecord, preferredMode?: ModeKey): ModeKey {
  if (preferredMode && program.modes[preferredMode]) return preferredMode;
  if (program.modes.oneObor) return 'oneObor';
  const available = listAvailableModes(program);
  if (available.length === 0) throw new Error(`Obor ${program.code} nemá žádné režimy.`);
  return available[0];
}

export function getIntervalForAverage(dataset: Dataset, params: { code: string; averageStudents: number; mode?: ModeKey }): ResolvedInterval {
  const { code, averageStudents, mode } = params;
  if (!Number.isFinite(averageStudents) || averageStudents < 0) {
    throw new Error('Průměrný počet žáků musí být nezáporné konečné číslo.');
  }

  const program = getProgram(dataset, code);
  const modeKey = resolveMode(program, mode);
  const intervals = program.modes[modeKey];
  const found = intervals.find((interval) => intervalContains(interval, averageStudents));
  if (!found) {
    throw new Error(`Pro obor ${code}, režim ${modeKey} a průměr ${averageStudents} nebylo nalezeno pásmo.`);
  }

  return {
    ...found,
    modeKey,
    code: program.code,
    category: program.category,
    name: program.name,
  };
}

export function getPhmaxPerClass(dataset: Dataset, params: { code: string; averageStudents: number; mode?: ModeKey }): number {
  return getIntervalForAverage(dataset, params).value;
}

export function applyStudyFormCoefficient(dataset: Dataset, phmax: number, form: StudyForm = 'denni'): number {
  if (form === 'denni') return phmax;
  const coef = dataset.coefficients?.[form];
  if (typeof coef !== 'number') {
    throw new Error(`Koeficient pro formu ${form} nebyl nalezen.`);
  }
  return phmax * coef;
}

export function calculateProgramPhmax(dataset: Dataset, params: {
  code: string;
  averageStudents: number;
  classCount: number;
  mode?: ModeKey;
  form?: StudyForm;
}): {
  code: string;
  name: string;
  category: string;
  modeKey: ModeKey;
  intervalLabel: string;
  phmaxPerClass: number;
  coefficient: number;
  adjustedPhmaxPerClass: number;
  totalPhmax: number;
} {
  const { code, averageStudents, classCount, mode, form = 'denni' } = params;
  if (!Number.isInteger(classCount) || classCount <= 0) {
    throw new Error('Počet tříd musí být kladné celé číslo.');
  }

  const interval = getIntervalForAverage(dataset, { code, averageStudents, mode });
  const coefficient = form === 'denni' ? 1 : dataset.coefficients?.[form];
  if (typeof coefficient !== 'number') {
    throw new Error(`Koeficient pro formu ${form} nebyl nalezen.`);
  }

  const adjustedPhmaxPerClass = interval.value * coefficient;
  const totalPhmax = adjustedPhmaxPerClass * classCount;

  return {
    code: interval.code,
    name: interval.name,
    category: interval.category,
    modeKey: interval.modeKey,
    intervalLabel: interval.label,
    phmaxPerClass: interval.value,
    coefficient,
    adjustedPhmaxPerClass,
    totalPhmax,
  };
}

export const PHMAX_SS_STUDY_FORM_OPTIONS: { value: StudyForm; label: string }[] = [
  { value: "denni", label: "Denní" },
  { value: "vecerni", label: "Večerní" },
  { value: "kombinovana", label: "Kombinovaná" },
  { value: "kombinovana_konzervator", label: "Kombinovaná (konzervatoř)" },
  { value: "dalkova", label: "Dálková" },
  { value: "distancni", label: "Distanční" },
];
