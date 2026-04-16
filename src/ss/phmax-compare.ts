/**
 * Porovnání variant PHmax SŠ — každá varianta = jeden auditní protokol (`createAuditProtocol`).
 */
import type { Dataset } from "./phmax-ss-validator";
import { createAuditProtocol, type AuditProtocol, type AuditProtocolInput } from "./phmax-audit";

export type CompareVariant = {
  id: string;
  label: string;
  input: AuditProtocolInput;
};

/** Metriky jedné varianty pro tabulku / UI. */
export type CompareVariantMetrics = {
  variantId: string;
  variantLabel: string;
  totalPhmax: number | null;
  totalClasses: number | null;
  rowCount: number | null;
  /** Z validační části protokolu; `null` pokud validace neproběhla. */
  rulesAllowed: boolean | null;
  /** Z explainability, pokud je k dispozici. */
  explanationAllowed: boolean | null;
};

export type CompareVariantsResult = {
  /** Jedna položka na variantu včetně plného protokolu. */
  variants: Array<{ id: string; label: string; protocol: AuditProtocol }>;
  metrics: CompareVariantMetrics[];
  comparison: {
    totalPhmax: Array<{ variantId: string; variantLabel: string; value: number | null }>;
    totalClasses: Array<{ variantId: string; variantLabel: string; value: number | null }>;
  };
  /** Lidsky čitelné rozdíly (řádky). */
  differences: string[];
  /** Jednovětý návrh, kterou variantu z hlediska PHmax zvážit (ne právní závěr). */
  recommendation: string;
};

