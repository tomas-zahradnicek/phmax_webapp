import React from "react";

/**
 * Společná informace o právních a metodických zdrojích všech tří kalkulaček.
 */
export function MethodologyStrip() {
  return (
    <footer className="methodology-strip card muted" aria-label="Verze metodik a odkazy">
      <h2 className="methodology-strip__title">Verze metodik a předpisy</h2>
      <ul className="methodology-strip__list">
        <li>
          <strong>Základní vzdělávání (ZŠ):</strong> metodika PHmax / PHAmax / PHPmax pro ZV, verze 5 (březen 2026); NV
          č. 123/2018 Sb.; vyhl. č. 48/2005 Sb.
        </li>
        <li>
          <strong>Školní družina:</strong> příloha k vyhl. č. 74/2005 Sb., o zájmovém vzdělávání — tabulka PHmax podle
          počtu oddělení; metodické pokyny MŠMT k PHmax ŠD.{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2005-74" target="_blank" rel="noopener noreferrer" className="status-link">
            Zakonyprolidi.cz — vyhl. 74/2005
          </a>
        </li>
        <li>
          <strong>Předškolní vzdělávání (MŠ):</strong> metodika PHmax a PHAmax pro PV, verze 4 (2026); vyhl. č. 14/2005
          Sb.{" "}
          <a href="https://www.zakonyprolidi.cz/cs/2005-14" target="_blank" rel="noopener noreferrer" className="status-link">
            Zakonyprolidi.cz — vyhl. 14/2005
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
        speciální oddělení ŠD, více pracovišť najednou u PV — tam je třeba výpočet zopakovat a sečíst). Odkaz na
        konkrétní kalkulačku: přidejte k adrese parametr <code className="methodology-strip__code">?view=zs</code>,{" "}
        <code className="methodology-strip__code">?view=sd</code> nebo <code className="methodology-strip__code">?view=pv</code>.
      </p>
    </footer>
  );
}
