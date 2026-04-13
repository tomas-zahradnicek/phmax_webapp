import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import type { ProductView } from "./ProductViewPills";

export function readInitialProductView(): ProductView {
  if (typeof window === "undefined") return "zs";
  const p = new URLSearchParams(window.location.search).get("view");
  if (p && (PRODUCT_VIEW_CODES as readonly string[]).includes(p)) return p as ProductView;
  return "zs";
}
