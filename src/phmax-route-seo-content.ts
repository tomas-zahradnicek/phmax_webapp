import type { ProductViewCode } from "./calculator-ui-constants";
import {
  PRODUCT_USER_GUIDE_LABEL,
  PRODUCT_USER_GUIDE_LEAD,
  USER_GUIDE_PATH,
  VYROCNI_ZPRAVA_LABEL,
  VYROCNI_ZPRAVA_PATH,
} from "./calculator-ui-constants";
import type { PhmaxLiteKind } from "./phmax-document-head";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  PHMAX_USER_GUIDE_DOCUMENT_HEAD,
} from "./phmax-document-head";
import {
  KALKULACKY_PHMAX_PATH,
  KALKULACKY_PHMAX_SEO_H1,
  PHMAX_PUBLIC_HUB_LABEL,
} from "./phmax-landing-paths";
import {
  PHMAX_PV_LITE_PATH,
  PHMAX_SD_LITE_PATH,
  PHMAX_ZS_LITE_PATH,
} from "./phmax-lite-paths";
import { PHMAX_SEO_MODULE_CONTENT } from "./phmax-seo-module-content";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";
import {
  VYROCNI_ZPRAVA_SEO_FAQ,
  VYROCNI_ZPRAVA_SEO_H1,
  VYROCNI_ZPRAVA_SEO_LEAD,
} from "./vyrocni-zprava-seo-content";

export type RouteSeoSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export type RouteSeoFaqItem = {
  question: string;
  answer: string;
};

export type RouteSeoLink = {
  href: string;
  label: string;
};

export type RouteSeoContent = {
  path: string;
  h1: string;
  lead: string;
  sections: RouteSeoSection[];
  faq: RouteSeoFaqItem[];
  relatedLinks: RouteSeoLink[];
  breadcrumbs: RouteSeoLink[];
};

/** Routy fáze C – route-specific prerender obsah v počátečním HTML. */
export const PHASE_C_SEO_CONTENT_PATHS = [
  PRODUCT_VIEW_PATH.pv,
  PRODUCT_VIEW_PATH.sd,
  PRODUCT_VIEW_PATH.zs,
  PRODUCT_VIEW_PATH.ss,
  PRODUCT_VIEW_PATH.nv75,
  PHMAX_PV_LITE_PATH,
  PHMAX_SD_LITE_PATH,
  PHMAX_ZS_LITE_PATH,
  USER_GUIDE_PATH,
] as const;

export type PhaseCSeoContentPath = (typeof PHASE_C_SEO_CONTENT_PATHS)[number];

/** Routy s prerenderovaným SEO obsahem (fáze C + D2). */
export const SEO_PRERENDER_CONTENT_PATHS = [
  ...PHASE_C_SEO_CONTENT_PATHS,
  VYROCNI_ZPRAVA_PATH,
  KALKULACKY_PHMAX_PATH,
] as const;

export type SeoPrerenderContentPath = (typeof SEO_PRERENDER_CONTENT_PATHS)[number];

const ROUTE_SEO_H1: Record<ProductViewCode, string> = {
  dash: PHMAX_DOCUMENT_HEAD.dash.applicationName,
  pv: "Kalkulačka PHmax a PHAmax pro mateřskou školu",
  sd: "Kalkulačka PHmax pro školní družinu",
  zs: "Kalkulačka PHmax, PHAmax a PHPmax pro základní školu",
  ss: "Kalkulačka PHmax pro střední školu",
  nv75: "Výpočet banky odpočtů zástupců ředitele školy",
};

const ROUTE_LITE_SEO_H1: Record<PhmaxLiteKind, string> = {
  pv: "Rychlý orientační výpočet PHmax mateřské školy",
  sd: "Rychlý orientační výpočet PHmax školní družiny",
  zs: "Rychlý orientační výpočet PHmax základní školy",
};

const LITE_FULL_LABEL: Record<PhmaxLiteKind, string> = {
  pv: "Plná kalkulačka PHmax pro mateřskou školu",
  sd: "Plná kalkulačka PHmax pro školní družinu",
  zs: "Plná kalkulačka PHmax pro základní školu",
};

