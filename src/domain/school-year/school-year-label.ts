const SCHOOL_YEAR_LABEL_RE = /^(\d{4})\/(\d{4})$/;

/**
 * Derive canonical display label from start year.
 * Example: 2026 → "2026/2027"
 */
export function formatSchoolYearLabel(startYear: number): string {
  if (!Number.isInteger(startYear)) {
    throw new RangeError(`startYear must be an integer, got ${startYear}`);
  }
  return `${startYear}/${startYear + 1}`;
}

/**
 * Parse canonical "YYYY/YYYY" label into startYear.
 * Returns null when the label is not valid (no implicit default).
 */
export function parseSchoolYearLabel(label: string): number | null {
  if (!isValidSchoolYearLabel(label)) return null;
  const match = SCHOOL_YEAR_LABEL_RE.exec(label.trim());
  if (!match) return null;
  return Number(match[1]);
}

/**
 * Accept only canonical YYYY/YYYY where the second year equals first + 1.
 */
export function isValidSchoolYearLabel(label: string): boolean {
  if (typeof label !== "string") return false;
  const match = SCHOOL_YEAR_LABEL_RE.exec(label.trim());
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
  return end === start + 1;
}
