import React, { useCallback, useEffect, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import type { Section14Readiness } from "./vyrocni-zprava-section14-data-logic";
import type { AnnualReportSection14Data } from "./vyrocni-zprava-section14-types";

type VyrocniZpravaSection14DataFormProps = {
  section14Data: AnnualReportSection14Data;
  savedAt: string | null;
  readiness: Section14Readiness;
  onSave: (data: AnnualReportSection14Data) => void;
  onReset: () => void;
};

export function VyrocniZpravaSection14DataForm({
  section14Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection14DataFormProps) {
  const [draft, setDraft] = useState(section14Data);

  useEffect(() => {
    setDraft(section14Data);
  }, [section14Data, savedAt]);

  const handleSave = useCallback(() => onSave(draft), [draft, onSave]);
  const handleReset = useCallback(() => {
    if (window.confirm("Opravdu chcete vymazat údaje kapitoly 14 uložené v tomto prohlížeči?")) onReset();
  }, [onReset]);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section14-form" role="region" aria-labelledby="vyrocni-zprava-section14-form-title">
      <div className="vyrocni-zprava-section14-form__header">
        <div>
          <h3 id="vyrocni-zprava-section14-form-title" className="vyrocni-zprava-detail__block-title">
            Závěr výroční zprávy
          </h3>
        </div>
        <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
      </div>

      <label className="vyrocni-zprava-field">
        <span className="vyrocni-zprava-field__label">Celkové zhodnocení školního roku</span>
        <textarea
          className="input vyrocni-zprava-detail__textarea"
          rows={5}
          value={draft.overallEvaluation ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, overallEvaluation: event.target.value }))}
        />
      </label>

      <label className="vyrocni-zprava-field">
        <span className="vyrocni-zprava-field__label">Plány do dalšího období</span>
        <textarea
          className="input vyrocni-zprava-detail__textarea"
          rows={5}
          value={draft.futurePlans ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, futurePlans: event.target.value }))}
          placeholder="Body nebo odstavce o plánech školy…"
        />
      </label>

      <div className="vyrocni-zprava-section14-form__actions">
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
