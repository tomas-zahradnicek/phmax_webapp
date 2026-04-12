import React from "react";

export type ProductView = "zs" | "sd" | "pv";

type ProductViewPillsProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function ProductViewPills({ productView, setProductView }: ProductViewPillsProps) {
  return (
    <div className="hero__product-pills" role="tablist" aria-label="Výběr kalkulačky">
      <button
        type="button"
        role="tab"
        aria-selected={productView === "pv"}
        className={`pill pill--hero pill--hero-toggle${productView === "pv" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("pv")}
      >
        Kalkulačka pro předškolní vzdělávání
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={productView === "sd"}
        className={`pill pill--hero pill--hero-toggle${productView === "sd" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("sd")}
      >
        Kalkulačka pro školní družiny
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={productView === "zs"}
        className={`pill pill--hero pill--hero-toggle${productView === "zs" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("zs")}
      >
        Kalkulačka pro základní školy
      </button>
    </div>
  );
}
