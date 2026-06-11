/** Normalizuje text čísla – odstraní úvodní nuly z celé části; výstup vždy s desetinnou čárkou. */
export function sanitizeNumericInputString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return "";

  const decSep = ",";
  const normalized = trimmed.replace(",", ".");
  const cleaned = normalized.replace(/[^\d.]/g, "");

  const dotIdx = cleaned.indexOf(".");
  let intPart = dotIdx >= 0 ? cleaned.slice(0, dotIdx) : cleaned;
  const decPart = dotIdx >= 0 ? cleaned.slice(dotIdx + 1).replace(/\./g, "") : "";

  if (intPart.length > 1 && intPart.startsWith("0")) {
    intPart = String(parseInt(intPart, 10));
  }

  const trailingSep = (trimmed.endsWith(",") || trimmed.endsWith(".")) && decPart === "";
  if (trailingSep) {
    return `${intPart === "" ? "0" : intPart}${decSep}`;
  }

  if (decPart) {
    return `${intPart === "" ? "0" : intPart}${decSep}${decPart}`;
  }

  return intPart;
}

export function parseNumericInput(raw: string): number {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "" || trimmed === ".") return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumericInputDisplay(value: number, emptyWhenZero = true): string {
  if (!Number.isFinite(value)) return "";
  if (emptyWhenZero && value === 0) return "";
  if (Number.isInteger(value)) return String(value);
  const formatted = value.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
    useGrouping: false,
  });
  return formatted;
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}
