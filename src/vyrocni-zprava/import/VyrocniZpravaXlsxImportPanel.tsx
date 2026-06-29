import React, { useCallback, useMemo, useRef, useState } from "react";
import type { SchoolProfile } from "../../school-profile/school-profile-types";
import type { AnnualReportPersonnelData } from "../vyrocni-zprava-personnel-types";
import type { VyrocniZpravaSection01Data } from "../vyrocni-zprava-section01-types";
import type { AnnualReportSection02Data } from "../vyrocni-zprava-section02-types";
import type { AnnualReportSection04Data } from "../vyrocni-zprava-section04-types";
import type { AnnualReportSection05Data } from "../vyrocni-zprava-section05-types";
import type { AnnualReportSection06Data } from "../vyrocni-zprava-section06-types";
import type { AnnualReportSection07Data } from "../vyrocni-zprava-section07-types";
import type { AnnualReportSection08Data } from "../vyrocni-zprava-section08-types";
import type { AnnualReportSection09Data } from "../vyrocni-zprava-section09-types";
import type { AnnualReportSection10Data } from "../vyrocni-zprava-section10-types";
import type { AnnualReportSection11Data } from "../vyrocni-zprava-section11-types";
import type { AnnualReportSection12Data } from "../vyrocni-zprava-section12-types";
import type { AnnualReportSection13Data } from "../vyrocni-zprava-section13-types";
import type { AnnualReportSection14Data } from "../vyrocni-zprava-section14-types";
import type { AnnualReportPublicationBlock, AnnualReportSection } from "../vyrocni-zprava-types";
import { downloadVyrocniZpravaImportTemplateXlsx } from "./vyrocni-zprava-xlsx-template";
import {
  ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR,
  ANNUAL_REPORT_XLSX_UPLOAD_ERROR,
  assertAnnualReportXlsxTemplateConfig,
} from "./vyrocni-zprava-xlsx-template-config";
import { parseVyrocniZpravaImportFile } from "./vyrocni-zprava-xlsx-import-logic";
import { buildImportPreviewSummary } from "./vyrocni-zprava-xlsx-import-preview";
import type { AnnualReportXlsxImportResult } from "./vyrocni-zprava-xlsx-import-types";

type VyrocniZpravaXlsxImportPanelProps = {
  schoolProfile: SchoolProfile;
  section01Data: VyrocniZpravaSection01Data;
  section02Data: AnnualReportSection02Data;
  section03Data: AnnualReportPersonnelData;
  section04Data: AnnualReportSection04Data;
  section05Data: AnnualReportSection05Data;
  section06Data: AnnualReportSection06Data;
  section07Data: AnnualReportSection07Data;
  section08Data: AnnualReportSection08Data;
  section09Data: AnnualReportSection09Data;
  section10Data: AnnualReportSection10Data;
  section11Data: AnnualReportSection11Data;
  section12Data: AnnualReportSection12Data;
  section13Data: AnnualReportSection13Data;
  section14Data: AnnualReportSection14Data;
  publicationBlock?: AnnualReportPublicationBlock;
  reportSections: AnnualReportSection[];
  onApplyProfilePatch: (patch: Partial<SchoolProfile>) => void;
  onApplySection01Data: (data: VyrocniZpravaSection01Data) => void;
  onApplySection02Data: (data: AnnualReportSection02Data) => void;
  onApplySection03Data: (data: AnnualReportPersonnelData) => void;
  onApplySection04Data: (data: AnnualReportSection04Data) => void;
  onApplySection05Data: (data: AnnualReportSection05Data) => void;
  onApplySection06Data: (data: AnnualReportSection06Data) => void;
  onApplySection07Data: (data: AnnualReportSection07Data) => void;
  onApplySection08Data: (data: AnnualReportSection08Data) => void;
  onApplySection09Data: (data: AnnualReportSection09Data) => void;
  onApplySection10Data: (data: AnnualReportSection10Data) => void;
  onApplySection11Data: (data: AnnualReportSection11Data) => void;
  onApplySection12Data: (data: AnnualReportSection12Data) => void;
  onApplySection13Data: (data: AnnualReportSection13Data) => void;
  onApplySection14Data: (data: AnnualReportSection14Data) => void;
  onApplyPublicationBlockPatch: (patch: Partial<AnnualReportPublicationBlock>) => void;
};

