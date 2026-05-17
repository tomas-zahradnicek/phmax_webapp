import React from "react";

type SsHumanSummaryProps = {
  classCount: number;
  phmaxTotal: number;
  rowCount: number;
  okRows: number;
  conflictCount: number;
};

/** Stručný lidský souhrn pro dock SŠ. */
export function SsHumanSummary({
  classCount,
  phmaxTotal,
  rowCount,
  okRows,
  conflictCount,
}: SsHumanSummaryProps) {
  const phmaxDisplay = phmaxTotal.toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
  return (
    <ul className="ss-human-summary" aria-label="Stručný přehled výpočtu">
      <li>
        <strong>{classCount}</strong> {classCount === 1 ? "třída" : classCount < 5 ? "třídy" : "tříd"}
      </li>
      <li>
        <strong>{phmaxDisplay}</strong> PHmax
      </li>
      <li>
        <strong>{okRows}</strong> / {rowCount} řádků OK
      </li>
      <li className={conflictCount > 0 ? "ss-human-summary__warn" : undefined}>
        <strong>{conflictCount}</strong> {conflictCount === 1 ? "konflikt" : "konfliktů"}
      </li>
    </ul>
  );
}
