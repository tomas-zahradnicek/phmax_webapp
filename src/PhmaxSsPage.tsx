import React from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { PRODUCT_CALCULATOR_TITLES } from "./calculator-ui-constants";
import { HeroStatusBar } from "./HeroStatusBar";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import {
  PHMAX_SS_FRAMEWORK_FIRST_PHASE,
  PHMAX_SS_LEGISLATIVE_MD_REL_PATH,
  PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES,
  PHMAX_SS_METHODOLOGY_LABEL,
  PHMAX_SS_MSMT_PAGE_URL,
  PHMAX_SS_RIZENI_SKOLY_URL,
  PHMAX_SS_SOURCE_FOLDER_HINT,
} from "./ss/phmax-ss-constants";
import { PhmaxSsUnitsForm } from "./ss/PhmaxSsUnitsForm";

type PhmaxSsPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxSsPage({ productView, setProductView }: PhmaxSsPageProps) {
  const fw = PHMAX_SS_FRAMEWORK_FIRST_PHASE;

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
        </div>

        <div className="grid two hero__grid">
          <div>
            <h1 className="hero__title hero__title--sd">PHmax a PHAmax – střední školy</h1>
            <p className="hero__text hero__text--sd">
              Samostatná kalkulačka pro <strong>střední vzdělávání</strong> podle{" "}
              <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                {PHMAX_SS_METHODOLOGY_LABEL}
              </a>
              . Doplňující souvislosti:{" "}
              <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
                metodické doporučení (ŘŠ)
              </a>
              . Kód kalkulačky SŠ je oddělený od ZŠ, PV a ŠD (složka{" "}
              <code className="methodology-strip__code">src/ss/</code>).
            </p>
            <p className="hero__note hero__text--sd" style={{ marginTop: 10 }}>
              {PHMAX_SS_SOURCE_FOLDER_HINT} Příklad názvu souboru:{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES[0]}</code>. Legislativní vrstva
              (pravidla × zdroj):{" "}
              <code className="methodology-strip__code">{PHMAX_SS_LEGISLATIVE_MD_REL_PATH}</code>.
            </p>
          </div>
          <div className="hero__stats hero__stats--compact hero__stats--sd">
            <div className="card muted" style={{ padding: "14px 16px", textAlign: "left" }}>
              <strong>Stav:</strong> sekce 2 – evidence řádků a orientační PHmax z datasetu v{" "}
              <code className="methodology-strip__code">src/ss/data/</code>; stejně jako u PV, ŠD a ZŠ lze stáhnout{" "}
              <strong>auditní protokol (JSON)</strong> a <strong>porovnání s pojmenovanou zálohou</strong>. PHAmax a plné
              víceoborové režimy budou doplněny.
            </div>
          </div>
        </div>
      </header>

      <section className="card" aria-labelledby="ss-framework-heading" style={{ marginTop: 24, marginBottom: 24 }}>
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

      <PhmaxSsUnitsForm />

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
