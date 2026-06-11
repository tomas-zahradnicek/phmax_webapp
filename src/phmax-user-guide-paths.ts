import { USER_GUIDE_PATH } from "./calculator-ui-constants";

export function isUserGuidePathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === USER_GUIDE_PATH;
}

export function writeUserGuideUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = USER_GUIDE_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxUserGuide: true }, "", target);
  } else {
    window.history.replaceState({ phmaxUserGuide: true }, "", target);
  }
}
