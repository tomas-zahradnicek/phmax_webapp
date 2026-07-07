import type { ProductViewCode } from "./calculator-ui-constants";
import { PHMAX_SEO_MODULE_CONTENT } from "./phmax-seo-module-content";
import { APP_BRAND_LOGO_PATH } from "./calculator-ui-constants";
import {
  PROFIL_SKOLY_PATH,
  USER_GUIDE_PATH,
  VYROCNI_ZPRAVA_NAHLED_PATH,
  VYROCNI_ZPRAVA_PATH,
} from "./calculator-ui-constants";
import { KALKULACKY_PHMAX_PATH, KALKULACKY_PHMAX_SEO_H1, PHMAX_PUBLIC_HUB_LABEL } from "./phmax-landing-paths";
import { PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH, PHMAX_ZS_LITE_PATH } from "./phmax-lite-paths";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "./phmax-site-origin";
import { buildProductViewPageUrl, PRODUCT_VIEW_PATH } from "./product-view-paths";
import { VYROCNI_ZPRAVA_SEO_FAQ, VYROCNI_ZPRAVA_SEO_LEAD } from "./vyrocni-zprava-seo-content";

export type PhmaxLiteKind = "pv" | "sd" | "zs";

export const PHMAX_SITE_NAME = "Ředitelský průvodce";

export { PHMAX_SITE_ORIGIN_FALLBACK };

export type PhmaxDocumentHeadMeta = {
  title: string;
  description: string;
  applicationName: string;
};

export const PHMAX_DOCUMENT_HEAD: Record<ProductViewCode, PhmaxDocumentHeadMeta> = {
  dash: {
    title: "Ředitelský průvodce – přehled výpočtu PHmax, PHAmax školy a banky odpočtů zástupců ředitele",
    description:
      "Orientační přehled stavu kalkulaček PHmax v tomto prohlížeči – moduly PV, ŠD, ZŠ, SŠ a banka odpočtů NV75. Pomocný souhrn pro kontrolu scénářů.",
    applicationName: "Ředitelský průvodce PHmax",
  },
  pv: {
    title: "PHmax pro předškolní vzdělávání – kalkulačka a orientační výpočet | Ředitelský průvodce",
    description:
      "Orientační výpočet PHmax pro mateřskou školu podle aktuální metodiky MŠMT. Pomocná kalkulačka s vysvětlením vstupů – neoficiální nástroj pro kontrolu scénářů.",
    applicationName: "PHmax kalkulačka pro předškolní vzdělávání",
  },
  sd: {
    title: "PHmax pro školní družinu – kalkulačka a orientační výpočet | Ředitelský průvodce",
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
    title: "PHmax pro střední školu – kalkulačka a orientační výpočet | Ředitelský průvodce",
    description:
      "Orientační výpočet PHmax pro střední školu podle metodiky. Pomocná kalkulačka pro kontrolu scénářů a plánování úvazků.",
    applicationName: "PHmax kalkulačka pro střední školy",
  },
  nv75: {
    title: "Kalkulačka banky odpočtů zástupců ředitele | Ředitelský průvodce",
    description:
      "Orientační výpočet banky odpočtů podle NV75 pro zástupce ředitele. Pomocný nástroj – po výpočtu ověřte PHmax školy v modulu ZŠ nebo přehledu.",
    applicationName: "Banka odpočtů zástupců ředitele (NV75)",
  },
};

