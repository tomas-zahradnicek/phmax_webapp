import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";
import { AppWhatsNewProvider } from "./AppWhatsNewContext";
import { SkipToMainLink } from "./SkipToMainLink";
import {
  recordDashboardProductVisit,
  recordLastActiveProduct,
  type DashboardVisitProduct,
} from "./phmax-dashboard-visits";
import { applyPhmaxDocumentHead, applyPhmaxLiteDocumentHead } from "./phmax-document-head";
import {
  isPvLitePathname,
  isSdLitePathname,
  isZsLitePathname,
  writePvLiteUrl,
  writeSdLiteUrl,
  writeZsLiteUrl,
} from "./phmax-lite-paths";
import { isLegacyViewQueryUrl, readInitialProductView, writeProductViewUrl } from "./product-view-url";
import { UiToastHost } from "./ui-toast";

const PhmaxPvPage = lazy(() => import("./PhmaxPvPage").then((m) => ({ default: m.PhmaxPvPage })));
const PhmaxSdPage = lazy(() => import("./PhmaxSdPage").then((m) => ({ default: m.PhmaxSdPage })));
const PhmaxSdLitePage = lazy(() => import("./sd/PhmaxSdLitePage").then((m) => ({ default: m.PhmaxSdLitePage })));
const PhmaxPvLitePage = lazy(() => import("./pv/PhmaxPvLitePage").then((m) => ({ default: m.PhmaxPvLitePage })));
const PhmaxSsPage = lazy(() => import("./PhmaxSsPage").then((m) => ({ default: m.PhmaxSsPage })));
const PhmaxNv75DeputyPage = lazy(() => import("./PhmaxNv75DeputyPage").then((m) => ({ default: m.PhmaxNv75DeputyPage })));
const PhmaxZsPage = lazy(() => import("./PhmaxZsPage").then((m) => ({ default: m.PhmaxZsPage })));
const PhmaxZsLitePage = lazy(() => import("./zs/PhmaxZsLitePage").then((m) => ({ default: m.PhmaxZsLitePage })));
const PhmaxDashboardPage = lazy(() => import("./PhmaxDashboardPage").then((m) => ({ default: m.PhmaxDashboardPage })));

export default function App() {
  const [productView, setProductViewState] = useState<ProductView>(() => readInitialProductView());
  const [sdLiteActive, setSdLiteActive] = useState(
    () => typeof window !== "undefined" && isSdLitePathname(window.location.pathname),
  );
  const [pvLiteActive, setPvLiteActive] = useState(
    () => typeof window !== "undefined" && isPvLitePathname(window.location.pathname),
  );
  const [zsLiteActive, setZsLiteActive] = useState(
    () => typeof window !== "undefined" && isZsLitePathname(window.location.pathname),
  );
  const setProductView = useCallback((v: ProductView) => {
    setSdLiteActive(false);
    setPvLiteActive(false);
    setZsLiteActive(false);
    setProductViewState(v);
    if (v !== "dash") {
      const product = v as DashboardVisitProduct;
      recordDashboardProductVisit(product);
      recordLastActiveProduct(product);
    }
    window.scrollTo(0, 0);
    writeProductViewUrl(v, "push");
  }, []);

  useEffect(() => {
    if (isLegacyViewQueryUrl()) {
      writeProductViewUrl(readInitialProductView(), "replace");
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setProductViewState(readInitialProductView());
      setSdLiteActive(isSdLitePathname(window.location.pathname));
      setPvLiteActive(isPvLitePathname(window.location.pathname));
      setZsLiteActive(isZsLitePathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (pvLiteActive) {
      applyPhmaxLiteDocumentHead("pv");
    } else if (sdLiteActive) {
      applyPhmaxLiteDocumentHead("sd");
    } else if (zsLiteActive) {
      applyPhmaxLiteDocumentHead("zs");
    } else {
      applyPhmaxDocumentHead(productView);
    }
    if (productView !== "dash") {
      const product = productView as DashboardVisitProduct;
      recordDashboardProductVisit(product);
      recordLastActiveProduct(product);
    }
  }, [productView, pvLiteActive, sdLiteActive, zsLiteActive]);

  const openSdLite = useCallback(() => {
    setProductViewState("sd");
    setSdLiteActive(true);
    writeSdLiteUrl("push");
    window.scrollTo(0, 0);
  }, []);

  const leaveSdLite = useCallback(() => {
    setSdLiteActive(false);
  }, []);

  const openPvLite = useCallback(() => {
    setProductViewState("pv");
    setPvLiteActive(true);
    writePvLiteUrl("push");
    window.scrollTo(0, 0);
  }, []);

  const leavePvLite = useCallback(() => {
    setPvLiteActive(false);
  }, []);

  const openZsLite = useCallback(() => {
    setProductViewState("zs");
    setZsLiteActive(true);
    writeZsLiteUrl("push");
    window.scrollTo(0, 0);
  }, []);

  const leaveZsLite = useCallback(() => {
    setZsLiteActive(false);
  }, []);

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
          <PhmaxDashboardPage
            productView={productView}
            setProductView={setProductView}
            onOpenPvLite={openPvLite}
            onOpenSdLite={openSdLite}
            onOpenZsLite={openZsLite}
          />
        </Suspense>
      );
      break;
    case "pv":
      page = pvLiteActive
        ? shell(
            <PhmaxPvLitePage
              productView={productView}
              setProductView={setProductView}
              onOpenFullVersion={leavePvLite}
            />,
          )
        : shell(<PhmaxPvPage productView={productView} setProductView={setProductView} onOpenRychlyPhmax={openPvLite} />);
      break;
    case "sd":
      page = sdLiteActive
        ? shell(
            <PhmaxSdLitePage
              productView={productView}
              setProductView={setProductView}
              onOpenFullVersion={leaveSdLite}
            />,
          )
        : shell(<PhmaxSdPage productView={productView} setProductView={setProductView} onOpenRychlyPhmax={openSdLite} />);
      break;
    case "ss":
      page = shell(<PhmaxSsPage productView={productView} setProductView={setProductView} />);
      break;
    case "zs":
      page = zsLiteActive
        ? shell(
            <PhmaxZsLitePage
              productView={productView}
              setProductView={setProductView}
              onOpenFullVersion={leaveZsLite}
            />,
          )
        : shell(
            <PhmaxZsPage
              productView={productView}
              setProductView={setProductView}
              onOpenRychlyPhmax={openZsLite}
            />,
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
    <AppWhatsNewProvider>
      <SkipToMainLink productView={productView} />
      <UiToastHost />
      {page}
    </AppWhatsNewProvider>
  );
}
