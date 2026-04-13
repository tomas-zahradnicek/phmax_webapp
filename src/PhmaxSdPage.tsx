import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  EXPORT_ORIENTACNI_NOTE,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { getAppAuthorPrintFooterHtml, stripAppAuthorCreditFromPlainSummary } from "./app-author-print";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSaveQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import { HeroStatusBar } from "./HeroStatusBar";
import { HeroStat } from "./HeroStat";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { InputOutputLegend, NumberField, ResultCard } from "./phmax-zs-ui";
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
const SD_NAMED_SNAPSHOTS_LS_KEY = "edu-cz-sd-named-snapshots-v1";
const SD_MAX_NAMED_SNAPSHOTS = 10;

type SdPersistedSnapshot = {
  pupils: number;
  manualDepts: boolean;
  departments: number;
};

type NamedSdSnapshot = { id: string; name: string; savedAt: string; snapshot: SdPersistedSnapshot };

function readNamedSdSnapshotsFromLs(): NamedSdSnapshot[] {
  try {
    const raw = localStorage.getItem(SD_NAMED_SNAPSHOTS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: NamedSdSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeNamedSdSnapshotsToLs(items: NamedSdSnapshot[]) {
  try {
    localStorage.setItem(SD_NAMED_SNAPSHOTS_LS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

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
  const [namedSnapshots, setNamedSnapshots] = useState<NamedSdSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
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

  useEffect(() => {
    setNamedSnapshots(readNamedSdSnapshotsFromLs());
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
      ? `Tabulka PHmax v této aplikaci končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními – u vyššího počtu použijte přílohu vyhlášky.`
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
          ["Vytvořil:", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
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

  const saveNamedSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const id = `n-${Date.now()}`;
    const item: NamedSdSnapshot = { id, name, savedAt: new Date().toISOString(), snapshot: buildSdSnapshot() };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, SD_MAX_NAMED_SNAPSHOTS);
      writeNamedSdSnapshotsToLs(next);
      return next;
    });
    setNamedSaveName("");
    setUiNotice(`Záloha „${name}“ uložena do seznamu (max. ${SD_MAX_NAMED_SNAPSHOTS}).`);
  }, [buildSdSnapshot, namedSaveName]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice("Vyberte pojmenovanou zálohu v seznamu.");
      return;
    }
    applySdSnapshot(item.snapshot);
    setUiNotice(`Obnovena záloha „${item.name}“.`);
  }, [applySdSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNotice("Vyberte zálohu ke smazání.");
      return;
    }
    setNamedSnapshots((prev) => {
      const next = prev.filter((x) => x.id !== selectedNamedId);
      writeNamedSdSnapshotsToLs(next);
      return next;
    });
    setSelectedNamedId("");
    setUiNotice("Pojmenovaná záloha byla smazána.");
  }, [selectedNamedId]);

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
      basePhmax != null ? `PHmax (po krácení): ${formatSdHours(reduction.adjusted)}` : "PHmax: –";
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
      "",
      APP_AUTHOR_CREDIT_LINE,
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
    const plain = stripAppAuthorCreditFromPlainSummary(buildSdSummaryText());
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí PHmax ŠD</title>` +
        `<style>body{font-family:system-ui,Segoe UI,sans-serif;margin:16px;font-size:11pt;line-height:1.45;color:#0f172a}a{color:#1d4ed8}</style>` +
        `</head><body><h1 style="font-size:13pt">Shrnutí – školní družina</h1><p>${text}</p>${getAppAuthorPrintFooterHtml()}</body></html>`,
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
              čtyř oddělení platí další pravidla – vždy vycházejte z úplného znění vyhlášky a metodiky.
            </p>
          </div>
          <div className="hero__stats hero__stats--compact hero__stats--sd">
            <HeroStat compact label="Účastníci (1. st.)" value={pupils} />
            <HeroStat compact label="Oddělení" value={effectiveDepts} />
            <HeroStat
              compact
              label="PHmax"
              value={basePhmax != null ? formatSdHours(reduction.adjusted) : "–"}
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
          <HeroActionsDrawer>
            <div className="hero-actions--stacked__row">
              <span className="hero-actions__cluster" role="group" aria-label="Tisk">
                <HeroIconActionButton
                  className="btn btn--light"
                  label="Tisk stránky"
                  icon={<IconPrint />}
                  onClick={() => window.print()}
                />
                <HeroIconActionButton
                  className="btn btn--light"
                  label="Tisk textového shrnutí"
                  icon={<IconPrintSummary />}
                  onClick={printSdSummary}
                />
              </span>
              <span className="hero-actions__cluster hero-actions__cluster--after" role="group" aria-label="Ukládání">
                <HeroIconActionButton
                  className="btn ghost"
                  label="Rychle uložit průběh do prohlížeče"
                  icon={<IconSaveQuick />}
                  onClick={saveSdSnapshotManually}
                />
                <HeroIconActionButton
                  className="btn ghost"
                  label="Rychle obnovit uložený průběh"
                  icon={<IconRestoreQuick />}
                  onClick={restoreSdSnapshot}
                />
              </span>
            </div>
            <div className="hero-actions--stacked__row hero-actions__group--meta">
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat uložená data v prohlížeči"
                icon={<IconClearStored />}
                onClick={clearSdStoredSnapshot}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat všechny údaje ve formuláři"
                icon={<IconResetAll />}
                onClick={resetSdAll}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions--stacked__row">
              <HeroIconActionButton
                className="btn ghost"
                label="Exportovat data jako CSV"
                icon={<IconCsv />}
                onClick={handleExportCsv}
              />
              <HeroIconActionButton
                className="btn ghost"
                label={xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout shrnutí jako Excel (.xlsx)"}
                icon={xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                disabled={xlsxExportBusy}
                aria-busy={xlsxExportBusy}
                showLabel={xlsxExportBusy}
                onClick={() => void handleExportXlsx()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Kopírovat textové shrnutí do schránky"
                icon={<IconCopy />}
                onClick={() => void copySdSummary()}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--named">
              <div className="hero-named-grid hero-named-grid--simple" aria-label="Pojmenované zálohy">
                <label className="hero-named-field hero-named-field--backup-name">
                  <span className="field__label field__label--hero-named">Název zálohy</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. varianta A"
                    value={namedSaveName}
                    onChange={(e) => setNamedSaveName(e.target.value)}
                    aria-label="Název pojmenované zálohy"
                  />
                </label>
                <div className="hero-named-field hero-named-field--save">
                  <span className="hero-named-field__btn-slot" aria-hidden="true" />
                  <button type="button" className="btn ghost btn--hero-named" onClick={saveNamedSnapshot}>
                    Uložit do seznamu
                  </button>
                </div>
                <div className="hero-named-field hero-named-field--select">
                  <select
                    className="input"
                    value={selectedNamedId}
                    onChange={(e) => setSelectedNamedId(e.target.value)}
                    aria-label="Vybrat uloženou zálohu"
                  >
                    <option value="">Vyberte uloženou zálohu…</option>
                    {namedSnapshots.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hero-named-field hero-named-field--restore-delete">
                  <button type="button" className="btn ghost btn--hero-named" onClick={restoreNamedSnapshot}>
                    Obnovit zálohu
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={deleteNamedSnapshot}>
                    Smazat zálohu
                  </button>
                </div>
              </div>
            </div>
          </HeroActionsDrawer>
        </div>

      </header>

      <QuickOnboarding
        title="Jak s touto kalkulačkou pracovat"
        open={guideOpen}
        onDismiss={dismissGuide}
        dismissButtonLabel="Skrýt nápovědu"
      >
        <p>
          Vyplňte počet účastníků a případně počet oddělení (jinak se dopočítá dělením 27). Výsledek vychází z přílohy k
          vyhlášce č. 74/2005 Sb.; u průměru pod 20 na oddělení může aplikovat orientační krácení dle § 10 odst. 2.
          Složité případy (§ 16 školského zákona, méně než čtyři oddělení) musíte ověřit v plném znění předpisů.
        </p>
        <p>{EXPORT_ORIENTACNI_NOTE}</p>
        <p>
          Export do CSV a Excelu a kopírování shrnutí najdete v horní liště pod nadpisem stránky.
        </p>
        <p>
          Počet účastníků = žáci 1. stupně ZŠ přihlášení k pravidelné denní docházce (pro krácení PHmax dle § 10 odst. 2).
          Počet oddělení pro nové oddělení nad první: průměr nad 27 účastníků → dělení počtem 27 a zaokrouhlení nahoru
          (u výjimek viz metodiku).
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
        <InputOutputLegend />

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
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
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
            </ScrollGrabRegion>
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
          méně než čtyři oddělení, výjimky zřizovatele) vycházejte z úplného znění vyhlášky a metodiky – odkazy níže.
        </p>
      </section>

      <MethodologyStrip />
      <footer className="zs-app-footer">
        <HeroStatusBar
          productLabel={PRODUCT_CALCULATOR_TITLES.sd}
          lastSavedAt={lastSavedAt}
          notice={uiNotice}
          variant="sd"
          placement="footer"
        />
        <AuthorCreditFooter />
      </footer>
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}
