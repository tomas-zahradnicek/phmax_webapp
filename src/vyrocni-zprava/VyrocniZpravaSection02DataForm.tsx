import React, { useCallback, useEffect, useMemo, useState } from "react";

import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { createDefaultSection02EducationField, detectSection02MissingFields } from "./vyrocni-zprava-section02-data-logic";
import type { Section02Readiness } from "./vyrocni-zprava-section02-data-logic";
import type { AnnualReportSection02Data } from "./vyrocni-zprava-section02-types";

type VyrocniZpravaSection02DataFormProps = {
  section02Data: AnnualReportSection02Data;
  savedAt: string | null;
  readiness: Section02Readiness;
  onSave: (data: AnnualReportSection02Data) => void;
  onReset: () => void;
};

type Section02FieldKey = "code" | "name" | "form" | "level" | "note";

const FIELD_COLUMNS: { key: Section02FieldKey; label: string; placeholder: string }[] = [
  { key: "code", label: "Kód oboru", placeholder: "např. 79-01-C/01" },
  { key: "name", label: "Název oboru / vzdělávacího programu", placeholder: "např. Základní škola" },
  { key: "form", label: "Forma vzdělávání", placeholder: "např. denní" },
  { key: "level", label: "Stupeň vzdělání", placeholder: "např. základní vzdělání" },
  { key: "note", label: "Poznámka", placeholder: "volitelná poznámka" },
];

export function VyrocniZpravaSection02DataForm({
  section02Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection02DataFormProps) {
  const [draft, setDraft] = useState(section02Data);

  useEffect(() => {
    setDraft(section02Data);
  }, [section02Data, savedAt]);

  const missingRequiredFields = useMemo(() => detectSection02MissingFields(draft), [draft]);

  const handleAddEducationField = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      educationFields: [...prev.educationFields, createDefaultSection02EducationField()],
    }));
  }, []);

  const handleRemoveEducationField = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      educationFields: prev.educationFields.filter((_, rowIndex) => rowIndex !== index),
    }));
  }, []);

  const updateEducationField = useCallback((index: number, key: Section02FieldKey, value: string) => {
    setDraft((prev) => ({
      ...prev,
      educationFields: prev.educationFields.map((field, rowIndex) => (rowIndex === index ? { ...field, [key]: value } : field)),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje o oborech vzdělání uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section02-form"
      role="region"
      aria-labelledby="vyrocni-zprava-section02-form-title"
    >
      <div className="vyrocni-zprava-section02-form__header">
        <div>
          <h3 id="vyrocni-zprava-section02-form-title" className="vyrocni-zprava-detail__block-title">
            Údaje o oborech vzdělání
          </h3>
          <p className="muted-text vyrocni-zprava-section02-form__lead">
            Uveďte obory vzdělání podle zápisu ve školském rejstříku. Pokud kód oboru není pro daný typ školy
            relevantní, ponechte jej prázdný a uveďte název vzdělávacího programu.
          </p>
        </div>
        <div className="vyrocni-zprava-section02-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section02-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.availableData.length > 0 ? (
        <div className="vyrocni-zprava-section02-form__subsection">
          <h4 className="vyrocni-zprava-section02-form__subtitle">Dostupné údaje</h4>
          <ul className="vyrocni-zprava-section02-form__list">
            {readiness.availableData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section02-form__subsection">
          <h4 className="vyrocni-zprava-section02-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section02-form__subsection">
          <h4 className="vyrocni-zprava-section02-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section02-form__list muted-text">
            {readiness.recommendedData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {missingRequiredFields.length > 0 ? (
        <p className="vyrocni-zprava-section02-form__missing-note muted-text">
          Chybí {missingRequiredFields.length}{" "}
          {missingRequiredFields.length === 1 ? "povinný údaj" : missingRequiredFields.length < 5 ? "povinné údaje" : "povinných údajů"}.
        </p>
      ) : null}

      <div className="vyrocni-zprava-section02-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section02-form__table">
          <thead>
            <tr>
              {FIELD_COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {draft.educationFields.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted-text">
                  Zatím není přidán žádný obor vzdělání.
                </td>
              </tr>
            ) : (
              draft.educationFields.map((field, index) => (
                <tr key={`row-${index}`}>
                  {FIELD_COLUMNS.map((column) => (
                    <td key={`${column.key}-${index}`}>
                      <input
                        className="input"
                        value={field[column.key] ?? ""}
                        placeholder={column.placeholder}
                        onChange={(event) => updateEducationField(index, column.key, event.target.value)}
                        aria-label={`${column.label} – řádek ${index + 1}`}
                      />
                    </td>
                  ))}
                  <td className="app-data-table__num">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => handleRemoveEducationField(index)}
                      aria-label={`Odstranit řádek ${index + 1}`}
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

      <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-section02-source">
        <span className="vyrocni-zprava-field__label">Zdroj ověření v rejstříku</span>
        <input
          id="vyrocni-zprava-section02-source"
          className="input"
          value={draft.registrySource ?? ""}
          placeholder="Např. veřejný rejstřík MŠMT"
          onChange={(event) => setDraft((prev) => ({ ...prev, registrySource: event.target.value }))}
        />
      </label>

      <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-section02-verified-at">
        <span className="vyrocni-zprava-field__label">Datum ověření</span>
        <input
          id="vyrocni-zprava-section02-verified-at"
          className="input"
          value={draft.registryVerifiedAt ?? ""}
          placeholder="Např. 15. 9. 2025"
          onChange={(event) => setDraft((prev) => ({ ...prev, registryVerifiedAt: event.target.value }))}
        />
      </label>

      <label className="vyrocni-zprava-field" htmlFor="vyrocni-zprava-section02-notes">
        <span className="vyrocni-zprava-field__label">Poznámky</span>
        <textarea
          id="vyrocni-zprava-section02-notes"
          className="input vyrocni-zprava-detail__textarea"
          rows={3}
          value={draft.notes ?? ""}
          placeholder="Volitelné poznámky k podkladům sekce 02…"
          onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </label>

      <div className="vyrocni-zprava-section02-form__actions">
        <button type="button" className="btn ghost" onClick={handleAddEducationField}>
          Přidat obor
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
