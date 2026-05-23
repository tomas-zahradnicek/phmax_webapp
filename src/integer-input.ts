/** Parsuje zadaný text na nezáporné celé číslo (bez úvodních nul). */
export function parseIntegerInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return 0;
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Zobrazitelná hodnota celého čísla bez úvodních nul. */
export function formatIntegerInputDisplay(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.trunc(value));
}

/** Normalizuje textové pole s celým číslem (prázdné zůstane prázdné). */
export function sanitizeIntegerInputString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits === "") return "";
  return String(parseInt(digits, 10));
}

export function clampInteger(value: number, min?: number, max?: number): number {
  let next = Math.trunc(value);
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

export function isIntegerNumberStep(step: number): boolean {
  return Number.isInteger(step) && step >= 1;
}
