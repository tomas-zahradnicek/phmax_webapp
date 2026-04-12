import React, { useCallback, useState } from "react";
import { PhmaxPvPage } from "./PhmaxPvPage";
import { PhmaxSdPage } from "./PhmaxSdPage";
import { PhmaxZsPage } from "./PhmaxZsPage";
import type { ProductView } from "./ProductViewPills";
import { readInitialProductView } from "./product-view-url";

export default function App() {
  const [productView, setProductViewState] = useState<ProductView>(() => readInitialProductView());
  const setProductView = useCallback((v: ProductView) => {
    setProductViewState(v);
    window.scrollTo(0, 0);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  }, []);

  if (productView === "pv") {
    return (
      <div className="app-shell app-shell--gradient">
        <div className="container container--app">
          <PhmaxPvPage productView={productView} setProductView={setProductView} />
        </div>
      </div>
    );
  }

  if (productView === "sd") {
    return (
      <div className="app-shell app-shell--gradient">
        <div className="container container--app">
          <PhmaxSdPage productView={productView} setProductView={setProductView} />
        </div>
      </div>
    );
  }

  return <PhmaxZsPage productView={productView} setProductView={setProductView} />;
}