const FULL_LITE_LABEL: Record<PhmaxLiteKind, string> = {
  pv: "Rychlý PHmax pro mateřskou školu",
  sd: "Rychlý PHmax pro školní družinu",
  zs: "Rychlý PHmax pro základní školu",
};

const LITE_PATH: Record<PhmaxLiteKind, string> = {
  pv: PHMAX_PV_LITE_PATH,
  sd: PHMAX_SD_LITE_PATH,
  zs: PHMAX_ZS_LITE_PATH,
};

function buildPublicBreadcrumbs(path: string, currentLabel: string): RouteSeoLink[] {
  return [
    { href: KALKULACKY_PHMAX_PATH, label: PHMAX_PUBLIC_HUB_LABEL },
    { href: path, label: currentLabel },
  ];
}

function buildModuleRelatedLinks(view: ProductViewCode): RouteSeoLink[] {
  const module = PHMAX_SEO_MODULE_CONTENT[view];
  const links: RouteSeoLink[] = [{ href: USER_GUIDE_PATH, label: PRODUCT_USER_GUIDE_LABEL }];

  if (view === "pv" || view === "sd" || view === "zs") {
    links.push({
      href: LITE_PATH[view],
      label: FULL_LITE_LABEL[view],
    });
  }

  for (const related of module.related.slice(0, 2)) {
    links.push({
      href: PRODUCT_VIEW_PATH[related.view],
      label: related.label,
    });
  }

  return links;
}

function buildLiteRelatedLinks(lite: PhmaxLiteKind): RouteSeoLink[] {
  const module = PHMAX_SEO_MODULE_CONTENT[lite];
  const links: RouteSeoLink[] = [
    { href: USER_GUIDE_PATH, label: PRODUCT_USER_GUIDE_LABEL },
    { href: PRODUCT_VIEW_PATH[lite], label: LITE_FULL_LABEL[lite] },
  ];

  for (const related of module.related.slice(0, 1)) {
    links.push({
      href: PRODUCT_VIEW_PATH[related.view],
      label: related.label,
    });
  }

  return links;
}

function buildModuleRouteContent(view: ProductViewCode): RouteSeoContent {
  const path = PRODUCT_VIEW_PATH[view];
  const meta = PHMAX_DOCUMENT_HEAD[view];
  const module = PHMAX_SEO_MODULE_CONTENT[view];

  return {
    path,
    h1: ROUTE_SEO_H1[view],
    lead: meta.description,
    sections: [
      {
        heading: "Co kalkulačka počítá",
        paragraphs: [...module.howItWorksParagraphs],
      },
      {
        heading: "Jak kalkulačku použít",
        paragraphs: [...module.whenToUseParagraphs],
      },
    ],
    faq: module.faq.map((item) => ({ question: item.question, answer: item.answer })),
    relatedLinks: buildModuleRelatedLinks(view),
    breadcrumbs: buildPublicBreadcrumbs(path, meta.applicationName),
  };
}

function buildLiteRouteContent(lite: PhmaxLiteKind): RouteSeoContent {
  const path = LITE_PATH[lite];
  const meta = PHMAX_LITE_DOCUMENT_HEAD[lite];
  const module = PHMAX_SEO_MODULE_CONTENT[lite];

  return {
    path,
    h1: ROUTE_LITE_SEO_H1[lite],
    lead: meta.description,
    sections: [
      {
        heading: "Co kalkulačka počítá",
        paragraphs: [...module.howItWorksParagraphs],
      },
      {
        heading: "Jak kalkulačku použít",
        paragraphs: [...module.whenToUseParagraphs],
      },
    ],
    faq: module.faq.map((item) => ({ question: item.question, answer: item.answer })),
    relatedLinks: buildLiteRelatedLinks(lite),
    breadcrumbs: buildPublicBreadcrumbs(path, meta.applicationName),
  };
}

