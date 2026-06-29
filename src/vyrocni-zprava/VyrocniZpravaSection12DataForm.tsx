import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import { createDefaultSection12ProjectRecord, type Section12Readiness } from "./vyrocni-zprava-section12-data-logic";
import type { AnnualReportSection12Data, AnnualReportSection12ProjectRecord } from "./vyrocni-zprava-section12-types";

type VyrocniZpravaSection12DataFormProps = {
  section12Data: AnnualReportSection12Data;
  savedAt: string | null;
  readiness: Section12Readiness;
  onSave: (data: AnnualReportSection12Data) => void;
  onReset: () => void;
};

export function VyrocniZpravaSection12DataForm({
  section12Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection12DataFormProps) {
  const [draft, setDraft] = useState(section12Data);

  useEffect(() => {
    setDraft(section12Data);
  }, [section12Data, savedAt]);

  const updateProjects = useCallback((projects: AnnualReportSection12ProjectRecord[]) => {
    setDraft((prev) => ({ ...prev, projects }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    if (window.confirm("Opravdu chcete vymazat údaje kapitoly 12 uložené v tomto prohlížeči?")) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section12-form" role="region" aria-labelledby="vyrocni-zprava-section12-form-title">
      <div className="vyrocni-zprava-section12-form__header">
        <div>
          <h3 id="vyrocni-zprava-section12-form-title" className="vyrocni-zprava-detail__block-title">
            Projekty a granty
          </h3>
          <p className="muted-text">Sekce 12 převádí pouze ručně zadané údaje do textu výroční zprávy.</p>
        </div>
        <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
      </div>

      <section className="vyrocni-zprava-section12-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section12-form__panel-title">A) Projekty a granty</h4>
        <div className="vyrocni-zprava-section12-form__table-wrap">
          <table className="app-data-table vyrocni-zprava-section12-form__table">
            <thead>
              <tr>
                <th scope="col">Název</th>
                <th scope="col">Poskytovatel</th>
                <th scope="col">Částka</th>
                <th scope="col">Popis</th>
                <th scope="col">Zaměření</th>
                <th scope="col">Akce</th>
              </tr>
            </thead>
            <tbody>
              {draft.projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted-text">
                    Zatím není přidán žádný projekt.
                  </td>
                </tr>
              ) : (
                draft.projects.map((row, index) => (
                  <tr key={`project-${index}`}>
                    {(["title", "provider", "amount", "description", "focusAreas"] as const).map((field) => (
                      <td key={field}>
                        <input
                          className="input"
                          value={row[field] ?? ""}
                          onChange={(event) =>
                            updateProjects(
                              draft.projects.map((item, i) => (i === index ? { ...item, [field]: event.target.value } : item)),
                            )
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => updateProjects(draft.projects.filter((_, i) => i !== index))}
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
        <button
          type="button"
          className="btn ghost"
          onClick={() => updateProjects([...draft.projects, createDefaultSection12ProjectRecord()])}
        >
          Přidat projekt
        </button>
      </section>

      <label className="vyrocni-zprava-field">
        <span className="vyrocni-zprava-field__label">B) Další programy</span>
        <textarea
          className="input vyrocni-zprava-detail__textarea"
          rows={4}
          value={draft.otherPrograms ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, otherPrograms: event.target.value }))}
          placeholder="Např. Ovoce a zelenina do škol, Mléko do škol…"
        />
      </label>

      <label className="vyrocni-zprava-field">
        <span className="vyrocni-zprava-field__label">C) Souhrnné vyhodnocení kapitoly</span>
        <textarea
          className="input vyrocni-zprava-detail__textarea"
          rows={3}
          value={draft.summaryEvaluation ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, summaryEvaluation: event.target.value }))}
        />
      </label>

      <div className="vyrocni-zprava-section12-form__actions">
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
