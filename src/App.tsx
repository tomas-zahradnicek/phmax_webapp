import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";
import {
  recordDashboardProductVisit,
  recordLastActiveProduct,
  type DashboardVisitProduct,
} from "./phmax-dashboard-visits";
import { readInitialProductView } from "./product-view-url";
import { UiToastHost } from "./ui-toast";

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
    if (v !== "dash") {
      const product = v as DashboardVisitProduct;
      recordDashboardProductVisit(product);
      recordLastActiveProduct(product);
    }
    window.scrollTo(0, 0);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (productView !== "dash") {
      const product = productView as DashboardVisitProduct;
      recordDashboardProductVisit(product);
      recordLastActiveProduct(product);
    }
  }, [productView]);

  const shell = (child: React.ReactNode) => (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <Suspense fallback={<div className="card muted">Načítám kalkulačku…</div>}>{child}</Suspense>
      </div>
    </div>
  );

  let page: React.ReactNode;
  switch (productView) {
    case "dash":
      page = (
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
      break;
    case "pv":
      page = shell(<PhmaxPvPage productView={productView} setProductView={setProductView} />);
      break;
    case "sd":
      page = shell(<PhmaxSdPage productView={productView} setProductView={setProductView} />);
      break;
    case "ss":
      page = shell(<PhmaxSsPage productView={productView} setProductView={setProductView} />);
      break;
    case "zs":
      page = (
        <Suspense
          fallback={
            <div className="app-shell app-shell--gradient">
              <div className="container container--app">
                <div className="card muted">Načítám kalkulačku…</div>
              </div>
            </div>
          }
        >
          <PhmaxZsPage productView={productView} setProductView={setProductView} />
        </Suspense>
      );
      break;
    case "nv75":
      page = shell(<PhmaxNv75DeputyPage productView={productView} setProductView={setProductView} />);
      break;
    default: {
      const _missing: never = productView;
      page = _missing;
    }
  }

  return (
    <>
      <UiToastHost />
      {page}
    </>
  );
}
