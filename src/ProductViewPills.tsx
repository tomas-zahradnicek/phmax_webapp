import React from "react";
import { PRODUCT_CALCULATOR_TITLES } from "./calculator-ui-constants";

export type ProductView = "zs" | "sd" | "pv";

type ProductViewPillsProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
  /** Krátké popisky PV / ŠD / ZŠ v hero; plný název je v zápatí (HeroStatusBar). */
  compact?: boolean;
};

const PILL_SHORT: Record<ProductView, string> = {
  pv: "PV",
  sd: "ŠD",
  zs: "ZŠ",
};

export function ProductViewPills({ productView, setProductView, compact }: ProductViewPillsProps) {
  return (
    <div className="hero__product-pills" role="tablist" aria-label="Výběr kalkulačky">
      <button
        type="button"
        role="tab"
        aria-selected={productView === "pv"}
        title={PRODUCT_CALCULATOR_TITLES.pv}
        aria-label={PRODUCT_CALCULATOR_TITLES.pv}
        className={`pill pill--hero pill--hero-toggle${productView === "pv" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("pv")}
      >
        {compact ? PILL_SHORT.pv : PRODUCT_CALCULATOR_TITLES.pv}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={productView === "sd"}
        title={PRODUCT_CALCULATOR_TITLES.sd}
        aria-label={PRODUCT_CALCULATOR_TITLES.sd}
        className={`pill pill--hero pill--hero-toggle${productView === "sd" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("sd")}
      >
        {compact ? PILL_SHORT.sd : PRODUCT_CALCULATOR_TITLES.sd}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={productView === "zs"}
        title={PRODUCT_CALCULATOR_TITLES.zs}
        aria-label={PRODUCT_CALCULATOR_TITLES.zs}
        className={`pill pill--hero pill--hero-toggle${productView === "zs" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("zs")}
      >
        {compact ? PILL_SHORT.zs : PRODUCT_CALCULATOR_TITLES.zs}
      </button>
    </div>
  );
}
