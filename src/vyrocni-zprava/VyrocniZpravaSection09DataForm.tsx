import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import {
  createDefaultSection09Competition,
  createDefaultSection09ProjectOrCooperation,
  createDefaultSection09SchoolEvent,
  type Section09Readiness,
} from "./vyrocni-zprava-section09-data-logic";
import type {
  AnnualReportSection09Competition,
  AnnualReportSection09Data,
  AnnualReportSection09ProjectOrCooperation,
  AnnualReportSection09SchoolEvent,
  Section09PublicEventFlag,
} from "./vyrocni-zprava-section09-types";

type VyrocniZpravaSection09DataFormProps = {
  section09Data: AnnualReportSection09Data;
  savedAt: string | null;
  readiness: Section09Readiness;
  onSave: (data: AnnualReportSection09Data) => void;
  onReset: () => void;
};

function EventsTable(props: { rows: AnnualReportSection09SchoolEvent[]; onChange: (rows: AnnualReportSection09SchoolEvent[]) => void }) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section09-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section09-form__panel-title">B) Akce školy</h4>
      <div className="vyrocni-zprava-section09-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section09-form__table">
          <thead>
            <tr>
              <th scope="col">Datum / období</th>
              <th scope="col">Název akce</th>
              <th scope="col">Typ akce</th>
              <th scope="col">Určeno pro</th>
              <th scope="col">Popis</th>
              <th scope="col">Místo</th>
              <th scope="col">Partner</th>
              <th scope="col">Veřejná akce</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted-text">
                  Zatím není přidána žádná akce.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`event-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.dateOrPeriod ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, dateOrPeriod: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.eventType ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, eventType: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.targetGroup ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, targetGroup: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.description ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.location ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, location: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.partner ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, partner: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={row.publicEvent ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, i) =>
                            i === index
                              ? { ...item, publicEvent: (event.target.value || undefined) as Section09PublicEventFlag | undefined }
                              : item,
                          ),
                        )
                      }
                    >
                      <option value="">—</option>
                      <option value="ANO">ANO</option>
                      <option value="NE">NE</option>
                      <option value="CASTECNE">ČÁSTEČNĚ</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat akci
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection09SchoolEvent()])}>
        Přidat akci
      </button>
    </section>
  );
}

function CompetitionsTable(props: { rows: AnnualReportSection09Competition[]; onChange: (rows: AnnualReportSection09Competition[]) => void }) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section09-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section09-form__panel-title">C) Účast žáků na soutěžích</h4>
      <div className="vyrocni-zprava-section09-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section09-form__table">
          <thead>
            <tr>
              <th scope="col">Datum / období</th>
              <th scope="col">Název soutěže</th>
              <th scope="col">Oblast / předmět</th>
              <th scope="col">Účastníci</th>
              <th scope="col">Výsledek / umístění</th>
              <th scope="col">Úroveň soutěže</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted-text">
                  Zatím není přidána žádná soutěž.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`competition-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.dateOrPeriod ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, dateOrPeriod: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.subjectOrArea ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, subjectOrArea: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.participants ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, participants: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.result ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, result: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.level ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, level: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat soutěž
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection09Competition()])}>
        Přidat soutěž
      </button>
    </section>
  );
}

function ProjectsTable(props: {
  rows: AnnualReportSection09ProjectOrCooperation[];
  onChange: (rows: AnnualReportSection09ProjectOrCooperation[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section09-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section09-form__panel-title">D) Projekty a spolupráce</h4>
      <div className="vyrocni-zprava-section09-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section09-form__table">
          <thead>
            <tr>
              <th scope="col">Název projektu / spolupráce</th>
              <th scope="col">Typ</th>
              <th scope="col">Partner</th>
              <th scope="col">Období</th>
              <th scope="col">Popis</th>
              <th scope="col">Výstup</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted-text">
                  Zatím není přidán žádný projekt/spolupráce.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`project-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.type ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, type: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.partner ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, partner: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.period ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, period: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.description ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.output ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, output: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat projekt/spolupráci
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
        onClick={() => onChange([...(rows ?? []), createDefaultSection09ProjectOrCooperation()])}
      >
        Přidat projekt/spolupráci
      </button>
    </section>
  );
}

export function VyrocniZpravaSection09DataForm({
  section09Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection09DataFormProps) {
  const [draft, setDraft] = useState(section09Data);

  useEffect(() => {
    setDraft(section09Data);
  }, [section09Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 09 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section09-form" role="region" aria-labelledby="vyrocni-zprava-section09-form-title">
      <div className="vyrocni-zprava-section09-form__header">
        <div>
          <h3 id="vyrocni-zprava-section09-form-title" className="vyrocni-zprava-detail__block-title">
            Aktivity a prezentace školy na veřejnosti
          </h3>
          <p className="muted-text vyrocni-zprava-section09-form__lead">
            Sekce 09 převádí pouze ručně zadané údaje do formálního textu výroční zprávy bez domýšlení akcí, soutěží nebo úspěchů.
          </p>
        </div>
        <div className="vyrocni-zprava-section09-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section09-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section09-form__subsection">
          <h4 className="vyrocni-zprava-section09-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section09-form__subsection">
          <h4 className="vyrocni-zprava-section09-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section09-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section09-form__subsection">
          <h4 className="vyrocni-zprava-section09-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section09-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section09-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section09-form__panel-title">A) Prezentace školy na veřejnosti</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis prezentace školy</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.publicPresentation.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, description: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Web školy</span>
          <input
            className="input"
            value={draft.publicPresentation.website ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, website: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Sociální sítě / online komunikace</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.publicPresentation.socialMedia ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, socialMedia: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Mediální výstupy</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.publicPresentation.mediaOutputs ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, mediaOutputs: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Spolupráce s obcí, zřizovatelem a veřejností</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.publicPresentation.cooperationWithCommunity ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, cooperationWithCommunity: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.publicPresentation.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                publicPresentation: { ...prev.publicPresentation, note: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <EventsTable rows={draft.schoolEvents} onChange={(rows) => setDraft((prev) => ({ ...prev, schoolEvents: rows }))} />
      <CompetitionsTable rows={draft.competitions} onChange={(rows) => setDraft((prev) => ({ ...prev, competitions: rows }))} />
      <ProjectsTable
        rows={draft.projectsAndCooperation}
        onChange={(rows) => setDraft((prev) => ({ ...prev, projectsAndCooperation: rows }))}
      />

      <section className="vyrocni-zprava-section09-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section09-form__panel-title">E) Mimořádné výsledky a úspěchy žáků</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Mimořádné výsledky a úspěchy žáků</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.extraordinaryAchievements ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, extraordinaryAchievements: event.target.value }))}
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section09-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section09-form__panel-title">F) Souhrnné vyhodnocení</h4>
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

      <div className="vyrocni-zprava-section09-form__actions">
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
