import React, { useCallback, useEffect, useMemo, useState } from "react";

import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import {
  createDefaultSection04GradeCountRow,
  createDefaultSection04PupilCountRow,
  type Section04Readiness,
} from "./vyrocni-zprava-section04-data-logic";
import type {
  AnnualReportSection04AdmissionSummary,
  AnnualReportSection04Data,
  AnnualReportSection04GradeCount,
  AnnualReportSection04PupilCountRow,
} from "./vyrocni-zprava-section04-types";

type VyrocniZpravaSection04DataFormProps = {
  section04Data: AnnualReportSection04Data;
  savedAt: string | null;
  readiness: Section04Readiness;
  onSave: (data: AnnualReportSection04Data) => void;
  onReset: () => void;
};

const SECONDARY_SCHOOL_ROWS = [
  "víceleté gymnázium",
  "úplné střední všeobecné vzdělání",
  "úplné střední odborné vzdělání s maturitou",
  "úplné střední odborné vzdělání s vyučením i maturitou",
  "střední odborné vzdělání s výučním listem",
  "nehlásí se nikam",
];

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function displayNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function ensureSecondaryRows(data: AnnualReportSection04Data): AnnualReportSection04Data {
  if (data.secondarySchoolAdmissions.length >= SECONDARY_SCHOOL_ROWS.length) return data;
  const byType = new Map(data.secondarySchoolAdmissions.map((row) => [row.schoolType, row.count]));
  return {
    ...data,
    secondarySchoolAdmissions: SECONDARY_SCHOOL_ROWS.map((schoolType) => ({
      schoolType,
      count: byType.get(schoolType),
    })),
  };
}

function updateAdmissionSummaryField(
  summary: AnnualReportSection04AdmissionSummary,
  key: keyof AnnualReportSection04AdmissionSummary,
  value: string,
): AnnualReportSection04AdmissionSummary {
  return { ...summary, [key]: parseOptionalNumber(value) };
}

