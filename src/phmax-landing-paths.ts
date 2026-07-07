/** Veřejná indexovatelná landing page kalkulaček a nástrojů (fáze D2). */
export const KALKULACKY_PHMAX_PATH = "/kalkulacky-phmax";

export const PHMAX_PUBLIC_HUB_LABEL = "Kalkulačky a nástroje";

export const KALKULACKY_PHMAX_SEO_H1 = "Kalkulačky PHmax a nástroje pro ředitele škol";

export function isKalkulackyPhmaxPathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === KALKULACKY_PHMAX_PATH;
}
