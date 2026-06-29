function normalizeStringInput(value: string): string {
  return value
    .trim()
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ");
}

/** Parsuje číselný vstup v českém zápisu (mezery tisíců, desetinná čárka/tečka). */
export function parseCzechNumberInput(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  const normalized = normalizeStringInput(value);
  if (normalized === "") return undefined;

  const withoutSpaces = normalized.replace(/\s/g, "");
  if (withoutSpaces === "") return undefined;
  if (!/^-?[\d.,]+$/.test(withoutSpaces)) return undefined;

  const hasComma = withoutSpaces.includes(",");
  const hasDot = withoutSpaces.includes(".");
  if (hasComma && hasDot) {
    return undefined;
  }

  const canonical = withoutSpaces.replace(",", ".");
  if (!/^-?(?:\d+|\d*\.\d+)$/.test(canonical)) return undefined;

  const parsed = Number(canonical);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatNumberInputValue(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
    useGrouping: false,
  });
}
