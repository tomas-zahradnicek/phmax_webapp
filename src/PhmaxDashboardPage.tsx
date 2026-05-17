import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { CALCULATOR_LIMITS_NOTE, PRODUCT_CALCULATOR_TITLES } from "./calculator-ui-constants";
import { HeroStatusBar } from "./HeroStatusBar";
import { ProductViewPills, type ProductView } from "./ProductViewPills";

const DASH_QUICK_IDS: Exclude<ProductView, "dash">[] = ["pv", "sd", "zs", "ss", "nv75"];

const DASH_CALC_LABEL: Record<Exclude<ProductView, "dash">, string> = {
  pv: "PV",
  sd: "ŠD",
  zs: "ZŠ",
  ss: "SŠ",
  nv75: "NV75",
};
import { round2 } from "./phmax-zs-logic";
import { computePvPhmaxTotal, getPhaMaxPv, type PvProvozKind } from "./phmax-pv-logic";
import { calculateNv75DeputyBank } from "./nv75-deputy-bank";
import { eligibleAdditionalWorkplacesForRow, normalizeNv75UiRow, type Nv75DeputyUiRow } from "./PhmaxNv75DeputyPage";
import { readNamedSnapshotsFromLs } from "./zs-named-snapshots";
import { PHMAX_SS_UNITS_STORAGE_KEY } from "./ss/phmax-ss-constants";
import { deriveSsUnitsPreview } from "./ss/phmax-ss-units-derive";
import { revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./ss/phmax-ss-types";
import { sumPracticalSchoolPhaMaxFromRows } from "./ss/phmax-ss-practical-phamax";

type PhmaxDashboardPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const LS_PV = "edu-cz-pv-calculator-state";
const LS_PV_NAMED = "edu-cz-pv-named-snapshots-v1";
const LS_SD = "edu-cz-sd-calculator-state";
const LS_SD_NAMED = "edu-cz-sd-named-snapshots-v1";
const LS_ZS = "edu-cz-zs-calculator-state";
const LS_NV75 = "edu-cz-nv75-deputy-bank-state";
const LS_NV75_NAMED = "edu-cz-nv75-deputy-bank-named-snapshots";

const PV_PROVOZ: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

function safeJsonParse(raw: string | null): unknown {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function namedCount(key: string): number {
  const data = safeJsonParse(typeof localStorage === "undefined" ? null : localStorage.getItem(key));
  if (!data || typeof data !== "object") return 0;
  const items = (data as { items?: unknown }).items;
  return Array.isArray(items) ? items.length : 0;
}

function normalizePvRowLoose(item: unknown): {
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const provoz = r.provoz;
  if (typeof provoz !== "string" || !PV_PROVOZ.includes(provoz as PvProvozKind)) return null;
  const classCount = typeof r.classCount === "number" && Number.isFinite(r.classCount) ? Math.max(0, r.classCount) : 0;
  const avgHours = typeof r.avgHours === "number" && Number.isFinite(r.avgHours) ? Math.max(0, r.avgHours) : 0;
  const sec16Count = typeof r.sec16Count === "number" && Number.isFinite(r.sec16Count) ? Math.max(0, r.sec16Count) : 0;
  const languageGroups =
    typeof r.languageGroups === "number" && Number.isFinite(r.languageGroups) ? Math.max(0, r.languageGroups) : 0;
  return { provoz: provoz as PvProvozKind, classCount, avgHours, sec16Count, languageGroups };
}

function summarizePvFromLs(): {
  present: boolean;
  rowCount: number;
  phmax: number | null;
  pha: number | null;
  incomplete: boolean;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_PV);
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return { present: false, rowCount: 0, phmax: null, pha: null, incomplete: false };
  }
  const rowsRaw = (parsed as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
    return { present: false, rowCount: 0, phmax: null, pha: null, incomplete: false };
  }
  let phmaxSum = 0;
  let phaSum = 0;
  let incomplete = false;
  for (const item of rowsRaw) {
    const nr = normalizePvRowLoose(item);
    if (!nr) continue;
    const computed = computePvPhmaxTotal({
      provoz: nr.provoz,
      classCount: nr.classCount,
      avgHoursPerDay: nr.avgHours,
      sec16ClassCount: nr.sec16Count,
      languageGroupCount: nr.languageGroups,
    });
    if (computed.totalPhmax != null) phmaxSum += computed.totalPhmax;
    else incomplete = true;
    const hoursForPha = nr.provoz === "zdravotnicke" ? 8 : nr.avgHours;
    const phaMax = nr.sec16Count > 0 ? getPhaMaxPv(nr.sec16Count, hoursForPha) : null;
    if (phaMax != null) phaSum += phaMax;
  }
  return {
    present: true,
    rowCount: rowsRaw.length,
    phmax: round2(phmaxSum),
    pha: phaSum > 0 ? round2(phaSum) : null,
    incomplete,
  };
}

