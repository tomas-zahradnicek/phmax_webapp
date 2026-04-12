import React, { useCallback, useMemo, useState } from "react";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField, ResultCard } from "./phmax-zs-ui";
import { round2 } from "./phmax-zs-logic";
import {
  SD_MAX_DEPARTMENTS_IN_TABLE,
  getPhmaxSdBase,
  getPhmaxSdBreakdown,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";

function formatSdHours(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type PhmaxSdPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxSdPage({ productView, setProductView }: PhmaxSdPageProps) {
  const [pupils, setPupils] = useState(0);
  const [manualDepts, setManualDepts] = useState(false);
  const [departments, setDepartments] = useState(1);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);

  const suggested = useMemo(() => suggestedDepartmentsFromPupils(pupils), [pupils]);
  const effectiveDepts = manualDepts ? departments : suggested;

  const basePhmax = useMemo(() => getPhmaxSdBase(effectiveDepts), [effectiveDepts]);
  const reduction = useMemo(() => {
    if (basePhmax == null) return { adjusted: 0, factor: 1, applied: false };
    return reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: pupils,
      departmentCount: effectiveDepts,
      basePhmax,
    });
  }, [basePhmax, pupils, effectiveDepts]);

  const avgPerDept = effectiveDepts > 0 && pupils > 0 ? Math.round((pupils / effectiveDepts) * 100) / 100 : 0;

  const breakdown = useMemo(() => getPhmaxSdBreakdown(effectiveDepts), [effectiveDepts]);

  const tableWarning =
    effectiveDepts > SD_MAX_DEPARTMENTS_IN_TABLE
      ? `Tabulka PHmax v této aplikaci končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními — u vyššího počtu použijte přílohu vyhlášky.`
      : null;

  const exportRows = useMemo((): [string, string | number][] => {
    const rows: [string, string | number][] = [
      ["=== PHmax školní družina — export ===", ""],
      ["Počet přihlášených účastníků (žáci 1. st., pravidelná docházka)", pupils],
      ["Počet oddělení (výpočet)", effectiveDepts],
      ["Způsob určení oddělení", manualDepts ? "ruční zadání" : "automaticky ÷ 27 (nahoru)"],
      ["Navržený počet oddělení (÷ 27)", suggested],
      ["Průměr účastníků na oddělení", avgPerDept],
    ];
    if (basePhmax != null) {
      rows.push(["PHmax základ z tabulky vyhl. 74/2005 (h/týden)", basePhmax]);
      rows.push(["Krácení PHmax dle § 10 odst. 2 vyhl.", reduction.applied ? "ano" : "ne"]);
      if (reduction.applied) {
        rows.push(["Koeficient krácení", reduction.factor]);
        rows.push(["PHmax po krácení (h/týden)", reduction.adjusted]);
      }
    }
    if (breakdown != null && breakdown.length > 0 && basePhmax != null) {
      rows.push(["--- Rozpad podle oddělení ---", ""]);
      breakdown.forEach((hours, index) => {
        rows.push([`Oddělení ${index + 1} — PHmax tabulkové (h)`, formatSdHours(hours)]);
        if (reduction.applied) {
          rows.push([`Oddělení ${index + 1} — po krácení orient. (h)`, formatSdHours(round2(hours * reduction.factor))]);
        }
      });
      rows.push(["Celkem tabulkové PHmax (h)", formatSdHours(basePhmax)]);
      if (reduction.applied) rows.push(["Celkem po krácení (h)", formatSdHours(reduction.adjusted)]);
    }
    if (tableWarning) rows.push(["Upozornění", tableWarning]);
    return rows;
  }, [
    pupils,
    effectiveDepts,
    manualDepts,
    suggested,
    avgPerDept,
    basePhmax,
    reduction,
    breakdown,
    tableWarning,
  ]);

  const handleExportCsv = useCallback(() => {
    downloadTextFile(exportFilenameStamped("phmax-sd", "csv"), exportCsvLocalized(exportRows), "text/csv;charset=utf-8");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace", "PHmax školní družina"],
          ["Čas exportu", new Date().toLocaleString("cs-CZ")],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("phmax-sd", "xlsx"),
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

        <ProductViewPills productView={productView} setProductView={setProductView} />

        <h1 className="hero__title hero__title--sd">PHmax ve školní družině</h1>
        <p className="hero__text hero__text--sd">
          Orientační výpočet podle{" "}
          <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
          <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
          počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
          čtyř oddělení platí další pravidla — vždy vycházejte z úplného znění vyhlášky a metodiky.
        </p>
      </header>

      <QuickOnboarding storageKey="phmax-sd-onboarding" title="Jak s touto kalkulačkou pracovat">
        <p>
          Vyplňte počet účastníků a případně počet oddělení (jinak se dopočítá dělením 27). Výsledek vychází z přílohy k
          vyhlášce č. 74/2005 Sb.; u průměru pod 20 na oddělení může aplikovat orientační krácení dle § 10 odst. 2.
          Složité případy (§ 16 školského zákona, méně než čtyři oddělení) musíte ověřit v plném znění předpisů.
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
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
        <p className="section-lead muted-text">
          Počet účastníků = žáci 1. stupně ZŠ přihlášení k pravidelné denní docházce (pro krácení PHmax dle § 10 odst. 2).
          Počet oddělení pro nové oddělení nad první: průměr nad 27 účastníků → dělení počtem 27 a zaokrouhlení nahoru
          (u výjimek viz metodiku).
        </p>

        <div className="grid two">
          <div className="subcard">
            <h3>Účastníci</h3>
            <NumberField
              label="Počet přihlášených účastníků (žáci 1. st. ZŠ, pravidelná docházka)"
              value={pupils}
              onChange={setPupils}
            />
            <p className="muted-text" style={{ marginTop: 12, fontSize: "0.88rem" }}>
              Navržený počet oddělení (÷ 27, nahoru): <strong>{suggested}</strong>
              {pupils > 0 ? ` → průměr při ${suggested} odd.: ${(pupils / suggested).toFixed(2)} účastníků` : null}
            </p>
          </div>

          <div className="subcard">
            <h3>Oddělení</h3>
            <label className="checks" style={{ marginTop: 0 }}>
              <span>
                <input
                  type="checkbox"
                  checked={manualDepts}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setManualDepts(on);
                    if (on) setDepartments(Math.max(1, suggested));
                  }}
                />
                Zadat počet oddělení ručně (např. dle součtu řádků 0101 ve výkazu Z 2-01)
              </span>
            </label>
            {manualDepts ? (
              <NumberField label="Celkový počet oddělení školní družiny" value={departments} onChange={setDepartments} />
            ) : null}
          </div>
        </div>

        <div className="grid two section-results" style={{ marginTop: 18 }}>
          {basePhmax != null ? (
            <>
              <ResultCard
                label="Počet oddělení pro výpočet"
                value={effectiveDepts}
                tone="primary"
              />
              <ResultCard
                label="Průměr účastníků na oddělení"
                value={avgPerDept}
                tone="primary"
              />
              <ResultCard label="PHmax (základ z tabulky)" value={basePhmax} tone="success" />
              {reduction.applied ? (
                <ResultCard
                  label={`PHmax po krácení (koef. ${reduction.factor.toFixed(4)})`}
                  value={reduction.adjusted}
                  tone="success"
                />
              ) : (
                <ResultCard
                  label="PHmax po krácení"
                  value="neaplikuje se (průměr ≥ 20 na oddělení nebo nejsou údaje)"
                  tone="primary"
                />
              )}
            </>
          ) : (
            <p className="muted-text">Zadejte platný počet oddělení (1–{SD_MAX_DEPARTMENTS_IN_TABLE}).</p>
          )}
        </div>

        {breakdown != null && breakdown.length > 0 && basePhmax != null ? (
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Rozpad PHmax podle oddělení
            </h3>
            <p className="muted-text" style={{ marginBottom: 12, fontSize: "0.88rem" }}>
              Hodiny podle přílohy k vyhlášce č. 74/2005 Sb. (stejně jako ve sloupcích tabulky pro váš počet oddělení).
              Pořadí odpovídá 1. až n-tému oddělení v této tabulce.
            </p>
            <div className="sd-phmax-breakdown-scroll">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th scope="col" className="sd-phmax-breakdown__corner" />
                    <th scope="col" className="sd-phmax-breakdown__head-num">
                      PHmax
                    </th>
                    {reduction.applied ? (
                      <th scope="col" className="sd-phmax-breakdown__head-num">
                        Po krácení (orient.)
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((hours, index) => (
                    <tr key={index}>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Oddělení {index + 1}
                      </th>
                      <td className="sd-phmax-breakdown__num">{formatSdHours(hours)}</td>
                      {reduction.applied ? (
                        <td className="sd-phmax-breakdown__num">
                          {formatSdHours(round2(hours * reduction.factor))}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  <tr className="sd-phmax-breakdown__total">
                    <th scope="row">Celkem</th>
                    <td className="sd-phmax-breakdown__num">{formatSdHours(basePhmax)}</td>
                    {reduction.applied ? (
                      <td className="sd-phmax-breakdown__num">{formatSdHours(reduction.adjusted)}</td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </div>
            {reduction.applied ? (
              <p className="muted-text" style={{ marginTop: 10, fontSize: "0.82rem" }}>
                Koeficient krácení: {reduction.factor.toFixed(4)}. Jako celkový strop po krácení platí součet v řádku
                Celkem ({formatSdHours(reduction.adjusted)} h); rozpad sloupců je poměrný podklad.
              </p>
            ) : null}
          </div>
        ) : null}

        {tableWarning ? <p className="card card--warning" style={{ marginTop: 16, padding: 14 }}>{tableWarning}</p> : null}

        <p className="muted-text" style={{ marginTop: 20 }}>
          Aplikace nenahrazuje úřední výpočet ani výkazy (např. Z 2-01). U složitých případů (§ 16 školského zákona,
          méně než čtyři oddělení, výjimky zřizovatele) vycházejte z úplného znění vyhlášky a metodiky — odkazy níže.
        </p>
      </section>

      <MethodologyStrip />
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}
