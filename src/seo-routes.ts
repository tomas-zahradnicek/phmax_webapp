/**
 * Centrální registr veřejných SEO tras — jediný zdroj pravdy pro indexovatelnost,
 * sitemap a mapování path ↔ ProductView / lite režim.
 *
 * Metadata title/description a H1 se berou z existujících konstant
 * (phmax-document-head, phmax-route-seo-content), aby nedošlo k rozjetí textů.
 */
import {
  PRODUCT_VIEW_CODES,
  USER_GUIDE_PATH,
  VYROCNI_ZPRAVA_PATH,
  VYROCNI_ZPRAVA_NAHLED_PATH,
  PROFIL_SKOLY_PATH,
  type ProductViewCode,
} from "./calculator-ui-constants";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  PHMAX_LANDING_DOCUMENT_HEAD,
  PHMAX_USER_GUIDE_DOCUMENT_HEAD,
  PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD,
  PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD,
  PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD,
  type PhmaxLiteKind,
} from "./phmax-document-head";
import { KALKULACKY_PHMAX_PATH, KALKULACKY_PHMAX_SEO_H1 } from "./phmax-landing-paths";
import { PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH, PHMAX_ZS_LITE_PATH } from "./phmax-lite-paths";
import { getRouteSeoContent } from "./phmax-route-seo-content";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "./phmax-site-origin";
import { VYROCNI_ZPRAVA_SEO_H1, VYROCNI_ZPRAVA_SEO_LEAD } from "./vyrocni-zprava-seo-content";

export type SeoRoute = {
  path: string;
  productView?: ProductViewCode;
  liteKind?: PhmaxLiteKind;
  title: string;
  description: string;
  /** Absolutní HTTPS canonical (bez query). */
  canonical: string;
  h1: string;
  intro: string;
  indexable: boolean;
  includeInSitemap: boolean;
  /** Path nadřazené stránky, pokud canonical ≠ path (např. /rychly → plná kalkulačka). */
  canonicalParent?: string;
};

const LITE_PARENT: Record<PhmaxLiteKind, ProductViewCode> = {
  pv: "pv",
  sd: "sd",
  zs: "zs",
};

const LITE_PATH: Record<PhmaxLiteKind, string> = {
  pv: PHMAX_PV_LITE_PATH,
  sd: PHMAX_SD_LITE_PATH,
  zs: PHMAX_ZS_LITE_PATH,
};

export function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "") || "/";
}

function absoluteCanonical(path: string, origin = PHMAX_SITE_ORIGIN_FALLBACK): string {
  return new URL(path === "/" ? "/" : path, origin).href;
}

function routeFromProduct(view: ProductViewCode): SeoRoute {
  const path = PRODUCT_VIEW_PATH[view];
  const meta = PHMAX_DOCUMENT_HEAD[view];
  const content = getRouteSeoContent(path);
  const indexable = view !== "dash";
  return {
    path,
    productView: view,
    title: meta.title,
    description: meta.description,
    canonical: absoluteCanonical(path),
    h1: content?.h1 ?? meta.applicationName,
    intro: content?.lead ?? meta.description,
    indexable,
    includeInSitemap: indexable,
  };
}

function routeFromLite(lite: PhmaxLiteKind): SeoRoute {
  const path = LITE_PATH[lite];
  const parentView = LITE_PARENT[lite];
  const parentPath = PRODUCT_VIEW_PATH[parentView];
  const meta = PHMAX_LITE_DOCUMENT_HEAD[lite];
  const content = getRouteSeoContent(path);
  return {
    path,
    productView: parentView,
    liteKind: lite,
    title: meta.title,
    description: meta.description,
    canonical: absoluteCanonical(parentPath),
    canonicalParent: parentPath,
    h1: content?.h1 ?? meta.applicationName,
    intro: content?.lead ?? meta.description,
    indexable: false,
    includeInSitemap: false,
  };
}

