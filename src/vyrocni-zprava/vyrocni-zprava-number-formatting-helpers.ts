type CzechDecimalFormatOptions = {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

type CzechCountForms = {
  one: string;
  few: string;
  many: string;
};

function isUsableNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeCzechNumberSpaces(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, " ");
}

export function formatCzechDecimal(value: number | undefined, options: CzechDecimalFormatOptions = {}): string {
  if (!isUsableNumber(value)) return "—";
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;
  return normalizeCzechNumberSpaces(value.toLocaleString("cs-CZ", {
    minimumFractionDigits,
    maximumFractionDigits,
  }));
}

export function formatCzechInteger(value: number | undefined): string {
  if (!isUsableNumber(value)) return "—";
  return normalizeCzechNumberSpaces(Math.round(value).toLocaleString("cs-CZ", { maximumFractionDigits: 0 }));
}

export function formatCzechCzk(value: number | undefined): string {
  if (!isUsableNumber(value)) return "neuvedeno";
  return `${normalizeCzechNumberSpaces(Math.round(value).toLocaleString("cs-CZ", { maximumFractionDigits: 0 }))} Kč`;
}

export function formatCzechCount(value: number | undefined, forms: CzechCountForms): string {
  if (!isUsableNumber(value)) return `— ${forms.many}`;
  const integer = Math.round(value);
  const abs = Math.abs(integer);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  const noun = mod100 >= 11 && mod100 <= 14 ? forms.many : mod10 === 1 ? forms.one : mod10 >= 2 && mod10 <= 4 ? forms.few : forms.many;
  return `${normalizeCzechNumberSpaces(integer.toLocaleString("cs-CZ", { maximumFractionDigits: 0 }))} ${noun}`;
}
