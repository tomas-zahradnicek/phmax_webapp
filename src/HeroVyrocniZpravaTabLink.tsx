import React from "react";
import { VYROCNI_ZPRAVA_LABEL, VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";

/** Odkaz na modul výroční zprávy v řádku záložek modulů (vedle Přehled / PV / …). */
export function HeroVyrocniZpravaTabLink() {
  return (
    <a className="btn ghost calculator-hero-shell__guide-btn" href={VYROCNI_ZPRAVA_PATH} data-dash-tour="vyrocni-zprava">
      {VYROCNI_ZPRAVA_LABEL}
    </a>
  );
}
