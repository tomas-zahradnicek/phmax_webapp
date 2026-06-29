import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import type { Section13Readiness } from "./vyrocni-zprava-section13-data-logic";
import type { AnnualReportSection13Data } from "./vyrocni-zprava-section13-types";

type VyrocniZpravaSection13DataFormProps = {
  section13Data: AnnualReportSection13Data;
  savedAt: string | null;
  readiness: Section13Readiness;
  onSave: (data: AnnualReportSection13Data) => void;
  onReset: () => void;
};

const FIELDS: { key: keyof AnnualReportSection13Data; label: string; rows: number; placeholder: string }[] = [
  {
    key: "parentCooperation",
    label: "13.1 Spolupráce se zákonnými zástupci",
    rows: 4,
    placeholder: "Třídní schůzky, konzultace, Bakaláři, školní akce…",
  },
  {
    key: "founderCooperation",
    label: "13.2 Spolupráce se zřizovatelem",
    rows: 4,
    placeholder: "Investice, modernizace, podpora mimoškolních aktivit…",
  },
  {
    key: "partners",
    label: "13.3 Další partneři školy",
    rows: 4,
    placeholder: "PPP, SPC, knihovna, sportovní kluby, střední školy…",
  },
  {
    key: "summaryEvaluation",
    label: "Souhrnné vyhodnocení kapitoly",
    rows: 3,
    placeholder: "Volitelný souhrn spolupráce…",
  },
];

export function VyrocniZpravaSection13DataForm({
  section13Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection13DataFormProps) {
  const [draft, setDraft] = useState(section13Data);

  useEffect(() => {
    setDraft(section13Data);
  }, [section13Data, savedAt]);

  const handleSave = useCallback(() => onSave(draft), [draft, onSave]);
  const handleReset = useCallback(() => {
    if (window.confirm("Opravdu chcete vymazat údaje kapitoly 13 uložené v tomto prohlížeči?")) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section13-form" role="region" aria-labelledby="vyrocni-zprava-section13-form-title">
      <div className="vyrocni-zprava-section13-form__header">
        <div>
          <h3 id="vyrocni-zprava-section13-form-title" className="vyrocni-zprava-detail__block-title">
            Spolupráce s rodiči a partnery
          </h3>
        </div>
        <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
      </div>

      {FIELDS.map((field) => (
        <label key={field.key} className="vyrocni-zprava-field" htmlFor={`vyrocni-zprava-section13-${field.key}`}>
          <span className="vyrocni-zprava-field__label">{field.label}</span>
          <textarea
            id={`vyrocni-zprava-section13-${field.key}`}
            className="input vyrocni-zprava-detail__textarea"
            rows={field.rows}
            value={draft[field.key] ?? ""}
            placeholder={field.placeholder}
            onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
          />
        </label>
      ))}

      <div className="vyrocni-zprava-section13-form__actions">
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
