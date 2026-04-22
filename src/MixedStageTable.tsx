import React from "react";
import { TABLE_SCROLL_HINT } from "./calculator-ui-constants";
import { round2 } from "./phmax-zs-logic";

export type MixedBand = { label: string; value: number };

export type MixedStageTableProps = {
  stageTitle: string;
  methodNote: string;
  zsPupils: number;
  zsClasses: number;
  zsAvg: number;
  zsBand: MixedBand;
  zsResult: number;
  specPupils: number;
  specClasses: number;
  specAvg: number;
  specBand: MixedBand;
  specResult: number;
  stageTotal: number;
  setZsPupils: (n: number) => void;
  setZsClasses: (n: number) => void;
  setSpecPupils: (n: number) => void;
  setSpecClasses: (n: number) => void;
  emphasizeEmpty: boolean;
};

export function MixedStageTable({
  stageTitle,
  methodNote,
  zsPupils,
  zsClasses,
  zsAvg,
  zsBand,
  zsResult,
  specPupils,
  specClasses,
  specAvg,
  specBand,
  specResult,
  stageTotal,
  setZsPupils,
  setZsClasses,
  setSpecPupils,
  setSpecClasses,
  emphasizeEmpty,
}: MixedStageTableProps) {
  const numInput = (value: number, onChange: (n: number) => void, aria: string) => (
    <td>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        className={`mixed-sheet__input${emphasizeEmpty && value === 0 ? " mixed-sheet__input--empty" : ""}`}
        value={value}
        aria-label={aria}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </td>
  );

  return (
    <div className="mixed-sheet-panel">
      <h3 className="mixed-sheet-panel__title">{stageTitle}</h3>
      <p className="mixed-sheet-panel__note muted-text">{methodNote}</p>
      <div className="mixed-sheet-scroll">
        <p className="table-outer__hint table-outer__hint--inset">{TABLE_SCROLL_HINT}</p>
        <table className="mixed-sheet">
          <thead>
            <tr>
              <th scope="col">Obor / část výpočtu</th>
              <th scope="col">Žáci</th>
              <th scope="col">Třídy</th>
              <th scope="col">Průměr žáků/třídu</th>
              <th scope="col">Pásmo</th>
              <th scope="col">PHmax / 1 třídu</th>
              <th scope="col">Výsledek PHmax</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">79-01-C/01 (běžná ZŠ)</th>
              {numInput(zsPupils, setZsPupils, `${stageTitle}: žáci, obor 79-01-C/01`)}
              {numInput(zsClasses, setZsClasses, `${stageTitle}: třídy, obor 79-01-C/01`)}
              <td className="mixed-sheet__num">{round2(zsAvg)}</td>
              <td>{zsBand.label}</td>
              <td className="mixed-sheet__num">{zsBand.value}</td>
              <td className="mixed-sheet__num mixed-sheet__num--strong">{zsResult}</td>
            </tr>
            <tr>
              <th scope="row">79-01-B/01 (ZŠ speciální)</th>
              {numInput(specPupils, setSpecPupils, `${stageTitle}: žáci, obor 79-01-B/01`)}
              {numInput(specClasses, setSpecClasses, `${stageTitle}: třídy, obor 79-01-B/01`)}
              <td className="mixed-sheet__num">{round2(specAvg)}</td>
              <td>{specBand.label}</td>
              <td className="mixed-sheet__num">{specBand.value}</td>
              <td className="mixed-sheet__num mixed-sheet__num--strong">{specResult}</td>
            </tr>
            <tr className="mixed-sheet__total-row">
              <th scope="row" colSpan={6}>
                PHmax za {stageTitle.toLowerCase()} (součet obou oborů)
              </th>
              <td className="mixed-sheet__num mixed-sheet__grand">{stageTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
