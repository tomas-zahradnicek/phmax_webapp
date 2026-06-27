import React, { useMemo, useState } from "react";

import { VYROCNI_ZPRAVA_PATH } from "../calculator-ui-constants";
import { showUiToast } from "../ui-toast";
import type { AnnualReportSectionStatus } from "./vyrocni-zprava-types";
import { ANNUAL_REPORT_SECTION_STATUS_LABELS } from "./vyrocni-zprava-types";
import { exportAnnualReportPreviewToDocx } from "./vyrocni-zprava-docx-export";
import { buildDocxExportModel } from "./vyrocni-zprava-docx-export-logic";
import type { AnnualReportPreviewData, AnnualReportPreviewSection } from "./vyrocni-zprava-report-preview-builder";
import { buildAnnualReportPreview } from "./vyrocni-zprava-report-preview-builder";

type VyrocniZpravaReportPreviewProps = {
  report: Parameters<typeof buildAnnualReportPreview>[0]["report"];
  schoolProfile: Parameters<typeof buildAnnualReportPreview>[0]["schoolProfile"];
};

function buildVisibleSections(
  sections: AnnualReportPreviewSection[],
  options: { onlyApproved: boolean; includeUnapproved: boolean },
): AnnualReportPreviewSection[] {
  if (options.onlyApproved) {
    return sections.filter((section) => section.status === "SCHVALENO" && section.generatedText);
  }
  if (!options.includeUnapproved) {
    return sections.filter((section) => section.status === "SCHVALENO" && section.generatedText);
  }
  return sections.filter((section) => section.generatedText);
}

function buildVisibleFullText(sections: AnnualReportPreviewSection[]): string {
  return sections
    .filter((section) => section.generatedText)
    .map((section) => section.generatedText as string)
    .join("\n\n\n");
}

function statusBadgeClass(status: AnnualReportSectionStatus): string {
  switch (status) {
    case "SCHVALENO":
      return "vyrocni-zprava-preview__status vyrocni-zprava-preview__status--approved";
    case "UPRAVENO_UZIVATELEM":
    case "VYGENEROVANO":
      return "vyrocni-zprava-preview__status vyrocni-zprava-preview__status--warning";
    default:
      return "vyrocni-zprava-preview__status";
  }
}

