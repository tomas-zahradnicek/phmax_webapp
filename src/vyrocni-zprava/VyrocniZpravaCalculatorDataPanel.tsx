import React from "react";

import { formatCsHoursPerWeek } from "../cs-format";
import type { AnnualReportCalculatorData, Section03Readiness } from "./vyrocni-zprava-calculator-data-bridge";
import { SECTION_03_CALCULATOR_DATA_WARNING } from "./vyrocni-zprava-calculator-data-bridge";

type VyrocniZpravaCalculatorDataPanelProps = {
  calculatorData: AnnualReportCalculatorData;
  readiness: Section03Readiness;
};

const VALUE_LABELS: { key: "phmax" | "phamax" | "phpmax"; label: string }[] = [
  { key: "phmax", label: "PHmax (součet modulů)" },
  { key: "phamax", label: "PHAmax (součet modulů)" },
  { key: "phpmax", label: "PHPmax (ZŠ)" },
];

export function VyrocniZpravaCalculatorDataPanel({
  calculatorData,
  readiness,
}: VyrocniZpravaCalculatorDataPanelProps) {
  const { personnel } = calculatorData;
  const presentValues = VALUE_LABELS.filter(({ key }) => personnel.values[key] != null);

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-calculator-panel" role="region" aria-labelledby="vyrocni-zprava-calculator-title">
      <div className="vyrocni-zprava-calculator-panel__header">
        <h3 id="vyrocni-zprava-calculator-title" className="vyrocni-zprava-detail__block-title">
          Podklady z kalkulaček
        </h3>
        <span
          className={`vyrocni-zprava-status-badge vyrocni-zprava-status-badge--compact ${
            readiness.status === "PRIPRAVENO" ? "vyrocni-zprava-status-badge--ready" : "vyrocni-zprava-status-badge--warning"
          }`}
        >
          {readiness.status === "PRIPRAVENO" ? "Připraveno" : "Chybí údaje"}
        </span>
      </div>

      <p className="vyrocni-zprava-calculator-panel__lead muted-text">{SECTION_03_CALCULATOR_DATA_WARNING}</p>

      {readiness.warnings.length > 0 ? (
        <ul className="vyrocni-zprava-calculator-panel__warnings">
          {readiness.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {personnel.sources.length > 0 ? (
        <div className="vyrocni-zprava-calculator-panel__subsection">
          <h4 className="vyrocni-zprava-calculator-panel__subtitle">Zdrojové moduly</h4>
          <ul className="vyrocni-zprava-calculator-panel__sources">
            {personnel.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted-text vyrocni-zprava-detail__placeholder">
          V tomto prohlížeči nejsou uložena data z kalkulaček PHmax, PHAmax ani PHPmax.
        </p>
      )}

      {presentValues.length > 0 ? (
        <div className="vyrocni-zprava-calculator-panel__subsection">
          <h4 className="vyrocni-zprava-calculator-panel__subtitle">Dostupné hodnoty</h4>
          <dl className="vyrocni-zprava-calculator-panel__values">
            {presentValues.map(({ key, label }) => {
              const value = personnel.values[key]!;
              const formatted =
                key === "phmax" || key === "phamax" || key === "phpmax"
                  ? formatCsHoursPerWeek(value)
                  : value.toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
              return (
                <div key={key} className="vyrocni-zprava-calculator-panel__value-row">
                  <dt>{label}</dt>
                  <dd>{formatted}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      ) : null}

      {readiness.availableData.length > 0 ? (
        <div className="vyrocni-zprava-calculator-panel__subsection">
          <h4 className="vyrocni-zprava-calculator-panel__subtitle">Detekované kapacity po modulech</h4>
          <ul className="vyrocni-zprava-calculator-panel__available">
            {readiness.availableData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-calculator-panel__subsection">
          <h4 className="vyrocni-zprava-calculator-panel__subtitle">Chybějící údaje pro kapitolu 03</h4>
          <ul className="vyrocni-zprava-detail__missing-list vyrocni-zprava-calculator-panel__missing">
            {readiness.missingData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {personnel.notes.length > 0 ? (
        <div className="vyrocni-zprava-calculator-panel__subsection">
          <h4 className="vyrocni-zprava-calculator-panel__subtitle">Poznámky k podkladům</h4>
          <ul className="vyrocni-zprava-calculator-panel__notes muted-text">
            {personnel.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
