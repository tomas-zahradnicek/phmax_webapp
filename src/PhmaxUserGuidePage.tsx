import React from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  APP_BRAND_LOGO_PATH,
  PRODUCT_USER_GUIDE_LABEL,
  PRODUCT_USER_GUIDE_LEAD,
  PRODUCT_USER_GUIDE_URL,
} from "./calculator-ui-constants";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";

export function PhmaxUserGuidePage() {
  return (
    <div className="user-guide-page">
      <header className="user-guide-page__header card">
        <div className="user-guide-page__brand">
          <img src={APP_BRAND_LOGO_PATH} alt="" className="user-guide-page__logo" width={40} height={40} />
          <div>
            <h1 className="user-guide-page__title">{PRODUCT_USER_GUIDE_LABEL}</h1>
            <p className="muted-text user-guide-page__lead">{PRODUCT_USER_GUIDE_LEAD}</p>
          </div>
        </div>
        <div className="user-guide-page__actions">
          <a className="btn ghost" href={PRODUCT_VIEW_PATH.dash}>
            Přejít na přehled
          </a>
          <a className="btn primary" href={PRODUCT_USER_GUIDE_URL} target="_blank" rel="noopener noreferrer">
            Otevřít návod v novém okně
          </a>
        </div>
      </header>

      <div className="user-guide-page__frame card">
        <iframe
          className="user-guide-page__iframe"
          src={PRODUCT_USER_GUIDE_URL}
          title={PRODUCT_USER_GUIDE_LABEL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <p className="muted-text user-guide-page__fallback">
          Návod se nenačetl?{" "}
          <a href={PRODUCT_USER_GUIDE_URL} target="_blank" rel="noopener noreferrer">
            Otevřete ho přímo na webu
          </a>
          .
        </p>
      </div>

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