function buildUserGuideRouteContent(): RouteSeoContent {
  const dash = PHMAX_SEO_MODULE_CONTENT.dash;

  return {
    path: USER_GUIDE_PATH,
    h1: PRODUCT_USER_GUIDE_LABEL,
    lead: PRODUCT_USER_GUIDE_LEAD,
    sections: [
      {
        heading: "Co obsahuje webový návod",
        paragraphs: [PHMAX_USER_GUIDE_DOCUMENT_HEAD.description],
      },
      {
        heading: "Jak začít s kalkulačkami",
        paragraphs: [...dash.whenToUseParagraphs],
      },
    ],
    faq: dash.faq.map((item) => ({ question: item.question, answer: item.answer })),
    relatedLinks: [
      { href: KALKULACKY_PHMAX_PATH, label: PHMAX_PUBLIC_HUB_LABEL },
      { href: PRODUCT_VIEW_PATH.zs, label: "PHmax základní škola" },
      { href: PRODUCT_VIEW_PATH.pv, label: "PHmax mateřská škola" },
      { href: PHMAX_ZS_LITE_PATH, label: FULL_LITE_LABEL.zs },
      { href: VYROCNI_ZPRAVA_PATH, label: VYROCNI_ZPRAVA_LABEL },
    ],
    breadcrumbs: buildPublicBreadcrumbs(USER_GUIDE_PATH, PRODUCT_USER_GUIDE_LABEL),
  };
}

function buildVyrocniZpravaRouteContent(): RouteSeoContent {
  return {
    path: VYROCNI_ZPRAVA_PATH,
    h1: VYROCNI_ZPRAVA_SEO_H1,
    lead: VYROCNI_ZPRAVA_SEO_LEAD,
    sections: [
      {
        heading: "Co nástroj umožňuje",
        items: [
          "Přípravu výroční zprávy po jednotlivých kapitolách podle struktury v aplikaci.",
          "Průběžnou kontrolu vyplnění a stavu jednotlivých částí.",
          "Import podkladů ze souboru XLSX, pokud máte připravenou šablonu.",
          "Náhled sestavené zprávy před exportem.",
          "Export výsledného dokumentu ve formátu DOCX.",
        ],
      },
      {
        heading: "Jak při přípravě postupovat",
        items: [
          "Doplňte profil školy – identifikační údaje se použijí v příslušných kapitolách.",
          "Vyplňte jednotlivé části zprávy v modulu po kapitolách.",
          "Zkontrolujte úplnost a stav vyplnění u jednotlivých sekcí.",
          "Otevřete náhled zprávy a ověřte obsah před exportem.",
          "Exportujte dokument ve formátu DOCX.",
        ],
      },
      {
        heading: "Jak jsou data ukládána",
        paragraphs: [
          "Údaje o výroční zprávě a jednotlivých kapitolách zůstávají v tomto prohlížeči. Aplikace je automaticky neodesílá na server.",
          "Pro přenos mezi zařízeními použijte export a import v pokročilých nástrojích aplikace (role IT).",
        ],
      },
      {
        heading: "Co nástroj nenahrazuje",
        paragraphs: [
          "Jde o pomůcku pro přípravu zprávy. Za správnost, úplnost a schválení výsledného dokumentu odpovídá škola – před odesláním zřizovateli a zveřejněním vždy zkontrolujte obsah.",
        ],
      },
    ],
    faq: VYROCNI_ZPRAVA_SEO_FAQ.map((item) => ({ question: item.question, answer: item.answer })),
    relatedLinks: [
      { href: KALKULACKY_PHMAX_PATH, label: PHMAX_PUBLIC_HUB_LABEL },
      { href: USER_GUIDE_PATH, label: PRODUCT_USER_GUIDE_LABEL },
      { href: VYROCNI_ZPRAVA_PATH, label: "Modul výroční zprávy" },
    ],
    breadcrumbs: buildPublicBreadcrumbs(VYROCNI_ZPRAVA_PATH, VYROCNI_ZPRAVA_LABEL),
  };
}

