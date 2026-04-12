import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
} from "./calculator-ui-constants";

/** HTML patička „tisk shrnutí“ / okno — jméno je mailto odkaz (e-mail v href). */
export function getAppAuthorPrintFooterHtml(): string {
  return (
    `<p class="print-doc-author" style="margin-top:14px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10pt;color:#334155">` +
    `Vytvořil: <a href="mailto:${APP_AUTHOR_EMAIL}">${APP_AUTHOR_DISPLAY_NAME}</a></p>`
  );
}

/** Odstraní závěrečnou řádku autora z prostého textu (před vložením HTML patičky). */
export function stripAppAuthorCreditFromPlainSummary(plain: string): string {
  const t = plain.trimEnd();
  if (t.endsWith(APP_AUTHOR_CREDIT_LINE)) {
    return t.slice(0, -APP_AUTHOR_CREDIT_LINE.length).replace(/\n+$/, "");
  }
  return plain;
}
