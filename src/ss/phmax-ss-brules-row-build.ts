import type { BusinessRuleOborInput } from "./phmax-ss-business-rules";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";

function parseAvgLocal(s: string): number | null {
  const n = Number(String(s).trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Oddělovače: čárka, středník, nový řádek. */
export function splitOborCodeTokens(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Primární kód + další, bez duplicit, zachované pořadí. */
export function mergeClassOborCodes(primary: string, additionalRaw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of [primary.trim(), ...splitOborCodeTokens(additionalRaw)]) {
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

/**
 * Volitelné počty žáků podle oboru: `KÓD:12` nebo `KÓD:12,5` na řádek / čárkou.
 * Klíče mapy odpovídají přesnému řetězci kódu z tabulky.
 */
export function parseOborStudentCountMap(raw: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const part of raw.split(/[,;\n]+/)) {
    const trimmed = part.trim();
    const match = trimmed.match(/^([^:]+):\s*(\d+(?:[.,]\d+)?)\s*$/);
    if (!match) continue;
    const code = match[1].trim();
    const n = Number(match[2].replace(",", "."));
    if (code && Number.isFinite(n) && n >= 0) m.set(code, n);
  }
  return m;
}

/** Vstup pro `evaluateBusinessRules` z jednoho řádku formuláře, nebo `null` bez primárního kódu. */
export function buildBusinessRuleOboryForRow(row: PhmaxSsUnitRow): BusinessRuleOborInput[] | null {
  const primary = row.educationField.trim();
  if (!primary) return null;
  const codes = mergeClassOborCodes(primary, row.additionalOborCodes);
  if (codes.length === 0) return null;
  const countMap = parseOborStudentCountMap(row.oborStudentCountsRaw);
  const fallbackAvg = parseAvgLocal(row.averageStudents);
  return codes.map((code) => ({
    code,
    studentsInClass: countMap.get(code) ?? fallbackAvg ?? undefined,
    form: row.studyForm,
  }));
}
