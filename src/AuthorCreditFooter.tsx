import React from "react";
import { APP_VERSION } from "./app-version";
import { APP_AUTHOR_DISPLAY_NAME, APP_AUTHOR_EMAIL } from "./calculator-ui-constants";

export function AuthorCreditFooter() {
  return (
    <div className="zs-app-footer__credits muted-text">
      <p className="zs-app-footer__author">
        Vytvořil:{" "}
        <a href={`mailto:${APP_AUTHOR_EMAIL}`}>{APP_AUTHOR_DISPLAY_NAME}</a>
      </p>
      <p className="zs-app-footer__version">Verze aplikace {APP_VERSION}</p>
    </div>
  );
}
