import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import type { ProductView } from "./ProductViewPills";
import { isPvLitePathname, isSdLitePathname, isZsLitePathname } from "./phmax-lite-paths";
import {
  LEGACY_VIEW_QUERY,
  productViewFromPathname,
  PRODUCT_VIEW_PATH,
} from "./product-view-paths";

export {
  isLegacyViewQueryUrl,
  LEGACY_VIEW_QUERY,
  PRODUCT_VIEW_PATH,
  productViewFromPathname,
} from "./product-view-paths";

export function readInitialProductView(): ProductView {
  if (typeof window === "undefined") return "dash";
  const norm = window.location.pathname.replace(/\/+$/, "") || "/";
  if (norm === "/") return "dash";
  if (isSdLitePathname(window.location.pathname)) return "sd";
  if (isPvLitePathname(window.location.pathname)) return "pv";
  if (isZsLitePathname(window.location.pathname)) return "zs";
  const fromPath = productViewFromPathname(window.location.pathname);
  if (fromPath) return fromPath;
  const q = new URLSearchParams(window.location.search).get(LEGACY_VIEW_QUERY);
  if (q && (PRODUCT_VIEW_CODES as readonly string[]).includes(q)) return q as ProductView;
  // Neznámá cesta → přehled (ne ZŠ), aby nevznikal soft-404 jako kalkulačka ZŠ.
  return "dash";
}

/** Synchronizuje adresu s aktivním modulem (čisté path, bez `?view=`). */
export function writeProductViewUrl(view: ProductView, mode: "replace" | "push" = "replace"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PRODUCT_VIEW_PATH[view];
  url.searchParams.delete(LEGACY_VIEW_QUERY);
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxView: view }, "", target);
  } else {
    window.history.replaceState({ phmaxView: view }, "", target);
  }
}
