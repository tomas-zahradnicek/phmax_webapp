import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { formatNumberInputValue, parseCzechNumberInput } from "./vyrocni-zprava-number-input-helpers";
import {
  createDefaultSection07PreventionProgramme,
  createDefaultSection07RiskBehaviourIncident,
  type Section07Readiness,
} from "./vyrocni-zprava-section07-data-logic";
import type {
  AnnualReportSection07Data,
  AnnualReportSection07PreventionProgramme,
  AnnualReportSection07RiskBehaviourIncident,
} from "./vyrocni-zprava-section07-types";

type VyrocniZpravaSection07DataFormProps = {
  section07Data: AnnualReportSection07Data;
  savedAt: string | null;
  readiness: Section07Readiness;
  onSave: (data: AnnualReportSection07Data) => void;
  onReset: () => void;
};

function parseOptionalNumber(value: string): number | undefined {
  return parseCzechNumberInput(value);
}

function displayNumber(value: number | undefined): string {
  return formatNumberInputValue(value);
}

function PreventionProgrammesTable(props: {
  rows: AnnualReportSection07PreventionProgramme[];
  onChange: (rows: AnnualReportSection07PreventionProgramme[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section07-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section07-form__panel-title">Preventivní aktivity</h4>
      <div className="vyrocni-zprava-section07-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section07-form__table">
          <thead>
            <tr>
              <th scope="col">Název programu / aktivity</th>
              <th scope="col">Cílová skupina</th>
              <th scope="col">Popis</th>
              <th scope="col">Datum nebo období</th>
              <th scope="col">Poskytovatel</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted-text">
                  Zatím není přidána žádná aktivita.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`programme-${index}`}>
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
                      value={row.targetGroup ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, targetGroup: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.description ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, description: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.dateOrPeriod ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, dateOrPeriod: event.target.value } : item)))
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
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>
                      Odebrat aktivitu
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
        onClick={() => onChange([...(rows ?? []), createDefaultSection07PreventionProgramme()])}
      >
        Přidat preventivní aktivitu
      </button>
    </section>
  );
}

