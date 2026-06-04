import type { ProductViewCode } from "./calculator-ui-constants";
import { PHMAX_SEO_MODULE_CONTENT } from "./phmax-seo-module-content";
import { APP_BRAND_LOGO_PATH } from "./calculator-ui-constants";
import { buildProductViewPageUrl, listProductViewPathUrls } from "./product-view-paths";

export const PHMAX_SITE_NAME = "Ředitelský průvodce";

/** Výchozí origin pro sitemap/robots; v prohlížeči se použije `window.location.origin`. */
export const PHMAX_SITE_ORIGIN_FALLBACK = "https://phmax-webapp.vercel.app";

export type PhmaxDocumentHeadMeta = {
  title: string;
  description: string;
  applicationName: string;
};

export const PHMAX_DOCUMENT_HEAD: Record<ProductViewCode, PhmaxDocumentHeadMeta> = {
  dash: {
    title: "Ředitelský průvodce – přehled PHmax školy",
    description:
      "Orientační přehled stavu kalkulaček PHmax v tomto prohlížeči – moduly PV, ŠD, ZŠ, SŠ a banka odpočtů NV75. Pomocný souhrn pro kontrolu scénářů.",
    applicationName: "Ředitelský průvodce PHmax",
  },
  pv: {
    title: "PHmax pro předškolní vzdělávání | Ředitelský průvodce",
    description:
      "Orientační výpočet PHmax pro mateřskou školu podle aktuální metodiky MŠMT. Pomocná kalkulačka s vysvětlením vstupů – neoficiální nástroj pro kontrolu scénářů.",
    applicationName: "PHmax kalkulačka pro předškolní vzdělávání",
  },
  sd: {
    title: "PHmax pro školní družinu | Ředitelský průvodce",
    description:
      "Spočítejte orientační PHmax pro školní družinu. Pomocný výpočet podle metodiky s kontrolou vstupů a souhrnem v hodinách týdně.",
    applicationName: "PHmax kalkulačka pro školní družiny",
  },
  zs: {
    title: "PHmax ZŠ – kalkulačka a orientační výpočet | Ředitelský průvodce",
    description:
      "Spočítejte orientační PHmax, PHAmax a PHPmax pro základní školu. Pomocná kalkulačka podle aktuální metodiky včetně vysvětlení vstupů.",
    applicationName: "PHmax kalkulačka pro základní školy",
  },
  ss: {
    title: "PHmax pro střední školu | Ředitelský průvodce",
    description:
      "Orientační výpočet PHmax pro střední školu podle metodiky. Pomocná kalkulačka pro kontrolu scénářů a plánování úvazků.",
    applicationName: "PHmax kalkulačka pro střední školy",
  },
  nv75: {
    title: "Banka odpočtů zástupců ředitele | Ředitelský průvodce",
    description:
      "Orientační výpočet banky odpočtů podle NV75 pro zástupce ředitele. Pomocný nástroj – po výpočtu ověřte PHmax školy v modulu ZŠ nebo přehledu.",
    applicationName: "Banka odpočtů zástupců ředitele (NV75)",
  },
};

const PHMAX_JSON_LD_ID = "phmax-software-application-jsonld";
const PHMAX_FAQ_JSON_LD_ID = "phmax-faq-jsonld";

export function resolvePhmaxSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return PHMAX_SITE_ORIGIN_FALLBACK;
}

export function buildPhmaxCanonicalUrl(view: ProductViewCode, origin = resolvePhmaxSiteOrigin()): string {
  return buildProductViewPageUrl(view, origin);
}

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, unknown>): void {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Nastaví title, meta description, Open Graph, canonical a JSON-LD pro aktivní modul. */
export function applyPhmaxDocumentHead(view: ProductViewCode): void {
  if (typeof document === "undefined") return;

  const meta = PHMAX_DOCUMENT_HEAD[view];
  const origin = resolvePhmaxSiteOrigin();
  const canonical = buildPhmaxCanonicalUrl(view, origin);

  document.title = meta.title;
  upsertMeta("name", "description", meta.description);
  upsertLink("canonical", canonical);

  upsertMeta("property", "og:title", meta.title);
  upsertMeta("property", "og:description", meta.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "cs_CZ");
  upsertMeta("property", "og:site_name", PHMAX_SITE_NAME);
  upsertMeta("property", "og:image", new URL(APP_BRAND_LOGO_PATH, origin).href);

  upsertJsonLd(PHMAX_JSON_LD_ID, {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.applicationName,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: "cs",
    description: meta.description,
    url: canonical,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CZK",
    },
  });

  const faq = PHMAX_SEO_MODULE_CONTENT[view].faq;
  if (faq.length > 0) {
    upsertJsonLd(PHMAX_FAQ_JSON_LD_ID, {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  } else {
    document.getElementById(PHMAX_FAQ_JSON_LD_ID)?.remove();
  }
}

/** Všechny URL pro sitemap (čisté path). */
export function listPhmaxSitemapUrls(origin = PHMAX_SITE_ORIGIN_FALLBACK): string[] {
  return listProductViewPathUrls(origin);
}
