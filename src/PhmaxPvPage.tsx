import React, { useCallback, useMemo, useState } from "react";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { HeroStat } from "./HeroStat";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField } from "./phmax-zs-ui";
import { buildPhmaxPvMultiExportRows } from "./phmax-pv-export-rows";
import { computePvPhmaxTotal, getPhaMaxPv, getPvMaxClassCount, type PvProvozKind } from "./phmax-pv-logic";
import { round2 } from "./phmax-zs-logic";

function pvDurationBandTableNo(provoz: PvProvozKind): string {
  if (provoz === "polodenni") return "1";
  if (provoz === "celodenni") return "2";
  if (provoz === "internat") return "3";
  return "";
}

function defaultAvgHoursForProvoz(p: PvProvozKind): number {
  if (p === "celodenni") return 10;
  if (p === "polodenni") return 5;
  if (p === "internat") return 21;
  return 0;
}

function pvAvgHoursField(provoz: PvProvozKind): { min: number; max: number; step: number; hint: string } {
  if (provoz === "polodenni") {
    return {
      min: 4,
      max: 6.5,
      step: 0.25,
      hint: "Zadejte průměr za den podle reality; tabulka 1 rozpozná sloupec (4 až 6,5 h včetně).",
    };
  }
  if (provoz === "celodenni") {
    return {
      min: 6.5,
      max: 12,
      step: 0.25,
      hint: "Tabulka 2: musí být vyšší než 6,5 h až 12 h včetně. Hodnota přesně 6,5 h patří do tabulky 1 (přepněte na polodenní).",
    };
  }
  if (provoz === "internat") {
    return {
      min: 20,
      max: 24,
      step: 0.25,
      hint: "Tabulka 3: průměrná denní doba nejméně 20 h (sloupce dle přílohy až 22 h a více).",
    };
  }
  return { min: 0, max: 24, step: 0.25, hint: "" };
}

type PhmaxPvPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const PV_ONBOARDING_KEY = "phmax-pv-onboarding";

const PROVOZ_OPTIONS: { value: PvProvozKind; label: string }[] = [
  { value: "polodenni", label: "Polodenní provoz (tabulka 1)" },
  { value: "celodenni", label: "Celodenní provoz (tabulka 2)" },
  { value: "internat", label: "Internátní provoz (tabulka 3)" },
  { value: "zdravotnicke", label: "Mateřská škola při zdravotnickém zařízení (S 4-01)" },
];

function newPvRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type PvWorkplaceRowState = {
  id: string;
  label: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
};

function createInitialPvRow(): PvWorkplaceRowState {
  const provoz: PvProvozKind = "celodenni";
  return {
    id: newPvRowId(),
    label: "",
    provoz,
    classCount: 0,
    avgHours: 0,
    sec16Count: 0,
    languageGroups: 0,
  };
}

