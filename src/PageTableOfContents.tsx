import React, { useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";

export type PageTocSection = {
  id: string;
  label: string;
};

type PageTableOfContentsProps = {
  sections: readonly PageTocSection[];
  productView?: ProductView;
  setProductView?: (v: ProductView) => void;
};

function scrollToSection(sectionId: string) {
  const el =
    document.querySelector(`[data-section="${sectionId}"]`) ??
    document.getElementById(sectionId);
  if (el instanceof HTMLElement) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Sticky navigace: obsah stránky + volitelně přepnutí kalkulačky (místo kulatých Σ/PV tlačítek).
 */
export function PageTableOfContents({ sections, productView, setProductView }: PageTableOfContentsProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show || sections.length === 0) return null;

  return (
    <nav className="page-toc" aria-label="Obsah stránky">
      <button
        type="button"
        className="page-toc__btn page-toc__btn--top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        Nahoru
      </button>
      <p className="page-toc__heading">Obsah</p>
      <ul className="page-toc__list">
        {sections.map((s) => (
          <li key={s.id}>
            <button type="button" className="page-toc__link" onClick={() => scrollToSection(s.id)}>
              {s.label}
            </button>
          </li>
        ))}
      </ul>
      {productView != null && setProductView != null ? (
        <div className="page-toc__products" role="group" aria-label="Přepnout kalkulačku">
          <p className="page-toc__heading page-toc__heading--sub">Kalkulačka</p>
          {(
            [
              ["dash", "Přehled"],
              ["pv", "PV"],
              ["sd", "ŠD"],
              ["zs", "ZŠ"],
              ["ss", "SŠ"],
              ["nv75", "NV75"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`page-toc__product${productView === id ? " page-toc__product--active" : ""}`}
              onClick={() => setProductView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
