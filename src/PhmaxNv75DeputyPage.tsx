import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  APP_AUTHOR_EXPORT_ROWS,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { exportCsvLocalized, downloadTextFile } from "./export-utils";
import { getAppAuthorPrintFooterHtml, stripAppAuthorCreditFromPlainSummary } from "./app-author-print";
import { HeroStatusBar } from "./HeroStatusBar";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { calculateNv75DeputyBank, type Nv75DeputyKind } from "./nv75-deputy-bank";

type PhmaxNv75DeputyPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

type Nv75DeputyUiRow = {
  id: number;
  kind: Nv75DeputyKind;
  units: number;
  additionalWorkplacesEligible: number;
};

const NV75_STORAGE_KEY = "edu-cz-nv75-deputy-bank-state";

const NV75_DEPUTY_KIND_OPTIONS: readonly { value: Nv75DeputyKind; label: string }[] = [
  { value: "ms", label: "MŠ (příl. 2)" },
  { value: "ms_internat", label: "MŠ internátní / SPC (příl. 2)" },
  { value: "zs", label: "ZŠ (příl. 2)" },
  { value: "ss_konz", label: "SŠ a konzervatoř (příl. 2)" },
  { value: "sd", label: "Školní družina (příl. 2)" },
  { value: "internat", label: "Internát (příl. 3)" },
  { value: "zus_individual", label: "ZUŠ – zástupce (individuální výuka) (příl. 3)" },
  { value: "zus_group", label: "ZUŠ – zástupce (skupinová/kolektivní) (příl. 3)" },
  { value: "jazykova", label: "Jazyková škola s právem SJZ (příl. 3)" },
  { value: "ustavni", label: "ŠZ pro ústavní/ochrannou výchovu (příl. 3)" },
  { value: "domov_mladeze", label: "Domov mládeže (příl. 3)" },
  { value: "poradenske", label: "Školské poradenské zařízení (příl. 3)" },
  { value: "vos", label: "Vyšší odborná škola (příl. 3)" },
  { value: "skolni_klub", label: "Školní klub (příl. 3)" },
];

function buildRowsForExport(rows: Nv75DeputyUiRow[], practicalGeneral: number, practicalSec16: number) {
  const result = calculateNv75DeputyBank({
    activities: rows,
    practicalStudentsGeneral: practicalGeneral,
    practicalStudentsSec16: practicalSec16,
  });
  const out: [string, string | number][] = [
    ["=== NV75 – banka odpočtů zástupců (orientačně) ===", ""],
    ["Pravidlo §4b", result.appliedRule],
    ["Banka – základ dle §4b (h/týden)", result.bankHoursBase4b],
    ["Banka – bonus dle §4c (h/týden)", result.bonus4cHours],
    ["Banka – bonus dle §4d (h/týden)", result.bonus4dHours],
    ["Banka – celkem (h/týden)", result.bankHoursTotal],
    ["§4c odst. 1 – žáci praktického vyučování", practicalGeneral],
    ["§4c odst. 2 – žáci praktického vyučování §16/9", practicalSec16],
    ["", ""],
    ["=== Zadané řádky ===", ""],
  ];
  rows.forEach((row, idx) => {
    out.push([`Řádek ${idx + 1} – druh`, row.kind]);
    out.push([`Řádek ${idx + 1} – jednotky`, row.units]);
    out.push([`Řádek ${idx + 1} – další pracoviště (způsobilá)`, row.additionalWorkplacesEligible]);
  });
  if (result.notes.length > 0) out.push(["Poznámky", result.notes.join(" | ")]);
  for (const [k, v] of APP_AUTHOR_EXPORT_ROWS) out.push([k, v]);
  return out;
}