type AnnualReportBackupV1 = {
  version: 1;
  exportedAt: string;
  schoolProfile: SchoolProfile;
  publicationBlock?: AnnualReportPublicationBlock;
  section01Data: VyrocniZpravaSection01Data;
  section02Data: AnnualReportSection02Data;
  section03Data: AnnualReportPersonnelData;
  section04Data: AnnualReportSection04Data;
  section05Data: AnnualReportSection05Data;
  section06Data: AnnualReportSection06Data;
  section07Data: AnnualReportSection07Data;
  section08Data: AnnualReportSection08Data;
  section09Data: AnnualReportSection09Data;
  section10Data: AnnualReportSection10Data;
  section11Data: AnnualReportSection11Data;
};

type AnnualReportBackupPreview = {
  payload: AnnualReportBackupV1;
  overwriteTargets: string[];
};

function hasAnyText(value?: string): boolean {
  return (value ?? "").trim().length > 0;
}

function hasAnyProfileData(profile: SchoolProfile): boolean {
  return Object.values(profile).some((value) => hasAnyText(value));
}

function hasAnyPublicationBlockData(block: AnnualReportPublicationBlock | undefined): boolean {
  if (!block) return false;
  return Object.values(block).some((value) => hasAnyText(value));
}

function hasAnySectionData(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return hasAnyText(value);
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some((item) => hasAnySectionData(item));
  return false;
}

