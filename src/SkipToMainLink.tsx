import React from "react";
import type { ProductView } from "./ProductViewPills";
import { PHMAX_CALCULATOR_MAIN_ID, PHMAX_DASHBOARD_MAIN_ID } from "./phmax-main-landmarks";

type SkipToMainLinkProps = {
  productView: ProductView;
};

export function SkipToMainLink({ productView }: SkipToMainLinkProps) {
  const isDash = productView === "dash";
  const href = isDash ? `#${PHMAX_DASHBOARD_MAIN_ID}` : `#${PHMAX_CALCULATOR_MAIN_ID}`;
  const label = isDash ? "Přeskočit na obsah" : "Přeskočit na výpočet";

  return (
    <a className="skip-link" href={href}>
      {label}
    </a>
  );
}