function RiskIncidentsTable(props: {
  rows: AnnualReportSection07RiskBehaviourIncident[];
  onChange: (rows: AnnualReportSection07RiskBehaviourIncident[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section07-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section07-form__panel-title">Výskyty rizikového chování</h4>
      <div className="vyrocni-zprava-section07-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section07-form__table">
          <thead>
            <tr>
              <th scope="col">Typ rizikového chování</th>
              <th scope="col">Počet řešených případů</th>
              <th scope="col">Přijatá opatření</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted-text">
                  Zatím není přidán žádný výskyt.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`risk-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.type}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, type: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.count)}
                      onChange={(event) =>
                        onChange(rows.map((item, rowIndex) => (rowIndex === index ? { ...item, count: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.adoptedMeasures ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, rowIndex) =>
                            rowIndex === index ? { ...item, adoptedMeasures: event.target.value } : item,
                          ),
                        )
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
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>
                      Odebrat výskyt
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
        onClick={() => onChange([...(rows ?? []), createDefaultSection07RiskBehaviourIncident()])}
      >
        Přidat výskyt
      </button>
    </section>
  );
}

function NumericField(props: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="vyrocni-zprava-field">
      <span className="vyrocni-zprava-field__label">{props.label}</span>
      <input className="input" value={displayNumber(props.value)} onChange={(event) => props.onChange(parseOptionalNumber(event.target.value))} />
    </label>
  );
}

export function VyrocniZpravaSection07DataForm({
  section07Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection07DataFormProps) {
  const [draft, setDraft] = useState(section07Data);

  useEffect(() => {
    setDraft(section07Data);
  }, [section07Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 07 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section07-form" role="region" aria-labelledby="vyrocni-zprava-section07-form-title">
      <div className="vyrocni-zprava-section07-form__header">
        <div>
          <h3 id="vyrocni-zprava-section07-form-title" className="vyrocni-zprava-detail__block-title">
            Prevence, rizikové chování a podpora žáků
          </h3>
          <p className="muted-text vyrocni-zprava-section07-form__lead">
            Sekce 07 převádí pouze zadané agregované údaje do formálního textu výroční zprávy bez domýšlení výsledků.
          </p>
        </div>
        <div className="vyrocni-zprava-section07-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section07-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section07-form__subsection">
          <h4 className="vyrocni-zprava-section07-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section07-form__subsection">
          <h4 className="vyrocni-zprava-section07-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section07-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section07-form__subsection">
          <h4 className="vyrocni-zprava-section07-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section07-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section07-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section07-form__panel-title">A) Prevence rizikového chování</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis preventivní strategie školy</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.prevention.preventionStrategyDescription ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                prevention: { ...prev.prevention, preventionStrategyDescription: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Preventivní tým / odpovědné osoby</span>
          <input
            className="input"
            value={draft.prevention.preventionTeam ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, prevention: { ...prev.prevention, preventionTeam: event.target.value } }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Spolupráce s institucemi</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.prevention.cooperation ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, prevention: { ...prev.prevention, cooperation: event.target.value } }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Vyhodnocení prevence</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.prevention.evaluation ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, prevention: { ...prev.prevention, evaluation: event.target.value } }))}
          />
        </label>
      </section>

      <PreventionProgrammesTable
        rows={draft.prevention.preventionProgrammes ?? []}
        onChange={(rows) => setDraft((prev) => ({ ...prev, prevention: { ...prev.prevention, preventionProgrammes: rows } }))}
      />

      <RiskIncidentsTable
        rows={draft.riskBehaviourIncidents}
        onChange={(rows) => setDraft((prev) => ({ ...prev, riskBehaviourIncidents: rows }))}
      />

      <section className="vyrocni-zprava-section07-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section07-form__panel-title">
          C) Žáci se speciálními vzdělávacími potřebami, nadaní a mimořádně nadaní
        </h4>
        <div className="vyrocni-zprava-section07-form__grid">
          <NumericField
            label="Počet žáků se SVP celkem"
            value={draft.pupilsWithSupportNeeds.pupilsWithSvpTotal}
            onChange={(value) => setDraft((prev) => ({ ...prev, pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsWithSvpTotal: value } }))}
          />
          <NumericField
            label="Počet žáků s podpůrnými opatřeními"
            value={draft.pupilsWithSupportNeeds.pupilsWithSupportMeasures}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsWithSupportMeasures: value } }))
            }
          />
          <NumericField
            label="Počet žáků s IVP"
            value={draft.pupilsWithSupportNeeds.pupilsWithIndividualEducationPlan}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsWithIndividualEducationPlan: value },
              }))
            }
          />
          <NumericField
            label="Počet žáků s pedagogickou intervencí"
            value={draft.pupilsWithSupportNeeds.pupilsWithPedagogicalIntervention}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsWithPedagogicalIntervention: value },
              }))
            }
          />
          <NumericField
            label="Počet žáků s podporou asistenta pedagoga"
            value={draft.pupilsWithSupportNeeds.pupilsWithTeachingAssistantSupport}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsWithTeachingAssistantSupport: value },
              }))
            }
          />
          <NumericField
            label="Počet nadaných žáků"
            value={draft.pupilsWithSupportNeeds.pupilsGifted}
            onChange={(value) => setDraft((prev) => ({ ...prev, pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsGifted: value } }))}
          />
          <NumericField
            label="Počet mimořádně nadaných žáků"
            value={draft.pupilsWithSupportNeeds.pupilsExceptionallyGifted}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, pupilsExceptionallyGifted: value },
              }))
            }
          />
        </div>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.pupilsWithSupportNeeds.note ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, pupilsWithSupportNeeds: { ...prev.pupilsWithSupportNeeds, note: event.target.value } }))}
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section07-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section07-form__panel-title">D) Podmínky pro vzdělávání a zajištění podpory</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis práce školního poradenského pracoviště</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.counsellingWorkplaceDescription ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, counsellingWorkplaceDescription: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Spolupráce s PPP/SPC</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.cooperationWithPppSpc ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, cooperationWithPppSpc: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis podpůrných opatření</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.supportConditions.supportMeasuresDescription ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, supportMeasuresDescription: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Inkluzivní opatření</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.inclusionMeasures ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, supportConditions: { ...prev.supportConditions, inclusionMeasures: event.target.value } }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Podpora nadaných a mimořádně nadaných žáků</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.giftedSupportDescription ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, giftedSupportDescription: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Podpora asistenty pedagoga</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.teachingAssistantSupportDescription ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, teachingAssistantSupportDescription: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Materiální a organizační podmínky</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.materialAndOrganizationalConditions ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supportConditions: { ...prev.supportConditions, materialAndOrganizationalConditions: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Vyhodnocení podpory</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supportConditions.evaluation ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, supportConditions: { ...prev.supportConditions, evaluation: event.target.value } }))
            }
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section07-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section07-form__panel-title">E) Jazyková příprava</h4>
        <div className="vyrocni-zprava-section07-form__grid">
          <NumericField
            label="Počet žáků s nárokem na jazykovou přípravu"
            value={draft.languagePreparation.pupilsWithLanguagePreparationEntitlement}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                languagePreparation: { ...prev.languagePreparation, pupilsWithLanguagePreparationEntitlement: value },
              }))
            }
          />
          <label className="vyrocni-zprava-field">
            <span className="vyrocni-zprava-field__label">Byla jazyková příprava poskytována?</span>
            <select
              className="input"
              value={draft.languagePreparation.languagePreparationProvided ?? "NERELEVANTNI"}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  languagePreparation: {
                    ...prev.languagePreparation,
                    languagePreparationProvided: event.target.value as "ANO" | "NE" | "NERELEVANTNI" | "NEUVEDENO",
                  },
                }))
              }
            >
              <option value="ANO">ANO</option>
              <option value="NE">NE</option>
              <option value="NERELEVANTNI">NERELEVANTNÍ</option>
              <option value="NEUVEDENO">NEUVEDENO</option>
            </select>
          </label>
        </div>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis zajištění jazykové přípravy</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.languagePreparation.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, languagePreparation: { ...prev.languagePreparation, description: event.target.value } }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poskytovatel</span>
          <input
            className="input"
            value={draft.languagePreparation.provider ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, languagePreparation: { ...prev.languagePreparation, provider: event.target.value } }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.languagePreparation.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, languagePreparation: { ...prev.languagePreparation, note: event.target.value } }))
            }
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section07-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section07-form__panel-title">F) Souhrnné vyhodnocení</h4>
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

      <div className="vyrocni-zprava-section07-form__actions">
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
