import { getSchoolTypeLabel } from "../school-profile/school-profile-school-type";

/** Český popisek typu školy pro text výroční zprávy (kódy i uložené labely). */
export function formatSchoolTypeForReport(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  return getSchoolTypeLabel(trimmed);
}

export function normalizeOptionalText(text?: string): string | undefined {
  const trimmed = (text ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function appendSentencePeriod(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return "";
  if (/[.!?:;)]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}
