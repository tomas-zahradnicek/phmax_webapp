/**
 * Auditní protokol nad PHmax SŠ — agreguje vstupy, validaci (business rules),
 * výpočet (`phmax-ss-service`), explainability a právní oporu bez úprav engine souborů.
 */
import type { Dataset } from "./phmax-ss-validator";
import type { BusinessRulesInput, BusinessRulesResult } from "./phmax-ss-business-rules";
import { evaluateBusinessRules } from "./phmax-ss-business-rules";
import type { ExplainabilityInput, ExplainabilityResult } from "./phmax-ss-explainability";
import { explainFullPhmaxDecision } from "./phmax-ss-explainability";
import {
  buildCalculationPayload,
  calculateSchoolPhmax,
  type BatchCalculationResult,
} from "./phmax-ss-service";

/** Verze struktury protokolu (serializace / migrace). */
export const AUDIT_PROTOCOL_VERSION = "1.0.0";

/**
 * Vstup do auditu: stejné jako explainability (`rows` + volitelně `businessRules`),
 * plus volitelný `businessRulesInput` pro vyhodnocení pravidel, pokud není předán hotový výsledek.
 */
export type AuditProtocolInput = ExplainabilityInput & {
  businessRulesInput?: BusinessRulesInput;
};

export type AuditProtocolMeta = {
  protocolVersion: string;
  createdAtIso: string;
  /** `dataset.meta` z načteného datasetu (identifikace zdroje tabulek). */
  datasetMeta: Record<string, unknown>;
};

/** Jak vznikl záznam validace v protokolu. */
export type AuditValidationSource = "none" | "businessRulesProvided" | "businessRulesInputEvaluated";

export type AuditProtocolValidation = {
  source: AuditValidationSource;
  /** Použitý vstup pro `evaluateBusinessRules`, pokud byl vyhodnocen. */
  businessRulesInputSnapshot?: BusinessRulesInput;
  /** Výsledek validace; `null`, pokud nebyla pravidla vyhodnocena samostatně (explainability může stále použít prázdný rámec). */
  businessRulesResult: BusinessRulesResult | null;
};

export type AuditProtocolCalculation =
  | { ok: true; batch: BatchCalculationResult }
  | { ok: false; error: string };

export type AuditProtocolExplanation =
  | { ok: true; data: ExplainabilityResult }
  | { ok: false; error: string };

/** Sloučená a řádková právní opora z explainability výstupu. */
export type AuditProtocolLegal = {
  summaryLegalBasis: string[];
  perRow: Array<{ rowIndex: number; code: string; legalBasis: string[] }>;
  /** Unikátní sjednocení řádků + souhrnu. */
  consolidated: string[];
};

export type AuditProtocol = {
  meta: AuditProtocolMeta;
  /** Zamražená kopie vstupu (JSON-safe). */
  input: AuditProtocolInput;
  validation: AuditProtocolValidation;
  calculation: AuditProtocolCalculation;
  explanation: AuditProtocolExplanation;
  legal: AuditProtocolLegal;
  /** Souhrnné chybové hlášky (např. selhání výpočtu). */
  errors: string[];
};

function deepSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyLegal(): AuditProtocolLegal {
  return { summaryLegalBasis: [], perRow: [], consolidated: [] };
}

function collectLegalFromExplanation(exp: ExplainabilityResult): AuditProtocolLegal {
  const summaryLegalBasis = [...exp.summary.legalBasis];
  const perRow = exp.rows.map((r, rowIndex) => ({
    rowIndex,
    code: r.code,
    legalBasis: [...r.explanation.legalBasis],
  }));
  const consolidated = [...new Set([...summaryLegalBasis, ...perRow.flatMap((p) => p.legalBasis)])];
  return { summaryLegalBasis, perRow, consolidated };
}

/**
 * Sestaví auditní protokol: uloží vstupy, validaci, výpočet po řádcích, explainability a právní oporu.
 */
export function createAuditProtocol(dataset: Dataset, input: AuditProtocolInput): AuditProtocol {
  const errors: string[] = [];
  const inputSnapshot = deepSnapshot(input);

  let validationSource: AuditValidationSource = "none";
  let businessRulesInputSnapshot: BusinessRulesInput | undefined;
  let businessRulesResult: BusinessRulesResult | null = null;

  if (input.businessRules !== undefined) {
    validationSource = "businessRulesProvided";
    businessRulesResult = deepSnapshot(input.businessRules);
  } else if (input.businessRulesInput !== undefined) {
    validationSource = "businessRulesInputEvaluated";
    businessRulesInputSnapshot = deepSnapshot(input.businessRulesInput);
    try {
      businessRulesResult = evaluateBusinessRules(dataset, input.businessRulesInput);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Validace (evaluateBusinessRules): ${msg}`);
      businessRulesResult = null;
    }
  }

  const explainInput: ExplainabilityInput = {
    rows: input.rows,
    ...(businessRulesResult !== null ? { businessRules: businessRulesResult } : {}),
  };

  let calculation: AuditProtocolCalculation = { ok: false, error: "Neprovedeno" };
  try {
    const preparedRows = input.rows.map((row) =>
      buildCalculationPayload(dataset, row, {
        oborCountInClass: row.oborCountInClass ?? 1,
        isArt82TalentClass: row.isArt82TalentClass ?? false,
      }),
    );
    const batch = calculateSchoolPhmax(dataset, preparedRows);
    calculation = { ok: true, batch };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    calculation = { ok: false, error: msg };
    errors.push(`Výpočet (calculateSchoolPhmax): ${msg}`);
  }

  let explanation: AuditProtocolExplanation = { ok: false, error: "Neprovedeno" };
  let legal: AuditProtocolLegal = emptyLegal();

  try {
    const data = explainFullPhmaxDecision(dataset, explainInput);
    explanation = { ok: true, data };
    legal = collectLegalFromExplanation(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    explanation = { ok: false, error: msg };
    errors.push(`Explainability (explainFullPhmaxDecision): ${msg}`);
  }

  const meta: AuditProtocolMeta = {
    protocolVersion: AUDIT_PROTOCOL_VERSION,
    createdAtIso: new Date().toISOString(),
    datasetMeta: deepSnapshot(dataset.meta ?? {}),
  };

  const validation: AuditProtocolValidation = {
    source: validationSource,
    businessRulesInputSnapshot,
    businessRulesResult,
  };

  return {
    meta,
    input: inputSnapshot,
    validation,
    calculation,
    explanation,
    legal,
    errors,
  };
}

/*
 * --- Příklad použití ---
 *
 * import { phmaxSsDataset } from "./phmax-ss-dataset";
 * import { createAuditProtocol } from "./phmax-audit";
 *
 * const protocol = createAuditProtocol(phmaxSsDataset, {
 *   rows: [
 *     { code: "23-51-H/01", averageStudents: 20, classCount: 1, form: "denni", oborCountInClass: 1 },
 *   ],
 *   businessRulesInput: { obory: [{ code: "23-51-H/01", form: "denni" }] },
 * });
 *
 * console.log(protocol.calculation.ok && protocol.calculation.batch.summary.totalPhmax);
 * console.log(protocol.explanation.ok && protocol.explanation.data.summary.narrative);
 * console.log(protocol.legal.consolidated);
 */