function buildKalkulackyPhmaxRouteContent(): RouteSeoContent {
  return {
    path: KALKULACKY_PHMAX_PATH,
    h1: KALKULACKY_PHMAX_SEO_H1,
    lead:
      "Ředitelský průvodce nabízí orientační kalkulačky PHmax pro jednotlivé typy škol, banku odpočtů zástupců ředitele, webový návod a modul pro přípravu výroční zprávy. Nástroje jsou dostupné z prohlížeče bez registrace.",
    sections: [
      {
        heading: "Kalkulačky PHmax podle typu školy",
        items: [
          "Mateřská škola a předškolní vzdělávání – orientační PHmax a PHAmax.",
          "Základní škola – PHmax, PHAmax a PHPmax včetně detailní metodiky.",
          "Střední škola – výpočet podle oborů a tříd.",
          "Školní družina – orientační PHmax pro družinu.",
        ],
      },
      {
        heading: "Další nástroje",
        items: [
          "Banka odpočtů zástupců ředitele (NV75) – orientační výpočet odpočtů.",
          "Rychlé kalkulačky pro mateřskou školu, základní školu a školní družinu.",
          "Webový návod k použití kalkulaček a doporučený postup.",
          "Modul pro přípravu výroční zprávy školy po kapitolách.",
        ],
      },
    ],
    faq: [],
    relatedLinks: [
      { href: PRODUCT_VIEW_PATH.pv, label: PHMAX_DOCUMENT_HEAD.pv.applicationName },
      { href: PRODUCT_VIEW_PATH.zs, label: PHMAX_DOCUMENT_HEAD.zs.applicationName },
      { href: PRODUCT_VIEW_PATH.ss, label: PHMAX_DOCUMENT_HEAD.ss.applicationName },
      { href: PRODUCT_VIEW_PATH.sd, label: PHMAX_DOCUMENT_HEAD.sd.applicationName },
      { href: PRODUCT_VIEW_PATH.nv75, label: PHMAX_DOCUMENT_HEAD.nv75.applicationName },
      { href: PHMAX_PV_LITE_PATH, label: FULL_LITE_LABEL.pv },
      { href: PHMAX_SD_LITE_PATH, label: FULL_LITE_LABEL.sd },
      { href: PHMAX_ZS_LITE_PATH, label: FULL_LITE_LABEL.zs },
      { href: USER_GUIDE_PATH, label: PRODUCT_USER_GUIDE_LABEL },
      { href: VYROCNI_ZPRAVA_PATH, label: VYROCNI_ZPRAVA_LABEL },
    ],
    breadcrumbs: [{ href: KALKULACKY_PHMAX_PATH, label: KALKULACKY_PHMAX_SEO_H1 }],
  };
}

const PATH_TO_VIEW = new Map<string, ProductViewCode>(
  (Object.entries(PRODUCT_VIEW_PATH) as [ProductViewCode, string][]).map(([view, routePath]) => [routePath, view]),
);

const PATH_TO_LITE = new Map<string, PhmaxLiteKind>([
  [PHMAX_PV_LITE_PATH, "pv"],
  [PHMAX_SD_LITE_PATH, "sd"],
  [PHMAX_ZS_LITE_PATH, "zs"],
]);

export function isPhaseCSeoContentPath(pathname: string): pathname is PhaseCSeoContentPath {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return (PHASE_C_SEO_CONTENT_PATHS as readonly string[]).includes(norm);
}

export function isSeoPrerenderContentPath(pathname: string): pathname is SeoPrerenderContentPath {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return (SEO_PRERENDER_CONTENT_PATHS as readonly string[]).includes(norm);
}

export function getRouteSeoContent(pathname: string): RouteSeoContent | null {
  const norm = pathname.replace(/\/+$/, "") || "/";

  if (norm === KALKULACKY_PHMAX_PATH) return buildKalkulackyPhmaxRouteContent();
  if (norm === VYROCNI_ZPRAVA_PATH) return buildVyrocniZpravaRouteContent();
  if (norm === USER_GUIDE_PATH) return buildUserGuideRouteContent();

  const lite = PATH_TO_LITE.get(norm);
  if (lite) return buildLiteRouteContent(lite);

  const view = PATH_TO_VIEW.get(norm);
  if (view && view !== "dash") return buildModuleRouteContent(view);

  return null;
}

export function listPhaseCSeoContentRoutes(): RouteSeoContent[] {
  return PHASE_C_SEO_CONTENT_PATHS.map((routePath) => {
    const content = getRouteSeoContent(routePath);
    if (!content) throw new Error(`Missing route SEO content for ${routePath}`);
    return content;
  });
}

export function listSeoPrerenderContentRoutes(): RouteSeoContent[] {
  return SEO_PRERENDER_CONTENT_PATHS.map((routePath) => {
    const content = getRouteSeoContent(routePath);
    if (!content) throw new Error(`Missing route SEO content for ${routePath}`);
    return content;
  });
}
