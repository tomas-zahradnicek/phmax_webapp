import type { RouteSeoContent } from "./phmax-route-seo-content";

const INTERNAL_PATH_PATTERN = /^\/[a-z0-9\-/]*$/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text);
}

function assertInternalHref(href: string): string {
  if (!INTERNAL_PATH_PATTERN.test(href)) {
    throw new Error(`Blocked non-internal SEO link href: ${href}`);
  }
  return href;
}

function renderParagraphs(paragraphs: string[] | undefined): string {
  if (!paragraphs?.length) return "";
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n        ");
}

function renderItems(items: string[] | undefined): string {
  if (!items?.length) return "";
  const rows = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n          ");
  return `<ul>\n          ${rows}\n        </ul>`;
}

function renderBreadcrumbs(breadcrumbs: RouteSeoContent["breadcrumbs"]): string {
  const items = breadcrumbs
    .map((crumb, index) => {
      const href = assertInternalHref(crumb.href);
      const isLast = index === breadcrumbs.length - 1;
      if (isLast) {
        return `<span aria-current="page">${escapeHtml(crumb.label)}</span>`;
      }
      return `<a href="${escapeHtmlAttr(href)}">${escapeHtml(crumb.label)}</a>`;
    })
    .join(' <span aria-hidden="true">/</span> ');

  return `<nav aria-label="Drobečková navigace">${items}</nav>`;
}

function renderFaq(faq: RouteSeoContent["faq"]): string {
  if (!faq.length) return "";
  const items = faq
    .map(
      (item) => `<details>
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`,
    )
    .join("\n          ");

  return `<section>
        <h2>Nejčastější otázky</h2>
        <div>
          ${items}
        </div>
      </section>`;
}

function renderRelatedLinks(links: RouteSeoContent["relatedLinks"]): string {
  if (!links.length) return "";
  const items = links
    .map((link) => {
      const href = assertInternalHref(link.href);
      return `<li><a href="${escapeHtmlAttr(href)}">${escapeHtml(link.label)}</a></li>`;
    })
    .join("\n          ");

  return `<nav aria-label="Související nástroje">
        <h2>Související nástroje</h2>
        <ul>
          ${items}
        </ul>
      </nav>`;
}

/** Vygeneruje statický route-specific obsah pro #seo-prerender-content. */
export function renderRouteSeoHtml(content: RouteSeoContent): string {
  const path = assertInternalHref(content.path);
  const sections = content.sections
    .map((section) => {
      const body = `${renderParagraphs(section.paragraphs)}${renderItems(section.items)}`;
      return `<section>
        <h2>${escapeHtml(section.heading)}</h2>
        ${body}
      </section>`;
    })
    .join("\n\n      ");

  return `<div id="seo-prerender-content" class="seo-prerender-content" data-seo-route="${escapeHtmlAttr(path)}">
  <header class="seo-prerender-content__header">
    ${renderBreadcrumbs(content.breadcrumbs)}
    <h1>${escapeHtml(content.h1)}</h1>
    <p>${escapeHtml(content.lead)}</p>
  </header>

  <main class="seo-prerender-content__main">
    ${sections}

    ${renderFaq(content.faq)}

    ${renderRelatedLinks(content.relatedLinks)}
  </main>
</div>`;
}

export const SEO_PRERENDER_NOSCRIPT_HTML = `<noscript>
      <p>Interaktivní výpočet vyžaduje JavaScript. Základní informace a návod jsou dostupné na této stránce.</p>
    </noscript>`;
