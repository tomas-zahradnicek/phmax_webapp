import React from "react";
import {
  PHMAX_CALCULATOR_NAV_ARIA_LABEL,
  PHMAX_CALCULATOR_NAV_LINKS,
  shouldIncludePhmaxCalculatorNav,
} from "./phmax-calculator-nav";
import type { RouteSeoContent } from "./phmax-route-seo-content";

type RouteSeoContentViewProps = {
  content: RouteSeoContent;
  className?: string;
};

/** Statické zobrazení route SEO obsahu – sdílené mezi prerenderem a React landing page. */
export function RouteSeoContentView({ content, className = "seo-prerender-content" }: RouteSeoContentViewProps) {
  return (
    <div id="kalkulacky-phmax-main" className={className} data-seo-route={content.path}>
      <header className="seo-prerender-content__header">
        <nav aria-label="Drobečková navigace">
          {content.breadcrumbs.map((crumb, index) => {
            const isLast = index === content.breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {index > 0 ? <span aria-hidden="true"> / </span> : null}
                {isLast ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : (
                  <a href={crumb.href}>{crumb.label}</a>
                )}
              </React.Fragment>
            );
          })}
        </nav>
        <h1 className="section-title">{content.h1}</h1>
        <p className="muted-text">{content.lead}</p>
      </header>

      <main className="seo-prerender-content__main">
        {content.sections.map((section) => (
          <section key={section.heading} className="card section-card">
            <h2 className="section-title">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items?.length ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {content.faq.length > 0 ? (
          <section className="card section-card">
            <h2 className="section-title">Nejčastější otázky</h2>
            <div>
              {content.faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {content.relatedLinks.length > 0 ? (
          <nav aria-label="Související nástroje" className="card section-card">
            <h2 className="section-title">Související nástroje</h2>
            <ul>
              {content.relatedLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {shouldIncludePhmaxCalculatorNav(content.path) ? (
          <nav aria-label={PHMAX_CALCULATOR_NAV_ARIA_LABEL} className="card section-card phmax-calculator-nav">
            <ul className="phmax-calculator-nav__list">
              {PHMAX_CALCULATOR_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </main>
    </div>
  );
}
