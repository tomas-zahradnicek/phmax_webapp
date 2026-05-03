import React, { Suspense, lazy, useCallback, useState } from "react";
import type { ProductView } from "./ProductViewPills";
import { readInitialProductView } from "./product-view-url";

const PhmaxPvPage = lazy(() => import("./PhmaxPvPage").then((m) => ({ default: m.PhmaxPvPage })));
const PhmaxSdPage = lazy(() => import("./PhmaxSdPage").then((m) => ({ default: m.PhmaxSdPage })));
const PhmaxSsPage = lazy(() => import("./PhmaxSsPage").then((m) => ({ default: m.PhmaxSsPage })));
const PhmaxNv75DeputyPage = lazy(() => import("./PhmaxNv75DeputyPage").then((m) => ({ default: m.PhmaxNv75DeputyPage })));
const PhmaxZsPage = lazy(() => import("./PhmaxZsPage").then((m) => ({ default: m.PhmaxZsPage })));
const PhmaxDashboardPage = lazy(() => import("./PhmaxDashboardPage").then((m) => ({ default: m.PhmaxDashboardPage })));

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

  const shell = (child: React.ReactNode) => (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <Suspense fallback={<div className="card muted">Načítám kalkulačku…</div>}>{child}</Suspense>
      </div>
    </div>
  );

  switch (productView) {
    case "dash":
      return (
        <Suspense
          fallback={
            <div className="app-shell app-shell--gradient">
              <div className="container container--app">
                <div className="card muted">Načítám přehled…</div>
              </div>
            </div>
          }
        >
          <PhmaxDashboardPage productView={productView} setProductView={setProductView} />
        </Suspense>
      );
    case "pv":
      return shell(<PhmaxPvPage productView={productView} setProductView={setProductView} />);
    case "sd":
      return shell(<PhmaxSdPage productView={productView} setProductView={setProductView} />);
    case "ss":
      return shell(<PhmaxSsPage productView={productView} setProductView={setProductView} />);
    case "zs":
      return (
        <Suspense fallback={<div className="app-shell app-shell--gradient"><div className="container container--app"><div className="card muted">Načítám kalkulačku…</div></div></div>}>
          <PhmaxZsPage productView={productView} setProductView={setProductView} />
        </Suspense>
      );
    case "nv75":
      return shell(<PhmaxNv75DeputyPage productView={productView} setProductView={setProductView} />);
    default: {
      const _missing: never = productView;
      return _missing;
    }
  }
}
