import React from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { APP_BRAND_LOGO_PATH } from "./calculator-ui-constants";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";
import { KALKULACKY_PHMAX_PATH } from "./phmax-landing-paths";
import { getRouteSeoContent } from "./phmax-route-seo-content";
import { RouteSeoContentView } from "./RouteSeoContentView";

const landingContent = getRouteSeoContent(KALKULACKY_PHMAX_PATH);

export function KalkulackyPhmaxPage() {
  if (!landingContent) {
    throw new Error("Missing landing page SEO content");
  }

  return (
    <div className="kalkulacky-phmax-page">
      <header className="kalkulacky-phmax-page__header card">
        <div className="kalkulacky-phmax-page__brand">
          <img src={APP_BRAND_LOGO_PATH} alt="" className="kalkulacky-phmax-page__logo" width={40} height={40} />
          <div>
            <p className="muted-text">Ředitelský průvodce</p>
            <p>
              <a className="btn ghost" href={PRODUCT_VIEW_PATH.dash}>
                Přejít na pracovní přehled
              </a>
            </p>
          </div>
        </div>
      </header>

      <RouteSeoContentView content={landingContent} className="seo-prerender-content kalkulacky-phmax-page__content" />

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
