import React from "react";
import { IntegerInput } from "../IntegerInput";
import { ResultCard } from "../phmax-zs-ui";
import type { Pha1rClassRow, Pha1rSchoolFlags } from "./zs-pha1r";
import {
  buildPha1rResultPresentation,
  buildPha1rRowViews,
  PHA1R_DEDUCTION_NOTE,
  PHA1R_ROWS_TITLE,
  PHA1R_SCHOOL_FLAGS,
  PHA1R_SECTION_LEAD,
  pha1rGrade1Label,
  pha1rPar38Label,
  pha1rPar41Label,
  pha1rRemoveAriaLabel,
  pha1rSec16Label,
} from "./zs-pha1r-ui";
import { ZS_PHA1R_PUBLIC_EXPLANATION } from "./zs-pha1r-publication";

export type ZsPha1rSectionProps = {
  classes: Pha1rClassRow[];
  flags: Pha1rSchoolFlags;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onGrade1Change: (id: number, value: number) => void;
  onPar38Change: (id: number, value: number) => void;
  onPar41Change: (id: number, value: number) => void;
  onSec16Change: (id: number, value: boolean) => void;
  onFlagChange: (key: keyof Pha1rSchoolFlags, value: boolean) => void;
  onReset: () => void;
  illustrativeNote?: string;
};

export function ZsPha1rSection({
  classes,
  flags,
  onAdd,
  onRemove,
  onGrade1Change,
  onPar38Change,
  onPar41Change,
  onSec16Change,
  onFlagChange,
  onReset,
  illustrativeNote,
}: ZsPha1rSectionProps) {
  const result = buildPha1rResultPresentation({ classes, flags });
  const rows = buildPha1rRowViews({ classes, flags });

  return (
    <section className="card section-card section-card--pha1r" data-section="pha1r">
      <h2>PHA1Rmax – asistent pedagoga v 1. ročníku</h2>
      {illustrativeNote ? <p className="muted-text">{illustrativeNote}</p> : null}
      <p className="muted-text">{PHA1R_SECTION_LEAD}</p>
      <p className="muted-text">{ZS_PHA1R_PUBLIC_EXPLANATION}</p>
      <div className="checks">
        {PHA1R_SCHOOL_FLAGS.map((flag) => (
          <label key={flag.key}>
            <input
              type="checkbox"
              checked={flags[flag.key]}
              onChange={(event) => onFlagChange(flag.key, event.target.checked)}
            />
            {flag.label}
          </label>
        ))}
      </div>
      {result.kind === "excluded" ? <p className="muted-text">{result.detail}</p> : null}

      <h3>{PHA1R_ROWS_TITLE}</h3>
      <p className="muted-text">{PHA1R_DEDUCTION_NOTE}</p>
      {rows.length === 0 && result.kind !== "excluded" ? <p className="muted-text">{result.detail}</p> : null}
      <div className="stack">
        {rows.map((view) => {
          const source = classes.find((item) => item.id === view.id);
          if (!source) return null;
          const invalid = view.issues.length > 0;
          return (
            <div className="subcard" key={view.id}>
              <div className="grid two">
                <label className="number-field number-field--entry">
                  <span className="number-field__label">{pha1rGrade1Label(view.rowNumber)}</span>
                  <IntegerInput
                    className="number-field__input"
                    aria-label={pha1rGrade1Label(view.rowNumber)}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? view.errorId : undefined}
                    value={source.grade1Pupils}
                    onChange={(value) => onGrade1Change(view.id, value)}
                  />
                </label>
                <label className="number-field number-field--entry">
                  <span className="number-field__label">{pha1rPar38Label(view.rowNumber)}</span>
                  <IntegerInput
                    className="number-field__input"
                    aria-label={pha1rPar38Label(view.rowNumber)}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? view.errorId : undefined}
                    value={source.grade1Par38}
                    onChange={(value) => onPar38Change(view.id, value)}
                  />
                </label>
                <label className="number-field number-field--entry">
                  <span className="number-field__label">{pha1rPar41Label(view.rowNumber)}</span>
                  <IntegerInput
                    className="number-field__input"
                    aria-label={pha1rPar41Label(view.rowNumber)}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? view.errorId : undefined}
                    value={source.grade1Par41}
                    onChange={(value) => onPar41Change(view.id, value)}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={source.establishedSec16_9}
                    onChange={(event) => onSec16Change(view.id, event.target.checked)}
                  />
                  {pha1rSec16Label(view.rowNumber)}
                </label>
              </div>
              <p className="muted-text">{view.statusText}</p>
              {invalid ? (
                <p id={view.errorId} className="muted-text field-validation-warning">
                  {view.issues.map((issue) => issue.label).join(" ")}
                </p>
              ) : null}
              <button type="button" className="btn ghost" aria-label={pha1rRemoveAriaLabel(view.rowNumber)} onClick={() => onRemove(view.id)}>
                Odebrat třídu
              </button>
            </div>
          );
        })}
      </div>
      <div className="toolbar">
        <button type="button" className="btn ghost" onClick={onAdd}>
          Přidat třídu
        </button>
        <button type="button" className="btn ghost" onClick={onReset}>
          Vymazat údaje PHA1Rmax
        </button>
      </div>
      <ResultCard label="PHA1Rmax" value={result.hoursText} hint="Asistent pedagoga v 1. ročníku" />
      {result.kind === "computed" ? <p className="muted-text">{result.detail}</p> : null}
    </section>
  );
}
