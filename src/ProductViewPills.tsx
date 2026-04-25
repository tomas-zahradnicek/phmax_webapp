import React, { useCallback } from "react";
import { PRODUCT_CALCULATOR_TITLES, type ProductViewCode } from "./calculator-ui-constants";

export type ProductView = ProductViewCode;

type ProductViewPillsProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const PILL_SHORT: Record<ProductView, string> = {
  pv: "PV",
  sd: "ŠD",
  zs: "ZŠ",
  ss: "SŠ",
  nv75: "NV75",
};

const TAB_ORDER: ProductView[] = ["pv", "sd", "zs", "ss", "nv75"];

export function ProductViewPills({ productView, setProductView }: ProductViewPillsProps) {
  const moveSelection = useCallback(
    (from: ProductView, delta: number) => {
      const i = TAB_ORDER.indexOf(from);
      if (i < 0) return;
      setProductView(TAB_ORDER[(i + delta + TAB_ORDER.length) % TAB_ORDER.length]);
    },
    [setProductView],
  );

  const onTabListKeyDown = useCallback(
    (e: React.KeyboardEvent, view: ProductView) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(view, 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(view, -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setProductView("pv");
      } else if (e.key === "End") {
        e.preventDefault();
        setProductView("nv75");
      }
    },
    [moveSelection, setProductView],
  );

  return (
    <div className="hero__product-pills" role="tablist" aria-label="Výběr kalkulačky">
      <button
        type="button"
        role="tab"
        tabIndex={productView === "pv" ? 0 : -1}
        aria-selected={productView === "pv"}
        title={PRODUCT_CALCULATOR_TITLES.pv}
        aria-label={PRODUCT_CALCULATOR_TITLES.pv}
        className={`pill pill--hero pill--hero-toggle${productView === "pv" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("pv")}
        onKeyDown={(e) => onTabListKeyDown(e, "pv")}
      >
        {PILL_SHORT.pv}
      </button>
      <button
        type="button"
        role="tab"
        tabIndex={productView === "sd" ? 0 : -1}
        aria-selected={productView === "sd"}
        title={PRODUCT_CALCULATOR_TITLES.sd}
        aria-label={PRODUCT_CALCULATOR_TITLES.sd}
        className={`pill pill--hero pill--hero-toggle${productView === "sd" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("sd")}
        onKeyDown={(e) => onTabListKeyDown(e, "sd")}
      >
        {PILL_SHORT.sd}
      </button>
      <button
        type="button"
        role="tab"
        tabIndex={productView === "zs" ? 0 : -1}
        aria-selected={productView === "zs"}
        title={PRODUCT_CALCULATOR_TITLES.zs}
        aria-label={PRODUCT_CALCULATOR_TITLES.zs}
        className={`pill pill--hero pill--hero-toggle${productView === "zs" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("zs")}
        onKeyDown={(e) => onTabListKeyDown(e, "zs")}
      >
        {PILL_SHORT.zs}
      </button>
      <button
        type="button"
        role="tab"
        tabIndex={productView === "ss" ? 0 : -1}
        aria-selected={productView === "ss"}
        title={PRODUCT_CALCULATOR_TITLES.ss}
        aria-label={PRODUCT_CALCULATOR_TITLES.ss}
        className={`pill pill--hero pill--hero-toggle${productView === "ss" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("ss")}
        onKeyDown={(e) => onTabListKeyDown(e, "ss")}
      >
        {PILL_SHORT.ss}
      </button>
      <button
        type="button"
        role="tab"
        tabIndex={productView === "nv75" ? 0 : -1}
        aria-selected={productView === "nv75"}
        title={PRODUCT_CALCULATOR_TITLES.nv75}
        aria-label={PRODUCT_CALCULATOR_TITLES.nv75}
        className={`pill pill--hero pill--hero-toggle${productView === "nv75" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("nv75")}
        onKeyDown={(e) => onTabListKeyDown(e, "nv75")}
      >
        {PILL_SHORT.nv75}
      </button>
    </div>
  );
}