export function PhmaxNv75DeputyPage({ productView, setProductView }: PhmaxNv75DeputyPageProps) {
  const [rows, setRows] = useState<Nv75DeputyUiRow[]>([{ id: 1, kind: "zs", units: 0, additionalWorkplacesEligible: 0 }]);
  const [practicalGeneral, setPracticalGeneral] = useState(0);
  const [practicalSec16, setPracticalSec16] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uiNotice, setUiNotice] = useState("");
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NV75_STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as { rows?: Nv75DeputyUiRow[]; practicalGeneral?: number; practicalSec16?: number };
      if (Array.isArray(s.rows) && s.rows.length > 0) setRows(s.rows);
      if (typeof s.practicalGeneral === "number") setPracticalGeneral(s.practicalGeneral);
      if (typeof s.practicalSec16 === "number") setPracticalSec16(s.practicalSec16);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NV75_STORAGE_KEY, JSON.stringify({ rows, practicalGeneral, practicalSec16 }));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch {
      /* ignore */
    }
  }, [rows, practicalGeneral, practicalSec16]);

  const bank = useMemo(
    () =>
      calculateNv75DeputyBank({
        activities: rows,
        practicalStudentsGeneral: practicalGeneral,
        practicalStudentsSec16: practicalSec16,
      }),
    [rows, practicalGeneral, practicalSec16],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: Date.now(), kind: "zs", units: 0, additionalWorkplacesEligible: 0 }]);
  }, []);
  const removeRow = useCallback((id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
  }, []);
  const updateRow = useCallback((id: number, patch: Partial<Nv75DeputyUiRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);
  const resetAll = useCallback(() => {
    setRows([{ id: 1, kind: "zs", units: 0, additionalWorkplacesEligible: 0 }]);
    setPracticalGeneral(0);
    setPracticalSec16(0);
    setUiNotice("NV75 banka byla resetována.");
  }, []);

  const exportRows = useMemo(
    () => buildRowsForExport(rows, practicalGeneral, practicalSec16),
    [rows, practicalGeneral, practicalSec16],
  );

  const handleExportCsv = useCallback(() => {
    downloadTextFile("nv75-banka-odpoctu.csv", exportCsvLocalized(exportRows), "text/csv;charset=utf-8");
    setUiNotice("Exportováno do CSV.");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", PRODUCT_CALCULATOR_TITLES.nv75],
          ["Datum a čas exportu", new Date().toLocaleString("cs-CZ")],
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportRows,
        filename: "nv75-banka-odpoctu.xlsx",
      });
      setUiNotice("Stažen soubor Excel (XLSX).");
    } catch {
      setUiNotice("Export do Excelu se nepodařil.");
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const summaryText = useMemo(() => {
    const lines = [
      "Shrnutí – NV75 banka odpočtů zástupců (orientačně)",
      "",
      `Pravidlo §4b: ${bank.appliedRule}`,
      `Základ banky (§4b): ${bank.bankHoursBase4b} h/týden`,
      `Bonus (§4c): ${bank.bonus4cHours} h/týden`,
      `Bonus (§4d): ${bank.bonus4dHours} h/týden`,
      `Banka odpočtů celkem: ${bank.bankHoursTotal} h/týden`,
      "",
      APP_AUTHOR_CREDIT_LINE,
    ];
    return lines.join("\n");
  }, [bank]);

  const copySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setUiNotice("Shrnutí zkopírováno.");
    } catch {
      setUiNotice("Kopírování shrnutí se nepodařilo.");
    }
  }, [summaryText]);

  const printSummary = useCallback(() => {
    const plain = stripAppAuthorCreditFromPlainSummary(summaryText);
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>NV75 banka odpočtů</title>` +
        `<style>body{font-family:system-ui,Segoe UI,sans-serif;margin:16px;font-size:11pt;line-height:1.45;color:#0f172a}</style>` +
        `</head><body><h1 style="font-size:13pt">NV75 – banka odpočtů zástupců</h1><p>${text}</p>${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [summaryText]);

  return (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <header className="hero hero--feature">
          <div className="hero__content">
            <ProductViewPills productView={productView} setProductView={setProductView} />
            <h1 className="hero__title">NV75 – banka odpočtů zástupců</h1>
            <p className="hero__subtitle">
              Samostatná kalkulačka dle §4b až §4d NV č. 75/2005 Sb. pro orientační výpočet celkového snížení PPČ
              zástupců ředitele.
            </p>
          </div>
        </header>

        <section className="card muted section-card">
          <h2 className="section-title">Vstupy</h2>
          <div className="toolbar">
            <button type="button" className="btn ghost" onClick={addRow}>
              Přidat řádek
            </button>
            <button type="button" className="btn ghost" onClick={resetAll}>
              Reset
            </button>
            <button type="button" className="btn ghost" onClick={handleExportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn ghost" onClick={() => void handleExportXlsx()} disabled={xlsxExportBusy}>
              {xlsxExportBusy ? "Exportuji…" : "Export XLSX"}
            </button>
            <button type="button" className="btn ghost" onClick={() => void copySummary()}>
              Kopírovat shrnutí
            </button>
            <button type="button" className="btn ghost" onClick={printSummary}>
              Tisk shrnutí
            </button>
          </div>

          <div className="grid two" style={{ marginTop: 10 }}>
            <label className="field">
              <span className="field__label">§4c odst. 1 – žáci/stud. praktického vyučování</span>
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={practicalGeneral}
                onChange={(e) => setPracticalGeneral(Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span className="field__label">§4c odst. 2 – žáci prakt. vyučování ve škole dle §16/9</span>
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={practicalSec16}
                onChange={(e) => setPracticalSec16(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="sd-phmax-breakdown-scroll" style={{ marginTop: 10 }}>
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th>Druh školy/zařízení</th>
                  <th>Jednotky</th>
                  <th>Další pracoviště (způsobilá)</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select className="input" value={row.kind} onChange={(e) => updateRow(row.id, { kind: e.target.value as Nv75DeputyKind })}>
                        {NV75_DEPUTY_KIND_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="input" type="number" min={0} step={1} value={row.units} onChange={(e) => updateRow(row.id, { units: Number(e.target.value) })} />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        step={1}
                        value={row.additionalWorkplacesEligible}
                        onChange={(e) => updateRow(row.id, { additionalWorkplacesEligible: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn ghost" onClick={() => removeRow(row.id)}>
                        Odebrat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card muted section-card section-card--overview">
          <h2 className="section-title">Výsledek banky odpočtů</h2>
          <div className="grid four">
            <div className="result-card"><p className="result-card__label">Pravidlo §4b</p><p className="result-card__value">{bank.appliedRule}</p></div>
            <div className="result-card"><p className="result-card__label">Základ §4b</p><p className="result-card__value">{bank.bankHoursBase4b}</p></div>
            <div className="result-card"><p className="result-card__label">Bonus §4c+§4d</p><p className="result-card__value">{bank.bonus4cHours + bank.bonus4dHours}</p></div>
            <div className="result-card"><p className="result-card__label">Banka celkem (h/týden)</p><p className="result-card__value">{bank.bankHoursTotal}</p></div>
          </div>
          {bank.notes.length > 0 ? <p className="muted-text" style={{ marginTop: 10 }}>{bank.notes.join(" | ")}</p> : null}
        </section>

        <footer className="zs-app-footer">
          <HeroStatusBar variant="nv75" placement="footer" productLabel={PRODUCT_CALCULATOR_TITLES.nv75} lastSavedAt={lastSavedAt} notice={uiNotice} />
          <AuthorCreditFooter />
        </footer>
      </div>
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </div>
  );
}
