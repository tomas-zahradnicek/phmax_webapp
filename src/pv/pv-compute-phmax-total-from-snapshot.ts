import { computePv1d3Reduction } from "../phmax-pv-1d3-reduction";
import { computePvPhmaxTotal, type PvProvozKind } from "../phmax-pv-logic";
import { round2 } from "../phmax-zs-logic";

const PROVOZ_VALUES: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

function isPvProvoz(v: unknown): v is PvProvozKind {
  return typeof v === "string" && (PROVOZ_VALUES as readonly string[]).includes(v);
}

function pvEffectivePhmaxFromRow(r: Record<string, unknown>): number | null {
  if (!isPvProvoz(r.provoz)) return null;
  const { totalPhmax: basePhmax } = computePvPhmaxTotal({
    provoz: r.provoz,
    classCount: typeof r.classCount === "number" ? r.classCount : 0,
    avgHoursPerDay: typeof r.avgHours === "number" ? r.avgHours : 0,
    sec16ClassCount: typeof r.sec16Count === "number" ? r.sec16Count : 0,
    languageGroupCount: typeof r.languageGroups === "number" ? r.languageGroups : 0,
  });
  if (basePhmax == null) return null;
  const reduction1d3 = computePv1d3Reduction(basePhmax, {
    actualChildren: typeof r.pv1dActualChildren === "number" && r.pv1dActualChildren > 0 ? r.pv1dActualChildren : undefined,
    minimumChildren: typeof r.pv1dMinimumChildren === "number" && r.pv1dMinimumChildren > 0 ? r.pv1dMinimumChildren : undefined,
    kuPhmaxCap: typeof r.pv1dKuPhmaxCap === "number" && r.pv1dKuPhmaxCap > 0 ? r.pv1dKuPhmaxCap : undefined,
    kuDecisionRef: typeof r.pv1dKuDecisionRef === "string" && r.pv1dKuDecisionRef.trim() ? r.pv1dKuDecisionRef.trim() : undefined,
    exemptionConfirmed: Boolean(r.pv1dExemption),
  });
  return reduction1d3?.status === "reduced" ? reduction1d3.phmaxAfter : basePhmax;
}

/** Přepočet PHmax z PV autosave – stejná logika jako na stránce PV a v koherenci. */
export function computePvPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const rows = (snapshot as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return null;
  let sum = 0;
  let any = false;
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const effectivePhmax = pvEffectivePhmaxFromRow(item as Record<string, unknown>);
    if (effectivePhmax != null) {
      sum += effectivePhmax;
      any = true;
    }
  }
  return any ? round2(sum) : null;
}
