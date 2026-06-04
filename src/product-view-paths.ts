import { PRODUCT_VIEW_CODES, type ProductViewCode } from "./calculator-ui-constants";

/** Čisté URL modulů (SEO, sdílení, sitemap). */
export const PRODUCT_VIEW_PATH: Record<ProductViewCode, string> = {
  dash: "/prehled",
  pv: "/phmax-predskolni-vzdelavani",
  sd: "/phmax-skolni-druzina",
  zs: "/phmax-zakladni-skola",
  ss: "/phmax-stredni-skola",
  nv75: "/banka-odpoctu-zastupcu-reditele",
};

export const LEGACY_VIEW_QUERY = "view";

const PATH_TO_VIEW = new Map<string, ProductViewCode>(
  (Object.entries(PRODUCT_VIEW_PATH) as [ProductViewCode, string][]).map(([view, path]) => [path, view]),
);

export function productViewFromPathname(pathname: string): ProductViewCode | null {
  const norm = pathname.replace(/\/+$/, "") || "/";
  if (norm === "/") return null;
  return PATH_TO_VIEW.get(norm) ?? null;
}

export function isLegacyViewQueryUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(LEGACY_VIEW_QUERY);
}

export function buildProductViewPageUrl(
  view: ProductViewCode,
  origin = typeof window !== "undefined" ? window.location.origin : "https://phmax-webapp.vercel.app",
): string {
  return new URL(PRODUCT_VIEW_PATH[view], origin).href;
}

export function listProductViewPathUrls(origin = "https://phmax-webapp.vercel.app"): string[] {
  return PRODUCT_VIEW_CODES.map((view) => buildProductViewPageUrl(view, origin));
}
