import React from "react";
import { PRODUCT_USER_GUIDE_LABEL, USER_GUIDE_PATH } from "./calculator-ui-constants";

/** Odkaz na webový návod v řádku záložek modulů (vedle Přehled / PV / …). */
export function HeroUserGuideTabLink() {
  return (
    <a className="btn ghost calculator-hero-shell__guide-btn" href={USER_GUIDE_PATH} data-dash-tour="user-guide">
      {PRODUCT_USER_GUIDE_LABEL}
    </a>
  );
}
