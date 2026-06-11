import React from "react";
import { APP_VERSION } from "./app-version";
import { PHMAX_CURRENT_RELEASE_NOTES } from "./app-release-notes";
import { useAppWhatsNew } from "./AppWhatsNewContext";
import {
  APP_AUTHOR_CONTACT_LABEL,
  APP_AUTHOR_CONTACT_URL,
  APP_AUTHOR_DISPLAY_NAME,
  PRODUCT_USER_GUIDE_LABEL,
  USER_GUIDE_PATH,
} from "./calculator-ui-constants";

export function AuthorCreditFooter() {
  const { openWhatsNew } = useAppWhatsNew();

  return (
    <div className="zs-app-footer__credits">
      <p className="zs-app-footer__author">
        Vytvořil: {APP_AUTHOR_DISPLAY_NAME}
        {" · "}
        <a href={APP_AUTHOR_CONTACT_URL} target="_blank" rel="noopener noreferrer">
          {APP_AUTHOR_CONTACT_LABEL}
        </a>
      </p>
      <p className="zs-app-footer__version">
        <a href={USER_GUIDE_PATH}>{PRODUCT_USER_GUIDE_LABEL}</a>
        {" · "}
        Verze aplikace {APP_VERSION}
        {" · "}
        <button type="button" className="link-btn" onClick={openWhatsNew}>
          {PHMAX_CURRENT_RELEASE_NOTES.title}
        </button>
      </p>
    </div>
  );
}
