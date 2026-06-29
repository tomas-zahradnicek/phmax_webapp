import React, { useCallback, useEffect, useState } from "react";

import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { formatNumberInputValue, parseCzechNumberInput } from "./vyrocni-zprava-number-input-helpers";
import {
  createDefaultSection06ClassResultRow,
  type Section06Readiness,
} from "./vyrocni-zprava-section06-data-logic";
import type {
  AnnualReportSection06ClassResultRow,
  AnnualReportSection06Data,
  AnnualReportSection06EducationalMeasuresTerm,
  AnnualReportSection06ExamData,
} from "./vyrocni-zprava-section06-types";

type VyrocniZpravaSection06DataFormProps = {
  section06Data: AnnualReportSection06Data;
  savedAt: string | null;
  readiness: Section06Readiness;
  onSave: (data: AnnualReportSection06Data) => void;
  onReset: () => void;
};

type NumericClassField = Exclude<keyof AnnualReportSection06ClassResultRow, "className" | "classTeacher">;

const CLASS_NUMERIC_FIELDS: { key: NumericClassField; label: string }[] = [
  { key: "pupilsTotal", label: "Počet žáků" },
  { key: "passedWithHonours", label: "Prospěl s vyznamenáním" },
  { key: "passed", label: "Prospěl" },
  { key: "failed", label: "Neprospěl" },
  { key: "notAssessed", label: "Nehodnocen" },
  { key: "reducedConductGrade", label: "Snížená známka z chování" },
  { key: "averageGrade", label: "Průměrný prospěch" },
  { key: "excusedAbsencePerPupil", label: "Omluvená absence na žáka" },
  { key: "unexcusedAbsencePerPupil", label: "Neomluvená absence na žáka" },
];

const MEASURE_FIELDS: { key: keyof AnnualReportSection06EducationalMeasuresTerm; label: string }[] = [
  { key: "classTeacherPraise", label: "Pochvala třídního učitele" },
  { key: "principalPraise", label: "Pochvala ředitele školy" },
  { key: "classTeacherWarning", label: "Napomenutí třídního učitele" },
  { key: "classTeacherReprimand", label: "Důtka třídního učitele" },
  { key: "principalReprimand", label: "Důtka ředitele školy" },
  { key: "secondConductGrade", label: "2. stupeň z chování" },
  { key: "thirdConductGrade", label: "3. stupeň z chování" },
];

function parseOptionalNumber(value: string): number | undefined {
  return parseCzechNumberInput(value);
}

function displayNumber(value: number | undefined): string {
  return formatNumberInputValue(value);
}

function isTransientNumberDraft(value: string): boolean {
  return value === "-" || value === "," || value === "." || value === "-," || value === "-.";
}

function CzechNumberInput(props: {
  value: number | undefined;
  className?: string;
  onValueChange: (value: number | undefined) => void;
}) {
  const { value, className, onValueChange } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const displayValue = draft ?? displayNumber(value);

  return (
    <input
      className={className ?? "input"}
      value={displayValue}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^-?[\d\s\u00A0\u202F]*([,.][\d]*)?$/.test(next) && next !== "") return;

        setDraft(next);

        const trimmed = next.trim();
        if (trimmed === "") {
          onValueChange(undefined);
          return;
        }
        if (isTransientNumberDraft(trimmed)) return;

        const parsed = parseOptionalNumber(next);
        if (parsed !== undefined) {
          onValueChange(parsed);
        }
      }}
      onBlur={() => {
        if (draft === null) return;
        const trimmed = draft.trim();
        if (trimmed === "") {
          onValueChange(undefined);
        } else if (!isTransientNumberDraft(trimmed)) {
          onValueChange(parseOptionalNumber(draft));
        }
        setDraft(null);
      }}
    />
  );
}

