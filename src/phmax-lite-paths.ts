import { PRODUCT_VIEW_PATH } from "./product-view-paths";

/** Přípona URL pro zjednodušený režim „Rychlý PHmax“. */
export const PHMAX_LITE_PATH_SUFFIX = "/rychly";

export const PHMAX_SD_LITE_PATH = `${PRODUCT_VIEW_PATH.sd}${PHMAX_LITE_PATH_SUFFIX}`;
export const PHMAX_PV_LITE_PATH = `${PRODUCT_VIEW_PATH.pv}${PHMAX_LITE_PATH_SUFFIX}`;
export const PHMAX_ZS_LITE_PATH = `${PRODUCT_VIEW_PATH.zs}${PHMAX_LITE_PATH_SUFFIX}`;

export function isSdLitePathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === PHMAX_SD_LITE_PATH;
}

export function isPvLitePathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === PHMAX_PV_LITE_PATH;
}

export function isZsLitePathname(pathname: string): boolean {
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === PHMAX_ZS_LITE_PATH;
}

export function writeSdLiteUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PHMAX_SD_LITE_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxLite: "sd" }, "", target);
  } else {
    window.history.replaceState({ phmaxLite: "sd" }, "", target);
  }
}

export function writeSdFullUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PRODUCT_VIEW_PATH.sd;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxView: "sd" }, "", target);
  } else {
    window.history.replaceState({ phmaxView: "sd" }, "", target);
  }
}

export function writePvLiteUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PHMAX_PV_LITE_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxLite: "pv" }, "", target);
  } else {
    window.history.replaceState({ phmaxLite: "pv" }, "", target);
  }
}

export function writePvFullUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PRODUCT_VIEW_PATH.pv;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxView: "pv" }, "", target);
  } else {
    window.history.replaceState({ phmaxView: "pv" }, "", target);
  }
}

export function writeZsLiteUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PHMAX_ZS_LITE_PATH;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxLite: "zs" }, "", target);
  } else {
    window.history.replaceState({ phmaxLite: "zs" }, "", target);
  }
}

export function writeZsFullUrl(mode: "replace" | "push" = "push"): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = PRODUCT_VIEW_PATH.zs;
  url.searchParams.delete("view");
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({ phmaxView: "zs" }, "", target);
  } else {
    window.history.replaceState({ phmaxView: "zs" }, "", target);
  }
}