/** Všechny veřejné trasy se SEO kontraktem (včetně noindex). */
export const SEO_ROUTES: readonly SeoRoute[] = [
  {
    path: KALKULACKY_PHMAX_PATH,
    title: PHMAX_LANDING_DOCUMENT_HEAD.title,
    description: PHMAX_LANDING_DOCUMENT_HEAD.description,
    canonical: absoluteCanonical(KALKULACKY_PHMAX_PATH),
    h1: getRouteSeoContent(KALKULACKY_PHMAX_PATH)?.h1 ?? KALKULACKY_PHMAX_SEO_H1,
    intro: getRouteSeoContent(KALKULACKY_PHMAX_PATH)?.lead ?? PHMAX_LANDING_DOCUMENT_HEAD.description,
    indexable: true,
    includeInSitemap: true,
  },
  ...PRODUCT_VIEW_CODES.map(routeFromProduct),
  {
    path: USER_GUIDE_PATH,
    title: PHMAX_USER_GUIDE_DOCUMENT_HEAD.title,
    description: PHMAX_USER_GUIDE_DOCUMENT_HEAD.description,
    canonical: absoluteCanonical(USER_GUIDE_PATH),
    h1: getRouteSeoContent(USER_GUIDE_PATH)?.h1 ?? "Návod k použití",
    intro: getRouteSeoContent(USER_GUIDE_PATH)?.lead ?? PHMAX_USER_GUIDE_DOCUMENT_HEAD.description,
    indexable: true,
    includeInSitemap: true,
  },
  {
    path: VYROCNI_ZPRAVA_PATH,
    title: PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD.title,
    description: PHMAX_VYROCNI_ZPRAVA_DOCUMENT_HEAD.description,
    canonical: absoluteCanonical(VYROCNI_ZPRAVA_PATH),
    h1: getRouteSeoContent(VYROCNI_ZPRAVA_PATH)?.h1 ?? VYROCNI_ZPRAVA_SEO_H1,
    intro: getRouteSeoContent(VYROCNI_ZPRAVA_PATH)?.lead ?? VYROCNI_ZPRAVA_SEO_LEAD,
    indexable: true,
    includeInSitemap: true,
  },
  routeFromLite("pv"),
  routeFromLite("sd"),
  routeFromLite("zs"),
  {
    path: PROFIL_SKOLY_PATH,
    title: PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD.title,
    description: PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD.description,
    canonical: absoluteCanonical(PROFIL_SKOLY_PATH),
    h1: PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD.applicationName,
    intro: PHMAX_PROFIL_SKOLY_DOCUMENT_HEAD.description,
    indexable: false,
    includeInSitemap: false,
  },
  {
    path: VYROCNI_ZPRAVA_NAHLED_PATH,
    title: PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD.title,
    description: PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD.description,
    canonical: absoluteCanonical(VYROCNI_ZPRAVA_NAHLED_PATH),
    h1: PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD.applicationName,
    intro: PHMAX_VYROCNI_ZPRAVA_PREVIEW_DOCUMENT_HEAD.description,
    indexable: false,
    includeInSitemap: false,
  },
];

const BY_PATH = new Map(SEO_ROUTES.map((route) => [normalizePathname(route.path), route]));

export function getSeoRouteByPath(pathname: string): SeoRoute | undefined {
  return BY_PATH.get(normalizePathname(pathname));
}

export function getPathByProductView(productView: ProductViewCode): string {
  return PRODUCT_VIEW_PATH[productView];
}

/** Kanonické indexovatelné trasy pro sitemap. */
export function getCanonicalRoutes(): readonly SeoRoute[] {
  return SEO_ROUTES.filter((route) => route.includeInSitemap && route.indexable);
}

export function listSitemapPaths(): readonly string[] {
  return getCanonicalRoutes().map((route) => route.path);
}

export function getLiteCanonicalParentPath(lite: PhmaxLiteKind): string {
  return PRODUCT_VIEW_PATH[LITE_PARENT[lite]];
}