export function VyrocniZpravaReportPreview({ report, schoolProfile }: VyrocniZpravaReportPreviewProps) {
  const preview = useMemo<AnnualReportPreviewData>(
    () => buildAnnualReportPreview({ report, schoolProfile }),
    [report, schoolProfile],
  );
  const [onlyApproved, setOnlyApproved] = useState(false);
  const [includeUnapproved, setIncludeUnapproved] = useState(true);
  const [copyNotice, setCopyNotice] = useState<string>("");
  const [exportNotice, setExportNotice] = useState<string>("");
  const [exportError, setExportError] = useState<string>("");

  const visibleSections = useMemo(
    () => buildVisibleSections(preview.sections, { onlyApproved, includeUnapproved }),
    [preview.sections, onlyApproved, includeUnapproved],
  );
  const visibleFullText = useMemo(() => buildVisibleFullText(visibleSections), [visibleSections]);

  const omittedSections = useMemo(() => {
    const visibleSet = new Set(visibleSections.map((section) => `${section.number}|${section.title}`));
    return preview.sections
      .filter((section) => !visibleSet.has(`${section.number}|${section.title}`))
      .map((section) => `${section.number} ${section.title}`);
  }, [preview.sections, visibleSections]);

  async function copyAnnualReportPreviewToClipboard() {
    if (!visibleFullText.trim()) {
      const msg = "Náhled zatím neobsahuje text ke kopírování.";
      setCopyNotice(msg);
      showUiToast(msg);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      const msg = "Kopírování není v tomto prohlížeči dostupné.";
      setCopyNotice(msg);
      showUiToast(msg, { assertive: true });
      return;
    }
    try {
      await navigator.clipboard.writeText(visibleFullText);
      const msg = "Text náhledu byl zkopírován do schránky.";
      setCopyNotice(msg);
      showUiToast(msg);
    } catch {
      const msg = "Kopírování se nepodařilo (omezení prohlížeče).";
      setCopyNotice(msg);
      showUiToast(msg, { assertive: true });
    }
  }

  async function handleExportVisibleToWord() {
    setExportNotice("");
    setExportError("");
    const visiblePreview: AnnualReportPreviewData = {
      ...preview,
      sections: visibleSections,
      fullText: visibleFullText,
    };
    const unapprovedVisible = visibleSections.filter((section) => section.status !== "SCHVALENO" && section.generatedText);
    if (unapprovedVisible.length > 0) {
      const warning = `Pozor: export zahrnuje i neschválené kapitoly (${unapprovedVisible.length}).`;
      setExportNotice(warning);
      showUiToast(warning, { assertive: true });
    }
    try {
      const result = await exportAnnualReportPreviewToDocx(visiblePreview, { mode: "visible-generated" });
      if (!result.exported) {
        const msg = "Nejsou k dispozici žádné kapitoly k exportu.";
        setExportError(msg);
        showUiToast(msg, { assertive: true });
        return;
      }
      const msg = "Export do Wordu byl dokončen.";
      setExportNotice(msg);
      showUiToast(msg);
    } catch {
      const msg = "Export do Wordu se nepodařil.";
      setExportError(msg);
      showUiToast(msg, { assertive: true });
    }
  }

  async function handleExportApprovedToWord() {
    setExportNotice("");
    setExportError("");
    try {
      const model = buildDocxExportModel(preview, "approved-only");
      if (model.sections.length === 0) {
        const msg = "Nejsou k dispozici žádné kapitoly k exportu.";
        setExportError(msg);
        showUiToast(msg, { assertive: true });
        return;
      }
      await exportAnnualReportPreviewToDocx(preview, { mode: "approved-only" });
      const msg = "Export schválených kapitol do Wordu byl dokončen.";
      setExportNotice(msg);
      showUiToast(msg);
    } catch {
      const msg = "Export schválených kapitol do Wordu se nepodařil.";
      setExportError(msg);
      showUiToast(msg, { assertive: true });
    }
  }

  return (
    <div className="vyrocni-zprava-preview card">
      <header className="vyrocni-zprava-preview__header">
        <div>
          <h2 className="section-title vyrocni-zprava-preview__title">{preview.title}</h2>
          <p className="muted-text vyrocni-zprava-preview__meta">
            {preview.schoolName ? preview.schoolName : "Název školy není vyplněn"} · školní rok{" "}
            {preview.schoolYear ? preview.schoolYear : "neuveden"}
          </p>
        </div>
        <div className="vyrocni-zprava-preview__actions">
          <a className="btn ghost" href={VYROCNI_ZPRAVA_PATH}>
            Zpět na kapitoly
          </a>
          <button type="button" className="btn primary" onClick={copyAnnualReportPreviewToClipboard}>
            Kopírovat celý text
          </button>
          <button type="button" className="btn primary" onClick={handleExportVisibleToWord}>
            Exportovat do Wordu
          </button>
          <button type="button" className="btn ghost" onClick={handleExportApprovedToWord}>
            Exportovat pouze schválené kapitoly do Wordu
          </button>
        </div>
      </header>

      <div className="vyrocni-zprava-preview__summary card card--elevated">
        <p>
          Vygenerováno: <strong>{preview.generatedSectionsCount}</strong> / {preview.totalSectionsCount}
        </p>
        <p>
          Schváleno: <strong>{preview.approvedSectionsCount}</strong> / {preview.totalSectionsCount}
        </p>
        <p>
          Chybějící kapitoly: <strong>{preview.missingSections.length}</strong>
        </p>
      </div>

      {preview.missingSections.length > 0 ? (
        <div className="vyrocni-zprava-preview__warning" role="status">
          <p>
            Některé kapitoly zatím nemají finální text ({preview.missingSections.length}):{" "}
            {preview.missingSections.join(", ")}.
          </p>
        </div>
      ) : null}

      {preview.unapprovedSections.length > 0 ? (
        <div className="vyrocni-zprava-preview__warning" role="status">
          <p>
            Neschválené kapitoly ({preview.unapprovedSections.length}): {preview.unapprovedSections.join(", ")}.
          </p>
        </div>
      ) : null}

      <div className="vyrocni-zprava-preview__toggles">
        <label className="vyrocni-zprava-preview__toggle">
          <input
            type="checkbox"
            checked={onlyApproved}
            onChange={(event) => {
              const checked = event.target.checked;
              setOnlyApproved(checked);
              if (checked) setIncludeUnapproved(false);
            }}
          />
          <span>Zobrazit pouze schválené kapitoly</span>
        </label>
        <label className="vyrocni-zprava-preview__toggle">
          <input
            type="checkbox"
            checked={includeUnapproved}
            onChange={(event) => {
              const checked = event.target.checked;
              setIncludeUnapproved(checked);
              if (checked) setOnlyApproved(false);
            }}
          />
          <span>Zobrazit i neschválené kapitoly</span>
        </label>
      </div>

      {onlyApproved && omittedSections.length > 0 ? (
        <div className="vyrocni-zprava-preview__warning" role="status">
          <p>V režimu „pouze schválené“ jsou vynechány kapitoly: {omittedSections.join(", ")}.</p>
        </div>
      ) : null}

      <section className="vyrocni-zprava-preview__sections card card--elevated">
        <h3 className="vyrocni-zprava-preview__sections-title">Kapitoly v náhledu</h3>
        <ul className="vyrocni-zprava-preview__section-list">
          {visibleSections.map((section) => (
            <li key={`${section.number}-${section.title}`} className="vyrocni-zprava-preview__section-item">
              <span>{section.number} {section.title}</span>
              <span className={statusBadgeClass(section.status)}>
                {section.approved ? "Schváleno" : ANNUAL_REPORT_SECTION_STATUS_LABELS[section.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="vyrocni-zprava-preview__text card card--elevated">
        <h3 className="vyrocni-zprava-preview__sections-title">Sestavený náhled textu</h3>
        {visibleFullText ? (
          <pre className="vyrocni-zprava-preview__fulltext">{visibleFullText}</pre>
        ) : (
          <p className="muted-text">Pro aktuální filtr nejsou k dispozici žádné kapitoly s textem.</p>
        )}
      </section>

      {copyNotice ? <p className="muted-text vyrocni-zprava-preview__copy-note">{copyNotice}</p> : null}
      {exportNotice ? <p className="muted-text vyrocni-zprava-preview__copy-note">{exportNotice}</p> : null}
      {exportError ? <p className="vyrocni-zprava-preview__error-note">{exportError}</p> : null}
    </div>
  );
}
