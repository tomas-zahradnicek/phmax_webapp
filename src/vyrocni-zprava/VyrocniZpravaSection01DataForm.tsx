import React, { useCallback, useEffect, useState } from "react";

import type { VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";

type VyrocniZpravaSection01DataFormProps = {
  section01Data: VyrocniZpravaSection01Data;
  savedAt: string | null;
  onSave: (data: VyrocniZpravaSection01Data) => void;
  onReset: () => void;
};

const FIELDS: { key: keyof VyrocniZpravaSection01Data; label: string; rows: number; placeholder: string }[] = [
  {
    key: "schoolCharacteristic",
    label: "Charakteristika školy",
    rows: 4,
    placeholder: "Stručný popis zaměření, organizace a specifik školy…",
  },
  {
    key: "schoolParts",
    label: "Součásti školy",
    rows: 3,
    placeholder: "Např. mateřská škola, školní družina, jídelna…",
  },
  {
    key: "schoolCapacity",
    label: "Kapacita školy / součástí školy",
    rows: 2,
    placeholder: "Kapacita školy nebo jednotlivých součástí…",
  },
  {
    key: "schoolCouncilInfo",
    label: "Údaje o školské radě",
    rows: 4,
    placeholder: "Složení školské rady a způsob jednání…",
  },
  {
    key: "leadershipInfo",
    label: "Doplňující údaje o vedení školy",
    rows: 3,
    placeholder: "Zástupci ředitele nebo další údaje o vedení…",
  },
  {
    key: "remoteAccessInfo",
    label: "Upřesnění adresy pro dálkový přístup",
    rows: 2,
    placeholder: "Doplňující informace k webové adrese nebo vzdálenému přístupu…",
  },
];

export function VyrocniZpravaSection01DataForm({
  section01Data,
  savedAt,
  onSave,
  onReset,
}: VyrocniZpravaSection01DataFormProps) {
  const [draft, setDraft] = useState(section01Data);

  useEffect(() => {
    setDraft(section01Data);
  }, [section01Data, savedAt]);

  const updateField = useCallback((key: keyof VyrocniZpravaSection01Data, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Opravdu chcete vymazat doplňující údaje kapitoly 01 uložené v tomto prohlížeči?",
    );
    if (confirmed) onReset();
  }, [onReset]);

  return (
    <div
      className="vyrocni-zprava-detail__block vyrocni-zprava-section01-form"
      role="region"
      aria-labelledby="vyrocni-zprava-section01-form-title"
    >
      <div className="vyrocni-zprava-section01-form__header">
        <div>
          <h3 id="vyrocni-zprava-section01-form-title" className="vyrocni-zprava-detail__block-title">
            Doplňující údaje kapitoly 01
          </h3>
          <p className="muted-text vyrocni-zprava-section01-form__lead">
            Tyto texty doplňují profil školy pro podkapitoly 1.3 až 1.7. Nejsou povinné pro základní generování,
            doporučují se pro úplnější návrh.
          </p>
        </div>
        {savedAt ? (
          <p className="vyrocni-zprava-section01-form__saved muted-text">Údaje uloženy v tomto prohlížeči: {savedAt}</p>
        ) : null}
      </div>

      {FIELDS.map((field) => (
        <label key={field.key} className="vyrocni-zprava-field" htmlFor={`vyrocni-zprava-section01-${field.key}`}>
          <span className="vyrocni-zprava-field__label">{field.label}</span>
          <textarea
            id={`vyrocni-zprava-section01-${field.key}`}
            className="input vyrocni-zprava-detail__textarea"
            rows={field.rows}
            value={draft[field.key] ?? ""}
            placeholder={field.placeholder}
            onChange={(event) => updateField(field.key, event.target.value)}
          />
        </label>
      ))}

      <div className="vyrocni-zprava-section01-form__actions">
        <button type="button" className="btn primary" onClick={handleSave}>
          Uložit doplňující údaje
        </button>
        <button type="button" className="btn ghost" onClick={handleReset}>
          Vymazat doplňující údaje
        </button>
      </div>
    </div>
  );
}