export const PHMAX_LITE_DOCUMENT_HEAD: Record<PhmaxLiteKind, PhmaxDocumentHeadMeta> = {
  pv: {
    title: "Rychlý PHmax – předškolní vzdělávání | Ředitelský průvodce",
    description:
      "Zjednodušený orientační výpočet PHmax pro jedno pracoviště mateřské školy – druh provozu, počet tříd a doba provozu. Pomocný nástroj bez exportu a složitých výjimek.",
    applicationName: "Rychlý PHmax pro předškolní vzdělávání",
  },
  sd: {
    title: "Rychlý PHmax – školní družina | Ředitelský průvodce",
    description:
      "Zjednodušený orientační výpočet PHmax školní družiny z počtu účastníků a oddělení. Pomocný nástroj pro rychlou kontrolu bez detailní tabulky oddělení.",
    applicationName: "Rychlý PHmax pro školní družiny",
  },
  zs: {
    title: "Rychlý PHmax – základní škola | Ředitelský průvodce",
    description:
      "Zjednodušený orientační výpočet PHmax pro běžné třídy základní školy z počtu tříd a žáků. Pomocný nástroj bez inkluze, PHAmax a PHPmax.",
    applicationName: "Rychlý PHmax pro základní školy",
  },
};

const PHMAX_LITE_PATH: Record<PhmaxLiteKind, string> = {
  pv: PHMAX_PV_LITE_PATH,
  sd: PHMAX_SD_LITE_PATH,
  zs: PHMAX_ZS_LITE_PATH,
};

const PHMAX_JSON_LD_ID = "phmax-software-application-jsonld";
const PHMAX_FAQ_JSON_LD_ID = "phmax-faq-jsonld";
const PHMAX_BREADCRUMB_JSON_LD_ID = "phmax-breadcrumb-jsonld";
const PHMAX_WEBSITE_JSON_LD_ID = "phmax-website-jsonld";
const PHMAX_WEBPAGE_JSON_LD_ID = "phmax-webpage-jsonld";

export type PhmaxFaqItem = {
  question: string;
  answer: string;
};

export type PhmaxHeadRenderOptions = {
  canonical: string;
  indexable?: boolean;
  breadcrumbLabel?: string;
  breadcrumbRootPath?: string;
  breadcrumbRootLabel?: string;
  includeWebSite?: boolean;
  includeWebPage?: boolean;
  includeSoftwareApplication?: boolean;
  /** Explicit FAQ pro JSON-LD; `null` = žádné FAQ; `undefined` = použít faqView. */
  faqItems?: PhmaxFaqItem[] | null;
  faqView?: ProductViewCode;
  websiteDescription?: string;
};

export type PhmaxPrerenderRoute = {
  pathname: string;
  meta: PhmaxDocumentHeadMeta;
  head: Omit<PhmaxHeadRenderOptions, "canonical">;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function upsertJsonLd(id: string, data: Record<string, unknown> | null): void {
  if (data === null) {
    document.getElementById(id)?.remove();
    return;
  }
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function buildPhmaxPublicHubUrl(origin: string): string {
  return new URL(KALKULACKY_PHMAX_PATH, origin).href;
}

function resolveFaqItems(options: PhmaxHeadRenderOptions): PhmaxFaqItem[] {
  if (options.faqItems === null) return [];
  if (options.faqItems !== undefined) return options.faqItems;
  if (options.faqView) return [...PHMAX_SEO_MODULE_CONTENT[options.faqView].faq];
  return [];
}

type PhmaxJsonLdBlockMap = {
  software: Record<string, unknown> | null;
  faq: Record<string, unknown> | null;
  breadcrumb: Record<string, unknown> | null;
  website: Record<string, unknown> | null;
  webpage: Record<string, unknown> | null;
};

function buildPhmaxJsonLdBlocks(
  meta: PhmaxDocumentHeadMeta,
  canonical: string,
  origin: string,
  options: PhmaxHeadRenderOptions,
): PhmaxJsonLdBlockMap {
  const faq = resolveFaqItems(options);
  const includeSoftware = options.includeSoftwareApplication !== false;
  const rootPath = options.breadcrumbRootPath ?? KALKULACKY_PHMAX_PATH;
  const rootLabel = options.breadcrumbRootLabel ?? PHMAX_PUBLIC_HUB_LABEL;
  const rootUrl = new URL(rootPath, origin).href;

  return {
    software: includeSoftware
      ? {
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
        }
      : null,
    faq:
      faq.length > 0
        ? {
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
          }
        : null,
    breadcrumb: options.breadcrumbLabel
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: rootLabel,
              item: rootUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: options.breadcrumbLabel,
              item: canonical,
            },
          ],
        }
      : null,
    website: options.includeWebSite
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: PHMAX_SITE_NAME,
          url: buildPhmaxPublicHubUrl(origin),
          inLanguage: "cs",
          description: options.websiteDescription ?? meta.description,
        }
      : null,
    webpage: options.includeWebPage
      ? {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: meta.title,
          description: meta.description,
          url: canonical,
          inLanguage: "cs",
          isPartOf: {
            "@type": "WebSite",
            name: PHMAX_SITE_NAME,
            url: buildPhmaxPublicHubUrl(origin),
          },
        }
      : null,
  };
}

