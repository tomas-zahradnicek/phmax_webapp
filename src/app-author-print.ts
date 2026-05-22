import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
} from "./calculator-ui-constants";

/** Patička autora v okně tisku shrnutí – menší text, zarovnání do spodního okraje stránky. */
export const APP_AUTHOR_PRINT_FOOTER_STYLES = `
.print-doc-footer {
  flex-shrink: 0;
  margin-top: auto;
  padding: 2mm 0 0;
  text-align: center;
}
.print-doc-author {
  margin: 0;
  font-size: 6.5pt;
  line-height: 1.3;
  color: #64748b;
}
.print-doc-author a {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
}
@media print {
  .print-summary-doc {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  .print-doc-footer {
    margin-top: auto;
  }
}
`;

/** Základní layout dokumentu pro tisk shrnutí (flex → patička dole na poslední stránce). */
export const APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES = `
@page { margin: 10mm 12mm 11mm; size: A4; }
.print-summary-doc {
  font-family: system-ui, Segoe UI, Roboto, Arial, sans-serif;
  margin: 0;
  padding: 0;
  font-size: 9pt;
  line-height: 1.4;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.print-summary-doc__main { flex: 1 1 auto; }
.print-summary-doc__main a { color: #1d4ed8; }
${APP_AUTHOR_PRINT_FOOTER_STYLES}
`;

/** HTML patička „tisk shrnutí“ – jméno je mailto odkaz (e-mail v href). */
export function getAppAuthorPrintFooterHtml(): string {
  return (
    `<footer class="print-doc-footer" role="contentinfo">` +
    `<p class="print-doc-author">Vytvořil: <a href="mailto:${APP_AUTHOR_EMAIL}">${APP_AUTHOR_DISPLAY_NAME}</a></p>` +
    `</footer>`
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
