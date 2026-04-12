import React from "react";

export type ProductView = "zs" | "sd";

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
        aria-selected={productView === "sd"}
        className={`pill pill--hero pill--hero-toggle${productView === "sd" ? " pill--hero-toggle--active" : ""}`}
        onClick={() => setProductView("sd")}
      >
        PHmax – školní družina
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