/** HTML fragment pro statický head (prerender po buildu). */
export function buildPhmaxHeadHtmlTags(
  meta: PhmaxDocumentHeadMeta,
  origin: string,
  options: PhmaxHeadRenderOptions,
): string {
  const { canonical, indexable = true } = options;
  const ogImage = new URL(APP_BRAND_LOGO_PATH, origin).href;
  const robots = indexable ? "index, follow, max-image-preview:large" : "noindex, follow";
  const jsonLdBlocks = buildPhmaxJsonLdBlocks(meta, canonical, origin, options);

  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="cs_CZ" />`,
    `<meta property="og:site_name" content="${escapeHtml(PHMAX_SITE_NAME)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(PHMAX_SITE_NAME)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ];

  const jsonLdEntries: [string, Record<string, unknown> | null][] = [
    [PHMAX_JSON_LD_ID, jsonLdBlocks.software],
    [PHMAX_FAQ_JSON_LD_ID, jsonLdBlocks.faq],
    [PHMAX_BREADCRUMB_JSON_LD_ID, jsonLdBlocks.breadcrumb],
    [PHMAX_WEBSITE_JSON_LD_ID, jsonLdBlocks.website],
    [PHMAX_WEBPAGE_JSON_LD_ID, jsonLdBlocks.webpage],
  ];
  for (const [id, block] of jsonLdEntries) {
    if (block) {
      lines.push(`<script id="${id}" type="application/ld+json">${JSON.stringify(block)}</script>`);
    }
  }

  return lines.join("\n    ");
}

function applyPhmaxHeadMeta(meta: PhmaxDocumentHeadMeta, canonical: string, options: PhmaxHeadRenderOptions): void {
  const origin = resolvePhmaxSiteOrigin();
  const { indexable = true } = options;
  const ogImage = new URL(APP_BRAND_LOGO_PATH, origin).href;
  const robots = indexable ? "index, follow, max-image-preview:large" : "noindex, follow";

  document.title = meta.title;
  upsertMeta("name", "description", meta.description);
  upsertMeta("name", "robots", robots);
  upsertLink("canonical", canonical);

  upsertMeta("property", "og:title", meta.title);
  upsertMeta("property", "og:description", meta.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "cs_CZ");
  upsertMeta("property", "og:site_name", PHMAX_SITE_NAME);
  upsertMeta("property", "og:image", ogImage);
  upsertMeta("property", "og:image:alt", PHMAX_SITE_NAME);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", meta.title);
  upsertMeta("name", "twitter:description", meta.description);
  upsertMeta("name", "twitter:image", ogImage);

  const jsonLdBlocks = buildPhmaxJsonLdBlocks(meta, canonical, origin, options);
  upsertJsonLd(PHMAX_JSON_LD_ID, jsonLdBlocks.software);
  upsertJsonLd(PHMAX_FAQ_JSON_LD_ID, jsonLdBlocks.faq);
  upsertJsonLd(PHMAX_BREADCRUMB_JSON_LD_ID, jsonLdBlocks.breadcrumb);
  upsertJsonLd(PHMAX_WEBSITE_JSON_LD_ID, jsonLdBlocks.website);
  upsertJsonLd(PHMAX_WEBPAGE_JSON_LD_ID, jsonLdBlocks.webpage);
}

