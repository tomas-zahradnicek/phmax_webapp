/**
 * Porovnání variant nad jednotným `PhmaxProductAuditProtocol` (PV, ŠD, ZŠ, SŠ).
 */
import type { PhmaxProductAuditProtocol, PhmaxProductId } from "./phmax-product-audit-types";

export type CompareProductVariant = {
  id: string;
  label: string;
  protocol: PhmaxProductAuditProtocol;
};

export type CompareProductVariantMetrics = {
  variantId: string;
  variantLabel: string;
  product: PhmaxProductId;
  totalPrimary: number | null;
  totalSecondary: number | null;
  validationOk: boolean | null;
};

export type CompareProductVariantsResult = {
  variants: CompareProductVariant[];
  metrics: CompareProductVariantMetrics[];
  comparison: {
    totalPrimary: Array<{ variantId: string; variantLabel: string; value: number | null }>;
    totalSecondary: Array<{ variantId: string; variantLabel: string; value: number | null }>;
  };
  differences: string[];
  recommendation: string;
};

function formatHours(value: number): string {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function metricsFromProtocol(v: CompareProductVariant): CompareProductVariantMetrics {
  let totalPrimary: number | null = null;
  let totalSecondary: number | null = null;
  const p = v.protocol;
  if (p.calculation.ok) {
    totalPrimary = p.calculation.totalPrimary;
    totalSecondary = p.calculation.totalSecondary ?? null;
  }
  return {
    variantId: v.id,
    variantLabel: v.label,
    product: p.meta.product,
    totalPrimary,
    totalSecondary,
    validationOk: p.validation.ok,
  };
}

function buildDifferences(metrics: CompareProductVariantMetrics[]): string[] {
  const lines: string[] = [];
  if (metrics.length < 2) return lines;

  const base = metrics[0];
  for (let i = 1; i < metrics.length; i++) {
    const cur = metrics[i];
    const labelA = base.variantLabel || base.variantId;
    const labelB = cur.variantLabel || cur.variantId;

    if (
      base.totalPrimary !== null &&
      cur.totalPrimary !== null &&
      base.totalPrimary !== cur.totalPrimary
    ) {
      const d = cur.totalPrimary - base.totalPrimary;
      lines.push(
        `PHmax (primární metrika): „${labelB}“ oproti „${labelA}“ ${d >= 0 ? "+" : ""}${formatHours(d)} h (celkem ${formatHours(cur.totalPrimary)} vs ${formatHours(base.totalPrimary)}).`,
      );
    }
    if (
      base.totalSecondary !== null &&
      cur.totalSecondary !== null &&
      base.totalSecondary !== cur.totalSecondary
    ) {
      lines.push(
        `Sekundární metrika (např. třídy/oddělení): „${labelB}“ ${cur.totalSecondary} vs „${labelA}“ ${base.totalSecondary}.`,
      );
    }
    if (
      base.validationOk !== null &&
      cur.validationOk !== null &&
      base.validationOk !== cur.validationOk
    ) {
      lines.push(
        `Validace: „${labelA}“ ${base.validationOk ? "OK" : "chyby"}, „${labelB}“ ${cur.validationOk ? "OK" : "chyby"}.`,
      );
    }
    if (base.product !== cur.product) {
      lines.push(`Produkt se liší: „${labelA}“ je ${base.product}, „${labelB}“ je ${cur.product} — srovnání může být jen orientační.`);
    }
  }
  return lines;
}

function buildRecommendation(metrics: CompareProductVariantMetrics[]): string {
  if (metrics.length === 0) {
    return "Nebyla předána žádná varianta.";
  }
  if (metrics.length === 1) {
    const m = metrics[0];
    const ph = m.totalPrimary;
    return ph !== null
      ? `Jediná varianta „${m.variantLabel}“: PHmax ${ph} h (orientační údaj).`
      : `Jediná varianta „${m.variantLabel}“: primární metrika není k dispozici.`;
  }

  const withPrimary = metrics.filter((m) => m.totalPrimary !== null) as Array<
    CompareProductVariantMetrics & { totalPrimary: number }
  >;
  if (withPrimary.length === 0) {
    return "U žádné varianty není k dispozici primární metrika (PHmax) — zkontrolujte vstupy.";
  }

  const allowedOnly = withPrimary.filter((m) => m.validationOk !== false);
  const pool = allowedOnly.length > 0 ? allowedOnly : withPrimary;
  const maxPh = Math.max(...pool.map((m) => m.totalPrimary));
  const winners = pool.filter((m) => m.totalPrimary === maxPh);
  const names = winners.map((w) => `„${w.variantLabel}“`).join(", ");

  if (winners.length === pool.length) {
    return `Varianty mají stejnou nejvyšší primární metriku (${maxPh} h) — rozhodují jiná kritéria.`;
  }

  return `Nejvyšší PHmax (${maxPh} h) v této sadě: ${names}. Doporučení je orientační — ověřte vstupy a metodiku.`;
}

/**
 * Porovná varianty, které už mají sestavený produktový protokol (libovolný mix PV/ŠD/ZŠ/SŠ).
 */
export function comparePhmaxProductVariants(variants: CompareProductVariant[]): CompareProductVariantsResult {
  const list = variants.map((v) => ({ ...v, protocol: v.protocol }));
  const metrics = list.map(metricsFromProtocol);
  const comparison = {
    totalPrimary: metrics.map((m) => ({
      variantId: m.variantId,
      variantLabel: m.variantLabel,
      value: m.totalPrimary,
    })),
    totalSecondary: metrics.map((m) => ({
      variantId: m.variantId,
      variantLabel: m.variantLabel,
      value: m.totalSecondary,
    })),
  };
  return {
    variants: list,
    metrics,
    comparison,
    differences: buildDifferences(metrics),
    recommendation: buildRecommendation(metrics),
  };
}
