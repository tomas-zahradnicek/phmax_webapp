import React, { useCallback, useEffect, useState } from "react";

import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { formatNumberInputValue, parseCzechNumberInput } from "./vyrocni-zprava-number-input-helpers";
import { createSection05DefaultGoals } from "./vyrocni-zprava-section05-default-goals";
import {
  createDefaultSection05GoalEvaluation,
  createDefaultSection05WeeklyHourRow,
  type Section05Readiness,
} from "./vyrocni-zprava-section05-data-logic";
import type {
  AnnualReportSection05Data,
  AnnualReportSection05GoalEvaluation,
  AnnualReportSection05WeeklyHourRow,
  Section05GoalLevel,
} from "./vyrocni-zprava-section05-types";

type VyrocniZpravaSection05DataFormProps = {
  section05Data: AnnualReportSection05Data;
  savedAt: string | null;
  readiness: Section05Readiness;
  onSave: (data: AnnualReportSection05Data) => void;
  onReset: () => void;
};

const GOAL_LEVEL_OPTIONS: { value: Section05GoalLevel; label: string }[] = [
  { value: "VETSINA_HODIN", label: "Objevuje se ve většině hodin a činností" },
  { value: "NEKTERE_HODINY", label: "Objevuje se pouze v některých hodinách a činnostech" },
  { value: "NEOBJEVUJE_SE", label: "V hodinách a činnostech se neobjevuje" },
];

type GradeKey = keyof Pick<
  AnnualReportSection05WeeklyHourRow,
  "grade1" | "grade2" | "grade3" | "grade4" | "grade5" | "grade6" | "grade7" | "grade8" | "grade9"
>;

const GRADE_COLUMNS: { key: GradeKey; label: string }[] = [
  { key: "grade1", label: "1. ročník" },
  { key: "grade2", label: "2. ročník" },
  { key: "grade3", label: "3. ročník" },
  { key: "grade4", label: "4. ročník" },
  { key: "grade5", label: "5. ročník" },
  { key: "grade6", label: "6. ročník" },
  { key: "grade7", label: "7. ročník" },
  { key: "grade8", label: "8. ročník" },
  { key: "grade9", label: "9. ročník" },
];

function parseOptionalNumber(value: string): number | undefined {
  return parseCzechNumberInput(value);
}

function displayNumber(value: number | undefined): string {
  return formatNumberInputValue(value);
}

