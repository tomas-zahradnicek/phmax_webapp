import type { CalculatorMode } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import {
  createZsProductAuditProtocol,
  parseZsSnapshotAuditTotals,
} from "../phmax-product-audit";
import { comparePhmaxProductVariants, type CompareProductVariantsResult } from "../phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "../phmax-product-audit-download";
import type { ZsTabKey } from "./zs-form-snapshot";
import type { ZsValidationIssue } from "./zs-form-validation";

export type ZsNamedSnapshotItem = {
  id: string;
  name: string;
  snapshot: Record<string, unknown>;
};

function buildZsAuditValidationIssues(warnings: string[], validationIssues: ZsValidationIssue[]) {
  return [
    ...warnings.map((w) => ({ severity: "warning" as const, message: w })),
    ...validationIssues.map((v) => ({
      severity: "info" as const,
      code: v.section,
      message: v.label,
    })),
  ];
}

function buildZsCurrentAuditProtocol(input: {
  buildSnapshot: () => Record<string, unknown>;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: string[];
  validationIssues: ZsValidationIssue[];
  narrative: string;
}) {
  return createZsProductAuditProtocol({
    formSnapshot: input.buildSnapshot(),
    totals: {
      totalPhmax: input.totalPhmax,
      breakdown: { totalPha: input.totalPha, totalPhp: input.totalPhp },
    },
    validationIssues: buildZsAuditValidationIssues(input.warnings, input.validationIssues),
    narrative: input.narrative,
  });
}

export function exportZsAuditJson(input: {
  buildSnapshot: () => Record<string, unknown>;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  tab: ZsTabKey;
  mode: CalculatorMode;
  exportLabel: string;
  warnings: string[];
  validationIssues: ZsValidationIssue[];
}): void {
  downloadPhmaxProductAuditJson(
    buildZsCurrentAuditProtocol({
      buildSnapshot: input.buildSnapshot,
      totalPhmax: input.totalPhmax,
      totalPha: input.totalPha,
      totalPhp: input.totalPhp,
      warnings: input.warnings,
      validationIssues: input.validationIssues,
      narrative: `${input.tab === "phmax" ? "PHmax" : input.tab === "pha" ? "PHAmax" : "PHPmax"} – ${MODE_CONFIG[input.mode].label}${
        input.exportLabel ? `; export: ${input.exportLabel}` : ""
      }`,
    }),
    "zs",
  );
}

export function compareZsWithNamedSnapshot(input: {
  buildSnapshot: () => Record<string, unknown>;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: string[];
  namedSnapshots: ZsNamedSnapshotItem[];
  selectedNamedId: string;
}): { ok: true; message: string } | { ok: false; message: string } {
  const item = input.namedSnapshots.find((x) => x.id === input.selectedNamedId);
  if (!item) {
    return { ok: false, message: "pick-named" };
  }
  const stored = parseZsSnapshotAuditTotals(item.snapshot);
  if (!stored) {
    return { ok: false, message: "no-audit-totals" };
  }
  const currentProtocol = buildZsCurrentAuditProtocol({
    buildSnapshot: input.buildSnapshot,
    totalPhmax: input.totalPhmax,
    totalPha: input.totalPha,
    totalPhp: input.totalPhp,
    warnings: input.warnings,
    validationIssues: [],
    narrative: "Aktuální stav",
  });
  const namedProtocol = createZsProductAuditProtocol({
    formSnapshot: {
      namedBackup: item.name,
      exportLabel: typeof item.snapshot.exportLabel === "string" ? item.snapshot.exportLabel : "",
      tabAtSave: stored.tab,
    },
    totals: {
      totalPhmax: stored.totalPhmax,
      breakdown: { totalPha: stored.totalPha, totalPhp: stored.totalPhp },
    },
    narrative: item.name,
  });
  const cmp = comparePhmaxProductVariants([
    { id: "current", label: "Aktuální stav", protocol: currentProtocol },
    { id: "named", label: item.name, protocol: namedProtocol },
  ]);
  downloadPhmaxProductCompareJson(cmp, "zs");
  return {
    ok: true,
    message: `Staženo srovnání: aktuální stav vs „${item.name}“ (JSON). Krátké doporučení: ${cmp.recommendation}`,
  };
}

export function buildZsComparePreview(input: {
  buildSnapshot: () => Record<string, unknown>;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: string[];
  namedSnapshots: ZsNamedSnapshotItem[];
  selectedNamedId: string;
}): CompareProductVariantsResult | null {
  const item = input.namedSnapshots.find((x) => x.id === input.selectedNamedId);
  if (!item) return null;
  const stored = parseZsSnapshotAuditTotals(item.snapshot);
  if (!stored) return null;
  const currentProtocol = buildZsCurrentAuditProtocol({
    buildSnapshot: input.buildSnapshot,
    totalPhmax: input.totalPhmax,
    totalPha: input.totalPha,
    totalPhp: input.totalPhp,
    warnings: input.warnings,
    validationIssues: [],
    narrative: "Aktuální stav",
  });
  const namedProtocol = createZsProductAuditProtocol({
    formSnapshot: {
      namedBackup: item.name,
      exportLabel: typeof item.snapshot.exportLabel === "string" ? item.snapshot.exportLabel : "",
      tabAtSave: stored.tab,
    },
    totals: {
      totalPhmax: stored.totalPhmax,
      breakdown: { totalPha: stored.totalPha, totalPhp: stored.totalPhp },
    },
    narrative: item.name,
  });
  return comparePhmaxProductVariants([
    { id: "current", label: "Aktuální stav", protocol: currentProtocol },
    { id: "named", label: item.name, protocol: namedProtocol },
  ]);
}
