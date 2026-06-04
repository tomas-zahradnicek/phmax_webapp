import React from "react";
import { APP_BRAND_LOGO_PATH } from "./calculator-ui-constants";

export type AppBrandLogoSize = "hero" | "card";

export type AppBrandLogoProps = {
  size?: AppBrandLogoSize;
  className?: string;
  alt?: string;
};

export function AppBrandLogo({ size = "card", className, alt = "" }: AppBrandLogoProps) {
  const dim = size === "hero" ? 80 : 40;
  return (
    <img
      src={APP_BRAND_LOGO_PATH}
      alt={alt}
      className={[
        "app-brand-logo",
        size === "hero" ? "app-brand-logo--hero" : "app-brand-logo--card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      width={dim}
      height={dim}
      decoding="async"
    />
  );
}

export type CardBrandHeadProps = {
  children: React.ReactNode;
  className?: string;
};

/** Logo vlevo vedle nadpisu karty / sekce. */
export function CardBrandHead({ children, className }: CardBrandHeadProps) {
  return (
    <div className={["card-brand-head", className].filter(Boolean).join(" ")}>
      <AppBrandLogo size="card" />
      {children}
    </div>
  );
}