function readSdBrief(): { present: boolean; pupils: number; departments: number; inputMode: "summary" | "detail" } | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_SD);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const pupils = o.pupils;
  const departments = o.departments;
  if (typeof pupils !== "number" || !Number.isFinite(pupils)) return null;
  if (typeof departments !== "number" || !Number.isFinite(departments) || departments < 1) return null;
  const inputMode = o.inputMode === "detail" ? "detail" : "summary";
  return { present: true, pupils, departments, inputMode };
}

type ZsAuditTotals = { totalPhmax: number; totalPha: number; totalPhp: number; tab?: string };

function readZsTotals(): ZsAuditTotals | null {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_ZS);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") return null;
  const t = (data as { _phmaxAuditTotals?: unknown })._phmaxAuditTotals;
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const totalPhmax = o.totalPhmax;
  const totalPha = o.totalPha;
  const totalPhp = o.totalPhp;
  if (typeof totalPhmax !== "number" || typeof totalPha !== "number" || typeof totalPhp !== "number") return null;
  const tab = typeof o.tab === "string" ? o.tab : undefined;
  return { totalPhmax, totalPha, totalPhp, tab };
}

function parseSsDraftRows(raw: string | null): PhmaxSsUnitRow[] {
  const data = safeJsonParse(raw);
  if (!Array.isArray(data) || data.length === 0) return [];
  try {
    return data.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
  } catch {
    return [];
  }
}

function summarizeSsFromLs(): {
  present: boolean;
  rowCount: number;
  phmax: number | null;
  phamaxPractical: number | null;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(PHMAX_SS_UNITS_STORAGE_KEY);
  const rows = parseSsDraftRows(raw);
  if (rows.length === 0)
    return { present: false, rowCount: 0, phmax: null, phamaxPractical: null };
  const preview = deriveSsUnitsPreview(rows);
  let sum = 0;
  for (const p of preview) {
    if (!p.skipped && "resolved" in p) sum += p.resolved?.totalPhmax ?? 0;
  }
  const rounded = Math.round((sum + Number.EPSILON) * 100) / 100;
  const phamax = sumPracticalSchoolPhaMaxFromRows(rows);
  return {
    present: true,
    rowCount: rows.length,
    phmax: rounded,
    phamaxPractical: phamax,
  };
}

function nv75CalculationRows(rows: Nv75DeputyUiRow[]) {
  return rows.map((row) => ({
    kind: row.kind,
    units: row.units,
    additionalWorkplacesEligible: eligibleAdditionalWorkplacesForRow(row),
  }));
}

function readNv75State(): {
  rowCount: number;
  bankTotal: number | null;
  rule: string | null;
  practicalFilled: boolean;
} {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_NV75);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") {
    return { rowCount: 0, bankTotal: null, rule: null, practicalFilled: false };
  }
  const o = data as Record<string, unknown>;
  const rowsRaw = o.rows;
  const practicalGeneralNonOv =
    typeof o.practicalGeneralNonOv === "number" && Number.isFinite(o.practicalGeneralNonOv) ? o.practicalGeneralNonOv : 0;
  const practicalOvEhl0 =
    typeof o.practicalOvEhl0 === "number" && Number.isFinite(o.practicalOvEhl0) ? o.practicalOvEhl0 : 0;
  const practicalSec16 =
    typeof o.practicalSec16 === "number" && Number.isFinite(o.practicalSec16) ? o.practicalSec16 : 0;
  const ovGroupsSchool =
    typeof o.ovGroupsSchool === "number" && Number.isFinite(o.ovGroupsSchool) ? o.ovGroupsSchool : 0;
  const ovGroupsInstructor =
    typeof o.ovGroupsInstructor === "number" && Number.isFinite(o.ovGroupsInstructor) ? o.ovGroupsInstructor : 0;
  const practicalFilled = practicalGeneralNonOv > 0 || practicalOvEhl0 > 0 || practicalSec16 > 0 || ovGroupsSchool > 0 || ovGroupsInstructor > 0;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
    return { rowCount: 0, bankTotal: null, rule: null, practicalFilled };
  }
  let uiRows: Nv75DeputyUiRow[];
  try {
    uiRows = rowsRaw
      .map((item) => normalizeNv75UiRow((item ?? {}) as Nv75DeputyUiRow))
      .map((r, idx) => ({ ...r, id: typeof r.id === "number" ? r.id : idx + 1 }));
  } catch {
    return { rowCount: rowsRaw.length, bankTotal: null, rule: null, practicalFilled };
  }
  try {
    const result = calculateNv75DeputyBank({
      activities: nv75CalculationRows(uiRows),
      practicalStudentsGeneralNonOv: practicalGeneralNonOv,
      practicalStudentsOvEhl0: practicalOvEhl0,
      practicalStudentsSec16: practicalSec16,
      ovGroupsSchool,
      ovGroupsInstructor,
    });
    return {
      rowCount: uiRows.length,
      bankTotal: result.bankHoursTotal,
      rule: result.appliedRule,
      practicalFilled,
    };
  } catch {
    return { rowCount: uiRows.length, bankTotal: null, rule: null, practicalFilled };
  }
}

