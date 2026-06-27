import React from "react";
import { annualReportLegalNotes, annualReportRequiredItems } from "./vyrocni-zprava-legal-constants";

type VyrocniZpravaLegalFrameworkPanelProps = {
  defaultOpen?: boolean;
};

export function VyrocniZpravaLegalFrameworkPanel({ defaultOpen = false }: VyrocniZpravaLegalFrameworkPanelProps) {
  return (
    <details className="vyrocni-zprava-legal-panel card" open={defaultOpen}>
      <summary className="vyrocni-zprava-legal-panel__summary">Legislativní rámec výroční zprávy</summary>
      <div className="vyrocni-zprava-legal-panel__content">
        <p className="vyrocni-zprava-legal-panel__note">{annualReportLegalNotes[0]}</p>
        <ol className="vyrocni-zprava-legal-panel__items" type="a">
          {annualReportRequiredItems.map((item) => (
            <li key={item}>{item.replace(/^[a-k]\)\s*/i, "")}</li>
          ))}
        </ol>
        <p className="vyrocni-zprava-legal-panel__note">{annualReportLegalNotes[1]}</p>
      </div>
    </details>
  );
}