function formatHours(value: number): string {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function metricsFromProtocol(v: CompareVariant, protocol: AuditProtocol): CompareVariantMetrics {
  let totalPhmax: number | null = null;
  let totalClasses: number | null = null;
  let rowCount: number | null = null;
  let explanationAllowed: boolean | null = null;

  if (protocol.explanation.ok) {
    totalPhmax = protocol.explanation.data.summary.totalPhmax;
    totalClasses = protocol.explanation.data.summary.totalClasses;
    rowCount = protocol.explanation.data.summary.rowCount;
    explanationAllowed = protocol.explanation.data.allowed;
  } else if (protocol.calculation.ok) {
    totalPhmax = protocol.calculation.batch.summary.totalPhmax;
    totalClasses = protocol.calculation.batch.summary.totalClasses;
    rowCount = protocol.calculation.batch.summary.rowCount;
  }

  const rulesAllowed =
    protocol.validation.businessRulesResult !== null
      ? protocol.validation.businessRulesResult.allowed
      : null;

  return {
    variantId: v.id,
    variantLabel: v.label,
    totalPhmax,
    totalClasses,
    rowCount,
    rulesAllowed,
    explanationAllowed,
  };
}

function buildDifferences(metrics: CompareVariantMetrics[]): string[] {
  const lines: string[] = [];
  if (metrics.length < 2) return lines;

  const base = metrics[0];
  for (let i = 1; i < metrics.length; i++) {
    const cur = metrics[i];
    const labelA = base.variantLabel || base.variantId;
    const labelB = cur.variantLabel || cur.variantId;

    if (base.totalPhmax !== null && cur.totalPhmax !== null && base.totalPhmax !== cur.totalPhmax) {
      const d = cur.totalPhmax - base.totalPhmax;
      lines.push(
        `PHmax: „${labelB}“ oproti „${labelA}“ ${d >= 0 ? "+" : ""}${formatHours(d)} h (celkem ${formatHours(cur.totalPhmax)} vs ${formatHours(base.totalPhmax)}).`,
      );
    }
    if (base.totalClasses !== null && cur.totalClasses !== null && base.totalClasses !== cur.totalClasses) {
      lines.push(
        `Počet tříd (součet řádků): „${labelB}“ ${cur.totalClasses} vs „${labelA}“ ${base.totalClasses}.`,
      );
    }
    if (base.rowCount !== null && cur.rowCount !== null && base.rowCount !== cur.rowCount) {
      lines.push(`Počet výpočetních řádků: „${labelB}“ ${cur.rowCount} vs „${labelA}“ ${base.rowCount}.`);
    }
    if (base.rulesAllowed !== null && cur.rulesAllowed !== null && base.rulesAllowed !== cur.rulesAllowed) {
      lines.push(
        `Kontrola pravidel: „${labelA}“ ${base.rulesAllowed ? "OK" : "chyby"}, „${labelB}“ ${cur.rulesAllowed ? "OK" : "chyby"}.`,
      );
    }
  }
  return lines;
}

function buildRecommendation(metrics: CompareVariantMetrics[]): string {
  if (metrics.length === 0) {
    return "Nebyla předána žádná varianta.";
  }
  if (metrics.length === 1) {
    const m = metrics[0];
    const ph = m.totalPhmax;
    return ph !== null
      ? `Jediná varianta „${m.variantLabel}“: PHmax ${ph} h (orientační údaj).`
      : `Jediná varianta „${m.variantLabel}“: výpočet PHmax se nepodařil dokončit.`;
  }

  const withPhmax = metrics.filter((m) => m.totalPhmax !== null) as Array<CompareVariantMetrics & { totalPhmax: number }>;
  if (withPhmax.length === 0) {
    return "U žádné varianty nelze spočítat PHmax — zkontrolujte vstupy a dataset.";
  }

  const allowedOnly = withPhmax.filter((m) => m.rulesAllowed !== false && m.explanationAllowed !== false);
  const pool = allowedOnly.length > 0 ? allowedOnly : withPhmax;
  const maxPhmax = Math.max(...pool.map((m) => m.totalPhmax));
  const winners = pool.filter((m) => m.totalPhmax === maxPhmax);
  const names = winners.map((w) => `„${w.variantLabel}“`).join(", ");

  if (winners.length === pool.length) {
    return `Varianty mají stejný nejvyšší PHmax (${maxPhmax} h) v porovnávané množině — rozhodují jiná kritéria (např. naplnění tříd, pravidla).`;
  }

  return `Nejvyšší PHmax (${maxPhmax} h) v této sadě: ${names}. Doporučení je čistě orientační — vždy ověřte vstupy a metodiku.`;
}

/**
 * Pro každou variantu vytvoří auditní protokol a vrátí srovnání součtů, rozdílů a krátké doporučení.
 */
export function compareVariants(dataset: Dataset, variants: CompareVariant[]): CompareVariantsResult {
  const list = variants.map((v) => ({
    id: v.id,
    label: v.label,
    protocol: createAuditProtocol(dataset, v.input),
  }));

  const metrics = variants.map((v, i) => metricsFromProtocol(v, list[i].protocol));

  const comparison = {
    totalPhmax: metrics.map((m) => ({
      variantId: m.variantId,
      variantLabel: m.variantLabel,
      value: m.totalPhmax,
    })),
    totalClasses: metrics.map((m) => ({
      variantId: m.variantId,
      variantLabel: m.variantLabel,
      value: m.totalClasses,
    })),
  };

  const differences = buildDifferences(metrics);
  const recommendation = buildRecommendation(metrics);

  return {
    variants: list,
    metrics,
    comparison,
    differences,
    recommendation,
  };
}

/*
 * --- Příklad použití ---
 *
 * import { phmaxSsDataset } from "./phmax-ss-dataset";
 * import { compareVariants } from "./phmax-compare";
 *
 * const cmp = compareVariants(phmaxSsDataset, [
 *   {
 *     id: "a",
 *     label: "Varianta A — denní",
 *     input: {
 *       rows: [{ code: "23-51-H/01", averageStudents: 18, classCount: 2, form: "denni", oborCountInClass: 1 }],
 *     },
 *   },
 *   {
 *     id: "b",
 *     label: "Varianta B — večerní",
 *     input: {
 *       rows: [{ code: "23-51-H/01", averageStudents: 18, classCount: 2, form: "vecerni", oborCountInClass: 1 }],
 *     },
 *   },
 * ]);
 *
 * console.log(cmp.comparison.totalPhmax);
 * console.log(cmp.differences);
 * console.log(cmp.recommendation);
 */
