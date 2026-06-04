import React from "react";
import { APP_BRAND_LOGO_PATH } from "./calculator-ui-constants";
import type { ProductView } from "./ProductViewPills";

export type AppBrandLogoProps = {
  className?: string;
  alt?: string;
};

export function AppBrandLogo({ className, alt = "" }: AppBrandLogoProps) {
  return (
    <img
      src={APP_BRAND_LOGO_PATH}
      alt={alt}
      className={["app-brand-logo", "app-brand-logo--hero", className].filter(Boolean).join(" ")}
      width={80}
      height={80}
      decoding="async"
    />
  );
}

export type HeroBrandLogoButtonProps = {
  productView: ProductView;
  setProductView: (view: ProductView) => void;
};

/** Logo v hero – klik vrátí na přehled školy. */
export function HeroBrandLogoButton({ productView, setProductView }: HeroBrandLogoButtonProps) {
  return (
    <button
      type="button"
      className="dash-hero-brand__logo-btn"
      aria-label="Přehled školy"
      onClick={() => {
        if (productView === "dash") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setProductView("dash");
        }
      }}
    >
      <AppBrandLogo className="dash-hero-brand__logo" />
    </button>
  );
}