function IssueList(props: { title: string; items: Array<{ message: string; sheet?: string; row?: number; field?: string }> }) {
  if (props.items.length === 0) return null;
  return (
    <div className="vyrocni-zprava-import__issues">
      <h4 className="vyrocni-zprava-import__subtitle">{props.title}</h4>
      <ul className="vyrocni-zprava-section04-form__warnings">
        {props.items.map((item, index) => (
          <li key={`${props.title}-${index}`}>
            {item.sheet ? `${item.sheet}` : "Import"}{item.row ? ` (řádek ${item.row})` : ""}: {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VyrocniZpravaXlsxImportPanel({
  schoolProfile,
  section01Data,
  section02Data,
  section03Data,
  section04Data,
  section05Data,
  section06Data,
  section07Data,
  section08Data,
  section09Data,
  section10Data,
  section11Data,
  section12Data,
  section13Data,
  section14Data,
  publicationBlock,
  reportSections,
  onApplyProfilePatch,
  onApplySection01Data,
  onApplySection02Data,
  onApplySection03Data,
  onApplySection04Data,
  onApplySection05Data,
  onApplySection06Data,
  onApplySection07Data,
  onApplySection08Data,
  onApplySection09Data,
  onApplySection10Data,
  onApplySection11Data,
  onApplySection12Data,
  onApplySection13Data,
  onApplySection14Data,
  onApplyPublicationBlockPatch,
}: VyrocniZpravaXlsxImportPanelProps) {
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<AnnualReportXlsxImportResult | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [backupPreview, setBackupPreview] = useState<AnnualReportBackupPreview | null>(null);
  const [backupOverwriteConfirmed, setBackupOverwriteConfirmed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"ok" | "warn" | "error" | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const templateConfigError = useMemo(() => {
    try {
      assertAnnualReportXlsxTemplateConfig();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR;
    }
  }, []);

  const previewSummary = useMemo(
    () =>
      importResult
        ? buildImportPreviewSummary(
            importResult,
            {
              schoolProfile,
              section01Data,
              section02Data,
              section03Data,
              section04Data,
              section05Data,
              section06Data,
              section07Data,
              section08Data,
              section09Data,
              section10Data,
              section11Data,
              section12Data,
              section13Data,
              section14Data,
              publicationBlock,
              sectionStatuses: Object.fromEntries(reportSections.map((section) => [section.id, section.status])),
            },
            overwriteConfirmed,
          )
        : null,
    [
      importResult,
      overwriteConfirmed,
      schoolProfile,
      section01Data,
      section02Data,
      section03Data,
      section04Data,
      section05Data,
      section06Data,
      section07Data,
      section08Data,
      section09Data,
      section10Data,
      section11Data,
      section12Data,
      section13Data,
      section14Data,
      publicationBlock,
      reportSections,
    ],
  );

  const handleDownloadTemplate = useCallback(async () => {
    if (templateConfigError) {
      setStatusKind("error");
      setStatusMessage(templateConfigError);
      return;
    }
    setIsTemplateDownloading(true);
    setStatusMessage(null);
    setStatusKind(null);
    try {
      await downloadVyrocniZpravaImportTemplateXlsx();
    } catch (error) {
      setStatusKind("error");
      setStatusMessage(error instanceof Error ? error.message : ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR);
    } finally {
      setIsTemplateDownloading(false);
    }
  }, [templateConfigError]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setStatusMessage(null);
      setStatusKind(null);
      setOverwriteConfirmed(false);
      setIsParsing(true);
      try {
        if (templateConfigError) {
          throw new Error(templateConfigError);
        }
        const parsed = await parseVyrocniZpravaImportFile(file, schoolProfile);
        setImportResult(parsed);
        if (!parsed.valid && parsed.errors.some((item) => item.message === ANNUAL_REPORT_XLSX_UPLOAD_ERROR)) {
          setStatusKind("error");
          setStatusMessage(ANNUAL_REPORT_XLSX_UPLOAD_ERROR);
        }
      } catch (error) {
        setImportResult(null);
        setStatusKind("error");
        setStatusMessage(error instanceof Error ? error.message : ANNUAL_REPORT_XLSX_UPLOAD_ERROR);
      } finally {
        setIsParsing(false);
        event.target.value = "";
      }
    },
    [schoolProfile, templateConfigError],
  );

  const handleConfirmImport = useCallback(() => {
    if (!importResult || !previewSummary?.canConfirm) return;

    if (importResult.profilePatch && Object.keys(importResult.profilePatch).length > 0) {
      onApplyProfilePatch(importResult.profilePatch);
    }
    if (importResult.section01Data) onApplySection01Data(importResult.section01Data);
    if (importResult.section02Data) onApplySection02Data(importResult.section02Data);
    if (importResult.section03Data) onApplySection03Data(importResult.section03Data);
    if (importResult.section04Data) onApplySection04Data(importResult.section04Data);
    if (importResult.section05Data) onApplySection05Data(importResult.section05Data);
    if (importResult.section06Data) onApplySection06Data(importResult.section06Data);
    if (importResult.section07Data) onApplySection07Data(importResult.section07Data);
    if (importResult.section08Data) onApplySection08Data(importResult.section08Data);
    if (importResult.section09Data) onApplySection09Data(importResult.section09Data);
    if (importResult.section10Data) onApplySection10Data(importResult.section10Data);
    if (importResult.section11Data) onApplySection11Data(importResult.section11Data);
    if (importResult.section12Data) onApplySection12Data(importResult.section12Data);
    if (importResult.section13Data) onApplySection13Data(importResult.section13Data);
    if (importResult.section14Data) onApplySection14Data(importResult.section14Data);
    if (importResult.publicationBlockPatch) onApplyPublicationBlockPatch(importResult.publicationBlockPatch);

    setStatusKind("ok");
    setStatusMessage("Import byl uložen. Doporučujeme znovu zkontrolovat údaje a vygenerovat dotčené kapitoly.");
  }, [
    importResult,
    onApplyProfilePatch,
    onApplySection01Data,
    onApplySection02Data,
    onApplySection03Data,
    onApplySection04Data,
    onApplySection05Data,
    onApplySection06Data,
    onApplySection07Data,
    onApplySection08Data,
    onApplySection09Data,
    onApplySection10Data,
    onApplySection11Data,
    onApplySection12Data,
    onApplySection13Data,
    onApplySection14Data,
    onApplyPublicationBlockPatch,
    previewSummary?.canConfirm,
  ]);

  const handleExportBackup = useCallback(() => {
    const payload: AnnualReportBackupV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schoolProfile,
      publicationBlock,
      section01Data,
      section02Data,
      section03Data,
      section04Data,
      section05Data,
      section06Data,
      section07Data,
      section08Data,
      section09Data,
      section10Data,
      section11Data,
    };
    const filenameDate = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vyrocni-zprava-backup-${filenameDate}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusKind("ok");
    setStatusMessage("JSON záloha byla stažena.");
  }, [
    publicationBlock,
    schoolProfile,
    section01Data,
    section02Data,
    section03Data,
    section04Data,
    section05Data,
    section06Data,
    section07Data,
    section08Data,
    section09Data,
    section10Data,
    section11Data,
  ]);

  const handleBackupFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as Partial<AnnualReportBackupV1>;
      if (raw.version !== 1 || !raw.schoolProfile) {
        throw new Error("Neplatný formát JSON zálohy (očekává se verze 1).");
      }
      const payload = raw as AnnualReportBackupV1;
      const targets: string[] = [];
      if (hasAnySectionData(payload.schoolProfile) && hasAnyProfileData(schoolProfile)) {
        targets.push("Profil školy");
      }
      if (payload.publicationBlock && hasAnyPublicationBlockData(publicationBlock)) {
        targets.push("Schválení a zveřejnění");
      }
      const sectionTargets: Array<{ id: string; payloadData: unknown; existingData: unknown }> = [
        { id: "01", payloadData: payload.section01Data, existingData: section01Data },
        { id: "02", payloadData: payload.section02Data, existingData: section02Data },
        { id: "03", payloadData: payload.section03Data, existingData: section03Data },
        { id: "04", payloadData: payload.section04Data, existingData: section04Data },
        { id: "05", payloadData: payload.section05Data, existingData: section05Data },
        { id: "06", payloadData: payload.section06Data, existingData: section06Data },
        { id: "07", payloadData: payload.section07Data, existingData: section07Data },
        { id: "08", payloadData: payload.section08Data, existingData: section08Data },
        { id: "09", payloadData: payload.section09Data, existingData: section09Data },
        { id: "10", payloadData: payload.section10Data, existingData: section10Data },
        { id: "11", payloadData: payload.section11Data, existingData: section11Data },
      ];
      sectionTargets.forEach((item) => {
        if (hasAnySectionData(item.payloadData) && hasAnySectionData(item.existingData)) {
          targets.push(item.id);
        }
      });
      setBackupPreview({
        payload,
        overwriteTargets: targets,
      });
      setBackupOverwriteConfirmed(false);
      setStatusKind("warn");
      setStatusMessage("JSON záloha byla načtena. Zkontrolujte mini diff a potvrďte obnovu.");
    } catch (error) {
      setStatusKind("error");
      setStatusMessage(error instanceof Error ? error.message : "JSON zálohu se nepodařilo obnovit.");
      setBackupPreview(null);
      setBackupOverwriteConfirmed(false);
    } finally {
      event.target.value = "";
    }
  }, [
    publicationBlock,
    schoolProfile,
    section01Data,
    section02Data,
    section03Data,
    section04Data,
    section05Data,
    section06Data,
    section07Data,
    section08Data,
    section09Data,
    section10Data,
    section11Data,
  ]);

  const handleConfirmBackupRestore = useCallback(() => {
    if (!backupPreview) return;
    if (backupPreview.overwriteTargets.length > 0 && !backupOverwriteConfirmed) return;
    const payload = backupPreview.payload;
    onApplyProfilePatch(payload.schoolProfile);
    if (payload.publicationBlock) onApplyPublicationBlockPatch(payload.publicationBlock);
    if (payload.section01Data) onApplySection01Data(payload.section01Data);
    if (payload.section02Data) onApplySection02Data(payload.section02Data);
    if (payload.section03Data) onApplySection03Data(payload.section03Data);
    if (payload.section04Data) onApplySection04Data(payload.section04Data);
    if (payload.section05Data) onApplySection05Data(payload.section05Data);
    if (payload.section06Data) onApplySection06Data(payload.section06Data);
    if (payload.section07Data) onApplySection07Data(payload.section07Data);
    if (payload.section08Data) onApplySection08Data(payload.section08Data);
    if (payload.section09Data) onApplySection09Data(payload.section09Data);
    if (payload.section10Data) onApplySection10Data(payload.section10Data);
    if (payload.section11Data) onApplySection11Data(payload.section11Data);
    setBackupPreview(null);
    setBackupOverwriteConfirmed(false);
    setStatusKind("ok");
    setStatusMessage("JSON záloha byla obnovena.");
  }, [
    backupOverwriteConfirmed,
    backupPreview,
    onApplyProfilePatch,
    onApplyPublicationBlockPatch,
    onApplySection01Data,
    onApplySection02Data,
    onApplySection03Data,
    onApplySection04Data,
    onApplySection05Data,
    onApplySection06Data,
    onApplySection07Data,
    onApplySection08Data,
    onApplySection09Data,
    onApplySection10Data,
    onApplySection11Data,
  ]);

  return (
    <section className="card section-card section-card--setup vyrocni-zprava-import" aria-labelledby="vyrocni-zprava-import-title">
      <h2 id="vyrocni-zprava-import-title" className="section-title">
        Import údajů z XLSX šablony
      </h2>
      <p className="muted-text">
        Import v2 podporuje Profil školy a kapitoly 01–14. Nejprve se zobrazí náhled, uložení proběhne až po potvrzení.
      </p>

      <div className="vyrocni-zprava-page__actions">
        <button
          type="button"
          className="btn ghost"
          onClick={handleDownloadTemplate}
          disabled={isTemplateDownloading || Boolean(templateConfigError)}
        >
          {isTemplateDownloading ? "Stahuji XLSX šablonu..." : "Stáhnout XLSX šablonu"}
        </button>
        <label className="btn ghost" aria-disabled={isParsing || Boolean(templateConfigError)}>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={isParsing || Boolean(templateConfigError)}
            style={{ display: "none" }}
          />
          {isParsing ? "Načítám XLSX..." : "Nahrát vyplněnou XLSX šablonu"}
        </label>
        <button
          type="button"
          className="btn ghost"
          onClick={handleExportBackup}
        >
          Export JSON zálohy (§01–11)
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => backupInputRef.current?.click()}
        >
          Obnovit z JSON zálohy
        </button>
        <input
          ref={backupInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleBackupFileChange}
          style={{ display: "none" }}
        />
      </div>

      {templateConfigError ? (
        <p className="vyrocni-zprava-section04-form__warnings">{templateConfigError}</p>
      ) : null}

      {statusMessage ? (
        <p className={statusKind === "error" ? "vyrocni-zprava-section04-form__warnings" : statusKind === "ok" ? "vyrocni-zprava-detail__ok" : "muted-text"}>
          {statusMessage}
        </p>
      ) : null}

      {backupPreview ? (
        <div className="vyrocni-zprava-import__preview">
          <h3 className="vyrocni-zprava-detail__block-title">Náhled obnovy JSON</h3>
          <ul className="vyrocni-zprava-section04-form__list muted-text">
            <li>Verze: {backupPreview.payload.version}</li>
            <li>Exportováno: {backupPreview.payload.exportedAt}</li>
            <li>Přepisovaných částí: {backupPreview.overwriteTargets.length}</li>
          </ul>
          {backupPreview.overwriteTargets.length > 0 ? (
            <div className="vyrocni-zprava-section04-form__subsection">
              <p className="muted-text">
                Obnova přepíše aktuální data v těchto částech: {backupPreview.overwriteTargets.join(", ")}.
              </p>
              <label className="vyrocni-zprava-field">
                <span className="vyrocni-zprava-field__label">
                  <input
                    type="checkbox"
                    checked={backupOverwriteConfirmed}
                    onChange={(event) => setBackupOverwriteConfirmed(event.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Rozumím, že JSON obnova přepíše uložené údaje ve vybraných částech.
                </span>
              </label>
            </div>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={handleConfirmBackupRestore}
            disabled={backupPreview.overwriteTargets.length > 0 && !backupOverwriteConfirmed}
          >
            Potvrdit obnovu JSON zálohy
          </button>
        </div>
      ) : null}

      {importResult ? (
        <div className="vyrocni-zprava-import__preview">
          <h3 className="vyrocni-zprava-detail__block-title">Náhled importu</h3>
          <p className="muted-text">
            Soubor: {importResult.sourceFileName ?? "neuveden"} | Detekované listy:{" "}
            {importResult.detectedSheets.length > 0 ? importResult.detectedSheets.join(", ") : "žádné"}
          </p>

          {previewSummary ? (
            <ul className="vyrocni-zprava-section04-form__list muted-text">
              <li>Profil školy: {importResult.profilePatch ? "ano" : "ne"}</li>
              <li>Schválení a zveřejnění: {importResult.publicationBlockPatch ? "ano" : "ne"}</li>
              {previewSummary.sectionSummaries.map((section) => (
                <li key={section.id}>
                  {section.label}:{" "}
                  {section.detected
                    ? `${section.summary} | readiness: ${section.readiness} | dopad: ${
                        section.impact === "PREPISE" ? "přepíše" : section.impact === "DOPLNI" ? "doplní" : "beze změny"
                      } | varování: ${section.warningsCount}`
                    : "V této části nebyla nalezena data k importu."}
                </li>
              ))}
              <li>Chyby: {importResult.errors.length}</li>
              <li>Upozornění: {importResult.warnings.length}</li>
              <li>Ignorované položky: {importResult.ignored.length}</li>
            </ul>
          ) : null}

          <IssueList title="Chyby importu" items={importResult.errors} />
          <IssueList title="Upozornění importu" items={importResult.warnings} />
          <IssueList title="Ignorované položky" items={importResult.ignored} />

          {previewSummary && previewSummary.overwriteTargets.length > 0 ? (
            <div className="vyrocni-zprava-section04-form__subsection">
              <p className="muted-text">
                Import přepíše aktuálně uložené údaje v těchto částech: {previewSummary.overwriteTargets.join(", ")}.
              </p>
              {previewSummary.manualOverwriteWarnings.length > 0 ? (
                <p className="vyrocni-zprava-section04-form__warnings">
                  Pozor: import zasahuje i ručně upravené / schválené kapitoly: {previewSummary.manualOverwriteWarnings.join(", ")}.
                </p>
              ) : null}
              <label className="vyrocni-zprava-field">
                <span className="vyrocni-zprava-field__label">
                  <input
                    type="checkbox"
                    checked={overwriteConfirmed}
                    onChange={(event) => setOverwriteConfirmed(event.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Rozumím, že import přepíše uložené údaje ve vybraných částech.
                </span>
              </label>
            </div>
          ) : null}

          <p className="muted-text">
            Import neupravuje automaticky generatedText. Po importu doporučujeme znovu zkontrolovat údaje a regenerovat dotčené kapitoly.
          </p>

          <button
            type="button"
            className="btn primary"
            onClick={handleConfirmImport}
            disabled={!previewSummary?.canConfirm}
          >
            Potvrdit import a uložit údaje
          </button>
        </div>
      ) : null}
    </section>
  );
}
