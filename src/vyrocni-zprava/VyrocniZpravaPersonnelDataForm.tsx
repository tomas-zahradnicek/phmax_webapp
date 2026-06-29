import React, { useCallback, useEffect, useMemo, useState } from "react";

import { IntegerInput } from "../IntegerInput";
import { NumericInput } from "../NumericInput";
import { formatCsNumber } from "../cs-format";
import type { AnnualReportPersonnelData, GenderCountPair, QualificationCountPair } from "./vyrocni-zprava-personnel-types";
import {
  calculateAgeGenderTotals,
  calculateEducationGenderTotals,
  calculatePersonnelStaffTotals,
  calculateQualificationTotals,
  detectMissingPersonnelFields,
  detectPersonnelInconsistencies,
} from "./vyrocni-zprava-personnel-logic";

type VyrocniZpravaPersonnelDataFormProps = {
  personnelData: AnnualReportPersonnelData;
  savedAt: string | null;
  onSave: (data: AnnualReportPersonnelData) => void;
  onReset: () => void;
};

const STAFF_ROWS: {
  label: string;
  personsKey: keyof AnnualReportPersonnelData["staffCounts"];
  fteKey: keyof AnnualReportPersonnelData["staffCounts"];
}[] = [
  { label: "Učitelé", personsKey: "teachersPersons", fteKey: "teachersFte" },
  { label: "Vychovatelé", personsKey: "educatorsPersons", fteKey: "educatorsFte" },
  { label: "Speciální pedagogové", personsKey: "specialPedagoguesPersons", fteKey: "specialPedagoguesFte" },
  { label: "Asistenti pedagoga", personsKey: "teachingAssistantsPersons", fteKey: "teachingAssistantsFte" },
  {
    label: "Správní / nepedagogičtí zaměstnanci",
    personsKey: "nonTeachingStaffPersons",
    fteKey: "nonTeachingStaffFte",
  },
];

const AGE_ROWS: { label: string; key: keyof AnnualReportPersonnelData["ageAndGender"] }[] = [
  { label: "do 35 let", key: "under35" },
  { label: "36–45 let", key: "age36to45" },
  { label: "46–55 let", key: "age46to55" },
  { label: "nad 55 let", key: "over55" },
  { label: "v důchodovém věku", key: "retirementAge" },
];

const EDUCATION_ROWS: { label: string; key: keyof AnnualReportPersonnelData["educationAndGender"] }[] = [
  { label: "nižší než maturita", key: "belowMaturita" },
  { label: "maturita", key: "maturita" },
  { label: "vyšší odborné", key: "higherVocational" },
  { label: "vysokoškolské", key: "university" },
];

const QUALIFICATION_ROWS: { label: string; key: keyof AnnualReportPersonnelData["qualification"] }[] = [
  { label: "učitel prvního stupně základní školy", key: "primaryTeachers" },
  { label: "učitel druhého stupně základní školy", key: "lowerSecondaryTeachers" },
  { label: "vychovatel", key: "educators" },
  { label: "asistent pedagoga", key: "teachingAssistants" },
  { label: "speciální pedagog", key: "specialPedagogues" },
];

function displayCount(value: number | undefined): string {
  return formatCsNumber(value ?? 0);
}

