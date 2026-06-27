import { PROFIL_SKOLY_PATH } from "./calculator-ui-constants";

export function isProfilSkolyPathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === PROFIL_SKOLY_PATH;
}

export function writeProfilSkolyUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PROFIL_SKOLY_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ profilSkoly: true }, "", target);
  } else {
    window.history.replaceState({ profilSkoly: true }, "", target);
  }
}
