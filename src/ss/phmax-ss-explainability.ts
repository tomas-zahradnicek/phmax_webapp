import type { Dataset } from "./phmax-ss-validator";
import type { ModeKey } from "./phmax-ss-helpers";
import type { BusinessRulesInput, BusinessRulesResult, RuleMessage } from "./phmax-ss-business-rules";
import { evaluateBusinessRules } from "./phmax-ss-business-rules";
import {
  buildCalculationPayload,
  calculatePhmaxRow,
  calculateSchoolPhmax,
  type ServiceRowInput,
  type ServiceResolvedRow,
} from "./phmax-ss-service";

export type ExplainabilityRowInput = ServiceRowInput & {
  oborCountInClass?: number;
  isArt82TalentClass?: boolean;
};

export type ExplainabilityInput = {
  rows: ExplainabilityRowInput[];
  /**
   * Výsledek `evaluateBusinessRules` pro danou třídu / seskupení oborů.
   * Pokud chybí, souhrn nespojuje kontrolu pravidel s výpočtem — použijte tabulku „Kontrola pravidel“ nebo předejte výsledek ručně.
   */
  businessRules?: BusinessRulesResult;
};

export type ExplainabilityMessage = {
  title: string;
  body: string;
  severity: "info" | "warning" | "error";
  legalBasis?: string[];
};

export type ExplainabilityRow = ServiceResolvedRow & {
  explanation: {
    shortSummary: string;
    steps: string[];
    messages: ExplainabilityMessage[];
    legalBasis: string[];
  };
};

export type ExplainabilityResult = {
  allowed: boolean;
  businessRules: BusinessRulesResult;
  businessRulesFromInput: boolean;
  rows: ExplainabilityRow[];
  summary: {
    totalPhmax: number;
    totalClasses: number;
    rowCount: number;
    narrative: string;
    messages: ExplainabilityMessage[];
    legalBasis: string[];
  };
};

function modeLabel(mode: ModeKey): string {
  switch (mode) {
    case "oneObor":
      return "jednooborová třída";
    case "twoObory":
      return "víceoborová třída se 2 obory";
    case "threeObory":
      return "víceoborová třída se 3 obory";
    case "twoObory82":
      return "víceoborová třída skupiny 82 se 2 obory";
    case "threePlusObory82":
      return "víceoborová třída skupiny 82 se 3 a více obory";
    default:
      return mode;
  }
}

function formLabel(form: string): string {
  switch (form) {
    case "denni":
      return "denní forma";
    case "vecerni":
      return "večerní forma";
    case "kombinovana":
      return "kombinovaná forma";
    case "dalkova":
      return "dálková forma";
    case "distancni":
      return "distanční forma";
    default:
      return form;
  }
}

function coefficientNarrative(form: string, coefficient: number): string {
  if (form === "denni") {
    return "Denní forma vzdělávání nepoužívá redukční koeficient.";
  }
  return `Na výsledek byl použit koeficient ${coefficient} pro ${formLabel(form)}.`;
}

function businessRulesToMessages(result: BusinessRulesResult): ExplainabilityMessage[] {
  const messages: ExplainabilityMessage[] = [];

  for (const item of result.errors) {
    messages.push({
      title: "Nepřípustná kombinace",
      body: item.message,
      severity: "error",
    });
  }

  for (const item of result.warnings) {
    messages.push({
      title: "Upozornění",
      body: item.message,
      severity: "warning",
    });
  }

  for (const item of result.info) {
    messages.push({
      title: "Informace",
      body: item.message,
      severity: "info",
    });
  }

  return messages;
}

function legalBasisForRow(row: ServiceResolvedRow): string[] {
  const basis = ["NV č. 123/2018 Sb., § 1 a příloha č. 1"];

  if (row.form !== "denni") {
    basis.push("NV č. 123/2018 Sb., § 2");
  }

  if (row.modeKey !== "oneObor") {
    basis.push("NV č. 123/2018 Sb., § 4");
  }

  if (row.modeKey === "twoObory82" || row.modeKey === "threePlusObory82") {
    basis.push("Vyhláška č. 13/2005 Sb., § 2c");
  }

  return basis;
}

