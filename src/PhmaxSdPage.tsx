import React, { useCallback, useEffect, useMemo, useState } from "react";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import { HeroStat } from "./HeroStat";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField, ResultCard } from "./phmax-zs-ui";
import { round2 } from "./phmax-zs-logic";
import { buildPhmaxSdExportRows } from "./phmax-sd-export-rows";
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

const SD_ONBOARDING_KEY = "phmax-sd-onboarding";
const SD_STORAGE_KEY = "edu-cz-sd-calculator-state";

type SdPersistedSnapshot = {
  pupils: number;
  manualDepts: boolean;
  departments: number;
};

function parseSdSnapshot(data: unknown): SdPersistedSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const pupils = r.pupils;
  const manualDepts = r.manualDepts;
  const departments = r.departments;
  if (typeof pupils !== "number" || !Number.isFinite(pupils) || pupils < 0) return null;
  if (typeof manualDepts !== "boolean") return null;
  if (typeof departments !== "number" || !Number.isFinite(departments) || departments < 1) return null;
  return { pupils, manualDepts, departments };
}

function loadSdStateFromStorage(): SdPersistedSnapshot {
  try {
    const raw = localStorage.getItem(SD_STORAGE_KEY);
    if (!raw) return { pupils: 0, manualDepts: false, departments: 1 };
    const parsed = parseSdSnapshot(JSON.parse(raw));
    return parsed ?? { pupils: 0, manualDepts: false, departments: 1 };
  } catch {
    return { pupils: 0, manualDepts: false, departments: 1 };
  }
}