function AdmissionSummaryPanel(props: {
  title: string;
  summary: AnnualReportSection04AdmissionSummary;
  onChange: (next: AnnualReportSection04AdmissionSummary) => void;
}) {
  const { title, summary, onChange } = props;
  return (
    <section className="vyrocni-zprava-section04-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section04-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section04-form__grid">
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poprvé u zápisu celkem</span>
          <input
            className="input"
            value={displayNumber(summary.firstTimeTotal)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "firstTimeTotal", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poprvé u zápisu dívky</span>
          <input
            className="input"
            value={displayNumber(summary.firstTimeGirls)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "firstTimeGirls", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Po odkladu celkem</span>
          <input
            className="input"
            value={displayNumber(summary.afterDeferralTotal)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "afterDeferralTotal", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Po odkladu dívky</span>
          <input
            className="input"
            value={displayNumber(summary.afterDeferralGirls)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "afterDeferralGirls", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Zapsaní celkem</span>
          <input
            className="input"
            value={displayNumber(summary.enrolledTotal)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "enrolledTotal", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Zapsaní dívky</span>
          <input
            className="input"
            value={displayNumber(summary.enrolledGirls)}
            onChange={(event) => onChange(updateAdmissionSummaryField(summary, "enrolledGirls", event.target.value))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Žádosti o odklad celkem</span>
          <input
            className="input"
            value={displayNumber(summary.deferralRequestsTotal)}
            onChange={(event) =>
              onChange(updateAdmissionSummaryField(summary, "deferralRequestsTotal", event.target.value))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Žádosti o odklad dívky</span>
          <input
            className="input"
            value={displayNumber(summary.deferralRequestsGirls)}
            onChange={(event) =>
              onChange(updateAdmissionSummaryField(summary, "deferralRequestsGirls", event.target.value))
            }
          />
        </label>
      </div>
    </section>
  );
}

function GradeCountTable(props: {
  title: string;
  rows: AnnualReportSection04GradeCount[];
  onChange: (rows: AnnualReportSection04GradeCount[]) => void;
}) {
  const { title, rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section04-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section04-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section04-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section04-form__table">
          <thead>
            <tr>
              <th scope="col">Ročník</th>
              <th scope="col">Počet žáků</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="muted-text">
                  Zatím není přidán žádný řádek.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`grade-row-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.grade}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, grade: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.count)}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) =>
                            i === index ? { ...item, count: parseOptionalNumber(event.target.value) } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    >
                      Odebrat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn ghost"
        onClick={() => onChange([...rows, createDefaultSection04GradeCountRow()])}
      >
        Přidat řádek
      </button>
    </section>
  );
}

function PupilCountTable(props: {
  title: string;
  rows: AnnualReportSection04PupilCountRow[];
  onChange: (rows: AnnualReportSection04PupilCountRow[]) => void;
}) {
  const { title, rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section04-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section04-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section04-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section04-form__table">
          <thead>
            <tr>
              <th scope="col">Třída</th>
              <th scope="col">Chlapci</th>
              <th scope="col">Děvčata</th>
              <th scope="col">Celkem</th>
              <th scope="col">Třídní učitel</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted-text">
                  Zatím není přidána žádná třída.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`class-row-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.className}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, className: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.boys)}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) => (i === index ? { ...item, boys: parseOptionalNumber(event.target.value) } : item)),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.girls)}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) =>
                            i === index ? { ...item, girls: parseOptionalNumber(event.target.value) } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.total)}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) =>
                            i === index ? { ...item, total: parseOptionalNumber(event.target.value) } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.classTeacher ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) =>
                            i === index ? { ...item, classTeacher: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    >
                      Odebrat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function VyrocniZpravaSection04DataForm({
  section04Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection04DataFormProps) {
  const [draft, setDraft] = useState(section04Data);

  useEffect(() => {
    setDraft(ensureSecondaryRows(section04Data));
  }, [section04Data, savedAt]);

  const totals = useMemo(
    () => ({
      september: draft.pupilCountsSeptember.reduce((sum, row) => sum + (row.total ?? 0), 0),
      june: draft.pupilCountsJune.reduce((sum, row) => sum + (row.total ?? 0), 0),
    }),
    [draft.pupilCountsJune, draft.pupilCountsSeptember],
  );

  const handleSave = useCallback(() => {
    onSave(ensureSecondaryRows(draft));
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 04 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section04-form"
      role="region"
      aria-labelledby="vyrocni-zprava-section04-form-title"
    >
      <div className="vyrocni-zprava-section04-form__header">
        <div>
          <h3 id="vyrocni-zprava-section04-form-title" className="vyrocni-zprava-detail__block-title">
            Údaje o přijímacím řízení a počtech žáků
          </h3>
          <p className="muted-text vyrocni-zprava-section04-form__lead">
            Vyplňte dostupné údaje pro kapitolu 04. Nevyplněné nepovinné části jsou vedeny jako doporučené, nikoli
            blokující.
          </p>
        </div>
        <div className="vyrocni-zprava-section04-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section04-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section04-form__subsection">
          <h4 className="vyrocni-zprava-section04-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section04-form__subsection">
          <h4 className="vyrocni-zprava-section04-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section04-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section04-form__subsection">
          <h4 className="vyrocni-zprava-section04-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section04-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdmissionSummaryPanel
        title="A) Žáci přijatí do 1. ročníku pro tento školní rok"
        summary={draft.firstGradeAdmissionCurrentYear}
        onChange={(next) => setDraft((prev) => ({ ...prev, firstGradeAdmissionCurrentYear: next }))}
      />

      <GradeCountTable
        title="B) Žáci přijatí v průběhu školního roku"
        rows={draft.pupilsAdmittedDuringYear}
        onChange={(rows) => setDraft((prev) => ({ ...prev, pupilsAdmittedDuringYear: rows }))}
      />

      <GradeCountTable
        title="C) Žáci v průběhu školního roku odhlášeni"
        rows={draft.pupilsLeftDuringYear}
        onChange={(rows) => setDraft((prev) => ({ ...prev, pupilsLeftDuringYear: rows }))}
      />

      <AdmissionSummaryPanel
        title="D) Zápis pro následující školní rok"
        summary={draft.firstGradeEnrollmentNextYear}
        onChange={(next) => setDraft((prev) => ({ ...prev, firstGradeEnrollmentNextYear: next }))}
      />

      <section className="vyrocni-zprava-section04-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section04-form__panel-title">E) Zvláštní zápis</h4>
        <div className="vyrocni-zprava-section04-form__grid">
          <label className="vyrocni-zprava-field">
            <span className="vyrocni-zprava-field__label">Počet přijatých dětí do prvních tříd</span>
            <input
              className="input"
              value={displayNumber(draft.specialEnrollment.admittedTotal)}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  specialEnrollment: { ...prev.specialEnrollment, admittedTotal: parseOptionalNumber(event.target.value) },
                }))
              }
            />
          </label>
          <label className="vyrocni-zprava-field">
            <span className="vyrocni-zprava-field__label">Z toho dívek</span>
            <input
              className="input"
              value={displayNumber(draft.specialEnrollment.admittedGirls)}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  specialEnrollment: { ...prev.specialEnrollment, admittedGirls: parseOptionalNumber(event.target.value) },
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="vyrocni-zprava-section04-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section04-form__panel-title">F) Žáci přijati ke vzdělávání do střední školy</h4>
        <div className="vyrocni-zprava-section04-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-section04-form__table">
            <thead>
              <tr>
                <th scope="col">Typ školy</th>
                <th scope="col">Počet žáků</th>
              </tr>
            </thead>
            <tbody>
              {draft.secondarySchoolAdmissions.map((row, index) => (
                <tr key={`secondary-${row.schoolType || index}`}>
                  <th scope="row">{row.schoolType || `Řádek ${index + 1}`}</th>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.count)}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          secondarySchoolAdmissions: prev.secondarySchoolAdmissions.map((item, i) =>
                            i === index ? { ...item, count: parseOptionalNumber(event.target.value) } : item,
                          ),
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PupilCountTable
        title="G) Počty žáků k 1. září"
        rows={draft.pupilCountsSeptember}
        onChange={(rows) => setDraft((prev) => ({ ...prev, pupilCountsSeptember: rows }))}
      />

      <PupilCountTable
        title="H) Počty žáků k 30. červnu"
        rows={draft.pupilCountsJune}
        onChange={(rows) => setDraft((prev) => ({ ...prev, pupilCountsJune: rows }))}
      />

      <p className="muted-text vyrocni-zprava-section04-form__totals">
        Součet celkem (1. září): {totals.september} | Součet celkem (30. června): {totals.june}
      </p>

      <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-section04-notes">
        <span className="vyrocni-zprava-field__label">Poznámky</span>
        <textarea
          id="vyrocni-zprava-section04-notes"
          className="input vyrocni-zprava-detail__textarea"
          rows={3}
          value={draft.notes ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Volitelná poznámka k podkladům sekce 04…"
        />
      </label>

      <div className="vyrocni-zprava-section04-form__actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              pupilCountsSeptember: [...prev.pupilCountsSeptember, createDefaultSection04PupilCountRow()],
              pupilCountsJune: [...prev.pupilCountsJune, createDefaultSection04PupilCountRow()],
            }))
          }
        >
          Přidat třídu
        </button>
        <button type="button" className="btn primary" onClick={handleSave}>
          Uložit údaje
        </button>
        <button type="button" className="btn ghost" onClick={handleReset}>
          Vymazat údaje
        </button>
      </div>
    </div>
  );
}
