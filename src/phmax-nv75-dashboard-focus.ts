import type { Nv75DeputyKind } from "./nv75-deputy-bank";

type Nv75LsRow = {
  id: number;
  kind: Nv75DeputyKind;
  units: number;
};

function kindUsesUnits(kind: Nv75DeputyKind): boolean {
  return kind !== "poradenske" && kind !== "skolni_klub";
}

function parseNv75Rows(raw: string | null): Nv75LsRow[] {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const rowsRaw = (parsed as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw)) return [];
  const out: Nv75LsRow[] = [];
  for (let i = 0; i < rowsRaw.length; i++) {
    const item = rowsRaw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = typeof r.kind === "string" ? (r.kind as Nv75DeputyKind) : "ms";
    const units = typeof r.units === "number" && Number.isFinite(r.units) ? Math.max(0, r.units) : 0;
    const id = typeof r.id === "number" && Number.isFinite(r.id) ? r.id : i + 1;
    out.push({ id, kind, units });
  }
  return out;
}

/** První řádek NV75 k fokusu z dashboardu – chybějící jednotky u druhu, který je vyžaduje. */
export function findFirstNv75DashboardFocusRowId(raw: string | null): number | undefined {
  const rows = parseNv75Rows(raw);
  const missingUnits = rows.find((row) => kindUsesUnits(row.kind) && row.units <= 0);
  if (missingUnits) return missingUnits.id;
  return rows[0]?.id;
}

export function nv75DashboardNeedsAttention(raw: string | null, bankTotal: number | null): boolean {
  if (bankTotal == null) return true;
  return parseNv75Rows(raw).some((row) => kindUsesUnits(row.kind) && row.units <= 0);
}

export function nv75DashboardVerdictFromLs(
  raw: string | null,
  bankTotal: number | null,
  rule: string | null,
): { tone: "ok" | "warning"; label: string; detail: string } | null {
  const rows = parseNv75Rows(raw);
  if (rows.length === 0 && bankTotal == null) return null;
  const missing = rows.filter((row) => kindUsesUnits(row.kind) && row.units <= 0).length;
  if (bankTotal == null) {
    return {
      tone: "warning",
      label: "Banka nelze spočítat",
      detail: "Zkontrolujte řádky a praktickou složku v modulu NV75.",
    };
  }
  if (missing > 0) {
    return {
      tone: "warning",
      label: "Řádky bez jednotek",
      detail: `U ${missing} řádků chybí počet jednotek (> 0) pro zvolený druh školy.`,
    };
  }
  return {
    tone: "ok",
    label: rule ? `Pravidlo ${rule}` : "Banka odpočtů",
    detail: `Banka odpočtů celkem ${bankTotal} h/týden (náhled z uloženého stavu).`,
  };
}
