import React from "react";
import { PROFIL_SKOLY_LABEL, PROFIL_SKOLY_PATH } from "./calculator-ui-constants";

/** Odkaz na profil školy v řádku záložek modulů. */
export function HeroProfilSkolyTabLink() {
  return (
    <a className="btn ghost calculator-hero-shell__guide-btn" href={PROFIL_SKOLY_PATH} data-dash-tour="profil-skoly">
      {PROFIL_SKOLY_LABEL}
    </a>
  );
}
