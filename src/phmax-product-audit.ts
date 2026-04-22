/**
 * Jednotný auditní protokol napříč produkty: mapování ze SŠ auditu + továrny PV, ŠD, ZŠ.
 * Výpočty zůstávají v doménách; struktura výstupu je stejná (`PhmaxProductAuditProtocol`).
 */
import type { Dataset } from "./ss/phmax-ss-validator";
import {
  createAuditProtocol,
  type AuditProtocol,
  type AuditProtocolInput,
} from "./ss/phmax-audit";
import { computePvPhmaxTotal, type PvProvozKind } from "./phmax-pv-logic";
import { round2 } from "./phmax-zs-logic";
import {
  getPhmaxSdBase,
  getPhmaxSdBreakdown,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
  SD_MAX_DEPARTMENTS_IN_TABLE,
} from "./phmax-sd-logic";
import { PV_LEGIS_ZAKONY_URL, PV_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-pv-legislativa";
import { SD_LEGIS_ZAKONY_URL, SD_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-sd-legislativa";
import { ZS_LEGIS_ZAKONY_URL, ZS_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-zs-legislativa";
import {
  PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION,
  type PhmaxProductAuditCalculation,
  type PhmaxProductAuditExplanation,
  type PhmaxProductAuditLegal,
  type PhmaxProductAuditProtocol,
  type PhmaxProductAuditValidation,
  type PhmaxProductValidationIssue,
} from "./phmax-product-audit-types";

function nowIso(): string {
  return new Date().toISOString();
}

function deepSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function pvLegal(): PhmaxProductAuditLegal {
  return {
    consolidated: Object.values(PV_LEGIS_PARAGRAPH_TOOLTIPS),
    references: Object.values(PV_LEGIS_ZAKONY_URL),
  };
}

function sdLegal(): PhmaxProductAuditLegal {
  return {
    consolidated: Object.values(SD_LEGIS_PARAGRAPH_TOOLTIPS),
    references: Object.values(SD_LEGIS_ZAKONY_URL),
  };
}

function zsLegal(): PhmaxProductAuditLegal {
  return {
    consolidated: Object.values(ZS_LEGIS_PARAGRAPH_TOOLTIPS),
    references: Object.values(ZS_LEGIS_ZAKONY_URL),
  };
}

function ssLegalFromAudit(audit: AuditProtocol): PhmaxProductAuditLegal {
  return {
    consolidated: audit.legal.consolidated,
    references: audit.legal.summaryLegalBasis,
  };
}

/** Převod nativního SŠ protokolu na produktový tvar (JSON / srovnání variant). */
export function ssAuditToProductProtocol(audit: AuditProtocol): PhmaxProductAuditProtocol {
  const issues: PhmaxProductValidationIssue[] = [];
  const br = audit.validation.businessRulesResult;
  if (br) {
    for (const e of br.errors) {
      issues.push({ severity: "error", code: e.code, message: e.message });
    }
    for (const w of br.warnings) {
      issues.push({ severity: "warning", code: w.code, message: w.message });
    }
  }
  for (const msg of audit.errors) {
    issues.push({ severity: "error", message: msg });
  }

  const validation: PhmaxProductAuditValidation = {
    ok: !issues.some((i) => i.severity === "error"),
    source: `ss:${audit.validation.source}`,
    issues,
    raw: br ?? undefined,
  };

  let calculation: PhmaxProductAuditCalculation;
  if (audit.calculation.ok) {
    const b = audit.calculation.batch;
    calculation = {
      ok: true,
      totalPrimary: b.summary.totalPhmax,
      totalSecondary: b.summary.totalClasses,
      breakdown: { rowCount: b.summary.rowCount },
      raw: b,
    };
  } else {
    calculation = { ok: false, error: audit.calculation.error };
  }

  let explanation: PhmaxProductAuditExplanation;
  if (audit.explanation.ok) {
    const d = audit.explanation.data;
    explanation = {
      ok: true,
      narrative: d.summary.narrative,
      raw: d,
    };
  } else {
    explanation = { ok: false, error: audit.explanation.error };
  }

  return {
    meta: {
      product: "ss",
      protocolVersion: PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION,
      createdAtIso: audit.meta.createdAtIso,
      contextMeta: {
        ssProtocolVersion: audit.meta.protocolVersion,
        datasetMeta: audit.meta.datasetMeta,
      },
    },
    input: audit.input,
    validation,
    calculation,
    explanation,
    legal: ssLegalFromAudit(audit),
    errors: [...audit.errors],
  };
}

export function createSsProductAuditProtocol(dataset: Dataset, input: AuditProtocolInput): PhmaxProductAuditProtocol {
  return ssAuditToProductProtocol(createAuditProtocol(dataset, input));
}

export type PvWorkplaceAuditRowInput = {
  /** Volitelný popisek řádku (pracoviště). */
  label?: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
  sec16ClassCount: number;
  languageGroupCount: number;
};

/**
 * Audit PV: součet PHmax po řádcích pracovišť (`computePvPhmaxTotal`).
 */
export function createPvProductAuditProtocol(rows: PvWorkplaceAuditRowInput[]): PhmaxProductAuditProtocol {
  const inputSnapshot = deepSnapshot(rows);
  const issues: PhmaxProductValidationIssue[] = [];
  const rowDetails: unknown[] = [];
  let sumPhmax = 0;
  let anyNull = false;

  if (rows.length === 0) {
    issues.push({
      severity: "info",
      code: "empty",
      message: "Nejsou zadána žádná pracoviště — součet PHmax je 0.",
    });
  }

  rows.forEach((row, idx) => {
    const r = computePvPhmaxTotal({
      provoz: row.provoz,
      classCount: row.classCount,
      avgHoursPerDay: row.avgHoursPerDay,
      sec16ClassCount: row.sec16ClassCount,
      languageGroupCount: row.languageGroupCount,
    });
    for (const iss of r.issues) {
      issues.push({
        severity: "error",
        code: iss.code,
        message: row.label ? `[${row.label}] ${iss.message}` : iss.message,
      });
    }
    if (r.totalPhmax == null) {
      anyNull = true;
    } else {
      sumPhmax += r.totalPhmax;
    }
    rowDetails.push({
      index: idx,
      label: row.label,
      ...r,
    });
  });

  const validation: PhmaxProductAuditValidation = {
    ok: !issues.some((i) => i.severity === "error"),
    source: "pv:computePvPhmaxTotal",
    issues,
  };

  const hasError = issues.some((i) => i.severity === "error");
  const calculation: PhmaxProductAuditCalculation = hasError
    ? { ok: false, error: "Alespoň u jednoho řádku nelze dopočítat PHmax (tabulka / vstupy)." }
    : {
        ok: true,
        totalPrimary: anyNull ? null : round2(sumPhmax),
        breakdown: { workplaces: rowDetails.length, rows: rowDetails },
        raw: { rows: rowDetails },
      };

  const narrative =
    calculation.ok && calculation.totalPrimary != null
      ? `Součet PHmax za ${rows.length} pracoviště: ${calculation.totalPrimary} h (metodika PV v4, tabulky 1–3 + bonusy § 16 / § 1d).`
      : "PHmax pro PV se nepodařilo kompletně spočítat — zkontrolujte vstupy a varování u řádků.";

  return {
    meta: {
      product: "pv",
      protocolVersion: PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION,
      createdAtIso: nowIso(),
    },
    input: inputSnapshot,
    validation,
    calculation,
    explanation: { ok: true, narrative },
    legal: pvLegal(),
    errors: [],
  };
}

export type SdAuditInput = {
  pupilsFirstGrade: number;
  manualDepts: boolean;
  /** Použije se jen při `manualDepts === true`. */
  departments: number;
};

/**
 * Audit ŠD: tabulka oddělení + případné krácení dle § 10 odst. 2.
 */
export function createSdProductAuditProtocol(input: SdAuditInput): PhmaxProductAuditProtocol {
  const inputSnapshot = deepSnapshot(input);
  const suggested = suggestedDepartmentsFromPupils(input.pupilsFirstGrade);
  const effectiveDepts = input.manualDepts ? input.departments : suggested;
  const issues: PhmaxProductValidationIssue[] = [];

  if (effectiveDepts > SD_MAX_DEPARTMENTS_IN_TABLE) {
    issues.push({
      severity: "warning",
      code: "table_limit",
      message: `Tabulka PHmax v aplikaci končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními — u vyššího počtu ověřte přílohu vyhlášky.`,
    });
  }

  const basePhmax = getPhmaxSdBase(effectiveDepts);
  if (basePhmax == null) {
    issues.push({
      severity: "error",
      code: "sd_base",
      message: "Nelze určit základ PHmax pro zadaný počet oddělení.",
    });
  }

  const reduction =
    basePhmax == null
      ? { adjusted: 0, factor: 1, applied: false }
      : reducedPhmaxIfUnderStaffed({
          pupilsFirstGrade: input.pupilsFirstGrade,
          departmentCount: effectiveDepts,
          basePhmax,
        });

  const breakdown = getPhmaxSdBreakdown(effectiveDepts);

  const validation: PhmaxProductAuditValidation = {
    ok: !issues.some((i) => i.severity === "error"),
    source: "sd:getPhmaxSdBase+reducedPhmaxIfUnderStaffed",
    issues,
  };

  const calculation: PhmaxProductAuditCalculation =
    basePhmax == null
      ? { ok: false, error: "Chybí platný základ PHmax pro počet oddělení." }
      : {
          ok: true,
          totalPrimary: reduction.adjusted,
          totalSecondary: effectiveDepts,
          breakdown: {
            suggestedDepartments: suggested,
            effectiveDepartments: effectiveDepts,
            manualDepts: input.manualDepts,
            basePhmax,
            reduction,
            tableRows: breakdown,
          },
          raw: { basePhmax, reduction, breakdown },
        };

  const narrative =
    calculation.ok && calculation.totalPrimary != null
      ? `PHmax školní družiny po případném krácení: ${calculation.totalPrimary} h (${effectiveDepts} oddělení, ${input.pupilsFirstGrade} žáků 1. stupně).`
      : "PHmax pro školní družinu nelze vypočítat — zkontrolujte počet oddělení.";

  return {
    meta: {
      product: "sd",
      protocolVersion: PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION,
      createdAtIso: nowIso(),
    },
    input: inputSnapshot,
    validation,
    calculation,
    explanation: { ok: true, narrative },
    legal: sdLegal(),
    errors: [],
  };
}

/** Součty uložené ve snapshotu ZŠ pro srovnání záloh bez opětovného výpočtu celé stránky. */
export type ZsStoredAuditTotals = {
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  tab: string;
};

export function parseZsSnapshotAuditTotals(snapshot: Record<string, unknown>): ZsStoredAuditTotals | null {
  const t = snapshot._phmaxAuditTotals;
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  if (
    typeof o.totalPhmax !== "number" ||
    typeof o.totalPha !== "number" ||
    typeof o.totalPhp !== "number" ||
    typeof o.tab !== "string"
  ) {
    return null;
  }
  return {
    totalPhmax: o.totalPhmax,
    totalPha: o.totalPha,
    totalPhp: o.totalPhp,
    tab: o.tab,
  };
}

export type ZsProductAuditInput = {
  /**
   * Zamrznutý stav formuláře / režimu z UI (JSON-safe), bez opětovného běhu celé ZŠ logiky.
   */
  formSnapshot: Record<string, unknown>;
  /** Součty již vypočtené v aplikaci. */
  totals: {
    totalPhmax: number;
    breakdown?: Record<string, number>;
  };
  /** Volitelné varování z UI (např. validace tabulek). */
  validationIssues?: PhmaxProductValidationIssue[];
  /** Krátký textový souhrn z UI (např. aktivní záložka, režim). */
  narrative?: string;
};

/**
 * Audit ZŠ: tenká vrstva nad již vypočtenými součty a snapshotem z UI (plný výpočet zůstává v `PhmaxZsPage`).
 */
export function createZsProductAuditProtocol(input: ZsProductAuditInput): PhmaxProductAuditProtocol {
  const inputSnapshot = deepSnapshot(input);
  const issues = [...(input.validationIssues ?? [])];
  const validation: PhmaxProductAuditValidation = {
    ok: !issues.some((i) => i.severity === "error"),
    source: "zs:ui_snapshot+totals",
    issues,
  };

  const calculation: PhmaxProductAuditCalculation = {
    ok: true,
    totalPrimary: input.totals.totalPhmax,
    breakdown: input.totals.breakdown ? { ...input.totals.breakdown } : undefined,
    raw: { totals: input.totals },
  };

  const narrative =
    input.narrative?.trim() ||
    `Celkový PHmax ze stavu ZŠ kalkulačky: ${input.totals.totalPhmax} h (ověřte vstupy a metodiku v5 v UI).`;

  return {
    meta: {
      product: "zs",
      protocolVersion: PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION,
      createdAtIso: nowIso(),
      contextMeta: { note: "ZŠ audit je odvozen ze snapshotu; hloubka výpočtu odpovídá UI." },
    },
    input: { formSnapshot: inputSnapshot.formSnapshot, totals: inputSnapshot.totals },
    validation,
    calculation,
    explanation: { ok: true, narrative },
    legal: zsLegal(),
    errors: [],
  };
}
