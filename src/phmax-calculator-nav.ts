import { PRODUCT_VIEW_PATH } from "./product-view-paths";

/** Veřejná navigace mezi hlavními kalkulačkami PHmax (prerender + UI). */
export const PHMAX_CALCULATOR_NAV_LINKS = [
  { href: PRODUCT_VIEW_PATH.pv, label: "Předškolní vzdělávání" },
  { href: PRODUCT_VIEW_PATH.sd, label: "Školní družina" },
  { href: PRODUCT_VIEW_PATH.zs, label: "Základní školy" },
  { href: PRODUCT_VIEW_PATH.ss, label: "Střední školy" },
  { href: PRODUCT_VIEW_PATH.nv75, label: "Banka odpočtů zástupců" },
] as const;

export const PHMAX_CALCULATOR_NAV_ARIA_LABEL = "Kalkulačky PHmax";

/** Stránky, které mají v SEO shellu zobrazit navigaci kalkulaček. */
export function shouldIncludePhmaxCalculatorNav(path: string): boolean {
  const norm = path.replace(/\/+$/, "") || "/";
  if (norm === "/kalkulacky-phmax" || norm === "/navod" || norm === "/vyrocni-zprava") return true;
  if (norm === PRODUCT_VIEW_PATH.nv75) return true;
  return (
    norm === PRODUCT_VIEW_PATH.pv ||
    norm === PRODUCT_VIEW_PATH.sd ||
    norm === PRODUCT_VIEW_PATH.zs ||
    norm === PRODUCT_VIEW_PATH.ss ||
    norm.startsWith(`${PRODUCT_VIEW_PATH.pv}/`) ||
    norm.startsWith(`${PRODUCT_VIEW_PATH.sd}/`) ||
    norm.startsWith(`${PRODUCT_VIEW_PATH.zs}/`)
  );
}
