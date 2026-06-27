import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import {
  createDefaultSection08NonTeachingStaffDevelopment,
  createDefaultSection08ProfessionalDevelopmentTraining,
  createDefaultSection08QualificationStudy,
  type Section08Readiness,
} from "./vyrocni-zprava-section08-data-logic";
import type {
  AnnualReportSection08Data,
  AnnualReportSection08NonTeachingStaffDevelopment,
  AnnualReportSection08ProfessionalDevelopmentTraining,
  AnnualReportSection08QualificationStudy,
  Section08StudyCompleted,
} from "./vyrocni-zprava-section08-types";

type VyrocniZpravaSection08DataFormProps = {
  section08Data: AnnualReportSection08Data;
  savedAt: string | null;
  readiness: Section08Readiness;
  onSave: (data: AnnualReportSection08Data) => void;
  onReset: () => void;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function displayNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function QualificationStudiesTable(props: {
  title: string;
  rows: AnnualReportSection08QualificationStudy[];
  onChange: (rows: AnnualReportSection08QualificationStudy[]) => void;
  addLabel: string;
  removeLabel: string;
}) {
  const { title, rows, onChange, addLabel, removeLabel } = props;
  return (
    <section className="vyrocni-zprava-section08-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section08-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section08-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section08-form__table">
          <thead>
            <tr>
              <th scope="col">Název studia</th>
              <th scope="col">Skupina účastníků</th>
              <th scope="col">Poskytovatel</th>
              <th scope="col">Období</th>
              <th scope="col">Dokončeno</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted-text">
                  Zatím není přidán žádný záznam.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.participantGroup ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, rowIndex) =>
                            rowIndex === index ? { ...item, participantGroup: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.provider ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, provider: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.period ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, period: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={row.completed ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...item,
                                  completed: (event.target.value || undefined) as Section08StudyCompleted | undefined,
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      <option value="">—</option>
                      <option value="ANO">ANO</option>
                      <option value="NE">NE</option>
                      <option value="PROBIHA">PROBÍHÁ</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      {removeLabel}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection08QualificationStudy()])}>
        {addLabel}
      </button>
    </section>
  );
}

function ProfessionalDevelopmentTable(props: {
  rows: AnnualReportSection08ProfessionalDevelopmentTraining[];
  onChange: (rows: AnnualReportSection08ProfessionalDevelopmentTraining[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section08-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section08-form__panel-title">D) Studium k prohlubování odborné kvalifikace</h4>
      <div className="vyrocni-zprava-section08-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section08-form__table">
          <thead>
            <tr>
              <th scope="col">Název vzdělávání</th>
              <th scope="col">Téma</th>
              <th scope="col">Skupina účastníků</th>
              <th scope="col">Poskytovatel</th>
              <th scope="col">Období</th>
              <th scope="col">Počet hodin</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted-text">
                  Zatím není přidáno žádné vzdělávání.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`professional-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.topic ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, topic: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.participantGroup ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, rowIndex) =>
                            rowIndex === index ? { ...item, participantGroup: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.provider ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, provider: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.period ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, period: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.hours)}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, hours: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat vzdělávání
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
        onClick={() => onChange([...(rows ?? []), createDefaultSection08ProfessionalDevelopmentTraining()])}
      >
        Přidat vzdělávání
      </button>
    </section>
  );
}

function NonTeachingDevelopmentTable(props: {
  rows: AnnualReportSection08NonTeachingStaffDevelopment[];
  onChange: (rows: AnnualReportSection08NonTeachingStaffDevelopment[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section08-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section08-form__panel-title">E) Odborný rozvoj nepedagogických pracovníků</h4>
      <div className="vyrocni-zprava-section08-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section08-form__table">
          <thead>
            <tr>
              <th scope="col">Název vzdělávání / aktivity</th>
              <th scope="col">Skupina pracovníků</th>
              <th scope="col">Poskytovatel</th>
              <th scope="col">Období</th>
              <th scope="col">Počet hodin</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted-text">
                  Zatím není přidána žádná aktivita.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`non-teaching-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.staffGroup ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, staffGroup: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.provider ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, provider: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.period ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, period: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.hours)}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, hours: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat aktivitu
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection08NonTeachingStaffDevelopment()])}>
        Přidat aktivitu
      </button>
    </section>
  );
}

export function VyrocniZpravaSection08DataForm({
  section08Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection08DataFormProps) {
  const [draft, setDraft] = useState(section08Data);

  useEffect(() => {
    setDraft(section08Data);
  }, [section08Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 08 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section08-form" role="region" aria-labelledby="vyrocni-zprava-section08-form-title">
      <div className="vyrocni-zprava-section08-form__header">
        <div>
          <h3 id="vyrocni-zprava-section08-form-title" className="vyrocni-zprava-detail__block-title">
            Další vzdělávání pracovníků
          </h3>
          <p className="muted-text vyrocni-zprava-section08-form__lead">
            Sekce 08 převádí pouze ručně zadané údaje do formálního textu výroční zprávy bez domýšlení aktivit nebo hodnocení.
          </p>
        </div>
        <div className="vyrocni-zprava-section08-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section08-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section08-form__subsection">
          <h4 className="vyrocni-zprava-section08-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section08-form__subsection">
          <h4 className="vyrocni-zprava-section08-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section08-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section08-form__subsection">
          <h4 className="vyrocni-zprava-section08-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section08-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section08-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section08-form__panel-title">A) Přehled dalšího vzdělávání pedagogických pracovníků</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis DVPP ve školním roce</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.dvppOverview.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                dvppOverview: { ...prev.dvppOverview, description: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Priority DVPP</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.dvppOverview.priorities ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                dvppOverview: { ...prev.dvppOverview, priorities: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Vyhodnocení DVPP</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.dvppOverview.evaluation ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                dvppOverview: { ...prev.dvppOverview, evaluation: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <QualificationStudiesTable
        title="B) Studium ke splnění kvalifikačních předpokladů"
        rows={draft.qualificationStudies}
        onChange={(rows) => setDraft((prev) => ({ ...prev, qualificationStudies: rows }))}
        addLabel="Přidat studium"
        removeLabel="Odebrat studium"
      />

      <QualificationStudiesTable
        title="C) Studium ke splnění dalších kvalifikačních předpokladů"
        rows={draft.additionalQualificationStudies}
        onChange={(rows) => setDraft((prev) => ({ ...prev, additionalQualificationStudies: rows }))}
        addLabel="Přidat studium"
        removeLabel="Odebrat studium"
      />

      <ProfessionalDevelopmentTable
        rows={draft.professionalDevelopmentTrainings}
        onChange={(rows) => setDraft((prev) => ({ ...prev, professionalDevelopmentTrainings: rows }))}
      />

      <NonTeachingDevelopmentTable
        rows={draft.nonTeachingStaffDevelopment}
        onChange={(rows) => setDraft((prev) => ({ ...prev, nonTeachingStaffDevelopment: rows }))}
      />

      <section className="vyrocni-zprava-section08-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section08-form__panel-title">F) Samostudium</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis samostudia</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.selfStudy.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                selfStudy: { ...prev.selfStudy, description: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Témata samostudia</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.selfStudy.topics ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                selfStudy: { ...prev.selfStudy, topics: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.selfStudy.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                selfStudy: { ...prev.selfStudy, note: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section08-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section08-form__panel-title">G) Souhrnné vyhodnocení</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Souhrnné vyhodnocení kapitoly</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={4}
            value={draft.summaryEvaluation ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, summaryEvaluation: event.target.value }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámky</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.notes ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </label>
      </section>

      <div className="vyrocni-zprava-section08-form__actions">
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
