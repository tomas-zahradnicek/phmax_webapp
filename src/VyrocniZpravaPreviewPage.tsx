import React from "react";

import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  APP_BRAND_LOGO_PATH,
  PRODUCT_USER_GUIDE_LABEL,
  VYROCNI_ZPRAVA_NAHLED_LABEL,
  VYROCNI_ZPRAVA_NAHLED_PATH,
  VYROCNI_ZPRAVA_PATH,
  VYROCNI_ZPRAVA_TITLE,
} from "./calculator-ui-constants";
import { useVyrocniZpravaReport } from "./vyrocni-zprava/use-vyrocni-zprava-report";
import { VyrocniZpravaApplicabilityNotice } from "./vyrocni-zprava/VyrocniZpravaApplicabilityNotice";
import { VyrocniZpravaLegalFrameworkPanel } from "./vyrocni-zprava/VyrocniZpravaLegalFrameworkPanel";
import { VyrocniZpravaReportPreview } from "./vyrocni-zprava/VyrocniZpravaReportPreview";
import { useVyrocniZpravaPersonnelData } from "./vyrocni-zprava/vyrocni-zprava-personnel-storage";
import { useVyrocniZpravaSection04Data } from "./vyrocni-zprava/vyrocni-zprava-section04-data-storage";
import { useVyrocniZpravaSection05Data } from "./vyrocni-zprava/vyrocni-zprava-section05-data-storage";
import { useVyrocniZpravaSection06Data } from "./vyrocni-zprava/vyrocni-zprava-section06-data-storage";
import { useVyrocniZpravaSection07Data } from "./vyrocni-zprava/vyrocni-zprava-section07-data-storage";
import { useVyrocniZpravaSection08Data } from "./vyrocni-zprava/vyrocni-zprava-section08-data-storage";
import { useVyrocniZpravaSection09Data } from "./vyrocni-zprava/vyrocni-zprava-section09-data-storage";
import { useVyrocniZpravaSection11Data } from "./vyrocni-zprava/vyrocni-zprava-section11-data-storage";

export function VyrocniZpravaPreviewPage() {
  const { report, schoolProfile } = useVyrocniZpravaReport();
  const { personnelData } = useVyrocniZpravaPersonnelData();
  const { section04Data } = useVyrocniZpravaSection04Data();
  const { section05Data } = useVyrocniZpravaSection05Data();
  const { section06Data } = useVyrocniZpravaSection06Data();
  const { section07Data } = useVyrocniZpravaSection07Data();
  const { section08Data } = useVyrocniZpravaSection08Data();
  const { section09Data } = useVyrocniZpravaSection09Data();
  const { section11Data } = useVyrocniZpravaSection11Data();

  return (
    <div className="vyrocni-zprava-page" id="vyrocni-zprava-preview-main">
      <header className="vyrocni-zprava-page__header card">
        <div className="vyrocni-zprava-page__brand">
          <img src={APP_BRAND_LOGO_PATH} alt="" className="vyrocni-zprava-page__logo" width={40} height={40} />
          <div>
            <h1 className="vyrocni-zprava-page__title">{VYROCNI_ZPRAVA_TITLE}</h1>
            <p className="muted-text vyrocni-zprava-page__lead">
              {VYROCNI_ZPRAVA_NAHLED_LABEL} ({VYROCNI_ZPRAVA_NAHLED_PATH})
            </p>
          </div>
        </div>
        <div className="vyrocni-zprava-page__actions">
          <a className="btn ghost" href={VYROCNI_ZPRAVA_PATH}>
            Zpět na kapitoly
          </a>
          <a className="btn ghost" href="/navod">
            {PRODUCT_USER_GUIDE_LABEL}
          </a>
        </div>
      </header>

      <VyrocniZpravaApplicabilityNotice schoolProfile={schoolProfile} />

      <VyrocniZpravaLegalFrameworkPanel />

      <VyrocniZpravaReportPreview
        report={report}
        schoolProfile={schoolProfile}
        structuredData={{
          schoolProfileData: schoolProfile,
          section03Data: personnelData,
          section04Data,
          section05Data,
          section06Data,
          section07Data,
          section08Data,
          section09Data,
          section11Data,
        }}
      />

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