/** Nastaví title, meta description, Open Graph, canonical a JSON-LD pro aktivní modul. */
export function applyPhmaxDocumentHead(view: ProductViewCode): void {
  if (typeof document === "undefined") return;
  const meta = PHMAX_DOCUMENT_HEAD[view];
  const origin = resolvePhmaxSiteOrigin();
  const canonical = buildPhmaxCanonicalUrl(view, origin);
  applyPhmaxHeadMeta(meta, canonical, {
    canonical,
    faqView: view,
    indexable: view !== "dash",
    breadcrumbLabel: meta.applicationName,
    includeWebSite: false,
  });
}

export const PHMAX_USER_GUIDE_DOCUMENT_HEAD: PhmaxDocumentHeadMeta = {
  title: "Návod k použití – Kalkulačky PHmax | Ředitelský průvodce",
  description:
    "Kompletní webový průvodce kalkulačkami PHmax – moduly PV, ZŠ, SŠ, ŠD a NV75, doporučený postup, exporty a limity orientačního nástroje.",
  applicationName: "Ředitelský průvodce – návod k použití",
};

export const PHMAX_LANDING_DOCUMENT_HEAD: PhmaxDocumentHeadMeta = {
  title: "Kalkulačky PHmax a nástroje pro ředitele škol | Ředitelský průvodce",
  description:
    "Orientační kalkulačky PHmax pro mateřskou, základní a střední školu, školní družinu, banku odpočtů NV75, webový návod a modul výroční zprávy. Nástroje pro ředitele škol z prohlížeče.",
  applicationName: "Kalkulačky PHmax – Ředitelský průvodce",
};

export const PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD: PhmaxDocumentHeadMeta = {
  title: "Generátor výroční zprávy školy | Ředitelský průvodce",
  description: VYROCNI_ZPRAVA_SEO_LEAD,
  applicationName: "Ředitelský průvodce – výroční zpráva školy",
};

export const PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD: PhmaxDocumentHeadMeta = {
  title: "Profil školy – sdílené údaje pro moduly | Ředitelský průvodce",
  description:
    "Centrální profil školy pro aplikaci Ředitelský průvodce – identifikační a kontaktní údaje použitelné ve výroční zprávě, kalkulačkách PHmax a dalších modulech.",
  applicationName: "Ředitelský průvodce – profil školy",
};

/** Document head pro stránku /navod s vloženým webovým průvodcem. */
export function applyPhmaxUserGuideDocumentHead(): void {
  if (typeof document === "undefined") return;
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(USER_GUIDE_PATH, origin).href;
  applyPhmaxHeadMeta(PHMAX_USER_GUIDE_DOCUMENT_HEAD, canonical, {
    canonical,
    faqView: "dash",
    includeSoftwareApplication: false,
    includeWebPage: true,
    breadcrumbLabel: "Návod k použití",
  });
}

/** Document head pro veřejnou landing page (/kalkulacky-phmax). */
export function applyKalkulackyPhmaxDocumentHead(): void {
  if (typeof document === "undefined") return;
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(KALKULACKY_PHMAX_PATH, origin).href;
  applyPhmaxHeadMeta(PHMAX_LANDING_DOCUMENT_HEAD, canonical, {
    canonical,
    faqItems: null,
    includeSoftwareApplication: false,
    includeWebSite: true,
    websiteDescription: PHMAX_LANDING_DOCUMENT_HEAD.description,
    breadcrumbLabel: KALKULACKY_PHMAX_SEO_H1,
    breadcrumbRootPath: KALKULACKY_PHMAX_PATH,
    breadcrumbRootLabel: KALKULACKY_PHMAX_SEO_H1,
  });
}

/** Document head pro modul výroční zprávy (/vyrocni-zprava). */
export function applyVyrocniZpravaDocumentHead(): void {
  if (typeof document === "undefined") return;
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(VYROCNI_ZPRAVA_PATH, origin).href;
  applyPhmaxHeadMeta(PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD, canonical, {
    canonical,
    faqItems: VYROCNI_ZPRAVA_SEO_FAQ,
    breadcrumbLabel: "Výroční zpráva školy",
  });
}