export function PhmaxSdPage({ productView, setProductView }: PhmaxSdPageProps) {
  const [pupils, setPupils] = useState(() => loadSdStateFromStorage().pupils);
  const [manualDepts, setManualDepts] = useState(() => loadSdStateFromStorage().manualDepts);
  const [departments, setDepartments] = useState(() => loadSdStateFromStorage().departments);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uiNotice, setUiNotice] = useState("");
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(SD_ONBOARDING_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const dismissGuide = useCallback(() => {
    try {
      localStorage.setItem(SD_ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuideOpen(false);
  }, []);

  const openGuide = useCallback(() => {
    try {
      localStorage.removeItem(SD_ONBOARDING_KEY);
    } catch {
      /* ignore */
    }
    setGuideOpen(true);
  }, []);

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

  const exportRows = useMemo(
    () =>
      buildPhmaxSdExportRows({
        pupils,
        effectiveDepts,
        manualDepts,
        suggested,
        avgPerDept,
        basePhmax,
        reduction,
        breakdown,
        tableWarning,
      }),
    [
      pupils,
      effectiveDepts,
      manualDepts,
      suggested,
      avgPerDept,
      basePhmax,
      reduction,
      breakdown,
      tableWarning,
    ]
  );

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
      setUiNotice("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNotice("Export do Excelu se nepodařil.");
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const buildSdSnapshot = useCallback(
    (): SdPersistedSnapshot => ({ pupils, manualDepts, departments }),
    [pupils, manualDepts, departments],
  );

  const applySdSnapshot = useCallback((data: unknown) => {
    const next = parseSdSnapshot(data);
    if (next) {
      setPupils(next.pupils);
      setManualDepts(next.manualDepts);
      setDepartments(next.departments);
      setUiNotice("Data byla obnovena.");
    } else {
      setUiNotice("Uložená data nejsou ve očekávaném tvaru.");
    }
  }, []);

  const saveSdSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
      setUiNotice("Rozpracované údaje byly uloženy.");
    } catch {
      setUiNotice("Uložení se nepodařilo.");
    }
  }, [buildSdSnapshot]);

  const restoreSdSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(SD_STORAGE_KEY);
      if (!raw) {
        setUiNotice("Nebyla nalezena žádná uložená data.");
        return;
      }
      applySdSnapshot(JSON.parse(raw));
    } catch {
      setUiNotice("Obnovení uložených dat se nepodařilo.");
    }
  }, [applySdSnapshot]);

  const clearSdStoredSnapshot = useCallback(() => {
    try {
      localStorage.removeItem(SD_STORAGE_KEY);
      setLastSavedAt("");
      setUiNotice("Uložená data v prohlížeči byla vymazána.");
    } catch {
      setUiNotice("Vymazání uložených dat se nepodařilo.");
    }
  }, []);

  const resetSdAll = useCallback(() => {
    setPupils(0);
    setManualDepts(false);
    setDepartments(1);
    setUiNotice("Všechna vstupní data kalkulačky byla vymazána.");
  }, []);

  const buildSdSummaryText = useCallback(() => {
    const phmaxLine =
      basePhmax != null ? `PHmax (po krácení): ${formatSdHours(reduction.adjusted)}` : "PHmax: —";
    const baseLine = basePhmax != null ? `PHmax (základ z tabulky): ${formatSdHours(basePhmax)}` : "";
    const kraceni = reduction.applied
      ? `ano (${(Math.round(reduction.factor * 1000) / 10).toLocaleString("cs-CZ")} %)`
      : "ne";
    return [
      "Shrnutí – PHmax, školní družina",
      "",
      `Čas: ${new Date().toLocaleString("cs-CZ")}`,
      `Účastníci (1. st.): ${pupils}`,
      `Oddělení (výpočet): ${effectiveDepts}${manualDepts ? " (ruční zadání)" : ` (navrženo ${suggested})`}`,
      baseLine,
      phmaxLine,
      `Krácení § 10 odst. 2: ${kraceni}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [pupils, effectiveDepts, manualDepts, suggested, basePhmax, reduction]);

  const copySdSummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildSdSummaryText());
      setUiNotice("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNotice("Kopírování do schránky se nepodařilo.");
    }
  }, [buildSdSummaryText]);

  const printSdSummary = useCallback(() => {
    const text = buildSdSummaryText().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí PHmax ŠD</title>` +
        `<style>body{font-family:system-ui,Segoe UI,sans-serif;margin:16px;font-size:11pt;line-height:1.45;color:#0f172a}</style>` +
        `</head><body><h1 style="font-size:13pt">Shrnutí – školní družina</h1><p>${text}</p></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [buildSdSummaryText]);

  useEffect(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch {
      /* ignore */
    }
  }, [buildSdSnapshot]);

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <div className="hero__pills-row-trailing">
            <button
              type="button"
              className="btn btn--hero-help"
              onClick={() => (guideOpen ? dismissGuide() : openGuide())}
              aria-expanded={guideOpen}
            >
              {guideOpen ? "Skrýt nápovědu" : "Nápověda"}
            </button>
          </div>
        </div>

        <div className="grid two hero__grid">
          <div>
            <h1 className="hero__title hero__title--sd">PHmax ve školní družině</h1>
            <p className="hero__text hero__text--sd">
              Orientační výpočet podle{" "}
              <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
              <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
              počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
              čtyř oddělení platí další pravidla — vždy vycházejte z úplného znění vyhlášky a metodiky.
            </p>
          </div>
          <div className="hero__stats hero__stats--compact hero__stats--sd">
            <HeroStat compact label="Účastníci (1. st.)" value={pupils} />
            <HeroStat compact label="Oddělení" value={effectiveDepts} />
            <HeroStat
              compact
              label="PHmax"
              value={basePhmax != null ? formatSdHours(reduction.adjusted) : "—"}
            />
            <HeroStat
              compact
              label="Krácení § 10 odst. 2"
              value={
                reduction.applied
                  ? `ano (${(Math.round(reduction.factor * 1000) / 10).toLocaleString("cs-CZ")} %)`
                  : "ne"
              }
            />
          </div>
        </div>

        <div className="hero-actions hero-actions--stacked">
          <HeroActionsDrawer triggerLabel="Akce, tisk, uložení a export…" drawerTitle="Akce a export">
            <div className="hero-actions--stacked__row">
              <span className="hero-actions__cluster" role="group" aria-label="Tisk">
                <button type="button" className="btn btn--light" onClick={() => window.print()}>
                  Tisk
                </button>
                <button type="button" className="btn btn--light" onClick={printSdSummary}>
                  Tisk shrnutí
                </button>
              </span>
              <span className="hero-actions__cluster hero-actions__cluster--after" role="group" aria-label="Ukládání">
                <button type="button" className="btn ghost" onClick={saveSdSnapshotManually}>
                  Uložit
                </button>
                <button type="button" className="btn ghost" onClick={restoreSdSnapshot}>
                  Obnovit
                </button>
              </span>
            </div>
            <div className="hero-actions--stacked__row hero-actions__group--meta">
              <button type="button" className="btn ghost" onClick={clearSdStoredSnapshot}>
                Vymazat uložená data
              </button>
              <button type="button" className="btn ghost" onClick={resetSdAll}>
                Vymazat všechny údaje
              </button>
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions--stacked__row">
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
              <button type="button" className="btn ghost" onClick={() => void copySdSummary()}>
                Kopírovat shrnutí
              </button>
            </div>
          </HeroActionsDrawer>
        </div>

        <div className="hero-status">
          <div className="hero-status__item">
            <strong>Automatické ukládání:</strong> probíhá průběžně v tomto prohlížeči.
          </div>
          <div className="hero-status__item">
            <strong>Poslední uložení:</strong> {lastSavedAt || "zatím neproběhlo"}
          </div>
          {uiNotice ? <div className="hero-status__item hero-status__item--notice">{uiNotice}</div> : null}
        </div>
      </header>

      <QuickOnboarding title="Jak s touto kalkulačkou pracovat" open={guideOpen} onDismiss={dismissGuide}>
        <p>
          Vyplňte počet účastníků a případně počet oddělení (jinak se dopočítá dělením 27). Výsledek vychází z přílohy k
          vyhlášce č. 74/2005 Sb.; u průměru pod 20 na oddělení může aplikovat orientační krácení dle § 10 odst. 2.
          Složité případy (§ 16 školského zákona, méně než čtyři oddělení) musíte ověřit v plném znění předpisů.
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
        <p className="muted-text" style={{ marginTop: 0, marginBottom: 12, fontSize: "0.9rem" }}>
          Export do CSV a Excelu a kopírování shrnutí najdete v horní liště pod nadpisem stránky.
        </p>
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