function explainRow(row: ServiceResolvedRow): ExplainabilityRow {
  const messages: ExplainabilityMessage[] = [
    {
      title: "Zvolený režim výpočtu",
      body: `Pro obor ${row.code} byl použit režim ${modeLabel(row.modeKey)}.`,
      severity: "info",
      legalBasis:
        row.modeKey === "oneObor"
          ? ["NV č. 123/2018 Sb., § 1 a příloha č. 1"]
          : ["NV č. 123/2018 Sb., § 4"],
    },
    {
      title: "Pásmo počtu žáků",
      body: `Průměrný počet žáků ${row.averageStudents} spadá do pásma „${row.intervalLabel}“.`,
      severity: "info",
      legalBasis: ["NV č. 123/2018 Sb., příloha č. 1"],
    },
    {
      title: "PHmax na třídu",
      body: `Z tabulky vychází PHmax ${row.phmaxPerClass} hodin na 1 třídu.`,
      severity: "info",
      legalBasis: ["NV č. 123/2018 Sb., příloha č. 1"],
    },
    {
      title: "Forma vzdělávání",
      body: coefficientNarrative(row.form, row.coefficient),
      severity: row.form === "denni" ? "info" : "info",
      legalBasis: ["NV č. 123/2018 Sb., § 2"],
    },
    {
      title: "Výsledek za řádek",
      body: `Po zohlednění počtu tříd (${row.classCount}) vychází celkový PHmax ${row.totalPhmax} hodin.`,
      severity: "info",
      legalBasis: ["NV č. 123/2018 Sb., § 1 odst. 3"],
    },
  ];

  return {
    ...row,
    explanation: {
      shortSummary: `${row.name}: ${row.totalPhmax} h (${modeLabel(row.modeKey)}, ${formLabel(row.form)})`,
      steps: [
        `1. Určen obor ${row.code} – ${row.name}.`,
        `2. Zvolen režim ${modeLabel(row.modeKey)}.`,
        `3. Průměr ${row.averageStudents} žáků zařazen do pásma „${row.intervalLabel}“.`,
        `4. Z tabulky vychází ${row.phmaxPerClass} hodin na třídu.`,
        `5. Použit koeficient ${row.coefficient}.`,
        `6. Výsledek po vynásobení ${row.classCount} třídami je ${row.totalPhmax} hodin.`,
      ],
      messages,
      legalBasis: legalBasisForRow(row),
    },
  };
}

const EMPTY_BUSINESS_RULES: BusinessRulesResult = {
  allowed: true,
  errors: [],
  warnings: [],
  info: [],
};

function prefixRuleMessages(msgs: readonly RuleMessage[], prefix: string): RuleMessage[] {
  if (!prefix) return [...msgs];
  return msgs.map((m) => ({ ...m, message: `${prefix}${m.message}` }));
}

/** Jedna třída / řádek formuláře — výsledek `evaluateBusinessRules` pro stejný řádek jako výpočet PHmax. */
export type LabeledBusinessRulesResult = {
  label: string;
  result: BusinessRulesResult;
};

/**
 * Sloučí výsledky kontroly pravidel z více řádků (každý řádek = jedna třída s jedním nebo více obory).
 * `allowed` je true jen pokud jsou přípustné všechny předané výsledky. Zprávy mají prefix `[označení řádku]`.
 */
export function mergeBusinessRulesResults(parts: LabeledBusinessRulesResult[]): BusinessRulesResult | null {
  if (parts.length === 0) return null;
  const out: BusinessRulesResult = {
    allowed: parts.every(({ result }) => result.allowed),
    errors: [],
    warnings: [],
    info: [],
  };
  for (const { label, result } of parts) {
    const prefix = label.trim() ? `[${label.trim()}] ` : "";
    out.errors.push(...prefixRuleMessages(result.errors, prefix));
    out.warnings.push(...prefixRuleMessages(result.warnings, prefix));
    out.info.push(...prefixRuleMessages(result.info, prefix));
  }
  const rec = parts.map((p) => p.result.recommendedMode).find((x) => x !== undefined);
  const sug = parts.map((p) => p.result.suggestedComputation).find((x) => x !== undefined);
  if (rec !== undefined) out.recommendedMode = rec;
  if (sug !== undefined) out.suggestedComputation = sug;
  return out;
}

