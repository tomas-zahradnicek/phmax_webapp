import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import {
  createDefaultSection10InspectionRecord,
  type Section10Readiness,
} from "./vyrocni-zprava-section10-data-logic";
import type {
  AnnualReportSection10Data,
  AnnualReportSection10InspectionRecord,
  Section10InspectionActivityStatus,
} from "./vyrocni-zprava-section10-types";

type VyrocniZpravaSection10DataFormProps = {
  section10Data: AnnualReportSection10Data;
  savedAt: string | null;
  readiness: Section10Readiness;
  onSave: (data: AnnualReportSection10Data) => void;
  onReset: () => void;
};

function InspectionsTable(props: {
  rows: AnnualReportSection10InspectionRecord[];
  onChange: (rows: AnnualReportSection10InspectionRecord[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section10-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section10-form__panel-title">B) Záznamy o inspekční činnosti</h4>
      <p className="muted-text vyrocni-zprava-section10-form__panel-hint">
        Tato tabulka je relevantní zejména v případě, že ve školním roce inspekční činnost proběhla.
      </p>
      <div className="vyrocni-zprava-section10-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section10-form__table">
          <thead>
            <tr>
              <th scope="col">Datum / období</th>
              <th scope="col">Typ inspekční činnosti</th>
              <th scope="col">Předmět inspekční činnosti</th>
              <th scope="col">Číslo jednací / označení zprávy</th>
              <th scope="col">Odkaz na zprávu</th>
              <th scope="col">Hlavní zjištění</th>
              <th scope="col">Závěry</th>
              <th scope="col">Přijatá opatření</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted-text">
                  Zatím není přidán žádný záznam.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`inspection-${index}`}>
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
                      value={row.inspectionType ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, inspectionType: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.subject ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, subject: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.reportReference ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, reportReference: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.reportUrl ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, reportUrl: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.mainFindings ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, mainFindings: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.conclusions ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, conclusions: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.adoptedMeasures ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, adoptedMeasures: event.target.value } : item)))
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
                      Odebrat záznam
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection10InspectionRecord()])}>
        Přidat inspekční činnost
      </button>
    </section>
  );
}

export function VyrocniZpravaSection10DataForm({
  section10Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection10DataFormProps) {
  const [draft, setDraft] = useState(section10Data);

  useEffect(() => {
    setDraft(section10Data);
  }, [section10Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 10 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  const inspectionStatus = draft.inspectionActivityStatus ?? "NEUVEDENO";

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section10-form" role="region" aria-labelledby="vyrocni-zprava-section10-form-title">
      <div className="vyrocni-zprava-section10-form__header">
        <div>
          <h3 id="vyrocni-zprava-section10-form-title" className="vyrocni-zprava-detail__block-title">
            Výsledky inspekční činnosti ČŠI
          </h3>
          <p className="muted-text vyrocni-zprava-section10-form__lead">
            Sekce 10 převádí pouze ručně zadané údaje o inspekční činnosti České školní inspekce bez domýšlení závěrů nebo opatření.
          </p>
        </div>
        <div className="vyrocni-zprava-section10-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section10-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section10-form__subsection">
          <h4 className="vyrocni-zprava-section10-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section10-form__subsection">
          <h4 className="vyrocni-zprava-section10-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section10-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section10-form__subsection">
          <h4 className="vyrocni-zprava-section10-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section10-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section10-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section10-form__panel-title">A) Inspekční činnost ČŠI ve školním roce</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Proběhla ve školním roce inspekční činnost ČŠI?</span>
          <select
            className="input"
            value={inspectionStatus}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                inspectionActivityStatus: event.target.value as Section10InspectionActivityStatus,
              }))
            }
          >
            <option value="PROBEHLA">Proběhla</option>
            <option value="NEPROBEHLA">Neproběhla</option>
            <option value="NEUVEDENO">Neuvedeno</option>
          </select>
        </label>

        {inspectionStatus === "NEPROBEHLA" ? (
          <>
            <label className="vyrocni-zprava-field">
              <span className="vyrocni-zprava-field__label">Text k uvedení ve výroční zprávě</span>
              <textarea
                className="input vyrocni-zprava-detail__textarea"
                rows={3}
                value={draft.noInspectionStatement ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, noInspectionStatement: event.target.value }))}
              />
            </label>
            <label className="vyrocni-zprava-field">
              <span className="vyrocni-zprava-field__label">Souhrnné vyhodnocení / poznámka</span>
              <textarea
                className="input vyrocni-zprava-detail__textarea"
                rows={3}
                value={draft.summaryEvaluation ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, summaryEvaluation: event.target.value }))}
              />
            </label>
          </>
        ) : null}
      </section>

      <InspectionsTable rows={draft.inspections} onChange={(rows) => setDraft((prev) => ({ ...prev, inspections: rows }))} />

      <section className="vyrocni-zprava-section10-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section10-form__panel-title">C) Souhrnné vyhodnocení</h4>
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

      <div className="vyrocni-zprava-section10-form__actions">
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
