import React, { useCallback, useEffect, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import {
  APP_BRAND_LOGO_PATH,
  PROFIL_SKOLY_LEAD,
  PROFIL_SKOLY_TITLE,
  VYROCNI_ZPRAVA_PATH,
} from "./calculator-ui-constants";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";
import {
  SCHOOL_PROFILE_FIELD_LABELS,
  SCHOOL_PROFILE_KRAJE,
} from "./school-profile/school-profile-constants";
import {
  getSchoolTypeSelectValue,
  type SchoolTypeCode,
  SCHOOL_TYPE_SELECT_OPTIONS,
  toSchoolTypeStorageValue,
} from "./school-profile/school-profile-school-type";
import type { SchoolProfile, SchoolProfileFieldKey } from "./school-profile/school-profile-types";
import { useSchoolProfile } from "./school-profile/use-school-profile";
import { VyrocniZpravaApplicabilityNotice } from "./vyrocni-zprava/VyrocniZpravaApplicabilityNotice";

function ProfileField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="vyrocni-zprava-field" htmlFor={id}>
      <span className="vyrocni-zprava-field__label">{label}</span>
      {children}
    </label>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card section-card section-card--setup school-profile-page__section">
      <h2 className="section-title">{title}</h2>
      <div className="vyrocni-zprava-setup__grid">{children}</div>
    </section>
  );
}

export function ProfilSkolyPage() {
  const { profile, saveProfile, resetProfile, missingRequiredFields } = useSchoolProfile();
  const [draft, setDraft] = useState<SchoolProfile>(profile);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const patchDraft = useCallback((patch: Partial<SchoolProfile>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(() => {
    saveProfile(draft);
    setSavedAt(new Date().toLocaleString("cs-CZ"));
  }, [draft, saveProfile]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Opravdu chcete vymazat profil školy v tomto prohlížeči? Údaje se odstraní ze všech modulů.",
    );
    if (!confirmed) return;
    resetProfile();
    setSavedAt(null);
  }, [resetProfile]);

  const renderInput = (field: SchoolProfileFieldKey, type: string = "text") => (
    <ProfileField id={`sp-${field}`} label={SCHOOL_PROFILE_FIELD_LABELS[field]}>
      <input
        id={`sp-${field}`}
        className="input"
        type={type}
        value={draft[field]}
        onChange={(e) => patchDraft({ [field]: e.target.value })}
      />
    </ProfileField>
  );

  return (
    <div className="school-profile-page" id="school-profile-main">
      <header className="school-profile-page__header card">
        <div className="school-profile-page__brand">
          <img src={APP_BRAND_LOGO_PATH} alt="" className="school-profile-page__logo" width={40} height={40} />
          <div>
            <h1 className="school-profile-page__title">{PROFIL_SKOLY_TITLE}</h1>
            <p className="muted-text school-profile-page__lead">{PROFIL_SKOLY_LEAD}</p>
          </div>
        </div>
        <div className="school-profile-page__actions">
          <a className="btn ghost" href={PRODUCT_VIEW_PATH.dash}>
            Přejít na přehled
          </a>
          <a className="btn ghost" href={VYROCNI_ZPRAVA_PATH}>
            Výroční zpráva
          </a>
        </div>
      </header>

      {missingRequiredFields.length > 0 ? (
        <div className="school-profile-page__warning card" role="status">
          <p>
            Profil školy není úplný. Chybí {missingRequiredFields.length}{" "}
            {missingRequiredFields.length === 1 ? "povinný údaj" : missingRequiredFields.length < 5 ? "povinné údaje" : "povinných údajů"} pro
            kapitolu „Základní údaje o škole“ ve výroční zprávě.
          </p>
          <ul className="school-profile-page__missing-list">
            {missingRequiredFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="school-profile-page__ok card" role="status">
          Profil školy obsahuje všechny povinné údaje pro kapitolu „Základní údaje o škole“.
        </div>
      )}

      <ProfileSection title="Identifikační údaje">
        {renderInput("name")}
        {renderInput("ico")}
        {renderInput("redIzo")}
        {renderInput("izo")}
        <ProfileField id="sp-schoolType" label={SCHOOL_PROFILE_FIELD_LABELS.schoolType}>
          <select
            id="sp-schoolType"
            className="input"
            value={getSchoolTypeSelectValue(draft.schoolType)}
            onChange={(e) => patchDraft({ schoolType: toSchoolTypeStorageValue(e.target.value as SchoolTypeCode) })}
          >
            {SCHOOL_TYPE_SELECT_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </ProfileField>
        <div className="school-profile-page__applicability">
          <VyrocniZpravaApplicabilityNotice schoolProfile={draft} />
        </div>
      </ProfileSection>

      <ProfileSection title="Sídlo a kontakty">
        {renderInput("address")}
        {renderInput("municipality")}
        <ProfileField id="sp-region" label={SCHOOL_PROFILE_FIELD_LABELS.region}>
          <select
            id="sp-region"
            className="input"
            value={draft.region}
            onChange={(e) => patchDraft({ region: e.target.value })}
          >
            <option value="">— vyberte kraj —</option>
            {SCHOOL_PROFILE_KRAJE.map((kraj) => (
              <option key={kraj} value={kraj}>
                {kraj}
              </option>
            ))}
          </select>
        </ProfileField>
        {renderInput("website", "url")}
        {renderInput("email", "email")}
        {renderInput("phone", "tel")}
        {renderInput("dataBox")}
      </ProfileSection>

      <ProfileSection title="Zřizovatel a vedení">
        {renderInput("founder")}
        {renderInput("principalName")}
      </ProfileSection>

      <div className="school-profile-page__footer card">
        <div className="school-profile-page__footer-actions">
          <button type="button" className="btn primary" onClick={handleSave}>
            Uložit profil školy
          </button>
          <button type="button" className="btn ghost" onClick={handleReset}>
            Vymazat profil školy
          </button>
        </div>
        {savedAt ? <p className="muted-text school-profile-page__saved">Profil školy uložen v tomto prohlížeči: {savedAt}</p> : null}
      </div>

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
