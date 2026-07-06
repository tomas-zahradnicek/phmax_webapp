import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import type { ProductView } from "./ProductViewPills";
import { AppWhatsNewProvider } from "./AppWhatsNewContext";
import { SkipToMainLink } from "./SkipToMainLink";
import {
  recordDashboardProductVisit,
  recordLastActiveProduct,
  type DashboardVisitProduct,
} from "./phmax-dashboard-visits";
import {
  applyPhmaxDocumentHead,
  applyPhmaxLiteDocumentHead,
  applyPhmaxUserGuideDocumentHead,
  applyProfilSkolyDocumentHead,
  applyVyrocniZpravaDocumentHead,
  applyVyrocniZpravaPreviewDocumentHead,
} from "./phmax-document-head";
import { isUserGuidePathname } from "./phmax-user-guide-paths";
import { isProfilSkolyPathname } from "./school-profile-paths";
import { isVyrocniZpravaPathname, isVyrocniZpravaPreviewPathname } from "./vyrocni-zprava-paths";
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
const PhmaxUserGuidePage = lazy(() => import("./PhmaxUserGuidePage").then((m) => ({ default: m.PhmaxUserGuidePage })));
const VyrocniZpravaPage = lazy(() => import("./VyrocniZpravaPage").then((m) => ({ default: m.VyrocniZpravaPage })));
const VyrocniZpravaPreviewPage = lazy(() =>
  import("./VyrocniZpravaPreviewPage").then((m) => ({ default: m.VyrocniZpravaPreviewPage })),
);
const ProfilSkolyPage = lazy(() => import("./ProfilSkolyPage").then((m) => ({ default: m.ProfilSkolyPage })));

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
  const [userGuideActive, setUserGuideActive] = useState(
    () => typeof window !== "undefined" && isUserGuidePathname(window.location.pathname),
  );
  const [vyrocniZpravaActive, setVyrocniZpravaActive] = useState(
    () =>
      typeof window !== "undefined" &&
      isVyrocniZpravaPathname(window.location.pathname) &&
      !isVyrocniZpravaPreviewPathname(window.location.pathname),
  );
  const [vyrocniZpravaPreviewActive, setVyrocniZpravaPreviewActive] = useState(
    () => typeof window !== "undefined" && isVyrocniZpravaPreviewPathname(window.location.pathname),
  );
  const [profilSkolyActive, setProfilSkolyActive] = useState(
    () => typeof window !== "undefined" && isProfilSkolyPathname(window.location.pathname),
  );
  const setProductView = useCallback((v: ProductView) => {
    setUserGuideActive(false);
    setVyrocniZpravaActive(false);
    setVyrocniZpravaPreviewActive(false);
    setProfilSkolyActive(false);
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
    const norm = window.location.pathname.replace(/\/+$/, "") || "/";
    if (norm === "/") {
      window.history.replaceState({ phmaxView: "dash" }, "", "/prehled");
      setProductViewState("dash");
    }
  }, []);

  useEffect(() => {
    // Dočasná klientská pojistka: primární legacy redirect řeší Vercel middleware (middleware.ts).
    // Tento efekt sjednotí URL, pokud prohlížeč načte ?view= bez serverového přesměrování.
    if (isLegacyViewQueryUrl()) {
      writeProductViewUrl(readInitialProductView(), "replace");
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setUserGuideActive(isUserGuidePathname(window.location.pathname));
      const isPreview = isVyrocniZpravaPreviewPathname(window.location.pathname);
      setVyrocniZpravaPreviewActive(isPreview);
      setVyrocniZpravaActive(isVyrocniZpravaPathname(window.location.pathname) && !isPreview);
      setProfilSkolyActive(isProfilSkolyPathname(window.location.pathname));
      setProductViewState(readInitialProductView());
      setSdLiteActive(isSdLitePathname(window.location.pathname));
      setPvLiteActive(isPvLitePathname(window.location.pathname));
      setZsLiteActive(isZsLitePathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (userGuideActive) {
      applyPhmaxUserGuideDocumentHead();
    } else if (vyrocniZpravaPreviewActive) {
      applyVyrocniZpravaPreviewDocumentHead();
    } else if (vyrocniZpravaActive) {
      applyVyrocniZpravaDocumentHead();
    } else if (profilSkolyActive) {
      applyProfilSkolyDocumentHead();
    } else if (pvLiteActive) {
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
  }, [
    productView,
    pvLiteActive,
    sdLiteActive,
    zsLiteActive,
    userGuideActive,
    vyrocniZpravaActive,
    vyrocniZpravaPreviewActive,
    profilSkolyActive,
  ]);

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

  const shell = (child: React.ReactNode, variant: "default" | "standalone" = "default") => (
    <div className={`app-shell app-shell--gradient${variant === "standalone" ? " app-shell--standalone-module" : ""}`}>
      <div className={`container container--app${variant === "standalone" ? " container--standalone-module" : ""}`}>
        <Suspense fallback={<div className="card muted">Načítám kalkulačku…</div>}>{child}</Suspense>
      </div>
    </div>
  );

  let page: React.ReactNode;
  if (userGuideActive) {
    page = shell(<PhmaxUserGuidePage />, "standalone");
  } else if (vyrocniZpravaPreviewActive) {
    page = shell(<VyrocniZpravaPreviewPage />, "standalone");
  } else if (vyrocniZpravaActive) {
    page = shell(<VyrocniZpravaPage />, "standalone");
  } else if (profilSkolyActive) {
    page = shell(<ProfilSkolyPage />, "standalone");
  } else switch (productView) {
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
