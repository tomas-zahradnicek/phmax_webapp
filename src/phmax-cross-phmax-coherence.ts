import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";
import { computeSdPhmaxTotalFromSnapshot } from "./sd/sd-compute-phmax-total-from-snapshot";
import { computeSsPhmaxTotalFromSnapshot } from "./ss/ss-compute-phmax-total-from-snapshot";
import { computePvPhmaxTotalFromSnapshot } from "./pv/pv-compute-phmax-total-from-snapshot";
import { computeZsPhmaxTotalFromSnapshot } from "./zs/zs-compute-phmax-total-from-snapshot";

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

function warnMismatch(label: string, dashboardValue: number, otherLabel: string, otherValue: number): string {
  return `${label}: v přehledu ${dashboardValue} h/týd., ${otherLabel} ${otherValue} h/týd. – otevřete modul a uložte znovu.`;
}

/** Upozornění na nesoulad souhrnu v přehledu a přepočtu v modulu. */
export function crossPhmaxAuditCoherenceWarnings(
  summary: CrossPhmaxSummary,
  moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"],
): readonly string[] {
  const warnings: string[] = [];

  const checkPv = () => {
    const slice = summary.slices.find((s) => s.id === "pv");
    if (slice?.phmax == null) return;
    const snapshot = moduleSnapshots.pv;
    const computed = computePvPhmaxTotalFromSnapshot(snapshot);
    const audit = readAuditTotals(snapshot);
    if (computed != null && audit?.totalPhmax != null && audit.tab === "phmax") {
      if (Math.abs(audit.totalPhmax - computed) > 0.05) {
        warnings.push(
          `PV: uložený součet (${audit.totalPhmax}) se liší od přepočtu z řádků (${computed}) – otevřete PV a uložte stav.`,
        );
      }
    }
    if (computed != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("PV", slice.phmax, "přepočet z řádků", computed));
    } else if (audit?.totalPhmax != null && audit.tab === "phmax" && Math.abs(slice.phmax - audit.totalPhmax) > 0.05) {
      warnings.push(warnMismatch("PV", slice.phmax, "uložený součet", audit.totalPhmax));
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
        `ZŠ: uložený součet (${audit.totalPhmax}) se liší od přepočtu z vstupů (${computed}) – otevřete ZŠ a uložte stav.`,
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
        `ŠD: uložený součet (${audit.totalPhmax}) se liší od přepočtu z vstupů (${computed}) – otevřete ŠD a uložte stav.`,
      );
    }
    if (slice?.phmax != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("ŠD", slice.phmax, "přepočet z vstupů", computed));
    }
  };

  const checkSs = () => {
    const slice = summary.slices.find((s) => s.id === "ss");
    const snapshot = moduleSnapshots.ss;
    const computed = computeSsPhmaxTotalFromSnapshot(snapshot);
    const audit = readAuditTotals(snapshot);
    if (computed == null) return;
    if (audit?.totalPhmax != null && audit.tab === "phmax" && Math.abs(audit.totalPhmax - computed) > 0.05) {
      warnings.push(
        `SŠ: uložený součet (${audit.totalPhmax}) se liší od přepočtu z řádků (${computed}) – otevřete SŠ a uložte stav.`,
      );
    }
    if (slice?.phmax != null && Math.abs(slice.phmax - computed) > 0.05) {
      warnings.push(warnMismatch("SŠ", slice.phmax, "přepočet z řádků", computed));
    }
  };

  checkPv();
  checkZs();
  checkSd();
  checkSs();

  return warnings;
}
