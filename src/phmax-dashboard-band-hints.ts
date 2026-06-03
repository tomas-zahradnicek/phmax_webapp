import { getSdDepartmentRangeFromPupils } from "./phmax-sd-narrative";
import { buildPvDurationUpgradeHint } from "./phmax-pv-band-sensitivity";
import { computePvPhmaxTotal, type PvProvozKind } from "./phmax-pv-logic";
import { buildNv75UnitsUpgradeHint } from "./nv75-units-sensitivity";
import type { Nv75DeputyKind } from "./nv75-deputy-bank";
import { buildZsBandUpgradeHintsFromSnapshot } from "./zs/zs-band-sensitivity";

const LS_PV = "edu-cz-pv-calculator-state";
const LS_SD = "edu-cz-sd-calculator-state";
const LS_ZS = "edu-cz-zs-calculator-state";
const LS_NV75 = "edu-cz-nv75-deputy-bank-state";

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readLs(key: string): unknown {
  if (typeof localStorage === "undefined") return null;
  return safeJsonParse(localStorage.getItem(key));
}

function buildPvHintsFromLs(maxPerModule: number): string[] {
  const data = readLs(LS_PV);
  if (!data || typeof data !== "object") return [];
  const rows = (data as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return [];

  const out: string[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const provoz = r.provoz as PvProvozKind;
    const classCount = typeof r.classCount === "number" ? r.classCount : 0;
    const avgHours = typeof r.avgHours === "number" ? r.avgHours : 0;
    const label = typeof r.label === "string" ? r.label : "";
    if (!provoz || classCount < 1) continue;
    const computed = computePvPhmaxTotal({
      provoz,
      classCount,
      avgHoursPerDay: avgHours,
      sec16ClassCount: typeof r.sec16Count === "number" ? r.sec16Count : 0,
      languageGroupCount: typeof r.languageGroups === "number" ? r.languageGroups : 0,
    });
    if (computed.totalPhmax == null) continue;
    const hint = buildPvDurationUpgradeHint({ workplaceLabel: label, provoz, classCount, avgHoursPerDay: avgHours });
    if (hint) out.push(hint);
    if (out.length >= maxPerModule) break;
  }
  return out;
}

function buildSdHintsFromLs(): string[] {
  const data = readLs(LS_SD);
  if (!data || typeof data !== "object") return [];
  const pupils = typeof (data as { pupils?: unknown }).pupils === "number" ? (data as { pupils: number }).pupils : 0;
  const departments =
    typeof (data as { departments?: unknown }).departments === "number"
      ? (data as { departments: number }).departments
      : 0;
  if (pupils <= 0) return [];

  const range = getSdDepartmentRangeFromPupils(pupils);
  if (!range) return [];

  if (departments <= 0) {
    return [
      `ŠD: při ${pupils} účastnících 1. stupně metodická orientace (÷ 27) doporučuje cca ${range.recommended} oddělení – doplňte počet oddělení v modulu ŠD.`,
    ];
  }
  if (departments < range.recommended) {
    return [
      `ŠD: při ${pupils} účastnících orientace cca ${range.recommended} oddělení; máte ${departments} – vyšší PHmax může vyžadovat více oddělení (ověřte v modulu ŠD).`,
    ];
  }
  if (departments > range.maxBy20) {
    return [
      `ŠD: ${departments} oddělení při ${pupils} účastnících je nad orientačním rozmezím (cca ${range.minBy32}–${range.maxBy20}) – zkontrolujte metodiku.`,
    ];
  }
  return [];
}

function buildNv75HintsFromLs(maxPerModule: number): string[] {
  const data = readLs(LS_NV75);
  if (!data || typeof data !== "object") return [];
  const rowsRaw = (data as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw)) return [];
  const out: string[] = [];
  for (const item of rowsRaw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = r.kind as Nv75DeputyKind;
    const units = typeof r.units === "number" ? r.units : 0;
    if (!kind || units <= 0) continue;
    const hint = buildNv75UnitsUpgradeHint(kind, units, `NV75 (${kind})`);
    if (hint) out.push(hint);
    if (out.length >= maxPerModule) break;
  }
  return out;
}

/** Souhrnné nápovědy z autosave pro dashboard (orientační, ne závazný výpočet). */
export function buildDashboardBandHints(maxTotal = 8): string[] {
  const out: string[] = [
    ...buildZsBandUpgradeHintsFromSnapshot(readLs(LS_ZS), 3),
    ...buildPvHintsFromLs(2),
    ...buildSdHintsFromLs(),
    ...buildNv75HintsFromLs(2),
  ];
  return out.slice(0, maxTotal);
}
