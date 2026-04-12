import React from "react";
import { APP_AUTHOR_EMAIL } from "./calculator-ui-constants";

export function AuthorCreditFooter() {
  return (
    <p className="zs-app-footer__author muted-text">
      Vytvořil: Mgr. Tomáš Zahradníček{" "}
      [
      <a href={`mailto:${APP_AUTHOR_EMAIL}`}>{APP_AUTHOR_EMAIL}</a>
      ]
    </p>
  );
}
