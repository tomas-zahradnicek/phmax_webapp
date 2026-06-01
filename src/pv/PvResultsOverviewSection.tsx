import React from "react";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import type { Pv1d3ReductionResult } from "../phmax-pv-1d3-reduction";

export type PvResultsOverviewRow = {
  row: { id: string; label: string };
  provozLabel: string;
  effectivePhmax: number | null;
  reduction1d3?: Pv1d3ReductionResult | null;
  phaMax: number | null;
};

export type PvResultsOverviewSectionProps = {
  rows: readonly PvResultsOverviewRow[];
  aggregate: { phmaxSum: number; phaSum: number; incomplete: boolean };
};

export function PvResultsOverviewSection({ rows, aggregate }: PvResultsOverviewSectionProps) {
  return (
    <section className="card muted section-card" data-section="pv-vysledek" aria-label="Součtový přehled pracovišť">
      <h2 className="section-title">Součtový přehled pracovišť</h2>
      <p className="muted-text" style={{ marginTop: 0 }}>
        Součty níže odpovídají pouze řádkům zadaným v této kalkulačce. Údaje z jiných pracovišť nebo výpočtů zapište a
        sečtěte samostatně podle metodiky (jeden dílčí výpočet na kombinaci místa a druhu provozu).
      </p>
      <ScrollGrabRegion className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Označení / provoz</th>
              <th scope="col">PHmax</th>
              <th scope="col">PHAmax</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.row.id}>
                <td>{i + 1}</td>
                <td>
                  {c.row.label.trim() || `Pracoviště ${i + 1}`}
                  <span className="muted-text"> – {c.provozLabel}</span>
                </td>
                <td>
                  {c.effectivePhmax != null
                    ? c.reduction1d3?.status === "reduced"
                      ? `${c.effectivePhmax} *`
                      : c.effectivePhmax
                    : "–"}
                </td>
                <td>{c.phaMax != null ? c.phaMax : "–"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Celkem (zobrazená pracoviště)
              </th>
              <td>
                <strong>{aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum}</strong>
              </td>
              <td>
                <strong>{aggregate.phaSum > 0 ? aggregate.phaSum : "–"}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </ScrollGrabRegion>
    </section>
  );
}