function zsSnapshotHasAnyInput(): boolean {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LS_ZS);
  const data = safeJsonParse(raw);
  if (!data || typeof data !== "object") return false;
  return Object.keys(data as object).length > 0;
}

type DashboardRow = {
  id: Exclude<ProductView, "dash">;
  title: string;
  status: string;
  detail: string;
  namedBackups: number;
};

function buildDashboardRows(): DashboardRow[] {
  const pv = summarizePvFromLs();
  const sd = readSdBrief();
  const zsTotals = readZsTotals();
  const zsNamed = readNamedSnapshotsFromLs().length;
  const ss = summarizeSsFromLs();
  const nv = readNv75State();

  const rows: DashboardRow[] = [
    {
      id: "pv",
      title: PRODUCT_CALCULATOR_TITLES.pv,
      status: pv.present ? "data v prohlížeči" : "žádná uložená data",
      detail: pv.present
        ? `Pracoviště: ${pv.rowCount}${pv.incomplete ? " · součet PHmax může být neúplný" : ""} · PHmax: ${
            pv.phmax ?? "–"
          } · PHAmax: ${pv.pha ?? "–"}`
        : "Po prvním uložení v PV se zde objeví orientační PHmax.",
      namedBackups: namedCount(LS_PV_NAMED),
    },
    {
      id: "sd",
      title: PRODUCT_CALCULATOR_TITLES.sd,
      status: sd ? "data v prohlížeči" : "žádná uložená data",
      detail: sd
        ? `Účastníci: ${sd.pupils}, oddělení: ${sd.departments}, režim: ${sd.inputMode === "detail" ? "detailní" : "souhrnný"} · PHmax dopočítejte v modulu ŠD.`
        : "Po uložení stavu v ŠD se zde zobrazí základ vstupů.",
      namedBackups: namedCount(LS_SD_NAMED),
    },
    {
      id: "zs",
      title: PRODUCT_CALCULATOR_TITLES.zs,
      status: zsSnapshotHasAnyInput() || zsTotals != null ? "data v prohlížeči" : "žádná uložená data",
      detail: zsTotals
        ? `Součty z autosave (záložka ${String(zsTotals.tab ?? "–")}): PHmax ${zsTotals.totalPhmax}, PHAmax ${zsTotals.totalPha}, PHPmax ${zsTotals.totalPhp}.`
        : zsSnapshotHasAnyInput()
          ? "Stav ZŠ je uložen; otevřete ZŠ – po uložení autosave se doplní řádek _phmaxAuditTotals pro souhrnné PHmax/PHAmax/PHPmax."
          : "Zatím nebyl uložen žádný stav ZŠ v tomto prohlížeči.",
      namedBackups: zsNamed,
    },
    {
      id: "ss",
      title: PRODUCT_CALCULATOR_TITLES.ss,
      status: ss.present ? "data v prohlížeči" : "žádná uložená data",
      detail: ss.present
        ? `Řádky evidence: ${ss.rowCount}, součet PHmax (platné řádky): ${ss.phmax}${ss.phamaxPractical != null ? `, PHAmax (PrŠ, denní): ${ss.phamaxPractical}` : ""}`
        : "Po vyplnění SŠ se zde zobrazí orientační PHmax ze stejné logiky jako ve formuláři.",
      namedBackups: 0,
    },
    {
      id: "nv75",
      title: PRODUCT_CALCULATOR_TITLES.nv75,
      status: nv.rowCount > 0 || nv.bankTotal != null ? "data v prohlížeči" : "žádná uložená data",
      detail:
        nv.rowCount > 0
          ? `Řádky: ${nv.rowCount}${nv.rule ? ` · §4b pravidlo: ${nv.rule}` : ""}, banka celkem: ${
              nv.bankTotal ?? "–"
            }${nv.practicalFilled ? " · §4c kontext doplněn" : ""}`
          : "Po uložení vstupů v NV75 se zobrazí banka odpočtů a pravidlo §4b.",
      namedBackups: namedCount(LS_NV75_NAMED),
    },
  ];
  return rows;
}

