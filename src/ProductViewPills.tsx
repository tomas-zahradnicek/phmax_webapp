import React, { useCallback } from "react";
import { PRODUCT_CALCULATOR_TITLES, type ProductViewCode } from "./calculator-ui-constants";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";

export type ProductView = ProductViewCode;

type ProductViewPillsProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const PILL_SHORT: Record<ProductView, string> = {
  dash: "Přehled",
  pv: "PV",
  sd: "ŠD",
  zs: "ZŠ",
  ss: "SŠ",
  nv75: "NV75",
};

const TAB_ORDER: ProductView[] = ["dash", "pv", "sd", "zs", "ss", "nv75"];

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
        setProductView("dash");
      } else if (e.key === "End") {
        e.preventDefault();
        setProductView("nv75");
      }
    },
    [moveSelection, setProductView],
  );

  const onNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, view: ProductView) => {
      e.preventDefault();
      setProductView(view);
    },
    [setProductView],
  );

  return (
    <nav className="hero__product-pills" role="tablist" aria-label="Výběr kalkulačky">
      {TAB_ORDER.map((view) => {
        const active = productView === view;
        return (
          <a
            key={view}
            href={PRODUCT_VIEW_PATH[view]}
            role="tab"
            tabIndex={active ? 0 : -1}
            aria-selected={active}
            title={PRODUCT_CALCULATOR_TITLES[view]}
            aria-label={PRODUCT_CALCULATOR_TITLES[view]}
            className={`pill pill--hero pill--hero-toggle${active ? " pill--hero-toggle--active" : ""}`}
            onClick={(e) => onNavClick(e, view)}
            onKeyDown={(e) => onTabListKeyDown(e, view)}
          >
            {PILL_SHORT[view]}
          </a>
        );
      })}
    </nav>
  );
}
