import React, { useCallback, useMemo } from "react";

import { AuthorCreditFooter } from "./AuthorCreditFooter";

import {

  APP_BRAND_LOGO_PATH,

  VYROCNI_ZPRAVA_NAHLED_PATH,

  PROFIL_SKOLY_PATH,

  VYROCNI_ZPRAVA_LEAD,
} from "./calculator-ui-constants";
import { VYROCNI_ZPRAVA_SEO_H1 } from "./vyrocni-zprava-seo-content";

import { PRODUCT_VIEW_PATH } from "./product-view-paths";

import { buildAnnualReportSectionTree } from "./vyrocni-zprava/vyrocni-zprava-logic";

import { useVyrocniZpravaReport } from "./vyrocni-zprava/use-vyrocni-zprava-report";
import { useVyrocniZpravaPersonnelData } from "./vyrocni-zprava/vyrocni-zprava-personnel-storage";
import { useVyrocniZpravaSection01Data } from "./vyrocni-zprava/vyrocni-zprava-section01-data-storage";
import { useVyrocniZpravaSection02Data } from "./vyrocni-zprava/vyrocni-zprava-section02-data-storage";
import { useVyrocniZpravaSection04Data } from "./vyrocni-zprava/vyrocni-zprava-section04-data-storage";
import { useVyrocniZpravaSection05Data } from "./vyrocni-zprava/vyrocni-zprava-section05-data-storage";
import { useVyrocniZpravaSection06Data } from "./vyrocni-zprava/vyrocni-zprava-section06-data-storage";
import { useVyrocniZpravaSection07Data } from "./vyrocni-zprava/vyrocni-zprava-section07-data-storage";
import { useVyrocniZpravaSection08Data } from "./vyrocni-zprava/vyrocni-zprava-section08-data-storage";
import { useVyrocniZpravaSection09Data } from "./vyrocni-zprava/vyrocni-zprava-section09-data-storage";
import { useVyrocniZpravaSection10Data } from "./vyrocni-zprava/vyrocni-zprava-section10-data-storage";
import { useVyrocniZpravaSection11Data } from "./vyrocni-zprava/vyrocni-zprava-section11-data-storage";
import { useVyrocniZpravaSection12Data } from "./vyrocni-zprava/vyrocni-zprava-section12-data-storage";
import { useVyrocniZpravaSection13Data } from "./vyrocni-zprava/vyrocni-zprava-section13-data-storage";
import { useVyrocniZpravaSection14Data } from "./vyrocni-zprava/vyrocni-zprava-section14-data-storage";

import { VyrocniZpravaSectionDetail } from "./vyrocni-zprava/VyrocniZpravaSectionDetail";

import { VyrocniZpravaSectionList } from "./vyrocni-zprava/VyrocniZpravaSectionList";

import { VyrocniZpravaSetupForm } from "./vyrocni-zprava/VyrocniZpravaSetupForm";
import { VyrocniZpravaApplicabilityNotice } from "./vyrocni-zprava/VyrocniZpravaApplicabilityNotice";
import { VyrocniZpravaLegalFrameworkPanel } from "./vyrocni-zprava/VyrocniZpravaLegalFrameworkPanel";
import { VyrocniZpravaXlsxImportPanel } from "./vyrocni-zprava/import/VyrocniZpravaXlsxImportPanel";



