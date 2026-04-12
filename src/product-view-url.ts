import type { ProductView } from "./ProductViewPills";

export function readInitialProductView(): ProductView {
  if (typeof window === "undefined") return "zs";
  const p = new URLSearchParams(window.location.search).get("view");
  if (p === "pv" || p === "sd" || p === "zs") return p;
  return "zs";
}
