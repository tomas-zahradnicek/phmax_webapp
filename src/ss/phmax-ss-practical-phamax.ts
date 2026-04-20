import { PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE } from "./phmax-ss-methodology-guides";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";

const PRACTICAL_CODES = new Set(["78-62-C/01", "78-62-C/02"]);

function parseAvgStudents(s: string): number | null {
  const n = Number(String(s).trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseClassCount(s: string): number | null {
  const n = parseInt(String(s).trim(), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Sloupec tabulky PHAmax z metodiky (PrŠ): méně než 4 | 4–<6 | 6–10 | více než 10 žáků.
 */
export function practicalSchoolPhaBandIndex(avgPupils: number): number {
  if (avgPupils < 4) return 0;
  if (avgPupils < 6) return 1;
  if (avgPupils <= 10) return 2;
  return 3;
}

/** PHAmax na jednu třídu podle kódu PrŠ a průměru žáků (tabulka v metodice v3). */
export function getPracticalSchoolPhaMaxPerClass(code: string, avgPupils: number): number | null {
  const trimmed = code.trim();
  if (!PRACTICAL_CODES.has(trimmed)) return null;
  const row = PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE.rows.find((r) => r.code === trimmed);
  if (!row) return null;
  const idx = practicalSchoolPhaBandIndex(avgPupils);
  return row.values[idx];
}

/**
 * Součet orientačního PHAmax pro řádky s PrŠ (78-62-C/01 nebo 78-62-C/02) v **denní** formě.
 * Ostatní obory a formy studia se do PHAmax v aplikaci nepromítají (metodika má další schémata mimo tento výpočet).
 */
export function sumPracticalSchoolPhaMaxFromRows(rows: readonly PhmaxSsUnitRow[]): number | null {
  let sum = 0;
  let any = false;
  for (const row of rows) {
    const code = row.educationField.trim();
    if (!PRACTICAL_CODES.has(code)) continue;
    if (row.studyForm !== "denni") continue;
    const avg = parseAvgStudents(row.averageStudents);
    const cnt = parseClassCount(row.classCount);
    if (avg === null || cnt === null) continue;
    const perClass = getPracticalSchoolPhaMaxPerClass(code, avg);
    if (perClass === null) continue;
    sum += perClass * cnt;
    any = true;
  }
  if (!any) return null;
  return Math.round((sum + Number.EPSILON) * 100) / 100;
}
