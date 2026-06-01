import React from "react";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import type { PvProvozKind } from "../phmax-pv-logic";

export type PvWorkplacesSummaryRow = {
  row: {
    id: string;
    label: string;
    classCount: number;
    avgHours: number;
    provoz: PvProvozKind;
  };
  computed: {
    totalPhmax: number | null;
    base: { durationColumnLabel: string } | null;
  };
  phaMax: number | null;
  provozLabel: string;
};

export type PvWorkplacesSummarySectionProps = {
  rows: readonly PvWorkplacesSummaryRow[];
  aggregate: { phmaxSum: number; phaSum: number; incomplete: boolean };
};

/** Detailní souhrnná tabulka všech pracovišť pod vstupy (dílčí PHmax, PHAmax). */
export function PvWorkplacesSummarySection({ rows, aggregate }: PvWorkplacesSummarySectionProps) {
  return (
    <ScrollGrabRegion className="app-table-wrap app-table-wrap--spaced" role="region" aria-label="Souhrn všech pracovišť výpočtu">
      <table className="app-data-table app-data-table--results">
        <caption className="app-data-table__caption">
          Souhrn – dílčí PHmax podle pracovišť a součet (hodiny týdně)
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Označení</th>
            <th scope="col">Druh provozu</th>
            <th scope="col" className="app-data-table__num">
              Třídy
            </th>
            <th scope="col" className="app-data-table__num">
              h/den
            </th>
            <th scope="col" className="app-data-table__band-col">
              Pásmo doby
            </th>
            <th scope="col" className="app-data-table__num">
              Dílčí PHmax
            </th>
            <th scope="col" className="app-data-table__num">
              PHAmax
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.row.id}>
              <td>{i + 1}</td>
              <td>{c.row.label.trim() ? c.row.label.trim() : "–"}</td>
              <td>{c.provozLabel}</td>
              <td className="app-data-table__num">{c.row.classCount}</td>
              <td className="app-data-table__num">
                {c.row.provoz === "zdravotnicke" ? <span className="muted-text">–</span> : c.row.avgHours}
              </td>
              <td className="app-data-table__band-col">
                {c.row.provoz === "zdravotnicke" ? (
                  <span className="muted-text">–</span>
                ) : c.computed.base ? (
                  c.computed.base.durationColumnLabel
                ) : (
                  <span className="muted-text">–</span>
                )}
              </td>
              <td className="app-data-table__num">
                {c.computed.totalPhmax != null ? c.computed.totalPhmax : <span className="muted-text">–</span>}
              </td>
              <td className="app-data-table__num">
                {c.phaMax != null ? c.phaMax : <span className="muted-text">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="app-data-table__total-row">
            <th scope="row" colSpan={6}>
              PHmax celkem (součet pracovišť){aggregate.incomplete ? " *" : ""}
            </th>
            <td className="app-data-table__num app-data-table__num--emph">{aggregate.phmaxSum}</td>
            <td className="app-data-table__num app-data-table__num--emph">
              {aggregate.phaSum > 0 ? aggregate.phaSum : "–"}
            </td>
          </tr>
        </tfoot>
      </table>
    </ScrollGrabRegion>
  );
}