export function PhmaxPvPage({ productView, setProductView }: PhmaxPvPageProps) {
  const [rows, setRows] = useState<PvWorkplaceRowState[]>(() => [createInitialPvRow()]);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(PV_ONBOARDING_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const dismissGuide = useCallback(() => {
    try {
      localStorage.setItem(PV_ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuideOpen(false);
  }, []);

  const openGuide = useCallback(() => {
    try {
      localStorage.removeItem(PV_ONBOARDING_KEY);
    } catch {
      /* ignore */
    }
    setGuideOpen(true);
  }, []);

  const patchRow = useCallback((id: string, patch: Partial<PvWorkplaceRowState>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createInitialPvRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const rowComputations = useMemo(() => {
    return rows.map((row) => {
      const computed = computePvPhmaxTotal({
        provoz: row.provoz,
        classCount: row.classCount,
        avgHoursPerDay: row.avgHours,
        sec16ClassCount: row.sec16Count,
        languageGroupCount: row.languageGroups,
      });
      const hoursForPha = row.provoz === "zdravotnicke" ? 8 : row.avgHours;
      const phaMax = row.sec16Count > 0 ? getPhaMaxPv(row.sec16Count, hoursForPha) : null;
      const provozLabel = PROVOZ_OPTIONS.find((o) => o.value === row.provoz)?.label ?? row.provoz;
      return { row, computed, phaMax, provozLabel };
    });
  }, [rows]);

  const aggregate = useMemo(() => {
    let phmaxSum = 0;
    let phaSum = 0;
    let incomplete = false;
    for (const c of rowComputations) {
      if (c.computed.totalPhmax != null) phmaxSum += c.computed.totalPhmax;
      else incomplete = true;
      if (c.phaMax != null) phaSum += c.phaMax;
    }
    return {
      phmaxSum: round2(phmaxSum),
      phaSum: round2(phaSum),
      incomplete,
    };
  }, [rowComputations]);

  const exportRows = useMemo(() => {
    const items = rowComputations.map((c, i) => ({
      index: i + 1,
      label: c.row.label,
      provozLabel: c.provozLabel,
      provoz: c.row.provoz,
      classCount: c.row.classCount,
      avgHoursPerDay: c.row.avgHours,
      sec16Count: c.row.sec16Count,
      languageGroups: c.row.languageGroups,
      computed: c.computed,
      phaMax: c.phaMax,
    }));
    return buildPhmaxPvMultiExportRows(items, aggregate);
  }, [rowComputations, aggregate]);

  const handleExportCsv = useCallback(() => {
    downloadTextFile(exportFilenameStamped("phmax-pv", "csv"), exportCsvLocalized(exportRows), "text/csv;charset=utf-8");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace", "PHmax / PHAmax předškolní vzdělávání"],
          ["Čas exportu", new Date().toLocaleString("cs-CZ")],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("phmax-pv", "xlsx"),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <button
            type="button"
            className="btn btn--hero-help"
            onClick={() => (guideOpen ? dismissGuide() : openGuide())}
            aria-expanded={guideOpen}
          >
            {guideOpen ? "Skrýt nápovědu" : "Nápověda"}
          </button>
        </div>

        <div className="grid two hero__grid">
          <div>
            <h1 className="hero__title hero__title--sd">PHmax a PHAmax – předškolní vzdělávání</h1>
            <p className="hero__text hero__text--sd">
              Orientační výpočet podle metodiky PHmax a PHAmax pro předškolní vzdělávání (verze 4, 2026) a{" "}
              <strong>vyhlášky č. 14/2005 Sb.</strong> Každé <strong>číslované pracoviště</strong> ve formuláři
              (Pracoviště 1, 2…) odpovídá jedné kombinaci <strong>místa (nebo jeho části) a druhu provozu</strong> —
              stejně jako jeden řádek v tabulkové pomůcce MŠMT. U právnické osoby s více skutečnými pracovišti nebo více
              druhy provozu přidejte další položku; <strong>součet PHmax</strong> z pracovišť odpovídá celkovému PHmax
              (po sečtení dílčích výpočtů dle metodiky). Údaje vycházejí z matrice M 1 (dříve S 1-01); u MŠ při
              zdravotnickém zařízení z výkazu S 4-01.
            </p>
            {aggregate.incomplete ? (
              <p className="hero__note hero__text--sd" style={{ marginTop: 10 }}>
                * Součet PHmax nezahrnuje pracoviště s neplatným vstupem — opravte je v tabulce níže.
              </p>
            ) : null}
          </div>
          <div className="hero__stats">
            <HeroStat label="Počet pracovišť ve výpočtu" value={rows.length} />
            <HeroStat
              label="PHmax celkem"
              value={aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum}
            />
            <HeroStat label="PHAmax celkem" value={aggregate.phaSum > 0 ? aggregate.phaSum : "—"} />
          </div>
        </div>
      </header>

      <QuickOnboarding title="Pracoviště MŠ" open={guideOpen} onDismiss={dismissGuide}>
        <p>
          Každé <strong>Pracoviště 1, 2…</strong> = vybraný <strong>druh provozu</strong>, počet tříd v něm, případně
          navýšení dle vyhlášky a <strong>průměrnou denní dobu provozu v hodinách</strong> (zařadí se do sloupce tabulky
          1–3 přílohy). Máte-li <strong>odloučená pracoviště</strong> nebo na jednom místě např. celodenní i polodenní
          provoz, přidejte další pracoviště pro každou kombinaci — v souhrnné tabulce uvidíte dílčí PHmax i{" "}
          <strong>součet</strong>. Krácení PHmax dle § 1d odst. 3 vyhl. 14/2005 zde neřešíme.
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy (pracoviště)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <button type="button" className="btn ghost" onClick={handleExportCsv}>
            CSV
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={xlsxExportBusy}
            aria-busy={xlsxExportBusy}
            onClick={() => void handleExportXlsx()}
          >
            {xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout Excel"}
          </button>
        </div>

        <div className="pv-workplace-rows">
          {rowComputations.map(({ row, computed, phaMax, provozLabel }, index) => {
            const maxClasses = getPvMaxClassCount(row.provoz);
            const avgMeta = pvAvgHoursField(row.provoz);
            const hoursForPha = row.provoz === "zdravotnicke" ? 8 : row.avgHours;

            return (
              <div key={row.id} className="pv-workplace-row">
                <div
                  className="pv-workplace-row-header"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <h3 className="section-title" style={{ fontSize: "1.05rem", margin: 0, flex: "1 1 200px" }}>
                    Pracoviště {index + 1}
                    {row.label.trim() ? ` — ${row.label.trim()}` : ""}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", flex: "1 1 280px" }}>
                    <label className="field" style={{ flex: "1 1 200px", margin: 0, minWidth: 0 }}>
                      <span>Označení (volitelně)</span>
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => patchRow(row.id, { label: e.target.value })}
                        placeholder="např. pracoviště Veřejná"
                        autoComplete="off"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={rows.length <= 1}
                      aria-label={`Odstranit pracoviště ${index + 1}`}
                      onClick={() => removeRow(row.id)}
                    >
                      Odstranit pracoviště
                    </button>
                  </div>
                </div>

                <div className="grid two">
                  <div className="subcard">
                    <h3>Druh provozu</h3>
                    <label className="field">
                      <span>Typ</span>
                      <select
                        value={row.provoz}
                        onChange={(e) => {
                          const next = e.target.value as PvProvozKind;
                          patchRow(row.id, {
                            provoz: next,
                            avgHours: 0,
                            classCount: Math.min(Math.max(0, row.classCount), getPvMaxClassCount(next)),
                          });
                        }}
                      >
                        {PROVOZ_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <NumberField
                      label={`Počet tříd pracoviště MŠ v tomto druhu provozu (0–${maxClasses}, dle přílohy platí ≥ 1 pro výpočet)`}
                      value={row.classCount}
                      onChange={(v) => patchRow(row.id, { classCount: v })}
                      min={0}
                      max={maxClasses}
                    />
                    {row.provoz === "zdravotnicke" ? (
                      <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
                        U MŠ při zdravotnickém zařízení je PHmax <strong>31 hodin/třídu</strong> týdně — tabulky 1–3 se
                        nepoužívají.
                      </p>
                    ) : null}
                  </div>

                  <div className="subcard">
                    <h3>Navýšení dle vyhlášky</h3>
                    <NumberField
                      label="Počet tříd (škol) zřízených podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)"
                      value={row.sec16Count}
                      onChange={(v) => patchRow(row.id, { sec16Count: v })}
                      min={0}
                      max={30}
                    />
                    <NumberField
                      label="Počet skupin pro jazykovou přípravu (+1 h PHmax / skupinu, § 1d odst. 11)"
                      value={row.languageGroups}
                      onChange={(v) => patchRow(row.id, { languageGroups: v })}
                      min={0}
                      max={50}
                    />
                  </div>
                </div>

                {row.provoz !== "zdravotnicke" ? (
                  <div className="subcard pv-input-duration">
                    <h3 className="section-title" style={{ fontSize: "1.02rem", marginBottom: 10 }}>
                      Průměrná doba provozu (tabulka {pvDurationBandTableNo(row.provoz)} přílohy)
                    </h3>
                    <NumberField
                      label="Průměrná doba provozu pracoviště v hodinách za den"
                      value={row.avgHours}
                      onChange={(v) => patchRow(row.id, { avgHours: v })}
                      min={avgMeta.min}
                      max={avgMeta.max}
                      step={avgMeta.step}
                      hint={avgMeta.hint}
                    />
                  </div>
                ) : null}

                <details className="pv-row-details">
                  <summary>
                    Detail Pracoviště {index + 1} – vstupy a dílčí PHmax
                  </summary>
                  <div className="app-table-wrap" role="region" aria-label={`Přehled vstupů pracoviště ${index + 1}`}>
                    <table className="app-data-table">
                      <caption className="app-data-table__caption">
                        Vstupy — pracoviště {index + 1} ({provozLabel}
                        {row.label.trim() ? `, ${row.label.trim()}` : ""})
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Položka</th>
                          <th scope="col">Hodnota</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Druh provozu</td>
                          <td>{provozLabel}</td>
                        </tr>
                        <tr>
                          <td>Počet tříd v tomto druhu provozu</td>
                          <td className="app-data-table__num">{row.classCount}</td>
                        </tr>
                        <tr>
                          <td>Průměrná doba provozu (h/den)</td>
                          <td className="app-data-table__num">
                            {row.provoz === "zdravotnicke" ? <span className="muted-text">—</span> : row.avgHours}
                          </td>
                        </tr>
                        <tr>
                          <td>Sloupec tabulky (pásmo doby)</td>
                          <td>
                            {row.provoz === "zdravotnicke" ? (
                              <span className="muted-text">—</span>
                            ) : computed.base ? (
                              computed.base.durationColumnLabel
                            ) : (
                              <span className="muted-text">Po opravě doby se zobrazí text ze přílohy</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Třídy zřízené podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)</td>
                          <td className="app-data-table__num">{row.sec16Count}</td>
                        </tr>
                        <tr>
                          <td>Skupiny jazykové přípravy (+1 h PHmax / skupinu, § 1d odst. 11 vyhl. 14/2005)</td>
                          <td className="app-data-table__num">{row.languageGroups}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {computed.issues.map((issue, i) => (
                    <p key={`${row.id}-${issue.code}-${i}`} className="card card--warning" style={{ marginTop: 14, padding: 12 }}>
                      <strong>Pracoviště {index + 1}:</strong> {issue.message}
                    </p>
                  ))}

                  {computed.base ? (
                    <div className="app-table-wrap app-table-wrap--spaced" role="region" aria-label={`PHmax pracoviště ${index + 1}`}>
                      <table className="app-data-table app-data-table--results">
                        <caption className="app-data-table__caption">
                          Výpočet PHmax pro pracoviště {index + 1} (hodiny týdně)
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Složka</th>
                            <th scope="col">Hodnota</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>PHmax ze základní tabulky metodiky (příslušná tabulka 1–3 / MŠ u zdrav. zařízení)</td>
                            <td className="app-data-table__num">{computed.base.basePhmax}</td>
                          </tr>
                          <tr>
                            <td>Pásmo / sloupec průměrné denní doby provozu</td>
                            <td>{computed.base.durationColumnLabel}</td>
                          </tr>
                          <tr>
                            <td>Navýšení § 16 odst. 9 školského zákona (5 h × počet tříd)</td>
                            <td className="app-data-table__num">{computed.sec16Bonus}</td>
                          </tr>
                          <tr>
                            <td>Navýšení jazyková příprava (1 h × počet skupin)</td>
                            <td className="app-data-table__num">{computed.languageBonus}</td>
                          </tr>
                        </tbody>
                        {computed.totalPhmax != null ? (
                          <tfoot>
                            <tr className="app-data-table__total-row">
                              <th scope="row">PHmax celkem (toto pracoviště)</th>
                              <td className="app-data-table__num app-data-table__num--emph">{computed.totalPhmax}</td>
                            </tr>
                          </tfoot>
                        ) : null}
                      </table>
                    </div>
                  ) : (
                    !computed.issues.length && (
                      <p className="muted-text section-results">Upravte vstupy pracoviště {index + 1} pro výpočet základního PHmax.</p>
                    )
                  )}

                  {phaMax != null ? (
                    <div className="app-table-wrap app-table-wrap--spaced" role="region" aria-label={`PHAmax pracoviště ${index + 1}`}>
                      <table className="app-data-table app-data-table--pha">
                        <caption className="app-data-table__caption">PHAmax — pracoviště {index + 1} (asistenti pedagoga, § 16)</caption>
                        <thead>
                          <tr>
                            <th scope="col">Položka</th>
                            <th scope="col">Hodnota (h/týden)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              PHAmax dle metodiky v4
                              <span className="app-data-table__hint">
                                Použije se průměrná doba tohoto pracoviště ({hoursForPha.toLocaleString("cs-CZ")} h/den); při
                                provozu pod 8 h/den krácení poměrem doba/8. U MŠ při zdravotnickém zařízení odkaz 8
                                h/den.
                              </span>
                            </td>
                            <td className="app-data-table__num app-data-table__num--emph">{phaMax}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </details>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--pv-add-workplace" onClick={addRow}>
            Přidat pracoviště (další kombinace místo / druhu provozu)
          </button>
        </div>

        {rowComputations.some((c) => c.computed.issues.length > 0) ? (
          <div className="card card--warning" style={{ marginTop: 20, padding: 14 }}>
            {rowComputations.flatMap((c, i) =>
              c.computed.issues.map((issue, j) => ({ issue, i, j, id: c.row.id }))
            ).map((x, idx) => (
              <p key={`${x.id}-warn-${x.issue.code}-${x.j}`} style={{ margin: idx === 0 ? 0 : "10px 0 0" }}>
                <strong>Pracoviště {x.i + 1}:</strong> {x.issue.message}
              </p>
            ))}
          </div>
        ) : null}

        <div className="app-table-wrap app-table-wrap--spaced" role="region" aria-label="Souhrn všech pracovišť výpočtu">
          <table className="app-data-table app-data-table--results">
            <caption className="app-data-table__caption">
              Souhrn — dílčí PHmax podle pracovišť a součet (hodiny týdně)
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Označení</th>
                <th scope="col">Druh provozu</th>
                <th scope="col" className="app-data-table__num">
                  Třídy
                </th>
                <th scope="col" className="app-data-table__num">
                  h/den
                </th>
                <th scope="col">Pásmo doby</th>
                <th scope="col" className="app-data-table__num">
                  Dílčí PHmax
                </th>
                <th scope="col" className="app-data-table__num">
                  PHAmax
                </th>
              </tr>
            </thead>
            <tbody>
              {rowComputations.map((c, i) => (
                <tr key={c.row.id}>
                  <td>{i + 1}</td>
                  <td>{c.row.label.trim() ? c.row.label.trim() : "—"}</td>
                  <td>{c.provozLabel}</td>
                  <td className="app-data-table__num">{c.row.classCount}</td>
                  <td className="app-data-table__num">
                    {c.row.provoz === "zdravotnicke" ? <span className="muted-text">—</span> : c.row.avgHours}
                  </td>
                  <td>
                    {c.row.provoz === "zdravotnicke" ? (
                      <span className="muted-text">—</span>
                    ) : c.computed.base ? (
                      c.computed.base.durationColumnLabel
                    ) : (
                      <span className="muted-text">—</span>
                    )}
                  </td>
                  <td className="app-data-table__num">
                    {c.computed.totalPhmax != null ? c.computed.totalPhmax : <span className="muted-text">—</span>}
                  </td>
                  <td className="app-data-table__num">
                    {c.phaMax != null ? c.phaMax : <span className="muted-text">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="app-data-table__total-row">
                <th scope="row" colSpan={6}>
                  PHmax celkem (součet pracovišť){aggregate.incomplete ? " *" : ""}
                </th>
                <td className="app-data-table__num app-data-table__num--emph">{aggregate.phmaxSum}</td>
                <td className="app-data-table__num app-data-table__num--emph">
                  {aggregate.phaSum > 0 ? aggregate.phaSum : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {aggregate.incomplete ? (
          <p className="muted-text" style={{ marginTop: 10, fontSize: "0.9rem" }}>
            * Do součtu PHmax jsou započítána jen pracoviště bez chyby vstupu. Ostatní opravte nebo příslušné pracoviště
            odstraňte, pokud ho nepotřebujete.
          </p>
        ) : null}

        <p className="muted-text" style={{ marginTop: 22 }}>
          Krácení PHmax při výjimkách z nejnižšího počtu dětí (§ 1d odst. 3) v aplikaci neřešíme — nutno dopočítat dle
          vyhlášky. Odkazy na předpisy a metodiku jsou v přehledu níže.
        </p>
      </section>

      <MethodologyStrip />
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}
