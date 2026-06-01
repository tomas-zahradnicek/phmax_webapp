import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";

type AuditTotals = { totalPhmax?: number; tab?: string };

function readAuditTotals(snapshot: unknown): AuditTotals | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const t = (snapshot as { _phmaxAuditTotals?: unknown })._phmaxAuditTotals;
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  return {
    totalPhmax: typeof o.totalPhmax === "number" ? o.totalPhmax : undefined,
    tab: typeof o.tab === "string" ? o.tab : undefined,
  };
}

/** Upozornění, když KPI na dashboardu nesedí s auditním součtem v autosave modulu. */
export function crossPhmaxAuditCoherenceWarnings(
  summary: CrossPhmaxSummary,
  moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"],
): readonly string[] {
  const warnings: string[] = [];
  const check = (id: "zs" | "pv" | "sd" | "ss", label: string) => {
    const slice = summary.slices.find((s) => s.id === id);
    if (slice?.phmax == null) return;
    const audit = readAuditTotals(moduleSnapshots[id]);
    if (!audit?.totalPhmax || audit.tab !== "phmax") return;
    if (Math.abs(audit.totalPhmax - slice.phmax) > 0.05) {
      warnings.push(
        `${label}: dashboard Σ (${slice.phmax}) ≠ audit autosave (${audit.totalPhmax}) – uložte modul znovu nebo obnovte přehled.`,
      );
    }
  };
  check("zs", "ZŠ");
  check("pv", "PV");
  check("sd", "ŠD");
  check("ss", "SŠ");
  return warnings;
}
