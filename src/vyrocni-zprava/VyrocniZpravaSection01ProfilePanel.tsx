import React from "react";

import { PROFIL_SKOLY_PATH } from "../calculator-ui-constants";
import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { Section01Readiness } from "./vyrocni-zprava-section01-data-logic";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";

type VyrocniZpravaSection01ProfilePanelProps = {
  schoolProfile: SchoolProfile;
  readiness: Section01Readiness;
};

export function VyrocniZpravaSection01ProfilePanel({
  readiness,
}: VyrocniZpravaSection01ProfilePanelProps) {
  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section01-panel"
      role="region"
      aria-labelledby="vyrocni-zprava-section01-profile-title"
    >
      <div className="vyrocni-zprava-section01-panel__header">
        <h3 id="vyrocni-zprava-section01-profile-title" className="vyrocni-zprava-detail__block-title">
          Údaje z Profilu školy
        </h3>
        <VyrocniZpravaStatusBadge
          status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"}
          compact
        />
      </div>

      <p className="muted-text vyrocni-zprava-section01-panel__lead">
        Povinné identifikační údaje pro kapitolu 01 se načítají ze sdíleného profilu školy. Chybějící položky je
        nutné doplnit před finálním návrhem kapitoly.
      </p>

      {readiness.availableData.length > 0 ? (
        <div className="vyrocni-zprava-section01-panel__subsection">
          <h4 className="vyrocni-zprava-section01-panel__subtitle">Dostupné údaje</h4>
          <ul className="vyrocni-zprava-section01-panel__list">
            {readiness.availableData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted-text vyrocni-zprava-detail__placeholder">
          V profilu školy zatím nejsou vyplněny údaje potřebné pro kapitolu 01.
        </p>
      )}

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section01-panel__subsection">
          <h4 className="vyrocni-zprava-section01-panel__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list vyrocni-zprava-section01-panel__missing">
            {readiness.missingData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section01-panel__subsection">
          <h4 className="vyrocni-zprava-section01-panel__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section01-panel__recommended muted-text">
            {readiness.recommendedData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="vyrocni-zprava-section01-panel__actions">
        <a className="btn primary" href={PROFIL_SKOLY_PATH}>
          Přejít na Profil školy
        </a>
      </div>
    </div>
  );
}
