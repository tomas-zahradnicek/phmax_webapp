import type { ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";
import type { DashboardFocusOptions } from "./phmax-dashboard-focus";

type SdDeptRow = { kind: "regular" | "special"; participants: number };

export type SdDashboardSnapshot = {
  pupils: number;
  departments: number;
  inputMode: "summary" | "detail";
  detailDepartments: SdDeptRow[];
};

export function parseSdDashboardSnapshot(raw: string | null): SdDashboardSnapshot | null {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const r = parsed as Record<string, unknown>;
  const pupils = r.pupils;
  const departments = r.departments;
  if (typeof pupils !== "number" || !Number.isFinite(pupils) || pupils < 0) return null;
  if (typeof departments !== "number" || !Number.isFinite(departments) || departments < 1) return null;
  const inputMode = r.inputMode === "detail" ? "detail" : "summary";
  const detailDepartments: SdDeptRow[] = Array.isArray(r.detailDepartments)
    ? r.detailDepartments
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          if (o.kind !== "regular" && o.kind !== "special") return null;
          if (typeof o.participants !== "number" || !Number.isFinite(o.participants) || o.participants < 0) return null;
          return { kind: o.kind, participants: o.participants };
        })
        .filter((x): x is SdDeptRow => x != null)
    : [];
  return { pupils, departments, inputMode, detailDepartments };
}

/** Hint ŠD pro dashboard – sekce vstupů, případně řádek detailního oddělení. */
export function findSdDashboardFocusHint(
  raw: string | null,
  options: DashboardFocusOptions = {},
): ModuleInputsFocusHint | undefined {
  const preferIssue = options.preferIssue !== false;
  const snap = parseSdDashboardSnapshot(raw);
  if (!snap) return undefined;
  if (!preferIssue) return { sectionId: "sd-vstupy" };
  if (snap.pupils <= 0) return { sectionId: "sd-vstupy" };
  if (snap.inputMode === "detail") {
    const idx = snap.detailDepartments.findIndex((d) => d.participants <= 0);
    if (idx >= 0) return { sectionId: "sd-vstupy", rowId: idx };
  }
  return undefined;
}

/** První fokus ŠD z dashboardu – sekce vstupů, případně řádek detailního oddělení. */
export function findFirstSdDashboardFocusHint(raw: string | null): ModuleInputsFocusHint | undefined {
  return findSdDashboardFocusHint(raw, { preferIssue: true });
}

export function sdDashboardNeedsAttention(snap: SdDashboardSnapshot): boolean {
  if (snap.pupils <= 0) return true;
  if (snap.inputMode === "detail") {
    return snap.detailDepartments.some((d) => d.participants <= 0);
  }
  return false;
}

export function sdDashboardVerdictFromSnapshot(snap: SdDashboardSnapshot): {
  tone: "ok" | "warning";
  label: string;
  detail: string;
} {
  if (snap.pupils <= 0) {
    return {
      tone: "warning",
      label: "Doplňte účastníky",
      detail: "Počet účastníků je 0 – PHmax nelze smysluplně ověřit.",
    };
  }
  if (snap.inputMode === "detail") {
    const emptyRows = snap.detailDepartments.filter((d) => d.participants <= 0).length;
    if (emptyRows > 0) {
      return {
        tone: "warning",
        label: "Neúplná oddělení",
        detail: `U ${emptyRows} řádků detailního režimu chybí počet účastníků.`,
      };
    }
  }
  return {
    tone: "ok",
    label: "Vstupy uloženy – ověřte PHmax v modulu",
    detail: `Účastníci ${snap.pupils}, oddělení ${snap.departments}, režim ${
      snap.inputMode === "detail" ? "detailní" : "souhrnný"
    }. Stejný stav jako v docku ŠD po otevření modulu.`,
  };
}
