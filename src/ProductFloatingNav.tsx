import React, { useCallback, useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";

type ProductFloatingNavProps = {
  active: ProductView;
  setProductView: (v: ProductView) => void;
};

const FLOAT_ITEMS: { view: ProductView; label: string; title: string }[] = [
  { view: "dash", label: "Σ", title: "Souhrnný přehled kalkulaček" },
  { view: "pv", label: "PV", title: "Kalkulačka pro předškolní vzdělávání" },
  { view: "sd", label: "ŠD", title: "Kalkulačka pro školní družiny" },
  { view: "zs", label: "ZŠ", title: "Kalkulačka pro základní školy" },
  { view: "ss", label: "SŠ", title: "Kalkulačka pro střední školy" },
  { view: "nv75", label: "NV75", title: "Kalkulačka NV75 – banka odpočtů zástupců" },
];

export function ProductFloatingNav({ active, setProductView }: ProductFloatingNavProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, view: ProductView) => {
      e.preventDefault();
      setProductView(view);
    },
    [setProductView],
  );

  if (!show) return null;

  return (
    <div className="scroll-tools scroll-tools--with-product" role="toolbar" aria-label="Rychlá navigace a přepnutí kalkulačky">
      <button type="button" className="scroll-tools__btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Nahoru
      </button>
      <nav className="scroll-tools__product-btns" aria-label="Přepnout typ kalkulačky">
        {FLOAT_ITEMS.map((item) => (
          <a
            key={item.view}
            href={PRODUCT_VIEW_PATH[item.view]}
            className={`scroll-tools__btn${active === item.view ? " scroll-tools__btn--active" : ""}`}
            title={item.title}
            onClick={(e) => onNavClick(e, item.view)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
