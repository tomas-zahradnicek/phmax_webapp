import { computePvPhmaxTotal, type PvProvozKind } from "../phmax-pv-logic";
import { round2 } from "../phmax-zs-logic";

const PROVOZ_VALUES: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

function isPvProvoz(v: unknown): v is PvProvozKind {
  return typeof v === "string" && (PROVOZ_VALUES as readonly string[]).includes(v);
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
    const r = item as Record<string, unknown>;
    if (!isPvProvoz(r.provoz)) continue;
    const { totalPhmax } = computePvPhmaxTotal({
      provoz: r.provoz,
      classCount: typeof r.classCount === "number" ? r.classCount : 0,
      avgHoursPerDay: typeof r.avgHours === "number" ? r.avgHours : 0,
      sec16ClassCount: typeof r.sec16Count === "number" ? r.sec16Count : 0,
      languageGroupCount: typeof r.languageGroups === "number" ? r.languageGroups : 0,
    });
    if (totalPhmax != null) {
      sum += totalPhmax;
      any = true;
    }
  }
  return any ? round2(sum) : null;
}