export function PhmaxDashboardPage({ productView, setProductView }: PhmaxDashboardPageProps) {
  const [refreshAt, setRefreshAt] = useState(() => new Date());
  const [notice, setNotice] = useState("");

  const refresh = useCallback(() => {
    setRefreshAt(new Date());
    setNotice("Souhrnný přehled byl znovu načten z prohlížeče.");
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshAt(new Date());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const rows = useMemo(() => buildDashboardRows(), [refreshAt]);

  return (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <header className="hero hero--feature">
          <div className="hero__orb hero__orb--one" />
          <div className="hero__orb hero__orb--two" />
          <div className="hero__pills-row">
            <ProductViewPills productView={productView} setProductView={setProductView} />
            <button type="button" className="btn ghost" onClick={refresh}>
              Obnovit z prohlížeče
            </button>
          </div>
          <div className="hero__grid" style={{ marginTop: 8 }}>
            <div>
              <h1 className="hero__title">{PRODUCT_CALCULATOR_TITLES.dash}</h1>
              <p className="hero__text">{CALCULATOR_LIMITS_NOTE}</p>
              <p className="muted-text" style={{ marginTop: 8 }}>
                URL:{" "}
                <code className="methodology-strip__code">
                  {typeof window !== "undefined" ? window.location.origin : ""}?view=dash
                </code>
              </p>
            </div>
          </div>
        </header>

        <section className="card card--accent section-card section-card--guide" aria-labelledby="dash-user-first-heading">
          <h2 id="dash-user-first-heading" className="section-title">
            Začněte uživatelsky nejdříve tady
          </h2>
          <p className="muted-text" style={{ marginBottom: 12 }}>
            V každé kalkulačce nejdřív v horní oblasti stránky vyberte <strong>Příkladové výpočty</strong> – získáte předvyplněnou situaci k orientaci ve vstupech. U ZŠ může navíc pomoci ukázka v horní liště či rozcestník v expertním režimu. V tabulkách PHmax používejte rozbalení{" "}
            <strong>„Proč tyto vstupy ovlivní PHmax?“</strong> (viz PV, ŠD, ZŠ, NV75) – u <strong>SŠ</strong> doplňuje stejný smysl tlačítko „Proč?“ u každého řádku přehledu.
          </p>
          <p className="muted-text" style={{ marginBottom: 12 }}>
            Rychlé otevření kalkulačky (stav zůstává v paměti tohoto prohlížeče):
          </p>
          <div className="toolbar" style={{ flexWrap: "wrap", gap: 8 }}>
            {DASH_QUICK_IDS.map((id) => (
              <button key={id} type="button" className="btn ghost" title={PRODUCT_CALCULATOR_TITLES[id]} onClick={() => setProductView(id)}>
                Otevřít {DASH_CALC_LABEL[id]}
              </button>
            ))}
          </div>
        </section>

        <section className="card muted section-card">
          <h2 className="section-title">Přehled podle uloženého stavu (localStorage)</h2>
          <p className="muted-text" style={{ marginBottom: 14 }}>
            Slouží jen k orientaci v tomto prohlížeči. Metriky počítám stejnou logikou jako v příslušné kartě (kde je k tomu dostupná data).
          </p>
          <div className="dash-cards">
            {rows.map((row) => {
              const metricMatch = row.detail.match(/PHmax[^:]*:\s*([\d.,]+|–)/i);
              const metric = metricMatch?.[1] ?? "–";
              return (
                <article key={row.id} className="dash-card">
                  <h3 className="dash-card__title">{row.title}</h3>
                  <p className="dash-card__metric">{metric}</p>
                  <p className="dash-card__meta">{row.status}</p>
                  <p className="dash-card__meta">{row.detail}</p>
                  <p className="dash-card__meta">Pojmenované zálohy: {row.namedBackups}</p>
                  <button type="button" className="btn primary" onClick={() => setProductView(row.id)}>
                    Otevřít
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="zs-app-footer">
          <HeroStatusBar
            variant="dash"
            placement="footer"
            productLabel={PRODUCT_CALCULATOR_TITLES.dash}
            lastSavedAt={refreshAt.toLocaleString("cs-CZ")}
            notice={notice}
          />
          <AuthorCreditFooter />
        </footer>
      </div>
    </div>
  );
}
