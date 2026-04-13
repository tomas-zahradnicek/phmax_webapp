/**
 * Čisté odvození náhledu PHmax, kontroly pravidel a vstupu do auditního protokolu z řádků formuláře SŠ.
 */
import type { BusinessRulesResult } from "./phmax-ss-business-rules";
import { evaluateBusinessRules } from "./phmax-ss-business-rules";
import { buildBusinessRuleOboryForRow } from "./phmax-ss-brules-row-build";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import type { ExplainabilityRowInput } from "./phmax-ss-explainability";
import { mergeBusinessRulesResults } from "./phmax-ss-explainability";
import type { AuditProtocolInput } from "./phmax-audit";
import type { ModeKey } from "./phmax-ss-helpers";
import { calculatePhmaxRow, type ServiceResolvedRow } from "./phmax-ss-service";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";

function parseAvg(s: string): number | null {
  const n = Number(String(s).trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseCount(s: string): number | null {
  const n = parseInt(String(s).trim(), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function explainInputFromUnitRow(row: PhmaxSsUnitRow): ExplainabilityRowInput | null {
  const code = row.educationField.trim();
  const avg = parseAvg(row.averageStudents);
  const cnt = parseCount(row.classCount);
  if (!code || avg === null || cnt === null) return null;
  const obRaw = row.oborCountInClass.trim();
  const obParsed = obRaw === "" ? 1 : parseInt(obRaw, 10);
  if (obRaw !== "" && (!Number.isInteger(obParsed) || obParsed <= 0)) return null;
  return {
    code,
    averageStudents: avg,
    classCount: cnt,
    form: row.studyForm,
    note: row.label || undefined,
    mode: row.phmaxMode === "" ? undefined : row.phmaxMode,
    oborCountInClass: obParsed,
    isArt82TalentClass: row.isArt82TalentClass,
  };
}

export type SsUnitPreviewEntry =
  | { rowId: number; label: string; skipped: true }
  | { rowId: number; label: string; skipped: false; error: string }
  | { rowId: number; label: string; skipped: false; resolved: ServiceResolvedRow };

export function deriveSsUnitsPreview(rows: PhmaxSsUnitRow[]): SsUnitPreviewEntry[] {
  return rows.map((row) => {
    const code = row.educationField.trim();
    const avg = parseAvg(row.averageStudents);
    const cnt = parseCount(row.classCount);
    if (!code || avg === null || cnt === null) {
      return { rowId: row.id, label: row.label, skipped: true as const };
    }

    const obRaw = row.oborCountInClass.trim();
    const obParsed = obRaw === "" ? 1 : parseInt(obRaw, 10);
    if (obRaw !== "" && (!Number.isInteger(obParsed) || obParsed <= 0)) {
      return {
        rowId: row.id,
        label: row.label,
        skipped: false as const,
        error: "Počet oborů ve třídě musí být kladné celé číslo.",
      };
    }
    const oborCountInClass = obParsed;

    try {
      const mode: ModeKey | undefined = row.phmaxMode === "" ? undefined : row.phmaxMode;
      const { row: resolved } = calculatePhmaxRow(phmaxSsDataset, {
        code,
        averageStudents: avg,
        classCount: cnt,
        form: row.studyForm,
        note: row.label || undefined,
        mode,
        oborCountInClass,
        isArt82TalentClass: row.isArt82TalentClass,
      });
      return { rowId: row.id, label: row.label, skipped: false as const, resolved };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { rowId: row.id, label: row.label, skipped: false as const, error: msg };
    }
  });
}

export type SsUnitBrulesEntry =
  | { rowId: number; label: string; skipped: true }
  | {
      rowId: number;
      label: string;
      skipped: false;
      codesStr: string;
      result: BusinessRulesResult;
    }
  | { rowId: number; label: string; skipped: false; codesStr: string; error: string };

export function deriveSsUnitsBrulesPreview(rows: PhmaxSsUnitRow[]): SsUnitBrulesEntry[] {
  return rows.map((row) => {
    const obory = buildBusinessRuleOboryForRow(row);
    if (!obory) {
      return { rowId: row.id, label: row.label, skipped: true as const };
    }
    const codesStr = obory.map((o) => o.code).join(", ");
    try {
      const result = evaluateBusinessRules(phmaxSsDataset, { obory });
      return {
        rowId: row.id,
        label: row.label,
        skipped: false as const,
        codesStr,
        result,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        rowId: row.id,
        label: row.label,
        skipped: false as const,
        codesStr,
        error: msg,
      };
    }
  });
}

/** Vstup pro `createSsProductAuditProtocol` / explainability — jen řádky s úspěšným PHmax. */
export function buildSsAuditProtocolInput(rows: PhmaxSsUnitRow[]): AuditProtocolInput | null {
  const preview = deriveSsUnitsPreview(rows);
  const brulesPreview = deriveSsUnitsBrulesPreview(rows);
  const list: ExplainabilityRowInput[] = [];
  const brParts: { label: string; result: BusinessRulesResult }[] = [];

  for (const p of preview) {
    if (!("resolved" in p)) continue;
    const src = rows.find((r) => r.id === p.rowId);
    if (!src) continue;
    const inp = explainInputFromUnitRow(src);
    if (!inp) continue;
    list.push(inp);

    const bp = brulesPreview.find((b) => b.rowId === p.rowId);
    const rowLabel = (p.label || "").trim() || `Řádek ${p.rowId}`;
    if (bp && !bp.skipped) {
      if ("result" in bp) {
        brParts.push({ label: rowLabel, result: bp.result });
      } else if ("error" in bp) {
        brParts.push({
          label: rowLabel,
          result: {
            allowed: false,
            errors: [{ code: "BRULES_EVAL", message: String(bp.error) }],
            warnings: [],
            info: [],
          },
        });
      }
    }
  }

  if (list.length === 0) return null;
  const mergedBr = mergeBusinessRulesResults(brParts);
  return {
    rows: list,
    ...(mergedBr ? { businessRules: mergedBr } : {}),
  };
}
