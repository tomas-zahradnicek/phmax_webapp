export type Interval = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  min_exclusive?: boolean;
  max_exclusive?: boolean;
  min_inclusive?: boolean;
  max_inclusive?: boolean;
  minExclusive?: boolean;
  maxExclusive?: boolean;
  minInclusive?: boolean;
  maxInclusive?: boolean;
};

export type ProgramModes = Record<string, Interval[]>;

export type ProgramRecord = {
  code: string;
  name: string;
  category: string;
  group?: string;
  modes: ProgramModes;
};

export type Dataset = {
  meta: Record<string, unknown>;
  coefficients: Record<string, number>;
  intervalSets: Record<string, Interval[]>;
  programs: Record<string, ProgramRecord>;
};

export type ValidationIssue = {
  severity: 'error' | 'warning';
  path: string;
  message: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getBool(interval: Interval, camel: keyof Interval, snake: keyof Interval): boolean | undefined {
  const camelValue = interval[camel];
  if (typeof camelValue === 'boolean') return camelValue;
  const snakeValue = interval[snake];
  if (typeof snakeValue === 'boolean') return snakeValue;
  return undefined;
}

function normalizedBounds(interval: Interval) {
  return {
    min: interval.min,
    max: interval.max,
    minExclusive: getBool(interval, 'minExclusive', 'min_exclusive') ?? false,
    maxExclusive: getBool(interval, 'maxExclusive', 'max_exclusive') ?? false,
    minInclusive: getBool(interval, 'minInclusive', 'min_inclusive') ?? !((getBool(interval, 'minExclusive', 'min_exclusive')) ?? false),
    maxInclusive: getBool(interval, 'maxInclusive', 'max_inclusive') ?? !((getBool(interval, 'maxExclusive', 'max_exclusive')) ?? false),
  };
}

function isOpenEnded(interval: Interval): boolean {
  return interval.max === undefined;
}

function compareLowerBounds(a: Interval, b: Interval): number {
  const av = a.min ?? Number.NEGATIVE_INFINITY;
  const bv = b.min ?? Number.NEGATIVE_INFINITY;
  if (av !== bv) return av - bv;
  const aEx = normalizedBounds(a).minExclusive ? 1 : 0;
  const bEx = normalizedBounds(b).minExclusive ? 1 : 0;
  return aEx - bEx;
}

export function validateDataset(dataset: Dataset): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!dataset || typeof dataset !== 'object') {
    return [{ severity: 'error', path: 'root', message: 'Dataset must be an object.' }];
  }

  if (!dataset.programs || typeof dataset.programs !== 'object') {
    issues.push({ severity: 'error', path: 'programs', message: 'Missing programs map.' });
    return issues;
  }

  for (const [code, program] of Object.entries(dataset.programs)) {
    if (!program || typeof program !== 'object') {
      issues.push({ severity: 'error', path: `programs.${code}`, message: 'Program must be an object.' });
      continue;
    }

    if (program.code !== code) {
      issues.push({ severity: 'warning', path: `programs.${code}.code`, message: `Program code mismatch: expected ${code}, got ${program.code}.` });
    }

    if (!program.modes || typeof program.modes !== 'object') {
      issues.push({ severity: 'error', path: `programs.${code}.modes`, message: 'Program is missing modes.' });
      continue;
    }

    for (const [modeName, intervals] of Object.entries(program.modes)) {
      const pathBase = `programs.${code}.modes.${modeName}`;
      if (!Array.isArray(intervals) || intervals.length === 0) {
        issues.push({ severity: 'error', path: pathBase, message: 'Mode must contain a non-empty interval array.' });
        continue;
      }

      const sorted = [...intervals].sort(compareLowerBounds);
      let previous: Interval | undefined;

      for (let i = 0; i < sorted.length; i++) {
        const interval = sorted[i];
        const path = `${pathBase}[${i}]`;

        if (typeof interval.label !== 'string' || !interval.label.trim()) {
          issues.push({ severity: 'error', path: `${path}.label`, message: 'Missing interval label.' });
        }
        if (!isFiniteNumber(interval.value)) {
          issues.push({ severity: 'error', path: `${path}.value`, message: 'Interval value must be a finite number.' });
        }
        if (interval.min !== undefined && !isFiniteNumber(interval.min)) {
          issues.push({ severity: 'error', path: `${path}.min`, message: 'Interval min must be a finite number when present.' });
        }
        if (interval.max !== undefined && !isFiniteNumber(interval.max)) {
          issues.push({ severity: 'error', path: `${path}.max`, message: 'Interval max must be a finite number when present.' });
        }
        if (isFiniteNumber(interval.min) && isFiniteNumber(interval.max) && interval.min > interval.max) {
          issues.push({ severity: 'error', path, message: 'Interval min cannot be greater than max.' });
        }

        const bounds = normalizedBounds(interval);
        const camelCasePresent =
          'minExclusive' in interval || 'maxExclusive' in interval || 'minInclusive' in interval || 'maxInclusive' in interval;
        const snakeCasePresent =
          'min_exclusive' in interval || 'max_exclusive' in interval || 'min_inclusive' in interval || 'max_inclusive' in interval;
        if (camelCasePresent && snakeCasePresent) {
          issues.push({ severity: 'warning', path, message: 'Interval mixes camelCase and snake_case boundary flags.' });
        }

        if (previous) {
          const prevBounds = normalizedBounds(previous);
          const prevMax = previous.max;
          const currMin = interval.min;

          if (prevMax === undefined) {
            issues.push({ severity: 'error', path, message: 'Open-ended interval is not the last interval.' });
          } else if (currMin === undefined) {
            issues.push({ severity: 'error', path, message: 'Only the first interval may omit min.' });
          } else {
            if (prevMax < currMin) {
              issues.push({ severity: 'warning', path, message: `Gap detected between previous max ${prevMax} and current min ${currMin}.` });
            } else if (prevMax > currMin) {
              issues.push({ severity: 'error', path, message: `Overlap detected between previous max ${prevMax} and current min ${currMin}.` });
            } else {
              const sharedBoundaryCoveredTwice = prevBounds.maxInclusive && bounds.minInclusive;
              const sharedBoundaryCoveredByNone = prevBounds.maxExclusive && bounds.minExclusive;
              if (sharedBoundaryCoveredTwice) {
                issues.push({ severity: 'error', path, message: `Boundary overlap at ${currMin}.` });
              }
              if (sharedBoundaryCoveredByNone) {
                issues.push({ severity: 'warning', path, message: `Boundary gap at ${currMin}.` });
              }
            }
          }
        }

        previous = interval;
      }

      const last = sorted[sorted.length - 1];
      if (!isOpenEnded(last)) {
        issues.push({ severity: 'warning', path: pathBase, message: 'Last interval is not open-ended.' });
      }
    }
  }

  return issues;
}

export function summarizeValidation(issues: ValidationIssue[]) {
  const errors = issues.filter((x) => x.severity === 'error');
  const warnings = issues.filter((x) => x.severity === 'warning');
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}
