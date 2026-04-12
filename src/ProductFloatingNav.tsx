import React, { useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";

type ProductFloatingNavProps = {
  active: ProductView;
  setProductView: (v: ProductView) => void;
};

export function ProductFloatingNav({ active, setProductView }: ProductFloatingNavProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="scroll-tools scroll-tools--with-product" role="toolbar" aria-label="Rychlá navigace a přepnutí kalkulačky">
      <button type="button" className="scroll-tools__btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Nahoru
      </button>
      <div className="scroll-tools__product-btns" role="group" aria-label="Přepnout typ kalkulačky">
        <button
          type="button"
          className={`scroll-tools__btn${active === "pv" ? " scroll-tools__btn--active" : ""}`}
          title="Kalkulačka pro předškolní vzdělávání"
          onClick={() => setProductView("pv")}
        >
          PV
        </button>
        <button
          type="button"
          className={`scroll-tools__btn${active === "sd" ? " scroll-tools__btn--active" : ""}`}
          title="Kalkulačka pro školní družiny"
          onClick={() => setProductView("sd")}
        >
          ŠD
        </button>
        <button
          type="button"
          className={`scroll-tools__btn${active === "zs" ? " scroll-tools__btn--active" : ""}`}
          title="Kalkulačka pro základní školy"
          onClick={() => setProductView("zs")}
        >
          ZŠ
        </button>
      </div>
    </div>
  );
}
