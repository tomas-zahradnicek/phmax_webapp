/** Krátký zápis týdenních hodin v českém UI (s tečkou za zkratkou). */
export const CS_HOURS_PER_WEEK_SHORT = "h./týd.";

export type FormatCsNumberOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Desetinná čísla pro zobrazení a export (čárka jako oddělovač). */
export function formatCsNumber(value: number, options: FormatCsNumberOptions = {}): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;
  return value.toLocaleString("cs-CZ", { minimumFractionDigits, maximumFractionDigits });
}

export function formatCsNumberOrDash(
  value: number | null | undefined,
  options: FormatCsNumberOptions = {},
): string {
  if (value == null || !Number.isFinite(value)) return "–";
  return formatCsNumber(value, options);
}

export function formatCsHoursPerWeek(value: number, options: FormatCsNumberOptions = {}): string {
  return `${formatCsNumber(value, options)} ${CS_HOURS_PER_WEEK_SHORT}`;
}

/** Hodnota pro buňku CSV (čísla s čárkou, text beze změny). */
export function formatExportCell(value: string | number): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatCsNumber(value);
  }
  return value;
}
