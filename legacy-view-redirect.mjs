/** Sdílená logika legacy redirectů pro Vercel middleware a lokální SEO routing testy. */
export const LEGACY_VIEW_PATHS = {
  pv: "/phmax-predskolni-vzdelavani",
  sd: "/phmax-skolni-druzina",
  zs: "/phmax-zakladni-skola",
  ss: "/phmax-stredni-skola",
  nv75: "/banka-odpoctu-zastupcu-reditele",
  dash: "/prehled",
};

/** Veřejná landing page – cíl přesměrování z kořenové `/` bez `?view=`. */
export const ROOT_REDIRECT_PATH = "/kalkulacky-phmax";

/**
 * @param {string} requestUrl
 * @returns {string | null} Cílová URL (path + search + hash) nebo null = bez redirectu.
 */
export function resolveLegacyViewRedirect(requestUrl) {
  const url = new URL(requestUrl);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (pathname !== "/" && pathname !== "/prehled") return null;

  const view = url.searchParams.get("view");

  if (view) {
    const mapped = LEGACY_VIEW_PATHS[view];
    if (mapped) {
      url.pathname = mapped;
      url.searchParams.delete("view");
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (pathname === "/") {
      // Neznámý ?view= na kořeni → landing (jeden hop, ne přes /prehled).
      url.pathname = ROOT_REDIRECT_PATH;
      url.searchParams.delete("view");
      return `${url.pathname}${url.search}${url.hash}`;
    }
    // /prehled?view=unknown → bez redirectu (zůstane přehled).
    return null;
  }

  if (pathname === "/") {
    url.pathname = ROOT_REDIRECT_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  // /prehled bez query → žádný redirect (pokračování ke statickému souboru).
  return null;
}
