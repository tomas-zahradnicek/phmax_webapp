import React from "react";

/**
 * Společné metodiky a předpisy pro všechny tři kalkulačky – text pod rozbalitelným shrnutím.
 */
export function MethodologyStrip() {
  return (
    <details className="methodology-strip methodology-strip--collapsible card muted">
      <summary className="methodology-strip__summary">Verze metodik a předpisy</summary>
      <div className="methodology-strip__panel">
        <ul className="methodology-strip__list">
          <li>
            <strong>Základní vzdělávání (ZŠ):</strong> metodika PHmax / PHAmax / PHPmax pro ZV, verze 5 (březen 2026); NV
            č. 123/2018 Sb.; vyhl. č. 48/2005 Sb.;{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-75" target="_blank" rel="noopener noreferrer" className="status-link">
              NV č. 75/2005 Sb.
            </a>{" "}
            (rozsah přímé výuky);{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2004-561" target="_blank" rel="noopener noreferrer" className="status-link">
              zákon č. 561/2004 Sb. (školský zákon)
            </a>
            .
          </li>
          <li>
            <strong>Školní družina:</strong> příloha k vyhl. č. 74/2005 Sb., o zájmovém vzdělávání – tabulka PHmax podle
            počtu oddělení; metodické pokyny MŠMT k PHmax ŠD.{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-74" target="_blank" rel="noopener noreferrer" className="status-link">
              Zakonyprolidi.cz – vyhl. 74/2005
            </a>
            .
          </li>
          <li>
            <strong>Předškolní vzdělávání (MŠ):</strong> metodika PHmax a PHAmax pro PV, verze 4 (2026); vyhl. č. 14/2005
            Sb.{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-14" target="_blank" rel="noopener noreferrer" className="status-link">
              Zakonyprolidi.cz – vyhl. 14/2005
            </a>
            ;{" "}
            <a
              href="https://edu.gov.cz/methodology/metodika-stanoveni-phmax-a-phamax-pro-predskolni-vzdelavani/"
              target="_blank"
              rel="noopener noreferrer"
              className="status-link"
            >
              Metodika MŠMT (PV)
            </a>
            .
          </li>
        </ul>
        <p className="methodology-strip__note muted-text">
          Aplikace slouží k orientačnímu výpočtu. Neřeší všechny výjimky (např. krácení PHmax u PV dle § 1d odst. 3,
          speciální oddělení ŠD). U předškolního vzdělávání: <strong>odloučená pracoviště</strong> a kombinace více druhů
          provozu vyžadují podle metodiky <strong>samostatný výpočet pro každé pracoviště a druh provozu</strong> a následný
          součet – kalkulačka PV jeden takový dílčí výpočet najednou; součet přes celou MŠ si uživatel vede sám. Odkaz na
          konkrétní kalkulačku: přidejte k adrese parametr <code className="methodology-strip__code">?view=zs</code>,{" "}
          <code className="methodology-strip__code">?view=sd</code> nebo <code className="methodology-strip__code">?view=pv</code>
          .
        </p>
      </div>
    </details>
  );
}
