import React from "react";
import {
  BROWSER_STORAGE_HINT_SIMPLE,
  BROWSER_STORAGE_HINT_ZS,
} from "./calculator-ui-constants";

type HeroStatusBarProps = {
  lastSavedAt: string;
  notice: string;
  variant: "zs" | "pv" | "sd";
  /** V zápatí stránky (světlé pozadí) místo v modrém hero. */
  placement?: "hero" | "footer";
};

/**
 * Stav ukládání a hlášky — v hero (PV/ŠD/ZŠ) nebo v zápatí (ZŠ).
 */
export function HeroStatusBar({ lastSavedAt, notice, variant, placement = "hero" }: HeroStatusBarProps) {
  const storageHint = variant === "zs" ? BROWSER_STORAGE_HINT_ZS : BROWSER_STORAGE_HINT_SIMPLE;

  return (
    <div className={placement === "footer" ? "hero-status hero-status--footer" : "hero-status"}>
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