export function VyrocniZpravaPage() {

  const {

    report,

    schoolProfile,

    selectedSectionId,

    selectedSection,

    savedAt,

    progress,

    missingProfileFields,

    checkVisibleForSectionId,

    setSelectedSectionId,

    patchSchoolProfile,

    setSchoolYear,

    updatePublicationBlock,

    updateSectionNotes,

    checkSectionData,

    generateSectionDraft,

    saveGeneratedText,

    restoreGeneratedText,

    approveSection,

    clearReport,

  } = useVyrocniZpravaReport();

  const {
    personnelData,
    savedAt: personnelSavedAt,
    savePersonnelData,
    resetPersonnelData,
  } = useVyrocniZpravaPersonnelData();

  const {
    section01Data,
    savedAt: section01SavedAt,
    saveSection01Data,
    resetSection01Data,
    readiness: section01Readiness,
  } = useVyrocniZpravaSection01Data();

  const {
    section02Data,
    savedAt: section02SavedAt,
    saveSection02Data,
    resetSection02Data,
    readiness: section02Readiness,
  } = useVyrocniZpravaSection02Data();

  const {
    section04Data,
    savedAt: section04SavedAt,
    saveSection04Data,
    resetSection04Data,
    readiness: section04Readiness,
  } = useVyrocniZpravaSection04Data();

  const {
    section05Data,
    savedAt: section05SavedAt,
    saveSection05Data,
    resetSection05Data,
    readiness: section05Readiness,
  } = useVyrocniZpravaSection05Data();

  const {
    section06Data,
    savedAt: section06SavedAt,
    saveSection06Data,
    resetSection06Data,
    readiness: section06Readiness,
  } = useVyrocniZpravaSection06Data();

  const {
    section07Data,
    savedAt: section07SavedAt,
    saveSection07Data,
    resetSection07Data,
    readiness: section07Readiness,
  } = useVyrocniZpravaSection07Data();

  const {
    section08Data,
    savedAt: section08SavedAt,
    saveSection08Data,
    resetSection08Data,
    readiness: section08Readiness,
  } = useVyrocniZpravaSection08Data();

  const {
    section09Data,
    savedAt: section09SavedAt,
    saveSection09Data,
    resetSection09Data,
    readiness: section09Readiness,
  } = useVyrocniZpravaSection09Data();

  const {
    section10Data,
    savedAt: section10SavedAt,
    saveSection10Data,
    resetSection10Data,
    readiness: section10Readiness,
  } = useVyrocniZpravaSection10Data();

  const {
    section11Data,
    savedAt: section11SavedAt,
    saveSection11Data,
    resetSection11Data,
    readiness: section11Readiness,
  } = useVyrocniZpravaSection11Data();

  const {
    section12Data,
    savedAt: section12SavedAt,
    saveSection12Data,
    resetSection12Data,
    readiness: section12Readiness,
  } = useVyrocniZpravaSection12Data();

  const {
    section13Data,
    savedAt: section13SavedAt,
    saveSection13Data,
    resetSection13Data,
    readiness: section13Readiness,
  } = useVyrocniZpravaSection13Data();

  const {
    section14Data,
    savedAt: section14SavedAt,
    saveSection14Data,
    resetSection14Data,
    readiness: section14Readiness,
  } = useVyrocniZpravaSection14Data();



  const sectionTree = useMemo(() => buildAnnualReportSectionTree(report.sections), [report.sections]);

  const progressPercent = progress.total > 0 ? Math.round((progress.approved / progress.total) * 100) : 0;



  const handleClearReport = useCallback(() => {

    const confirmed = window.confirm(

      "Opravdu chcete vymazat rozpracovanou výroční zprávu v tomto prohlížeči? Tuto akci nelze vrátit.",

    );

    if (confirmed) clearReport();

  }, [clearReport]);



  return (

    <div className="vyrocni-zprava-page" id="vyrocni-zprava-main">

      <header className="vyrocni-zprava-page__header card">

        <div className="vyrocni-zprava-page__brand">

          <img src={APP_BRAND_LOGO_PATH} alt="" className="vyrocni-zprava-page__logo" width={40} height={40} />

          <div>

            <h1 className="vyrocni-zprava-page__title">{VYROCNI_ZPRAVA_SEO_H1}</h1>

            <p className="muted-text vyrocni-zprava-page__lead">{VYROCNI_ZPRAVA_LEAD}</p>

          </div>

        </div>

        <div className="vyrocni-zprava-page__actions">
          <a className="btn ghost" href={VYROCNI_ZPRAVA_NAHLED_PATH}>
            Náhled zprávy
          </a>

          <a className="btn ghost" href={PRODUCT_VIEW_PATH.dash}>

            Přejít na přehled

          </a>

          <button type="button" className="btn ghost" onClick={handleClearReport}>

            Vymazat rozpracovanou zprávu

          </button>

        </div>

      </header>



      <VyrocniZpravaApplicabilityNotice schoolProfile={schoolProfile} />

      <VyrocniZpravaLegalFrameworkPanel />

      {missingProfileFields.length > 0 ? (

        <div className="vyrocni-zprava-page__profile-warning card" role="status">

          <p>

            Doplňte profil školy. Některé údaje jsou potřebné pro kapitolu Základní údaje o škole.

          </p>

          <a className="btn primary" href={PROFIL_SKOLY_PATH}>

            Přejít na Profil školy

          </a>

        </div>

      ) : null}



      <div className="vyrocni-zprava-page__meta card">

        <div className="vyrocni-zprava-page__progress">

          <div className="vyrocni-zprava-page__progress-labels">

            <span className="vyrocni-zprava-page__progress-title">Postup schvalování kapitol</span>

            <span className="vyrocni-zprava-page__progress-value">

              {progress.approved} / {progress.total} schváleno ({progressPercent} %)

            </span>

          </div>

          <div

            className="vyrocni-zprava-page__progress-bar"

            role="progressbar"

            aria-valuenow={progressPercent}

            aria-valuemin={0}

            aria-valuemax={100}

            aria-label="Podíl schválených kapitol"

          >

            <span className="vyrocni-zprava-page__progress-fill" style={{ width: `${progressPercent}%` }} />

          </div>

        </div>

        {savedAt ? <p className="vyrocni-zprava-page__saved muted-text">Uloženo v prohlížeči: {savedAt}</p> : null}

      </div>



      <VyrocniZpravaSetupForm

        schoolYear={report.schoolYear}

        schoolProfile={schoolProfile}

        publicationBlock={report.publicationBlock}

        onSchoolYearChange={setSchoolYear}

        onSchoolProfileChange={patchSchoolProfile}

        onPublicationBlockChange={updatePublicationBlock}

      />

      <VyrocniZpravaXlsxImportPanel
        schoolProfile={schoolProfile}
        section01Data={section01Data}
        section02Data={section02Data}
        section03Data={personnelData}
        section04Data={section04Data}
        section05Data={section05Data}
        section06Data={section06Data}
        section07Data={section07Data}
        section08Data={section08Data}
        section09Data={section09Data}
        section10Data={section10Data}
        section11Data={section11Data}
        section12Data={section12Data}
        section13Data={section13Data}
        section14Data={section14Data}
        publicationBlock={report.publicationBlock}
        reportSections={report.sections}
        onApplyProfilePatch={patchSchoolProfile}
        onApplySection01Data={saveSection01Data}
        onApplySection02Data={saveSection02Data}
        onApplySection03Data={savePersonnelData}
        onApplySection04Data={saveSection04Data}
        onApplySection05Data={saveSection05Data}
        onApplySection06Data={saveSection06Data}
        onApplySection07Data={saveSection07Data}
        onApplySection08Data={saveSection08Data}
        onApplySection09Data={saveSection09Data}
        onApplySection10Data={saveSection10Data}
        onApplySection11Data={saveSection11Data}
        onApplySection12Data={saveSection12Data}
        onApplySection13Data={saveSection13Data}
        onApplySection14Data={saveSection14Data}
        onApplyPublicationBlockPatch={updatePublicationBlock}
      />



      <div className="vyrocni-zprava-page__workspace" id="vyrocni-zprava-workspace">

        <VyrocniZpravaSectionList

          sections={sectionTree}

          selectedId={selectedSectionId}

          onSelect={setSelectedSectionId}

        />

        <VyrocniZpravaSectionDetail

          section={selectedSection}

          showMissingCheck={checkVisibleForSectionId === selectedSectionId}

          schoolProfile={schoolProfile}

          section01Data={section01Data}

          section01SavedAt={section01SavedAt}

          section01Readiness={section01Readiness}

          onSection01Save={saveSection01Data}

          onSection01Reset={resetSection01Data}

          section02Data={section02Data}

          section02SavedAt={section02SavedAt}

          section02Readiness={section02Readiness}

          onSection02Save={saveSection02Data}

          onSection02Reset={resetSection02Data}

          section04Data={section04Data}

          section04SavedAt={section04SavedAt}

          section04Readiness={section04Readiness}

          onSection04Save={saveSection04Data}

          onSection04Reset={resetSection04Data}

          section05Data={section05Data}

          section05SavedAt={section05SavedAt}

          section05Readiness={section05Readiness}

          onSection05Save={saveSection05Data}

          onSection05Reset={resetSection05Data}

          section06Data={section06Data}

          section06SavedAt={section06SavedAt}

          section06Readiness={section06Readiness}

          onSection06Save={saveSection06Data}

          onSection06Reset={resetSection06Data}

          section07Data={section07Data}

          section07SavedAt={section07SavedAt}

          section07Readiness={section07Readiness}

          onSection07Save={saveSection07Data}

          onSection07Reset={resetSection07Data}

          section08Data={section08Data}

          section08SavedAt={section08SavedAt}

          section08Readiness={section08Readiness}

          onSection08Save={saveSection08Data}

          onSection08Reset={resetSection08Data}

          section09Data={section09Data}

          section09SavedAt={section09SavedAt}

          section09Readiness={section09Readiness}

          onSection09Save={saveSection09Data}

          onSection09Reset={resetSection09Data}

          section10Data={section10Data}

          section10SavedAt={section10SavedAt}

          section10Readiness={section10Readiness}

          onSection10Save={saveSection10Data}

          onSection10Reset={resetSection10Data}

          section11Data={section11Data}

          section11SavedAt={section11SavedAt}

          section11Readiness={section11Readiness}

          onSection11Save={saveSection11Data}

          onSection11Reset={resetSection11Data}

          section12Data={section12Data}

          section12SavedAt={section12SavedAt}

          section12Readiness={section12Readiness}

          onSection12Save={saveSection12Data}

          onSection12Reset={resetSection12Data}

          section13Data={section13Data}

          section13SavedAt={section13SavedAt}

          section13Readiness={section13Readiness}

          onSection13Save={saveSection13Data}

          onSection13Reset={resetSection13Data}

          section14Data={section14Data}

          section14SavedAt={section14SavedAt}

          section14Readiness={section14Readiness}

          onSection14Save={saveSection14Data}

          onSection14Reset={resetSection14Data}

          personnelData={personnelData}

          personnelSavedAt={personnelSavedAt}

          onPersonnelSave={savePersonnelData}

          onPersonnelReset={resetPersonnelData}

          onNotesChange={(value) => updateSectionNotes(selectedSectionId, value)}

          onCheckData={() => checkSectionData(selectedSectionId)}

          onGenerateDraft={() => generateSectionDraft(selectedSectionId)}

          onSaveGeneratedText={(value) => saveGeneratedText(selectedSectionId, value)}

          onRestoreGeneratedText={() => restoreGeneratedText(selectedSectionId)}

          onApprove={() => approveSection(selectedSectionId)}

        />

      </div>



      <footer className="zs-app-footer">

        <AuthorCreditFooter />

      </footer>

    </div>

  );

}


