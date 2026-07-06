import type { ProductViewCode } from "./calculator-ui-constants";
import {
  PRODUCT_USER_GUIDE_LABEL,
  PRODUCT_USER_GUIDE_LEAD,
  USER_GUIDE_PATH,
} from "./calculator-ui-constants";
import type { PhmaxLiteKind } from "./phmax-document-head";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  PHMAX_SITE_NAME,
  PHMAX_USER_GUIDE_DOCUMENT_HEAD,
} from "./phmax-document-head";
import {
  PHMAX_PV_LITE_PATH,
  PHMAX_SD_LITE_PATH,
  PHMAX_ZS_LITE_PATH,
} from "./phmax-lite-paths";
import { PHMAX_SEO_MODULE_CONTENT } from "./phmax-seo-module-content";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";

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

function buildBreadcrumbs(path: string, currentLabel: string): RouteSeoLink[] {
  return [
    { href: PRODUCT_VIEW_PATH.dash, label: PHMAX_SITE_NAME },
    { href: path, label: currentLabel },
  ];
}

function buildModuleRelatedLinks(view: ProductViewCode): RouteSeoLink[] {
  const module = PHMAX_SEO_MODULE_CONTENT[view];
  const links: RouteSeoLink[] = [
    { href: USER_GUIDE_PATH, label: PRODUCT_USER_GUIDE_LABEL },
  ];

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
    breadcrumbs: buildBreadcrumbs(path, meta.applicationName),
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
    breadcrumbs: buildBreadcrumbs(path, meta.applicationName),
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
      { href: USER_GUIDE_PATH, label: "Webový návod k aplikaci" },
      { href: PRODUCT_VIEW_PATH.dash, label: "Přehled modulů školy" },
      { href: PRODUCT_VIEW_PATH.zs, label: "PHmax základní škola" },
      { href: PRODUCT_VIEW_PATH.pv, label: "PHmax mateřská škola" },
      { href: PHMAX_ZS_LITE_PATH, label: FULL_LITE_LABEL.zs },
    ],
    breadcrumbs: buildBreadcrumbs(USER_GUIDE_PATH, PRODUCT_USER_GUIDE_LABEL),
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

export function getRouteSeoContent(pathname: string): RouteSeoContent | null {
  const norm = pathname.replace(/\/+$/, "") || "/";

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
