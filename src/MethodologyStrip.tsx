import React from "react";
import { UI_TEXTS_LAST_REVIEW_DATE } from "./calculator-ui-constants";
import { MsmtMetodikaDownloadLink } from "./MsmtMetodikaDownloadLink";
import {
  PHMAX_MSMT_METODIKA_BY_ID,
  PHMAX_MSMT_METODIKY_HUB_URL,
} from "./phmax-msmt-metodiky";
import { PHMAX_SS_METHODOLOGY_LABEL, PHMAX_SS_RIZENI_SKOLY_URL } from "./ss/phmax-ss-constants";

/**
 * Společné metodiky a předpisy pro všechny kalkulačky – text pod rozbalitelným shrnutím.
 */
export function MethodologyStrip() {
  const [open, setOpen] = React.useState(false);
  const ssDoc = PHMAX_MSMT_METODIKA_BY_ID.ss;
  return (
    <details
      className="methodology-strip methodology-strip--collapsible card muted"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="methodology-strip__summary" aria-expanded={open}>
        Verze metodik a předpisy
      </summary>
      <div className="methodology-strip__panel">
        <p className="muted-text methodology-strip__note" style={{ marginTop: 0 }}>
          Oficiální metodiky MŠMT k výpočtu PHmax:{" "}
          <a href={PHMAX_MSMT_METODIKY_HUB_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            přehled na msmt.gov.cz
          </a>
          .
        </p>
        <ul className="methodology-strip__list">
          <li>
            <strong>Základní vzdělávání (ZŠ):</strong> {PHMAX_MSMT_METODIKA_BY_ID.zv.versionLabel}; NV č. 123/2018 Sb.;
            vyhl. č. 48/2005 Sb.;{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-75" target="_blank" rel="noopener noreferrer" className="status-link">
              NV č. 75/2005 Sb.
            </a>{" "}
            (rozsah přímé výuky);{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2004-561" target="_blank" rel="noopener noreferrer" className="status-link">
              zákon č. 561/2004 Sb. (školský zákon)
            </a>
            . <MsmtMetodikaDownloadLink metodikaId="zv" />.
          </li>
          <li>
            <strong>Školní družina:</strong> příloha k vyhl. č. 74/2005 Sb., o zájmovém vzdělávání – tabulka PHmax podle
            počtu oddělení.{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-74" target="_blank" rel="noopener noreferrer" className="status-link">
              Zakonyprolidi.cz – vyhl. 74/2005
            </a>
            . <MsmtMetodikaDownloadLink metodikaId="sd" />.
          </li>
          <li>
            <strong>Předškolní vzdělávání (MŠ):</strong> {PHMAX_MSMT_METODIKA_BY_ID.pv.versionLabel}; vyhl. č. 14/2005
            Sb.{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-14" target="_blank" rel="noopener noreferrer" className="status-link">
              Zakonyprolidi.cz – vyhl. 14/2005
            </a>
            . <MsmtMetodikaDownloadLink metodikaId="pv" />.
          </li>
          <li>
            <strong>Střední vzdělávání (SŠ):</strong> {PHMAX_SS_METHODOLOGY_LABEL}. Rámec zákona:{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2018-123" target="_blank" rel="noopener noreferrer" className="status-link">
              NV č. 123/2018 Sb.
            </a>
            ; vyhláška o přijímání ke vzdělávání ve SŠ:{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-13" target="_blank" rel="noopener noreferrer" className="status-link">
              vyhl. č. 13/2005 Sb.
            </a>
            .{" "}
            <a href={ssDoc.pageUrl} target="_blank" rel="noopener noreferrer" className="status-link">
              Stránka MŠMT (metodika SŠ)
            </a>
            ; <MsmtMetodikaDownloadLink metodikaId="ss" />;{" "}
            <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
              metodické doporučení (ŘŠ)
            </a>
            .
          </li>
          <li>
            <strong>NV75 (banka odpočtů zástupce):</strong> samostatná metodika PHmax neexistuje – modul pracuje s rozsahy
            přímé výuky dle{" "}
            <a href="https://www.zakonyprolidi.cz/cs/2005-75" target="_blank" rel="noopener noreferrer" className="status-link">
              NV č. 75/2005 Sb.
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
          <code className="methodology-strip__code">?view=sd</code>, <code className="methodology-strip__code">?view=pv</code>{" "}
          nebo <code className="methodology-strip__code">?view=ss</code>.
        </p>
        <p className="methodology-strip__note muted-text">
          UI texty v aplikaci byly naposledy redakčně kontrolovány: <strong>{UI_TEXTS_LAST_REVIEW_DATE}</strong>.
        </p>
      </div>
    </details>
  );
}
