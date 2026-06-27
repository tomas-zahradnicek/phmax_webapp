import React from "react";
import { PROFIL_SKOLY_PATH } from "./calculator-ui-constants";
import { readSchoolYearHintFromStorage } from "./school-profile/read-school-year-hint";
import { isSchoolProfileEstablished } from "./school-profile/school-profile-logic";
import { useSchoolProfile } from "./school-profile/use-school-profile";

function displayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "–";
}

export function CalculatorSchoolProfileBanner() {
  const { profile } = useSchoolProfile();
  const schoolYear = readSchoolYearHintFromStorage();

  if (!isSchoolProfileEstablished(profile)) {
    return (
      <section className="calculator-school-profile-banner calculator-school-profile-banner--empty card" role="status">
        <p className="calculator-school-profile-banner__warning">
          Profil školy není vyplněn. Doporučujeme jej doplnit, aby bylo možné údaje využívat v dalších modulech a exportech.
        </p>
        <a className="btn primary" href={PROFIL_SKOLY_PATH}>
          Přejít na Profil školy
        </a>
      </section>
    );
  }

  return (
    <section className="calculator-school-profile-banner card" aria-label="Profil školy">
      <div className="calculator-school-profile-banner__header">
        <h2 className="calculator-school-profile-banner__title">Profil školy</h2>
        <a className="btn ghost calculator-school-profile-banner__link" href={PROFIL_SKOLY_PATH}>
          Upravit profil
        </a>
      </div>
      <dl className="calculator-school-profile-banner__grid">
        <div>
          <dt>Název školy</dt>
          <dd>{displayValue(profile.name)}</dd>
        </div>
        <div>
          <dt>IČO</dt>
          <dd>{displayValue(profile.ico)}</dd>
        </div>
        <div>
          <dt>RED IZO</dt>
          <dd>{displayValue(profile.redIzo)}</dd>
        </div>
        <div>
          <dt>Typ školy</dt>
          <dd>{displayValue(profile.schoolType)}</dd>
        </div>
        {schoolYear ? (
          <div>
            <dt>Školní rok</dt>
            <dd>{schoolYear}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
