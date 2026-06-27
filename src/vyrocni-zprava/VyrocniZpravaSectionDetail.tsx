import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { AnnualReportSection } from "./vyrocni-zprava-types";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";
import type { VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";
import type { AnnualReportSection02Data } from "./vyrocni-zprava-section02-types";
import type { AnnualReportSection04Data } from "./vyrocni-zprava-section04-types";
import type { AnnualReportSection05Data } from "./vyrocni-zprava-section05-types";
import type { AnnualReportSection06Data } from "./vyrocni-zprava-section06-types";
import type { AnnualReportSection07Data } from "./vyrocni-zprava-section07-types";
import type { AnnualReportSection08Data } from "./vyrocni-zprava-section08-types";
import type { AnnualReportSection09Data } from "./vyrocni-zprava-section09-types";
import type { AnnualReportSection10Data } from "./vyrocni-zprava-section10-types";
import type { AnnualReportSection11Data } from "./vyrocni-zprava-section11-types";
import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { Section01Readiness } from "./vyrocni-zprava-section01-data-logic";
import type { Section02Readiness } from "./vyrocni-zprava-section02-data-logic";
import type { Section04Readiness } from "./vyrocni-zprava-section04-data-logic";
import type { Section05Readiness } from "./vyrocni-zprava-section05-data-logic";
import type { Section06Readiness } from "./vyrocni-zprava-section06-data-logic";
import type { Section07Readiness } from "./vyrocni-zprava-section07-data-logic";
import type { Section08Readiness } from "./vyrocni-zprava-section08-data-logic";
import type { Section09Readiness } from "./vyrocni-zprava-section09-data-logic";
import type { Section10Readiness } from "./vyrocni-zprava-section10-data-logic";
import type { Section11Readiness } from "./vyrocni-zprava-section11-data-logic";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { VyrocniZpravaCalculatorDataPanel } from "./VyrocniZpravaCalculatorDataPanel";
import { VyrocniZpravaPersonnelDataForm } from "./VyrocniZpravaPersonnelDataForm";
import { VyrocniZpravaSection01ProfilePanel } from "./VyrocniZpravaSection01ProfilePanel";
import { VyrocniZpravaSection01DataForm } from "./VyrocniZpravaSection01DataForm";
import { VyrocniZpravaSection02DataForm } from "./VyrocniZpravaSection02DataForm";
import { VyrocniZpravaSection04DataForm } from "./VyrocniZpravaSection04DataForm";
import { VyrocniZpravaSection05DataForm } from "./VyrocniZpravaSection05DataForm";
import { VyrocniZpravaSection06DataForm } from "./VyrocniZpravaSection06DataForm";
import { VyrocniZpravaSection07DataForm } from "./VyrocniZpravaSection07DataForm";
import { VyrocniZpravaSection08DataForm } from "./VyrocniZpravaSection08DataForm";
import { VyrocniZpravaSection09DataForm } from "./VyrocniZpravaSection09DataForm";
import { VyrocniZpravaSection10DataForm } from "./VyrocniZpravaSection10DataForm";
import { VyrocniZpravaSection11DataForm } from "./VyrocniZpravaSection11DataForm";
import {
  getAnnualReportCalculatorData,
  getSection03Readiness,
  isAnnualReportSection03Family,
} from "./vyrocni-zprava-calculator-data-bridge";
import { isAnnualReportSection01Family } from "./vyrocni-zprava-section01-generator-service";
import { isAnnualReportSection02Family } from "./vyrocni-zprava-section02-generator-service";
import { isAnnualReportSection04Family } from "./vyrocni-zprava-section04-generator-service";
import { isAnnualReportSection05Family } from "./vyrocni-zprava-section05-generator-service";
import { isAnnualReportSection06Family } from "./vyrocni-zprava-section06-generator-service";
import { isAnnualReportSection07Family } from "./vyrocni-zprava-section07-generator-service";
import { isAnnualReportSection08Family } from "./vyrocni-zprava-section08-generator-service";
import { isAnnualReportSection09Family } from "./vyrocni-zprava-section09-generator-service";
import { isAnnualReportSection10Family } from "./vyrocni-zprava-section10-generator-service";
import { isAnnualReportSection11Family } from "./vyrocni-zprava-section11-generator-service";
import { hasGeneratedDraft, hasRestorableOriginalDraft } from "./vyrocni-zprava-generated-text-logic";

type VyrocniZpravaSectionDetailProps = {
  section: AnnualReportSection | undefined;
  showMissingCheck: boolean;
  schoolProfile: SchoolProfile;
  section01Data: VyrocniZpravaSection01Data;
  section01SavedAt: string | null;
  section01Readiness: Section01Readiness;
  onSection01Save: (data: VyrocniZpravaSection01Data) => void;
  onSection01Reset: () => void;
  section02Data: AnnualReportSection02Data;
  section02SavedAt: string | null;
  section02Readiness: Section02Readiness;
  onSection02Save: (data: AnnualReportSection02Data) => void;
  onSection02Reset: () => void;
  section04Data: AnnualReportSection04Data;
  section04SavedAt: string | null;
  section04Readiness: Section04Readiness;
  onSection04Save: (data: AnnualReportSection04Data) => void;
  onSection04Reset: () => void;
  section05Data: AnnualReportSection05Data;
  section05SavedAt: string | null;
  section05Readiness: Section05Readiness;
  onSection05Save: (data: AnnualReportSection05Data) => void;
  onSection05Reset: () => void;
  section06Data: AnnualReportSection06Data;
  section06SavedAt: string | null;
  section06Readiness: Section06Readiness;
  onSection06Save: (data: AnnualReportSection06Data) => void;
  onSection06Reset: () => void;
  section07Data: AnnualReportSection07Data;
  section07SavedAt: string | null;
  section07Readiness: Section07Readiness;
  onSection07Save: (data: AnnualReportSection07Data) => void;
  onSection07Reset: () => void;
  section08Data: AnnualReportSection08Data;
  section08SavedAt: string | null;
  section08Readiness: Section08Readiness;
  onSection08Save: (data: AnnualReportSection08Data) => void;
  onSection08Reset: () => void;
  section09Data: AnnualReportSection09Data;
  section09SavedAt: string | null;
  section09Readiness: Section09Readiness;
  onSection09Save: (data: AnnualReportSection09Data) => void;
  onSection09Reset: () => void;
  section10Data: AnnualReportSection10Data;
  section10SavedAt: string | null;
  section10Readiness: Section10Readiness;
  onSection10Save: (data: AnnualReportSection10Data) => void;
  onSection10Reset: () => void;
  section11Data: AnnualReportSection11Data;
  section11SavedAt: string | null;
  section11Readiness: Section11Readiness;
  onSection11Save: (data: AnnualReportSection11Data) => void;
  onSection11Reset: () => void;
  personnelData: AnnualReportPersonnelData;
  personnelSavedAt: string | null;
  onPersonnelSave: (data: AnnualReportPersonnelData) => void;
  onPersonnelReset: () => void;
  onNotesChange: (value: string) => void;
  onCheckData: () => void;
  onGenerateDraft: () => void;
  onSaveGeneratedText: (value: string) => void;
  onRestoreGeneratedText: () => void;
  onApprove: () => void;
};

export function VyrocniZpravaSectionDetail({
  section,
  showMissingCheck,
  schoolProfile,
  section01Data,
  section01SavedAt,
  section01Readiness,
  onSection01Save,
  onSection01Reset,
  section02Data,
  section02SavedAt,
  section02Readiness,
  onSection02Save,
  onSection02Reset,
  section04Data,
  section04SavedAt,
  section04Readiness,
  onSection04Save,
  onSection04Reset,
  section05Data,
  section05SavedAt,
  section05Readiness,
  onSection05Save,
  onSection05Reset,
  section06Data,
  section06SavedAt,
  section06Readiness,
  onSection06Save,
  onSection06Reset,
  section07Data,
  section07SavedAt,
  section07Readiness,
  onSection07Save,
  onSection07Reset,
  section08Data,
  section08SavedAt,
  section08Readiness,
  onSection08Save,
  onSection08Reset,
  section09Data,
  section09SavedAt,
  section09Readiness,
  onSection09Save,
  onSection09Reset,
  section10Data,
  section10SavedAt,
  section10Readiness,
  onSection10Save,
  onSection10Reset,
  section11Data,
  section11SavedAt,
  section11Readiness,
  onSection11Save,
  onSection11Reset,
  personnelData,
  personnelSavedAt,
  onPersonnelSave,
  onPersonnelReset,
  onNotesChange,
  onCheckData,
  onGenerateDraft,
  onSaveGeneratedText,
  onRestoreGeneratedText,
  onApprove,
}: VyrocniZpravaSectionDetailProps) {
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [generatedDirty, setGeneratedDirty] = useState(false);

  useEffect(() => {
    if (!section) return;
    setGeneratedDraft(section.generatedText);
    setGeneratedDirty(false);
  }, [section?.id, section?.generatedText, section?.updatedAt]);

  const hasMissing = section ? section.missingFields.length > 0 : false;
  const showMissingPanel = showMissingCheck && hasMissing;
  const showSection01Panel = section ? isAnnualReportSection01Family(section.id) : false;
  const showSection02Panel = section ? isAnnualReportSection02Family(section.id) : false;
  const showSection04Panel = section ? isAnnualReportSection04Family(section.id) : false;
  const showSection05Panel = section ? isAnnualReportSection05Family(section.id) : false;
  const showSection06Panel = section ? isAnnualReportSection06Family(section.id) : false;
  const showSection07Panel = section ? isAnnualReportSection07Family(section.id) : false;
  const showSection08Panel = section ? isAnnualReportSection08Family(section.id) : false;
  const showSection09Panel = section ? isAnnualReportSection09Family(section.id) : false;
  const showSection10Panel = section ? isAnnualReportSection10Family(section.id) : false;
  const showSection11Panel = section ? isAnnualReportSection11Family(section.id) : false;
  const showCalculatorPanel = section ? isAnnualReportSection03Family(section.id) : false;
  const calculatorData = useMemo(
    () => (showCalculatorPanel ? getAnnualReportCalculatorData() : null),
    [showCalculatorPanel, section?.id],
  );
  const section03Readiness = useMemo(
    () =>
      calculatorData
        ? getSection03Readiness({ calculatorData, personnelData })
        : null,
    [calculatorData, personnelData],
  );

  const canRestoreOriginal = section ? hasRestorableOriginalDraft(section) : false;
  const showGeneratedEditor = section ? hasGeneratedDraft(section) : false;

  const handleGeneratedDraftChange = useCallback((value: string) => {
    setGeneratedDraft(value);
    setGeneratedDirty(true);
  }, []);

  const handleSaveGeneratedDraft = useCallback(() => {
    onSaveGeneratedText(generatedDraft);
    setGeneratedDirty(false);
  }, [generatedDraft, onSaveGeneratedText]);

  if (!section) {
    return (
      <section className="card vyrocni-zprava-detail vyrocni-zprava-detail--empty" aria-live="polite">
        <p className="muted-text">Vyberte kapitolu ze seznamu vlevo.</p>
      </section>
    );
  }

  return (
    <section className="card vyrocni-zprava-detail" aria-labelledby="vyrocni-zprava-detail-title">
      <div className="vyrocni-zprava-detail__header">
        <div>
          <p className="vyrocni-zprava-detail__code">{section.number}</p>
          <h2 id="vyrocni-zprava-detail-title" className="section-title vyrocni-zprava-detail__title">
            {section.title}
          </h2>
        </div>
        <VyrocniZpravaStatusBadge status={section.status} />
      </div>

      <p className="vyrocni-zprava-detail__description">{section.description}</p>

      {showSection01Panel ? (
        <VyrocniZpravaSection01ProfilePanel schoolProfile={schoolProfile} readiness={section01Readiness} />
      ) : null}

      {showSection01Panel ? (
        <VyrocniZpravaSection01DataForm
          section01Data={section01Data}
          savedAt={section01SavedAt}
          onSave={onSection01Save}
          onReset={onSection01Reset}
        />
      ) : null}

      {showSection02Panel ? (
        <VyrocniZpravaSection02DataForm
          section02Data={section02Data}
          savedAt={section02SavedAt}
          readiness={section02Readiness}
          onSave={onSection02Save}
          onReset={onSection02Reset}
        />
      ) : null}

      {showSection04Panel ? (
        <VyrocniZpravaSection04DataForm
          section04Data={section04Data}
          savedAt={section04SavedAt}
          readiness={section04Readiness}
          onSave={onSection04Save}
          onReset={onSection04Reset}
        />
      ) : null}

      {showSection05Panel ? (
        <VyrocniZpravaSection05DataForm
          section05Data={section05Data}
          savedAt={section05SavedAt}
          readiness={section05Readiness}
          onSave={onSection05Save}
          onReset={onSection05Reset}
        />
      ) : null}

      {showSection06Panel ? (
        <VyrocniZpravaSection06DataForm
          section06Data={section06Data}
          savedAt={section06SavedAt}
          readiness={section06Readiness}
          onSave={onSection06Save}
          onReset={onSection06Reset}
        />
      ) : null}

      {showSection07Panel ? (
        <VyrocniZpravaSection07DataForm
          section07Data={section07Data}
          savedAt={section07SavedAt}
          readiness={section07Readiness}
          onSave={onSection07Save}
          onReset={onSection07Reset}
        />
      ) : null}

      {showSection08Panel ? (
        <VyrocniZpravaSection08DataForm
          section08Data={section08Data}
          savedAt={section08SavedAt}
          readiness={section08Readiness}
          onSave={onSection08Save}
          onReset={onSection08Reset}
        />
      ) : null}

      {showSection09Panel ? (
        <VyrocniZpravaSection09DataForm
          section09Data={section09Data}
          savedAt={section09SavedAt}
          readiness={section09Readiness}
          onSave={onSection09Save}
          onReset={onSection09Reset}
        />
      ) : null}

      {showSection10Panel ? (
        <VyrocniZpravaSection10DataForm
          section10Data={section10Data}
          savedAt={section10SavedAt}
          readiness={section10Readiness}
          onSave={onSection10Save}
          onReset={onSection10Reset}
        />
      ) : null}

      {showSection11Panel ? (
        <VyrocniZpravaSection11DataForm
          section11Data={section11Data}
          savedAt={section11SavedAt}
          readiness={section11Readiness}
          onSave={onSection11Save}
          onReset={onSection11Reset}
        />
      ) : null}

      {showCalculatorPanel && calculatorData && section03Readiness ? (
        <VyrocniZpravaCalculatorDataPanel calculatorData={calculatorData} readiness={section03Readiness} />
      ) : null}

      {showCalculatorPanel ? (
        <VyrocniZpravaPersonnelDataForm
          personnelData={personnelData}
          savedAt={personnelSavedAt}
          onSave={onPersonnelSave}
          onReset={onPersonnelReset}
        />
      ) : null}

      {hasMissing ? (
        <div className="vyrocni-zprava-detail__warning" role="status">
          Pro tuto kapitolu chybí {section.missingFields.length}{" "}
          {section.missingFields.length === 1 ? "údaj" : section.missingFields.length < 5 ? "údaje" : "údajů"}.
        </div>
      ) : null}

      <div className="vyrocni-zprava-detail__block">
        <h3 className="vyrocni-zprava-detail__block-title">Požadované údaje</h3>
        {showMissingPanel ? (
          <ul className="vyrocni-zprava-detail__missing-list">
            {section.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : hasMissing ? (
          <p className="muted-text vyrocni-zprava-detail__placeholder">
            Klikněte na „Zkontrolovat údaje“ pro výpis chybějících položek.
          </p>
        ) : (
          <p className="vyrocni-zprava-detail__ok">Všechny požadované údaje jsou vyplněné.</p>
        )}
      </div>

      <div className="vyrocni-zprava-detail__block">
        <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-notes">
          <span className="vyrocni-zprava-field__label">Poznámky uživatele</span>
          <textarea
            id="vyrocni-zprava-notes"
            className="input vyrocni-zprava-detail__textarea"
            rows={4}
            value={section.userNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Vlastní poznámky k této kapitole…"
          />
        </label>
      </div>

      <div className="vyrocni-zprava-detail__block">
        <div className="vyrocni-zprava-generated-editor__header">
          <h3 className="vyrocni-zprava-detail__block-title">Vygenerovaný text</h3>
          {section.editedByUser ? (
            <p className="vyrocni-zprava-generated-editor__hint muted-text">Text byl ručně upraven.</p>
          ) : null}
        </div>

        {showGeneratedEditor ? (
          <>
            <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-generated-text">
              <span className="vyrocni-zprava-field__label">Návrh kapitoly k revizi a schválení</span>
              <textarea
                id="vyrocni-zprava-generated-text"
                className="input vyrocni-zprava-detail__textarea vyrocni-zprava-generated-editor__textarea"
                rows={14}
                value={generatedDraft}
                onChange={(e) => handleGeneratedDraftChange(e.target.value)}
              />
            </label>

            <div className="vyrocni-zprava-generated-editor__actions">
              <button
                type="button"
                className="btn primary"
                onClick={handleSaveGeneratedDraft}
                disabled={!generatedDirty}
              >
                Uložit úpravy textu
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={onRestoreGeneratedText}
                disabled={!canRestoreOriginal}
              >
                Vrátit se ke generovanému návrhu
              </button>
              <button type="button" className="btn ghost" onClick={onApprove}>
                Označit jako schválené
              </button>
            </div>
          </>
        ) : (
          <div className="vyrocni-zprava-detail__generated card card--elevated" aria-live="polite">
            <p className="muted-text vyrocni-zprava-detail__placeholder">
              Text kapitoly zatím nebyl vygenerován. Použijte tlačítko „Vygenerovat návrh“.
            </p>
          </div>
        )}
      </div>

      <div className="vyrocni-zprava-detail__actions">
        <button type="button" className="btn ghost" onClick={onCheckData}>
          Zkontrolovat údaje
        </button>
        <button type="button" className="btn primary" onClick={onGenerateDraft}>
          Vygenerovat návrh
        </button>
      </div>
    </section>
  );
}
