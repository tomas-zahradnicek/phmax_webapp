import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";
import { computeSdPhmaxTotalFromSnapshot } from "./sd/sd-compute-phmax-total-from-snapshot";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";
import { computePvPhmaxTotal } from "./phmax-pv-logic";

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

function computePvPhmaxFromSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const rows = (snapshot as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return null;
  let sum = 0;
  let any = false;
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const provoz = r.provoz;
    if (typeof provoz !== "string") continue;
    const { totalPhmax } = computePvPhmaxTotal({
      provoz: provoz as "polodenni" | "celodenni" | "internat" | "zdravotnicke",
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
  return any ? Math.round((sum + Number.EPSILON) * 100) / 100 : null;
}

function warnMismatch(label: string, dashboardValue: number, otherLabel: string, otherValue: number): string {
  return `${label}: dashboard Σ (${dashboardValue}) ≠ ${otherLabel} (${otherValue}) – uložte modul znovu nebo obnovte přehled.`;
}

/** Upozornění na nesoulad KPI / přepočtu vs. auditní součet v autosave. */
export function crossPhmaxAuditCoherenceWarnings(
  summary: CrossPhmaxSummary,
  moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"],
): readonly string[] {
  const warnings: string[] = [];

  const checkPv = () => {
    const slice = summary.slices.find((s) => s.id === "pv");
    if (slice?.phmax == null) return;
    const snapshot = moduleSnapshots.pv;
    const computed = computePvPhmaxFromSnapshot(snapshot);
    const audit = readAuditTotals(snapshot);
    if (computed != null && audit?.totalPhmax != null && audit.tab === "phmax") {
      if (Math.abs(audit.totalPhmax - computed) > 0.05) {
        warnings.push(
          `PV: audit autosave (${audit.totalPhmax}) ≠ přepočet z řádků (${computed}) – otevřete PV a uložte stav.`,
        );
      }
    }
    if (computed != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("PV", slice.phmax, "přepočet z řádků", computed));
    } else if (audit?.totalPhmax != null && audit.tab === "phmax" && Math.abs(slice.phmax - audit.totalPhmax) > 0.05) {
      warnings.push(warnMismatch("PV", slice.phmax, "audit autosave", audit.totalPhmax));
    }
  };

  const checkZs = () => {
    const slice = summary.slices.find((s) => s.id === "zs");
    const snapshot = moduleSnapshots.zs;
    const computed = computeZsPhmaxTotalFromSnapshot(snapshot);
    const audit = readAuditTotals(snapshot);
    if (computed == null) return;
    if (audit?.totalPhmax != null && audit.tab === "phmax" && Math.abs(audit.totalPhmax - computed) > 0.05) {
      warnings.push(
        `ZŠ: audit autosave (${audit.totalPhmax}) ≠ přepočet z vstupů (${computed}) – otevřete ZŠ a uložte stav.`,
      );
    }
    if (slice?.phmax != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("ZŠ", slice.phmax, "přepočet z vstupů", computed));
    }
  };

  const checkSd = () => {
    const slice = summary.slices.find((s) => s.id === "sd");
    const snapshot = moduleSnapshots.sd;
    const computed = computeSdPhmaxTotalFromSnapshot(snapshot);
    const audit = readAuditTotals(snapshot);
    if (computed == null) return;
    if (audit?.totalPhmax != null && audit.tab === "phmax" && Math.abs(audit.totalPhmax - computed) > 0.05) {
      warnings.push(
        `ŠD: audit autosave (${audit.totalPhmax}) ≠ přepočet z vstupů (${computed}) – otevřete ŠD a uložte stav.`,
      );
    }
    if (slice?.phmax != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("ŠD", slice.phmax, "přepočet z vstupů", computed));
    }
  };

  const checkLegacyAudit = (id: "ss", label: string) => {
    const slice = summary.slices.find((s) => s.id === id);
    if (slice?.phmax == null) return;
    const audit = readAuditTotals(moduleSnapshots[id]);
    if (!audit?.totalPhmax || audit.tab !== "phmax") return;
    if (Math.abs(audit.totalPhmax - slice.phmax) > 0.05) {
      warnings.push(warnMismatch(label, slice.phmax, "audit autosave", audit.totalPhmax));
    }
  };

  checkPv();
  checkZs();
  checkSd();
  checkLegacyAudit("ss", "SŠ");

  return warnings;
}
