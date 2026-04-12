import React from "react";
import { APP_AUTHOR_EMAIL, APP_AUTHOR_PRINT_FOOTER } from "./calculator-ui-constants";

export function AuthorCreditFooter() {
  return (
    <p className="zs-app-footer__author muted-text">
      <span className="zs-app-footer__author--screen">
        Vytvořil{" "}
        <a href={`mailto:${APP_AUTHOR_EMAIL}`}>Mgr. Tomáš Zahradníček</a>
      </span>
      <span className="zs-app-footer__author--print">{APP_AUTHOR_PRINT_FOOTER}</span>
    </p>
  );
}
