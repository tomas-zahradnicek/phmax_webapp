import React from "react";
import {
  BROWSER_STORAGE_HINT_SIMPLE,
  BROWSER_STORAGE_HINT_ZS,
  type ProductViewCode,
} from "./calculator-ui-constants";

type HeroStatusBarProps = {
  lastSavedAt: string;
  notice: string;
  /** Stejné kódy jako u přepínače produktů (PV, ŠD, ZŠ, SŠ). */
  variant: ProductViewCode;
  /** V zápatí stránky (světlé pozadí) místo v modrém hero. */
  placement?: "hero" | "footer";
  /** Plný název kalkulačky (stejně jako dřív v záložkách hero). */
  productLabel?: string;
};

/**
 * Stav ukládání a hlášky – v hero (PV/ŠD) nebo v zápatí (ZŠ, PV, ŠD, SŠ).
 */
export function HeroStatusBar({
  lastSavedAt,
  notice,
  variant,
  placement = "hero",
  productLabel,
}: HeroStatusBarProps) {
  const storageHint =
    variant === "zs" ? BROWSER_STORAGE_HINT_ZS : BROWSER_STORAGE_HINT_SIMPLE;

  return (
    <div className={placement === "footer" ? "hero-status hero-status--footer" : "hero-status"}>
      {productLabel ? (
        <div className="hero-status__item hero-status__item--product">
          <strong>{productLabel}</strong>
        </div>
      ) : null}
      <div className="hero-status__item">
        <strong>Automatické ukládání:</strong> probíhá průběžně v tomto prohlížeči.
      </div>
      <div className="hero-status__item">
        <strong>Poslední uložení:</strong> {lastSavedAt || "zatím neproběhlo"}
      </div>
      <div className="hero-status__item hero-status__item--subtle">{storageHint}</div>
      {notice ? (
        <div
          className="hero-status__item hero-status__item--notice"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}
