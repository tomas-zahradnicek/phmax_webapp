import { describe, expect, it } from "vitest";
import { APP_AUTHOR_CREDIT_LINE } from "./calculator-ui-constants";
import { buildPrintSummaryDocumentHtml, stripAppAuthorCreditFromPlainSummary } from "./app-author-print";

describe("app-author-print", () => {
  it("buildPrintSummaryDocumentHtml obsahuje titul a tělo", () => {
    const html = buildPrintSummaryDocumentHtml({
      pageTitle: "Test tisk",
      heading: "Shrnutí test",
      plainSummary: "Řádek 1\nŘádek 2",
      layout: "box",
    });
    expect(html).toContain("Shrnutí test");
    expect(html).toContain("Řádek 1");
    expect(html).toContain("print-summary-doc");
  });

  it("stripAppAuthorCreditFromPlainSummary odstraní patičku autora", () => {
    const plain = stripAppAuthorCreditFromPlainSummary(`Obsah\n\n${APP_AUTHOR_CREDIT_LINE}`);
    expect(plain).toBe("Obsah");
  });
});