export function VyrocniZpravaSection05DataForm({
  section05Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection05DataFormProps) {
  const [draft, setDraft] = useState(section05Data);

  useEffect(() => {
    setDraft(section05Data);
  }, [section05Data, savedAt]);

  const updateWeeklyRow = useCallback((index: number, patch: Partial<AnnualReportSection05WeeklyHourRow>) => {
    setDraft((prev) => ({
      ...prev,
      schoolCurriculumPlan: {
        ...prev.schoolCurriculumPlan,
        weeklyHourPlan: (prev.schoolCurriculumPlan.weeklyHourPlan ?? []).map((row, rowIndex) =>
          rowIndex === index ? { ...row, ...patch } : row,
        ),
      },
    }));
  }, []);

  const updateGoalRow = useCallback((index: number, patch: Partial<AnnualReportSection05GoalEvaluation>) => {
    setDraft((prev) => ({
      ...prev,
      goalsEvaluation: prev.goalsEvaluation.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 05 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section05-form"
      role="region"
      aria-labelledby="vyrocni-zprava-section05-form-title"
    >
      <div className="vyrocni-zprava-section05-form__header">
        <div>
          <h3 id="vyrocni-zprava-section05-form-title" className="vyrocni-zprava-detail__block-title">
            Vyhodnocení naplňování cílů ŠVP
          </h3>
          <p className="muted-text vyrocni-zprava-section05-form__lead">
            Aplikace jen strukturuje zadané údaje. Hodnocení školy se vytváří výhradně z vašich vstupů.
          </p>
        </div>
        <div className="vyrocni-zprava-section05-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section05-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section05-form__subsection">
          <h4 className="vyrocni-zprava-section05-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section05-form__subsection">
          <h4 className="vyrocni-zprava-section05-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section05-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section05-form__subsection">
          <h4 className="vyrocni-zprava-section05-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section05-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section05-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section05-form__panel-title">A) Vzdělávací program</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Název školního vzdělávacího programu</span>
          <input
            className="input"
            value={draft.educationProgram.name ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                educationProgram: { ...prev.educationProgram, name: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Zařazené třídy / ročníky</span>
          <input
            className="input"
            value={draft.educationProgram.applicableClasses ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                educationProgram: { ...prev.educationProgram, applicableClasses: event.target.value },
              }))
            }
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.educationProgram.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                educationProgram: { ...prev.educationProgram, note: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section05-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section05-form__panel-title">B) Učební plán školy</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Stručný popis učebního plánu</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.schoolCurriculumPlan.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                schoolCurriculumPlan: { ...prev.schoolCurriculumPlan, description: event.target.value },
              }))
            }
          />
        </label>
        <div className="vyrocni-zprava-section05-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-section05-form__table">
            <thead>
              <tr>
                <th scope="col">Předmět</th>
                {GRADE_COLUMNS.map((col) => (
                  <th key={col.key} scope="col">
                    {col.label}
                  </th>
                ))}
                <th scope="col">Akce</th>
              </tr>
            </thead>
            <tbody>
              {(draft.schoolCurriculumPlan.weeklyHourPlan ?? []).length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted-text">
                    Zatím není přidán žádný předmět.
                  </td>
                </tr>
              ) : (
                (draft.schoolCurriculumPlan.weeklyHourPlan ?? []).map((row, rowIndex) => (
                  <tr key={`weekly-row-${rowIndex}`}>
                    <td>
                      <input
                        className="input"
                        value={row.subject}
                        onChange={(event) => updateWeeklyRow(rowIndex, { subject: event.target.value })}
                      />
                    </td>
                    {GRADE_COLUMNS.map((col) => (
                      <td key={`${col.key}-${rowIndex}`}>
                        <input
                          className="input"
                          value={displayNumber(row[col.key])}
                          onChange={(event) => updateWeeklyRow(rowIndex, { [col.key]: parseOptionalNumber(event.target.value) })}
                        />
                      </td>
                    ))}
                    <td className="app-data-table__num">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            schoolCurriculumPlan: {
                              ...prev.schoolCurriculumPlan,
                              weeklyHourPlan: (prev.schoolCurriculumPlan.weeklyHourPlan ?? []).filter(
                                (_, index) => index !== rowIndex,
                              ),
                            },
                          }))
                        }
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
        <div className="vyrocni-zprava-section05-form__row-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                schoolCurriculumPlan: {
                  ...prev.schoolCurriculumPlan,
                  weeklyHourPlan: [...(prev.schoolCurriculumPlan.weeklyHourPlan ?? []), createDefaultSection05WeeklyHourRow()],
                },
              }))
            }
          >
            Přidat předmět
          </button>
        </div>
      </section>

      <section className="vyrocni-zprava-section05-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section05-form__panel-title">C) Naplňování cílů ŠVP</h4>
        <div className="vyrocni-zprava-section05-form__row-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                goalsEvaluation:
                  prev.goalsEvaluation.length > 0
                    ? prev.goalsEvaluation
                    : createSection05DefaultGoals(),
              }))
            }
          >
            Vložit výchozí cíle
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                goalsEvaluation: [...prev.goalsEvaluation, createDefaultSection05GoalEvaluation()],
              }))
            }
          >
            Přidat cíl
          </button>
        </div>
        <div className="vyrocni-zprava-section05-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-section05-form__table-goals">
            <thead>
              <tr>
                <th scope="col">Cíl</th>
                <th scope="col">Míra naplňování</th>
                <th scope="col">Důkaz / příklad z praxe</th>
                <th scope="col">Poznámka</th>
                <th scope="col">Akce</th>
              </tr>
            </thead>
            <tbody>
              {draft.goalsEvaluation.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted-text">
                    Zatím není přidán žádný cíl.
                  </td>
                </tr>
              ) : (
                draft.goalsEvaluation.map((row, rowIndex) => (
                  <tr key={`goal-row-${rowIndex}`}>
                    <td>
                      <textarea
                        className="input"
                        rows={2}
                        value={row.goal}
                        onChange={(event) => updateGoalRow(rowIndex, { goal: event.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        value={row.level ?? ""}
                        onChange={(event) =>
                          updateGoalRow(rowIndex, { level: (event.target.value || undefined) as Section05GoalLevel | undefined })
                        }
                      >
                        <option value="">Vyberte míru naplňování</option>
                        {GOAL_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        className="input"
                        rows={2}
                        value={row.evidence ?? ""}
                        onChange={(event) => updateGoalRow(rowIndex, { evidence: event.target.value })}
                      />
                    </td>
                    <td>
                      <textarea
                        className="input"
                        rows={2}
                        value={row.note ?? ""}
                        onChange={(event) => updateGoalRow(rowIndex, { note: event.target.value })}
                      />
                    </td>
                    <td className="app-data-table__num">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            goalsEvaluation: prev.goalsEvaluation.filter((_, index) => index !== rowIndex),
                          }))
                        }
                      >
                        Odebrat cíl
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vyrocni-zprava-section05-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section05-form__panel-title">D) Souhrnné vyhodnocení</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Celkové vyhodnocení naplňování ŠVP</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={4}
            value={draft.overallEvaluation ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, overallEvaluation: event.target.value }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Silné stránky</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.strengths ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, strengths: event.target.value }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Oblasti ke zlepšení</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.areasForImprovement ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, areasForImprovement: event.target.value }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Opatření pro další školní rok</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.measuresForNextYear ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, measuresForNextYear: event.target.value }))}
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

      <div className="vyrocni-zprava-section05-form__actions">
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
