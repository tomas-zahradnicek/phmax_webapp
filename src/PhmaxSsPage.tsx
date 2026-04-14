import React, { useCallback, useRef, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { GlossaryDialog, type GlossaryTerm } from "./GlossaryDialog";
import { GlossaryIconButton } from "./GlossaryIconButton";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconJson,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSaveQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { HeroStat } from "./HeroStat";
import { HeroStatusBar } from "./HeroStatusBar";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { QuickOnboarding } from "./QuickOnboarding";
import {
  PHMAX_SS_FRAMEWORK_FIRST_PHASE,
  PHMAX_SS_LEGISLATIVE_MD_REL_PATH,
  PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES,
  PHMAX_SS_MAX_NAMED_SNAPSHOTS,
  PHMAX_SS_METHODOLOGY_LABEL,
  PHMAX_SS_MSMT_PAGE_URL,
  PHMAX_SS_RIZENI_SKOLY_URL,
  PHMAX_SS_SOURCE_FOLDER_HINT,
  SS_HERO_EXAMPLE_LEGEND,
} from "./ss/phmax-ss-constants";
import { PhmaxSsUnitsForm, type SsDashboardMetrics } from "./ss/PhmaxSsUnitsForm";
import { usePhmaxSsUnits, type SsNamedSnapshot } from "./ss/use-phmax-ss-units";

const SS_GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    term: "PHmax",
    description:
      "U středních škol orientační součet maximálního týdenního rozsahu přímé pedagogické činnosti podle pravidel pro dílčí jednotky (obory, třídy, režimy) dle metodiky MŠMT a souvisejících předpisů.",
  },
  {
    term: "PHAmax",
    description:
      "Obdobně jako u základního vzdělávání jde o horní mez rozsahu přímé pedagogické činnosti asistenta pedagoga; v této kalkulačce SŠ je zatím zaměření na PHmax u dílčích jednotek, PHAmax může přibýt v další fázi.",
  },
  {
    term: "Dílčí jednotka výpočtu",
    description:
      "Řádek evidence třídy nebo skupiny s kódem oboru, průměrem žáků, počtem tříd a zvoleným režimem PHmax. Z něj aplikace dopočítá orientační PHmax a kontrolu pravidel.",
  },
];

type PhmaxSsPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxSsPage({ productView, setProductView }: PhmaxSsPageProps) {
  const fw = PHMAX_SS_FRAMEWORK_FIRST_PHASE;
  const [ssMetrics, setSsMetrics] = useState<SsDashboardMetrics>({ rowCount: 1, phmaxTotal: 0 });
  const ss = usePhmaxSsUnits(setSsMetrics);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [ssGuideOpen, setSsGuideOpen] = useState(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleSsGuideFromHero = useCallback(() => {
    setSsGuideOpen((o) => !o);
  }, []);

  const phmaxHeroValue = ssMetrics.phmaxTotal.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <div className="hero__pills-row-trailing">
            <GlossaryIconButton
              ref={glossaryTriggerRef}
              className="glossary-icon-btn--hero"
              onClick={() => setGlossaryOpen(true)}
            />
            <button type="button" className="btn btn--hero-guide" onClick={toggleSsGuideFromHero}>
              {ssGuideOpen ? "Skrýt nápovědu" : "Stručné pokyny"}
            </button>
          </div>
        </div>

        <div className="grid two hero__grid">
          <div>
            <h1 className="hero__title">PHmax a PHAmax – střední školy</h1>
            <p className="hero__text">
              Přehledná kalkulačka pro <strong>střední vzdělávání</strong> podle{" "}
              <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                {PHMAX_SS_METHODOLOGY_LABEL}
              </a>
              . Doplňující souvislosti:{" "}
              <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                metodické doporučení (ŘŠ)
              </a>
              . Kód SŠ je oddělený od ZŠ, PV a ŠD (složka{" "}
              <code className="methodology-strip__code">src/ss/</code>).
            </p>
            <p className="hero__note" style={{ marginTop: 10 }}>
              {PHMAX_SS_SOURCE_FOLDER_HINT} Příklad názvu souboru:{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES[0]}</code>. Legislativní vrstva
              (pravidla × zdroj):{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LEGISLATIVE_MD_REL_PATH}</code>.
            </p>
          </div>
          <div className="hero__stats">
            <HeroStat label="Aktivní modul" value="PHmax SŠ" />
            <HeroStat label="Zvolený režim" value="Evidence dílčích jednotek" />
            <HeroStat label="Výsledek PHmax" value={phmaxHeroValue} />
            <HeroStat label="Výsledek PHAmax" value="–" />
            <HeroStat label="Řádků ve formuláři" value={ssMetrics.rowCount} />
          </div>
        </div>

        <div className="hero-actions">
          <div className="field field--hero-select hero-actions__example">
            <span className="field__label field__label--hero" id="ss-hero-example-label">
              Ukázkový příklad
            </span>
            <select
              id="ss-hero-example-select"
              aria-labelledby="ss-hero-example-label"
              aria-describedby="ss-hero-example-legend"
              disabled
              value=""
            >
              <option value="">Vyberte ukázkový příklad…</option>
            </select>
            <p
              id="ss-hero-example-legend"
              className="muted-text"
              style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "44rem", lineHeight: 1.5 }}
            >
              {SS_HERO_EXAMPLE_LEGEND}
            </p>
          </div>
          <HeroActionsDrawer>
            <div className="hero-actions__group hero-actions__group--primary">
              <HeroIconActionButton
                className="btn btn--light"
                label="Tisk stránky"
                icon={<IconPrint />}
                onClick={() => window.print()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Rychle uložit průběh do prohlížeče"
                icon={<IconSaveQuick />}
                onClick={ss.saveSnapshotManually}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Rychle obnovit uložený průběh"
                icon={<IconRestoreQuick />}
                onClick={ss.restoreSnapshot}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--meta">
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat uložená data v prohlížeči"
                icon={<IconClearStored />}
                onClick={ss.clearStoredSnapshot}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat všechny údaje ve formuláři"
                icon={<IconResetAll />}
                onClick={ss.resetAll}
              />
            </div>
            <div className="hero-actions__group hero-actions__group--named">
              <div className="hero-named-grid" aria-label="Export a pojmenované zálohy">
                <label className="hero-named-field hero-named-field--export">
                  <span className="field__label field__label--hero-named">Označení pro export</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. název školy, školní rok…"
                    value={ss.exportLabel}
                    onChange={(e) => ss.setExportLabel(e.target.value)}
                    aria-label="Označení pro export a shrnutí"
                  />
                </label>
                <label className="hero-named-field hero-named-field--backup-name">
                  <span className="field__label field__label--hero-named">Název zálohy</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. stav 2026/27"
                    value={ss.namedSaveName}
                    onChange={(e) => ss.setNamedSaveName(e.target.value)}
                    aria-label="Název pojmenované zálohy"
                  />
                </label>
                <div className="hero-named-field hero-named-field--save">
                  <span className="hero-named-field__btn-slot" aria-hidden="true" />
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.saveNamedSsSnapshot}>
                    Uložit do seznamu
                  </button>
                </div>
                <div className="hero-named-field hero-named-field--select">
                  <select
                    className="input"
                    value={ss.selectedNamedId}
                    onChange={(e) => ss.setSelectedNamedId(e.target.value)}
                    aria-label="Vybrat uloženou zálohu"
                  >
                    <option value="">Vyberte uloženou zálohu…</option>
                    {ss.namedSnapshots.map((n: SsNamedSnapshot) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hero-named-field hero-named-field--restore-delete">
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.restoreNamedSsSnapshot}>
                    Obnovit zálohu
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.deleteNamedSsSnapshot}>
                    Smazat zálohu
                  </button>
                </div>
                <div className="hero-named-field" style={{ gridColumn: "1 / -1" }}>
                  <button type="button" className="btn ghost btn--hero-named" onClick={ss.handleCompareSsWithNamedSnapshot}>
                    Porovnat aktuální stav se zálohou (JSON)…
                  </button>
                </div>
              </div>
            </div>

            <div className="hero-actions__group hero-actions__group--exports">
              <HeroIconActionButton
                className="btn ghost"
                label="Exportovat data jako CSV"
                icon={<IconCsv />}
                onClick={ss.handleExportCsv}
              />
              <HeroIconActionButton
                className="btn ghost"
                label={ss.xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout shrnutí jako Excel (.xlsx)"}
                icon={ss.xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                disabled={ss.xlsxExportBusy}
                aria-busy={ss.xlsxExportBusy}
                showLabel={ss.xlsxExportBusy}
                onClick={() => void ss.handleExportXlsx()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Kopírovat textové shrnutí do schránky"
                icon={<IconCopy />}
                onClick={() => void ss.copySummaryToClipboard()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Tisk textového shrnutí"
                icon={<IconPrintSummary />}
                onClick={ss.printSummaryWindow}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Stáhnout auditní protokol (JSON)"
                icon={<IconJson />}
                onClick={ss.handleExportSsAuditJson}
              />
            </div>
          </HeroActionsDrawer>
        </div>
      </header>

      <GlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={SS_GLOSSARY_TERMS}
        triggerRef={glossaryTriggerRef}
      />

      <QuickOnboarding
        title="Jak postupovat u střední školy"
        open={ssGuideOpen}
        onDismiss={() => setSsGuideOpen(false)}
        dismissButtonLabel="Skrýt nápovědu"
        anchorId="ss-quick-onboarding"
      >
        <p>
          Začněte u sekce <strong>{fw.heading}</strong>: ověřte, co zadáváte vy a co dopočítá aplikace. Poté v sekci{" "}
          <strong>evidence tříd a skupin</strong> doplňte řádky podle skutečné struktury – kód oboru, průměr žáků, forma
          studia a režim PHmax.
        </p>
        <p>
          Tabulka <strong>Orientační výpočet PHmax</strong> a <strong>Kontrola pravidel</strong> reagují na vyplnění; prázdné
          řádky bez kódu oboru se do výpočtu neberou.
        </p>
        <p>{EXPORT_ORIENTACNI_NOTE}</p>
        <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
        <p>
          Horní lišta je rozložená jako u ZŠ: tisk, rychlé uložení a obnovení z prohlížeče, vymazání úložiště a formuláře,
          pole „Označení pro export“, pojmenované zálohy (max. {PHMAX_SS_MAX_NAMED_SNAPSHOTS}), srovnání se zálohou (JSON)
          a export CSV, Excel, kopírování shrnutí, tisk shrnutí a auditní JSON.
        </p>
      </QuickOnboarding>

      <section
        className="card section-card section-card--ss"
        aria-labelledby="ss-framework-heading"
        style={{ marginTop: 24, marginBottom: 24 }}
      >
        <h2 id="ss-framework-heading" className="section-title">
          {fw.heading}
        </h2>
        <p className="muted-text" style={{ marginTop: 10, lineHeight: 1.55 }}>
          {fw.lead}
        </p>
        <p className="muted-text" style={{ marginTop: 10, lineHeight: 1.55 }}>
          <strong>V aplikaci:</strong> {fw.implementationNote}
        </p>

        <div className="grid two" style={{ marginTop: 18, gap: "18px 24px", alignItems: "start" }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem", fontWeight: 700 }}>
              Vstupy (uživatel / škola)
            </h3>
            <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
              {fw.inputs.map((line) => (
                <li key={line} style={{ marginBottom: 6 }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem", fontWeight: 700 }}>
              Výstupy (dopočítá aplikace)
            </h3>
            <ul className="muted-text" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
              {fw.outputs.map((line) => (
                <li key={line} style={{ marginBottom: 6 }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="muted-text" style={{ marginTop: 18, lineHeight: 1.55 }}>
          Přímý odkaz na tuto kalkulačku: <code className="methodology-strip__code">?view=ss</code>. Právní rámec v
          přehledu níže (rozbalení „Verze metodik a předpisy“) – u SŠ společně s{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2018-123" target="_blank" rel="noopener noreferrer" className="status-link">
            NV č. 123/2018 Sb.
          </a>{" "}
          a{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2005-75" target="_blank" rel="noopener noreferrer" className="status-link">
            NV č. 75/2005 Sb.
          </a>
          .
        </p>
      </section>

      <PhmaxSsUnitsForm model={ss} hideBackupSubcard />

      <MethodologyStrip />

      <footer className="zs-app-footer">
        <HeroStatusBar
          productLabel={PRODUCT_CALCULATOR_TITLES.ss}
          lastSavedAt=""
          notice=""
          variant="ss"
          placement="footer"
        />
        <AuthorCreditFooter />
      </footer>

      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}
