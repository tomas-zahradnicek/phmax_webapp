import React from "react";
import type { ProductViewCode } from "./calculator-ui-constants";
import type { ProductView } from "./ProductViewPills";
import {
  PHMAX_CALCULATOR_NAV_ARIA_LABEL,
  PHMAX_CALCULATOR_NAV_LINKS,
} from "./phmax-calculator-nav";
import { PHMAX_SEO_MODULE_CONTENT } from "./phmax-seo-module-content";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";

type PhmaxModuleSeoSectionProps = {
  view: ProductViewCode;
  setProductView: (v: ProductView) => void;
};

export function PhmaxModuleSeoSection({ view, setProductView }: PhmaxModuleSeoSectionProps) {
  const content = PHMAX_SEO_MODULE_CONTENT[view];

  return (
    <section
      className="card section-card phmax-module-seo"
      data-testid="phmax-module-seo"
      aria-labelledby={`phmax-module-seo-${view}-heading`}
    >
      <h2 id={`phmax-module-seo-${view}-heading`} className="phmax-module-seo__title section-title">
        Informace k modulu
      </h2>

      <h3 className="phmax-module-seo__subtitle">{content.howItWorksTitle}</h3>
      {content.howItWorksParagraphs.map((p) => (
        <p key={p} className="phmax-module-seo__text muted-text">
          {p}
        </p>
      ))}

      <h3 className="phmax-module-seo__subtitle">{content.whenToUseTitle}</h3>
      {content.whenToUseParagraphs.map((p) => (
        <p key={p} className="phmax-module-seo__text muted-text">
          {p}
        </p>
      ))}

      <nav aria-label={PHMAX_CALCULATOR_NAV_ARIA_LABEL} className="phmax-calculator-nav">
        <h3 className="phmax-module-seo__subtitle">Kalkulačky PHmax</h3>
        <ul className="phmax-calculator-nav__list">
          {PHMAX_CALCULATOR_NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => {
                  const matched = (Object.entries(PRODUCT_VIEW_PATH) as [ProductViewCode, string][]).find(
                    ([, path]) => path === link.href,
                  );
                  if (!matched) return;
                  e.preventDefault();
                  setProductView(matched[0]);
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {content.related.length > 0 ? (
        <div className="phmax-module-seo__related">
          <h3 className="phmax-module-seo__subtitle">Související moduly</h3>
          <ul className="phmax-module-seo__related-list">
            {content.related.map((link) => (
              <li key={link.view}>
                <a
                  href={PRODUCT_VIEW_PATH[link.view]}
                  className="phmax-module-seo__related-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setProductView(link.view);
                  }}
                >
                  <strong>{link.label}</strong>
                </a>
                <span className="muted-text"> – {link.teaser}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.faq.length > 0 ? (
        <div className="phmax-module-seo__faq">
          <h3 className="phmax-module-seo__subtitle">Nejčastější dotazy</h3>
          {content.faq.map((item) => (
            <details key={item.question} className="phmax-module-seo__faq-item">
              <summary>{item.question}</summary>
              <p className="muted-text">{item.answer}</p>
            </details>
          ))}
        </div>
      ) : null}

      <p className="phmax-module-seo__methodology muted-text">{content.methodologyNote}</p>
    </section>
  );
}
