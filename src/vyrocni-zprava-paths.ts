import { VYROCNI_ZPRAVA_NAHLED_PATH, VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";

export function isVyrocniZpravaPathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === VYROCNI_ZPRAVA_PATH || norm === VYROCNI_ZPRAVA_NAHLED_PATH;
}

export function isVyrocniZpravaPreviewPathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === VYROCNI_ZPRAVA_NAHLED_PATH;
}

export function writeVyrocniZpravaUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = VYROCNI_ZPRAVA_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ vyrocniZprava: true }, "", target);
  } else {
    window.history.replaceState({ vyrocniZprava: true }, "", target);
  }
}

export function writeVyrocniZpravaPreviewUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = VYROCNI_ZPRAVA_NAHLED_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ vyrocniZpravaPreview: true }, "", target);
  } else {
    window.history.replaceState({ vyrocniZpravaPreview: true }, "", target);
  }
}