export const PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD: PhmaxDocumentHeadMeta = {
  title: "Náhled výroční zprávy – interní kontrola | Ředitelský průvodce",
  description:
    "Interní náhled výroční zprávy školy před exportem. Stránka není určena pro vyhledávače – použijte modul výroční zprávy pro přípravu dokumentu.",
  applicationName: "Ředitelský průvodce – náhled výroční zprávy",
};

/** Document head pro náhled výroční zprávy (/vyrocni-zprava/nahled) – bez indexace. */
export function applyVyrocniZpravaPreviewDocumentHead(): void {
  if (typeof document === "undefined") return;
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(VYROCNI_ZPRAVA_NAHLED_PATH, origin).href;
  applyPhmaxHeadMeta(PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD, canonical, {
    canonical,
    indexable: false,
    faqItems: null,
    includeSoftwareApplication: false,
  });
}

/** Document head pro profil školy (/profil-skoly). */
export function applyProfilSkolyDocumentHead(): void {
  if (typeof document === "undefined") return;
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(PROFIL_SKOLY_PATH, origin).href;
  applyPhmaxHeadMeta(PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD, canonical, {
    canonical,
    indexable: false,
    faqItems: null,
    includeSoftwareApplication: false,
  });
}

/** Document head pro režim „Rychlý PHmax“ (/rychly). */
export function applyPhmaxLiteDocumentHead(lite: PhmaxLiteKind): void {
  if (typeof document === "undefined") return;
  const meta = PHMAX_LITE_DOCUMENT_HEAD[lite];
  const origin = resolvePhmaxSiteOrigin();
  const canonical = new URL(PHMAX_LITE_PATH[lite], origin).href;
  applyPhmaxHeadMeta(meta, canonical, {
    canonical,
    faqView: lite,
    breadcrumbLabel: meta.applicationName,
  });
}

/** Indexovatelné URL pro sitemap (bez pracovního přehledu, profilu a náhledu výroční zprávy). */
export function listPhmaxSitemapUrls(origin = PHMAX_SITE_ORIGIN_FALLBACK): string[] {
  const moduleUrls = (Object.keys(PHMAX_DOCUMENT_HEAD) as ProductViewCode[])
    .filter((view) => view !== "dash")
    .map((view) => buildProductViewPageUrl(view, origin));

  return [
    new URL(KALKULACKY_PHMAX_PATH, origin).href,
    ...moduleUrls,
    new URL(USER_GUIDE_PATH, origin).href,
    new URL(VYROCNI_ZPRAVA_PATH, origin).href,
    new URL(PHMAX_PV_LITE_PATH, origin).href,
    new URL(PHMAX_SD_LITE_PATH, origin).href,
    new URL(PHMAX_ZS_LITE_PATH, origin).href,
  ];
}

