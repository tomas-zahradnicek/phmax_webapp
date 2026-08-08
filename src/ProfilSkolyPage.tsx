import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  messageForIdentityBlockReason,
  MSG_CONFIRM_RESET_SCHOOL_PROFILE_FIELDS,
  MSG_SCHOOL_PROFILE_CORRUPTED_BACKUP_HINT,
  MSG_SCHOOL_PROFILE_CORRUPTED_BODY,
  MSG_SCHOOL_PROFILE_CORRUPTED_CTA,
  MSG_SCHOOL_PROFILE_CORRUPTED_OTHER_DATA,
  MSG_SCHOOL_PROFILE_CORRUPTED_TITLE,
  MSG_SCHOOL_PROFILE_PERSIST_FAILED,
  MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY,
  MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_TITLE,
  readIdentityRegistryPresence,
  SCHOOL_PROFILE_DATA_MANAGEMENT_HASH,
} from "./school-profile/school-profile-identity-policy";
import {
  readSchoolProfilePersistenceStatus,
  type SchoolProfilePersistenceStatus,
} from "./school-profile/school-profile-persistence-status";
import { createSerializedPlatformBindingRunner } from "./school-profile/profile-save-platform-binding";
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
  const [identityGuardNotice, setIdentityGuardNotice] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [platformBindingNotice, setPlatformBindingNotice] = useState<string | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<SchoolProfilePersistenceStatus>(() =>
    readSchoolProfilePersistenceStatus(),
  );
  const identityRegistryStatus = readIdentityRegistryPresence();
  const bindingRunnerRef = useRef(createSerializedPlatformBindingRunner());
  const bindingGenerationRef = useRef(0);

  const isCorruptedRecovery = persistenceStatus === "corrupted";
  const isStorageUnavailable = persistenceStatus === "storage_unavailable";
  const blocksNormalEdit = isCorruptedRecovery || isStorageUnavailable;
  const dataManagementHref = `${PRODUCT_VIEW_PATH.dash}#${SCHOOL_PROFILE_DATA_MANAGEMENT_HASH}`;

  const clearTransientNotices = useCallback(() => {
    setPersistError(null);
    setPlatformBindingNotice(null);
    setIdentityGuardNotice(null);
    setSavedAt(null);
  }, []);

  useEffect(() => {
    if (blocksNormalEdit) return;
    setDraft(profile);
  }, [profile, blocksNormalEdit]);

  // 0F-2C: lazy mount binding for already-persisted SchoolProfile (no ghost identity on empty).
  // Shares serialized runner + generation with Save path to avoid race / stale warnings.
  useEffect(() => {
    if (blocksNormalEdit) return;
    let cancelled = false;
    const generation = ++bindingGenerationRef.current;
    void (async () => {
      const outcome = await bindingRunnerRef.current.onMount();
      if (cancelled) return;
      if (generation !== bindingGenerationRef.current) return;
      if (!outcome.bindingAttempted) return;
      // Re-check: external corruption must not surface as generic mount warning.
      const status = readSchoolProfilePersistenceStatus();
      if (status === "corrupted" || status === "storage_unavailable") {
        setPersistenceStatus(status);
        setPlatformBindingNotice(null);
        return;
      }
      // empty = no persisted school → no warning; ready clears; error soft-warns
      setPlatformBindingNotice(outcome.metadataNotice);
    })();
    return () => {
      cancelled = true;
    };
    // Mount-once for normal load; recovery modes skip generic mount binding UX.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-once for normal mode
  }, []);

  const patchDraft = useCallback((patch: Partial<SchoolProfile>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(async () => {
    const result = saveProfile(draft);
    setIdentityGuardNotice(messageForIdentityBlockReason(result.identityBlockReason));
    if (!result.persistence.ok) {
      // Draft stays edited for retry on storage_unavailable; no platform binding.
      if (result.persistence.reason === "profile_corrupted") {
        // 0F-3B: external/tab corruption → recovery state, not generic persist copy.
        clearTransientNotices();
        const status = readSchoolProfilePersistenceStatus();
        setPersistenceStatus(
          status === "corrupted" || status === "storage_unavailable" ? status : "corrupted",
        );
        return;
      }
      setPersistError(MSG_SCHOOL_PROFILE_PERSIST_FAILED);
      return;
    }

    // Business save succeeded independently of platform metadata binding.
    setSavedAt(new Date().toLocaleString("cs-CZ"));
    setPersistError(null);
    setPersistenceStatus("valid");

    const generation = ++bindingGenerationRef.current;
    setIsBinding(true);
    try {
      const outcome = await bindingRunnerRef.current.afterPersist(result.persistence);
      if (generation !== bindingGenerationRef.current) return;
      if (!outcome.bindingAttempted) return;
      setPlatformBindingNotice(outcome.metadataNotice);
    } finally {
      if (generation === bindingGenerationRef.current) {
        setIsBinding(false);
      }
    }
  }, [clearTransientNotices, draft, saveProfile]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(MSG_CONFIRM_RESET_SCHOOL_PROFILE_FIELDS);
    if (!confirmed) return;
    const result = resetProfile();
    if (result.persistence.ok) {
      setSavedAt(null);
      setIdentityGuardNotice(null);
      setPersistError(null);
      setPlatformBindingNotice(null);
      setPersistenceStatus(readSchoolProfilePersistenceStatus());
      return;
    }
    if (!result.persistence.ok && result.persistence.reason === "profile_corrupted") {
      clearTransientNotices();
      const status = readSchoolProfilePersistenceStatus();
      setPersistenceStatus(
        status === "corrupted" || status === "storage_unavailable" ? status : "corrupted",
      );
      return;
    }
    // Reset did not persist — keep draft aligned with last shared profile.
    setDraft(profile);
    setPersistError(MSG_SCHOOL_PROFILE_PERSIST_FAILED);
  }, [clearTransientNotices, profile, resetProfile]);

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

      {isCorruptedRecovery ? (
        <section
          className="school-profile-page__recovery card"
          role="alert"
          data-testid="school-profile-corrupted-recovery"
        >
          <h2 className="school-profile-page__recovery-title">{MSG_SCHOOL_PROFILE_CORRUPTED_TITLE}</h2>
          <p>{MSG_SCHOOL_PROFILE_CORRUPTED_BODY}</p>
          <p>{MSG_SCHOOL_PROFILE_CORRUPTED_OTHER_DATA}</p>
          <p className="muted-text">{MSG_SCHOOL_PROFILE_CORRUPTED_BACKUP_HINT}</p>
          <div className="school-profile-page__recovery-actions">
            <a
              className="btn primary"
              href={dataManagementHref}
              aria-label="Přejít ke správě dat na Dashboardu"
              data-testid="school-profile-recovery-cta"
            >
              {MSG_SCHOOL_PROFILE_CORRUPTED_CTA}
            </a>
          </div>
        </section>
      ) : null}

      {isStorageUnavailable ? (
        <section
          className="school-profile-page__recovery card"
          role="alert"
          data-testid="school-profile-storage-unavailable"
        >
          <h2 className="school-profile-page__recovery-title">
            {MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_TITLE}
          </h2>
          <p>{MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY}</p>
          <div className="school-profile-page__recovery-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                window.location.reload();
              }}
              data-testid="school-profile-storage-reload"
            >
              Znovu načíst stránku
            </button>
          </div>
        </section>
      ) : null}

      {!blocksNormalEdit ? (
        <>
          {missingRequiredFields.length > 0 ? (
            <div className="school-profile-page__warning card" role="status">
              <p>
                Profil školy není úplný. Chybí {missingRequiredFields.length}{" "}
                {missingRequiredFields.length === 1
                  ? "povinný údaj"
                  : missingRequiredFields.length < 5
                    ? "povinné údaje"
                    : "povinných údajů"}{" "}
                pro kapitolu „Základní údaje o škole“ ve výroční zprávě.
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
            {identityRegistryStatus === "valid" ? (
              <p className="muted-text school-profile-page__identity-note" role="note">
                IČO, RED IZO a IZO patří k identitě školy. Jejich změna na jinou školu vyžaduje samostatnou
                operaci nahrazení školy (zatím není k dispozici). Opravy překlepů v těchto polích zatím
                nejsou oddělené od nahrazení školy.
              </p>
            ) : null}
            {identityRegistryStatus === "corrupted" ||
            identityRegistryStatus === "storage_unavailable" ? (
              <p className="muted-text school-profile-page__identity-note" role="note">
                Identifikační údaje školy nyní nelze bezpečně změnit. Ostatní údaje profilu můžete upravit.
              </p>
            ) : null}
            {identityGuardNotice ? (
              <p className="school-profile-page__warning card" role="status">
                {identityGuardNotice}
              </p>
            ) : null}
            {persistError ? (
              <p className="school-profile-page__warning card" role="status">
                {persistError}
              </p>
            ) : null}
            {platformBindingNotice ? (
              <p className="school-profile-page__warning card" role="status">
                {platformBindingNotice}
              </p>
            ) : null}
            <ProfileField id="sp-schoolType" label={SCHOOL_PROFILE_FIELD_LABELS.schoolType}>
              <select
                id="sp-schoolType"
                className="input"
                value={getSchoolTypeSelectValue(draft.schoolType)}
                onChange={(e) =>
                  patchDraft({ schoolType: toSchoolTypeStorageValue(e.target.value as SchoolTypeCode) })
                }
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
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  void handleSave();
                }}
                disabled={isBinding}
              >
                Uložit profil školy
              </button>
              <button type="button" className="btn ghost" onClick={handleReset}>
                Vymazat údaje profilu
              </button>
            </div>
            <p className="muted-text school-profile-page__reset-hint">
              „Vymazat údaje profilu“ vyčistí formulář stejné školy. Data kalkulaček a výroční zprávy zůstanou
              zachována. Nejde o odstranění školy a jejích dat.
            </p>
            {savedAt ? (
              <p className="muted-text school-profile-page__saved">
                Profil školy uložen v tomto prohlížeči: {savedAt}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