export function VyrocniZpravaPersonnelDataForm({
  personnelData,
  savedAt,
  onSave,
  onReset,
}: VyrocniZpravaPersonnelDataFormProps) {
  const [draft, setDraft] = useState(personnelData);

  useEffect(() => {
    setDraft(personnelData);
  }, [personnelData, savedAt]);

  const staffTotals = useMemo(() => calculatePersonnelStaffTotals(draft), [draft]);
  const ageTotals = useMemo(() => calculateAgeGenderTotals(draft), [draft]);
  const educationTotals = useMemo(() => calculateEducationGenderTotals(draft), [draft]);
  const qualificationTotals = useMemo(() => calculateQualificationTotals(draft), [draft]);
  const missingRequiredFields = useMemo(() => detectMissingPersonnelFields(draft), [draft]);
  const inconsistencies = useMemo(() => detectPersonnelInconsistencies(draft), [draft]);

  const updateStaff = useCallback(
    (key: keyof AnnualReportPersonnelData["staffCounts"], value: number) => {
      setDraft((prev) => ({
        ...prev,
        staffCounts: { ...prev.staffCounts, [key]: value },
      }));
    },
    [],
  );

  const updateAgeGender = useCallback(
    (key: keyof AnnualReportPersonnelData["ageAndGender"], field: keyof GenderCountPair, value: number) => {
      setDraft((prev) => ({
        ...prev,
        ageAndGender: {
          ...prev.ageAndGender,
          [key]: { ...prev.ageAndGender[key], [field]: value },
        },
      }));
    },
    [],
  );

  const updateEducationGender = useCallback(
    (key: keyof AnnualReportPersonnelData["educationAndGender"], field: keyof GenderCountPair, value: number) => {
      setDraft((prev) => ({
        ...prev,
        educationAndGender: {
          ...prev.educationAndGender,
          [key]: { ...prev.educationAndGender[key], [field]: value },
        },
      }));
    },
    [],
  );

  const updateQualification = useCallback(
    (
      key: keyof AnnualReportPersonnelData["qualification"],
      field: keyof QualificationCountPair,
      value: number,
    ) => {
      setDraft((prev) => ({
        ...prev,
        qualification: {
          ...prev.qualification,
          [key]: { ...prev.qualification[key], [field]: value },
        },
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Opravdu chcete vymazat všechny ručně zadané personální údaje v tomto prohlížeči?",
    );
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-personnel-form"
      role="region"
      aria-labelledby="vyrocni-zprava-personnel-title"
    >
      <div className="vyrocni-zprava-personnel-form__header">
        <div>
          <h3 id="vyrocni-zprava-personnel-title" className="vyrocni-zprava-detail__block-title">
            Ruční personální údaje
          </h3>
          <p className="muted-text vyrocni-zprava-personnel-form__lead">
            Vyplňte údaje požadované pro kapitolu 03. Kalkulační kapacity výše slouží jen jako doplňkové podklady.
          </p>
        </div>
        {savedAt ? <p className="vyrocni-zprava-personnel-form__saved muted-text">Údaje uloženy v tomto prohlížeči: {savedAt}</p> : null}
      </div>

      {inconsistencies.length > 0 ? (
        <ul className="vyrocni-zprava-personnel-form__warnings" role="status">
          {inconsistencies.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {missingRequiredFields.length > 0 ? (
        <p className="vyrocni-zprava-personnel-form__missing-note muted-text">
          Chybí {missingRequiredFields.length}{" "}
          {missingRequiredFields.length === 1 ? "povinný údaj" : missingRequiredFields.length < 5 ? "povinné údaje" : "povinných údajů"}.
          Uložte formulář až po doplnění.
        </p>
      ) : null}

      <section className="vyrocni-zprava-personnel-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-personnel-form__panel-title">A) Základní údaje o pracovnících školy</h4>
        <div className="vyrocni-zprava-personnel-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-personnel-form__table">
            <thead>
              <tr>
                <th scope="col">Kategorie</th>
                <th scope="col">Fyzické osoby</th>
                <th scope="col">Úvazky</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.staffCounts[row.personsKey] ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – fyzické osoby`}
                      onChange={(value) => updateStaff(row.personsKey, value)}
                    />
                  </td>
                  <td className="app-data-table__num">
                    <NumericInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.staffCounts[row.fteKey] ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – úvazky`}
                      onChange={(value) => updateStaff(row.fteKey, value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="vyrocni-zprava-personnel-form__total-row">
                <th scope="row">Celkem</th>
                <td className="app-data-table__num">{displayCount(staffTotals.totalPersons)}</td>
                <td className="app-data-table__num">{displayCount(staffTotals.totalFte)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="vyrocni-zprava-personnel-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-personnel-form__panel-title">
          B) Členění pedagogických zaměstnanců podle věku a pohlaví
        </h4>
        <div className="vyrocni-zprava-personnel-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-personnel-form__table">
            <thead>
              <tr>
                <th scope="col">Věk</th>
                <th scope="col">Muži</th>
                <th scope="col">Ženy</th>
                <th scope="col">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {AGE_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.ageAndGender[row.key].men ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – muži`}
                      onChange={(value) => updateAgeGender(row.key, "men", value)}
                    />
                  </td>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.ageAndGender[row.key].women ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – ženy`}
                      onChange={(value) => updateAgeGender(row.key, "women", value)}
                    />
                  </td>
                  <td className="app-data-table__num">{displayCount(ageTotals.rows[row.key].total)}</td>
                </tr>
              ))}
              <tr className="vyrocni-zprava-personnel-form__total-row">
                <th scope="row">celkem</th>
                <td className="app-data-table__num">{displayCount(ageTotals.totalMen)}</td>
                <td className="app-data-table__num">{displayCount(ageTotals.totalWomen)}</td>
                <td className="app-data-table__num">{displayCount(ageTotals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="vyrocni-zprava-personnel-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-personnel-form__panel-title">
          C) Členění pedagogických zaměstnanců podle vzdělání a pohlaví
        </h4>
        <div className="vyrocni-zprava-personnel-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-personnel-form__table">
            <thead>
              <tr>
                <th scope="col">Vzdělání</th>
                <th scope="col">Muži</th>
                <th scope="col">Ženy</th>
                <th scope="col">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {EDUCATION_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.educationAndGender[row.key].men ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – muži`}
                      onChange={(value) => updateEducationGender(row.key, "men", value)}
                    />
                  </td>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.educationAndGender[row.key].women ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – ženy`}
                      onChange={(value) => updateEducationGender(row.key, "women", value)}
                    />
                  </td>
                  <td className="app-data-table__num">{displayCount(educationTotals.rows[row.key].total)}</td>
                </tr>
              ))}
              <tr className="vyrocni-zprava-personnel-form__total-row">
                <th scope="row">celkem</th>
                <td className="app-data-table__num">{displayCount(educationTotals.totalMen)}</td>
                <td className="app-data-table__num">{displayCount(educationTotals.totalWomen)}</td>
                <td className="app-data-table__num">{displayCount(educationTotals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="vyrocni-zprava-personnel-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-personnel-form__panel-title">
          D) Členění pedagogických pracovníků podle odborné kvalifikace
        </h4>
        <div className="vyrocni-zprava-personnel-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-personnel-form__table">
            <thead>
              <tr>
                <th scope="col">Kategorie</th>
                <th scope="col">Splňuje kvalifikaci</th>
                <th scope="col">Nesplňuje kvalifikaci</th>
                <th scope="col">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {QUALIFICATION_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.qualification[row.key].qualified ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – splňuje kvalifikaci`}
                      onChange={(value) => updateQualification(row.key, "qualified", value)}
                    />
                  </td>
                  <td className="app-data-table__num">
                    <IntegerInput
                      className="input vyrocni-zprava-personnel-form__input"
                      value={draft.qualification[row.key].notQualified ?? 0}
                      emptyWhenZero={false}
                      min={0}
                      aria-label={`${row.label} – nesplňuje kvalifikaci`}
                      onChange={(value) => updateQualification(row.key, "notQualified", value)}
                    />
                  </td>
                  <td className="app-data-table__num">{displayCount(qualificationTotals.rows[row.key].total)}</td>
                </tr>
              ))}
              <tr className="vyrocni-zprava-personnel-form__total-row">
                <th scope="row">celkem</th>
                <td className="app-data-table__num">{displayCount(qualificationTotals.totalQualified)}</td>
                <td className="app-data-table__num">{displayCount(qualificationTotals.totalNotQualified)}</td>
                <td className="app-data-table__num">{displayCount(qualificationTotals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-personnel-notes">
        <span className="vyrocni-zprava-field__label">Interní poznámka k personálním údajům</span>
        <textarea
          id="vyrocni-zprava-personnel-notes"
          className="input vyrocni-zprava-detail__textarea"
          rows={3}
          value={draft.notes ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Volitelná poznámka k personálním podkladům (neovlivňuje vygenerovaný text kapitoly)…"
        />
      </label>

      <div className="vyrocni-zprava-personnel-form__actions">
        <button type="button" className="btn primary" onClick={handleSave}>
          Uložit personální údaje
        </button>
        <button type="button" className="btn ghost" onClick={handleReset}>
          Vymazat personální údaje
        </button>
      </div>
    </div>
  );
}