/** Trasy pro statický head po buildu (včetně noindex stránek). */
export function listPhmaxPrerenderRoutes(_origin = PHMAX_SITE_ORIGIN_FALLBACK): PhmaxPrerenderRoute[] {
  const productRoutes: PhmaxPrerenderRoute[] = (Object.keys(PHMAX_DOCUMENT_HEAD) as ProductViewCode[]).map(
    (view) => ({
      pathname: PRODUCT_VIEW_PATH[view],
      meta: PHMAX_DOCUMENT_HEAD[view],
      head:
        view === "dash"
          ? {
              faqView: "dash",
              indexable: false,
              breadcrumbLabel: PHMAX_DOCUMENT_HEAD.dash.applicationName,
              includeWebSite: false,
            }
          : {
              faqView: view,
              indexable: true,
              breadcrumbLabel: PHMAX_DOCUMENT_HEAD[view].applicationName,
            },
    }),
  );

  const liteRoutes: PhmaxPrerenderRoute[] = (Object.keys(PHMAX_LITE_DOCUMENT_HEAD) as PhmaxLiteKind[]).map(
    (lite) => ({
      pathname: PHMAX_LITE_PATH[lite],
      meta: PHMAX_LITE_DOCUMENT_HEAD[lite],
      head: {
        faqView: lite,
        indexable: true,
        breadcrumbLabel: PHMAX_LITE_DOCUMENT_HEAD[lite].applicationName,
      },
    }),
  );

  const extraRoutes: PhmaxPrerenderRoute[] = [
    {
      pathname: KALKULACKY_PHMAX_PATH,
      meta: PHMAX_LANDING_DOCUMENT_HEAD,
      head: {
        faqItems: null,
        includeSoftwareApplication: false,
        includeWebSite: true,
        websiteDescription: PHMAX_LANDING_DOCUMENT_HEAD.description,
        indexable: true,
        breadcrumbLabel: KALKULACKY_PHMAX_SEO_H1,
        breadcrumbRootPath: KALKULACKY_PHMAX_PATH,
        breadcrumbRootLabel: KALKULACKY_PHMAX_SEO_H1,
      },
    },
    {
      pathname: USER_GUIDE_PATH,
      meta: PHMAX_USER_GUIDE_DOCUMENT_HEAD,
      head: {
        faqView: "dash",
        includeSoftwareApplication: false,
        includeWebPage: true,
        indexable: true,
        breadcrumbLabel: "Návod k použití",
      },
    },
    {
      pathname: VYROCNI_ZPRAVA_PATH,
      meta: PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD,
      head: {
        faqItems: VYROCNI_ZPRAVA_SEO_FAQ,
        indexable: true,
        breadcrumbLabel: "Výroční zpráva školy",
      },
    },
    {
      pathname: PROFIL_SKOLY_PATH,
      meta: PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD,
      head: {
        indexable: false,
        faqItems: null,
        includeSoftwareApplication: false,
      },
    },
    {
      pathname: VYROCNI_ZPRAVA_NAHLED_PATH,
      meta: PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD,
      head: {
        indexable: false,
        faqItems: null,
        includeSoftwareApplication: false,
      },
    },
  ];

  return [...productRoutes, ...extraRoutes, ...liteRoutes];
}

export type PhmaxSitemapEntry = {
  loc: string;
  changefreq: "weekly" | "monthly";
  priority: string;
  lastmod: string;
};

function phmaxSitemapPriority(pathname: string): { changefreq: PhmaxSitemapEntry["changefreq"]; priority: string } {
  if (pathname === KALKULACKY_PHMAX_PATH) return { changefreq: "weekly", priority: "1.0" };
  if (pathname === "/navod") return { changefreq: "monthly", priority: "0.85" };
  if (pathname === "/vyrocni-zprava") return { changefreq: "monthly", priority: "0.85" };
  if (pathname.endsWith("/rychly")) return { changefreq: "monthly", priority: "0.85" };
  if (pathname === "/banka-odpoctu-zastupcu-reditele") return { changefreq: "monthly", priority: "0.8" };
  return { changefreq: "monthly", priority: "0.9" };
}

export function buildPhmaxSitemapEntries(
  origin = PHMAX_SITE_ORIGIN_FALLBACK,
  lastmod = new Date().toISOString().slice(0, 10),
): PhmaxSitemapEntry[] {
  return listPhmaxSitemapUrls(origin).map((loc) => {
    const pathname = new URL(loc).pathname.replace(/\/+$/, "") || "/";
    const { changefreq, priority } = phmaxSitemapPriority(pathname);
    return { loc, changefreq, priority, lastmod };
  });
}

export function buildPhmaxSitemapXml(
  origin = PHMAX_SITE_ORIGIN_FALLBACK,
  lastmod = new Date().toISOString().slice(0, 10),
): string {
  const rows = buildPhmaxSitemapEntries(origin, lastmod)
    .map(
      (entry) =>
        `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}