function ClassResultsTable(props: {
  title: string;
  rows: AnnualReportSection06ClassResultRow[];
  onChange: (rows: AnnualReportSection06ClassResultRow[]) => void;
}) {
  const { title, rows, onChange } = props;
  const addStageRows = () => {
    const hasFirstStage = rows.some((row) => row.className.trim().toLowerCase() === "1. stupeň");
    const hasSecondStage = rows.some((row) => row.className.trim().toLowerCase() === "2. stupeň");
    const toAdd: AnnualReportSection06ClassResultRow[] = [];
    if (!hasFirstStage) toAdd.push({ ...createDefaultSection06ClassResultRow(), className: "1. stupeň" });
    if (!hasSecondStage) toAdd.push({ ...createDefaultSection06ClassResultRow(), className: "2. stupeň" });
    if (toAdd.length > 0) onChange([...rows, ...toAdd]);
  };

  return (
    <section className="vyrocni-zprava-section06-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section06-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section06-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section06-form__table">
          <thead>
            <tr>
              <th scope="col">Třída</th>
              <th scope="col">Třídní učitel</th>
              {CLASS_NUMERIC_FIELDS.map((field) => (
                <th key={field.key} scope="col">
                  {field.label}
                </th>
              ))}
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={CLASS_NUMERIC_FIELDS.length + 3} className="muted-text">
                  Zatím není přidána žádná třída.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={`class-row-${rowIndex}`}>
                  <td>
                    <input
                      className="input"
                      value={row.className}
                      onChange={(event) =>
                        onChange(rows.map((item, index) => (index === rowIndex ? { ...item, className: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.classTeacher ?? ""}
                      onChange={(event) =>
                        onChange(
                          rows.map((item, index) =>
                            index === rowIndex ? { ...item, classTeacher: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  {CLASS_NUMERIC_FIELDS.map((field) => (
                    <td key={`${field.key}-${rowIndex}`}>
                      <CzechNumberInput
                        className="input"
                        value={row[field.key]}
                        onValueChange={(value) =>
                          onChange(
                            rows.map((item, index) =>
                              index === rowIndex
                                ? { ...item, [field.key]: value }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                  ))}
                  <td className="app-data-table__num">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => onChange(rows.filter((_, index) => index !== rowIndex))}
                    >
                      Odebrat třídu
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
        onClick={() => onChange([...rows, createDefaultSection06ClassResultRow()])}
      >
        Přidat třídu
      </button>
      <button
        type="button"
        className="btn ghost"
        onClick={addStageRows}
      >
        Doplnit řádky 1. a 2. stupeň
      </button>
    </section>
  );
}

function MeasuresGroup(props: {
  title: string;
  value: AnnualReportSection06EducationalMeasuresTerm | undefined;
  onChange: (next: AnnualReportSection06EducationalMeasuresTerm) => void;
}) {
  const { title, value, onChange } = props;
  const current = value ?? {};
  return (
    <div className="vyrocni-zprava-section06-form__measures-group">
      <h5 className="vyrocni-zprava-section06-form__subpanel-title">{title}</h5>
      <div className="vyrocni-zprava-section06-form__measures-grid">
        {MEASURE_FIELDS.map((field) => (
          <label key={field.key} className="vyrocni-zprava-field">
            <span className="vyrocni-zprava-field__label">{field.label}</span>
            <CzechNumberInput
              className="input"
              value={current[field.key]}
              onValueChange={(value) => onChange({ ...current, [field.key]: value })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function ExamPanel(props: {
  title: string;
  value: AnnualReportSection06ExamData | undefined;
  onChange: (next: AnnualReportSection06ExamData) => void;
}) {
  const { title, value, onChange } = props;
  const current = value ?? {};
  return (
    <section className="vyrocni-zprava-section06-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section06-form__panel-title">{title}</h4>
      <div className="vyrocni-zprava-section06-form__grid">
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis</span>
          <input
            className="input"
            value={current.description ?? ""}
            onChange={(event) => onChange({ ...current, description: event.target.value })}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Počet žáků</span>
          <CzechNumberInput
            className="input"
            value={current.pupilsTotal}
            onValueChange={(value) => onChange({ ...current, pupilsTotal: value })}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Uspěli</span>
          <CzechNumberInput
            className="input"
            value={current.passed}
            onValueChange={(value) => onChange({ ...current, passed: value })}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Neuspěli</span>
          <CzechNumberInput
            className="input"
            value={current.failed}
            onValueChange={(value) => onChange({ ...current, failed: value })}
          />
        </label>
      </div>
      <label className="vyrocni-zprava-field">
        <span className="vyrocni-zprava-field__label">Poznámka</span>
        <textarea
          className="input vyrocni-zprava-detail__textarea"
          rows={2}
          value={current.note ?? ""}
          onChange={(event) => onChange({ ...current, note: event.target.value })}
        />
      </label>
    </section>
  );
}

export function VyrocniZpravaSection06DataForm({
  section06Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection06DataFormProps) {
  const [draft, setDraft] = useState(section06Data);

  useEffect(() => {
    setDraft(section06Data);
  }, [section06Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 06 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section06-form"
      role="region"
      aria-labelledby="vyrocni-zprava-section06-form-title"
    >
      <div className="vyrocni-zprava-section06-form__header">
        <div>
          <h3 id="vyrocni-zprava-section06-form-title" className="vyrocni-zprava-detail__block-title">
            Výsledky vzdělávání žáků
          </h3>
          <p className="muted-text vyrocni-zprava-section06-form__lead">
            Sekce 06 převádí pouze vámi zadané údaje do struktury výroční zprávy bez automatického hodnocení.
          </p>
        </div>
        <div className="vyrocni-zprava-section06-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section06-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section06-form__subsection">
          <h4 className="vyrocni-zprava-section06-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section06-form__subsection">
          <h4 className="vyrocni-zprava-section06-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section06-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section06-form__subsection">
          <h4 className="vyrocni-zprava-section06-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section06-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ClassResultsTable
        title="A) Souhrnná statistika tříd – 1. pololetí"
        rows={draft.firstTermClassResults}
        onChange={(rows) => setDraft((prev) => ({ ...prev, firstTermClassResults: rows }))}
      />

      <ClassResultsTable
        title="B) Souhrnná statistika tříd – 2. pololetí"
        rows={draft.secondTermClassResults}
        onChange={(rows) => setDraft((prev) => ({ ...prev, secondTermClassResults: rows }))}
      />

      <section className="vyrocni-zprava-section06-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section06-form__panel-title">C) Výchovná opatření</h4>
        <MeasuresGroup
          title="1. pololetí"
          value={draft.educationalMeasures.firstTerm}
          onChange={(next) =>
            setDraft((prev) => ({ ...prev, educationalMeasures: { ...prev.educationalMeasures, firstTerm: next } }))
          }
        />
        <MeasuresGroup
          title="2. pololetí"
          value={draft.educationalMeasures.secondTerm}
          onChange={(next) =>
            setDraft((prev) => ({ ...prev, educationalMeasures: { ...prev.educationalMeasures, secondTerm: next } }))
          }
        />
      </section>

      <ExamPanel
        title="D1) Závěrečné zkoušky"
        value={draft.finalExams}
        onChange={(next) => setDraft((prev) => ({ ...prev, finalExams: next }))}
      />
      <ExamPanel
        title="D2) Maturitní zkoušky"
        value={draft.maturitaExams}
        onChange={(next) => setDraft((prev) => ({ ...prev, maturitaExams: next }))}
      />
      <ExamPanel
        title="D3) Absolutorium"
        value={draft.absolutorium}
        onChange={(next) => setDraft((prev) => ({ ...prev, absolutorium: next }))}
      />

      <section className="vyrocni-zprava-section06-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section06-form__panel-title">E) Souhrnné vyhodnocení výsledků vzdělávání</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Souhrnné vyhodnocení</span>
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

      <div className="vyrocni-zprava-section06-form__actions">
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