/**
 * Součet PHmax přes více řádků + volitelně business rules (jedna třída nebo sloučení přes `mergeBusinessRulesResults`).
 */
export function explainFullPhmaxDecision(dataset: Dataset, input: ExplainabilityInput): ExplainabilityResult {
  const businessRulesFromInput = input.businessRules !== undefined;
  const businessRules = input.businessRules ?? EMPTY_BUSINESS_RULES;

  const preparedRows = input.rows.map((row) =>
    buildCalculationPayload(dataset, row, {
      oborCountInClass: row.oborCountInClass ?? 1,
      isArt82TalentClass: row.isArt82TalentClass ?? false,
    }),
  );

  const calc = calculateSchoolPhmax(dataset, preparedRows);
  const explainedRows = calc.rows.map((row) => explainRow(row));
  const ruleMessages = businessRulesToMessages(businessRules);

  const summaryMessages: ExplainabilityMessage[] = [
    ...ruleMessages,
    {
      title: "Součet školy",
      body: `Celkový PHmax za ${calc.summary.rowCount} řádků a ${calc.summary.totalClasses} tříd činí ${calc.summary.totalPhmax} hodin.`,
      severity: "info",
      legalBasis: ["NV č. 123/2018 Sb., § 1 odst. 3"],
    },
  ];

  const narrative = businessRulesFromInput
    ? businessRules.allowed
      ? `Výpočet je podle předaných pravidel přípustný. Celkový PHmax školy činí ${calc.summary.totalPhmax} hodin.`
      : `Výpočet obsahuje nepřípustnou kombinaci vstupů. Přesto byl spočten technický výstup ${calc.summary.totalPhmax} hodin — považujte ho jen za orientační, dokud neodstraníte chyby ve vstupu.`
    : `Součet ${calc.summary.rowCount} výpočetních řádků: celkový PHmax ${calc.summary.totalPhmax} hodin (${calc.summary.totalClasses} tříd). Kontrolu více oborů v jedné třídě najdete v tabulce „Kontrola pravidel“ níže.`;

  return {
    allowed: businessRules.allowed,
    businessRules,
    businessRulesFromInput,
    rows: explainedRows,
    summary: {
      totalPhmax: calc.summary.totalPhmax,
      totalClasses: calc.summary.totalClasses,
      rowCount: calc.summary.rowCount,
      narrative,
      messages: summaryMessages,
      legalBasis: [
        "NV č. 123/2018 Sb., § 1–4 a příloha č. 1",
        "Vyhláška č. 13/2005 Sb., § 2a–2c",
        "Vyhláška č. 145/2018 Sb.",
        "Vyhláška č. 248/2019 Sb. (pro § 16 odst. 9)",
      ],
    },
  };
}

export function explainSingleRow(dataset: Dataset, row: ExplainabilityRowInput): ExplainabilityRow {
  const prepared = buildCalculationPayload(dataset, row, {
    oborCountInClass: row.oborCountInClass ?? 1,
    isArt82TalentClass: row.isArt82TalentClass ?? false,
  });

  const calc = calculatePhmaxRow(dataset, prepared);
  return explainRow(calc.row);
}

/** Pomocný vstup pro `evaluateBusinessRules` z jednoho výpočetního řádku (jen kódy, bez počtů žáků). */
export function businessRulesInputFromExplainRows(rows: ExplainabilityRowInput[]): BusinessRulesInput {
  return {
    obory: rows.map((r) => ({
      code: r.code,
      studentsInClass: r.averageStudents,
      form: r.form ?? "denni",
    })),
  };
}

/**
 * Vyhodnotí pravidla pro seskupení kódů z řádků (zjednodušení: všechny kódy jako jedna třída).
 * Pro přesné mapování „jeden řádek formuláře = jedna třída“ použijte `evaluateBusinessRules` s `buildBusinessRuleOboryForRow`.
 */
export function explainFullPhmaxWithAutoRules(dataset: Dataset, input: Omit<ExplainabilityInput, "businessRules">): ExplainabilityResult {
  const brIn = businessRulesInputFromExplainRows(input.rows);
  const businessRules = evaluateBusinessRules(dataset, brIn);
  return explainFullPhmaxDecision(dataset, { ...input, businessRules });
}
