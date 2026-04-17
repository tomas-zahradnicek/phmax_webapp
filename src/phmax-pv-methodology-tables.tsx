import React from "react";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import {
  PHMAX_PV_CELODENNI,
  PHMAX_PV_INTERNAT,
  PHMAX_PV_POLODENNI,
  PV_CELODENNI_BAND_OPTIONS,
  PV_INTERNAT_BAND_OPTIONS,
  PV_POLODENNI_BAND_OPTIONS,
} from "./phmax-pv-logic";

function fmtPv(n: number): string {
  return n.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export type PvMethodologyActiveCell = { table: 1 | 2 | 3; rowIndex: number; colIndex: number };

const ACTIVE = "sd-phmax-breakdown__cell--pv-active";

function pvCellClass(active: readonly PvMethodologyActiveCell[] | undefined, table: 1 | 2 | 3, ri: number, ci: number) {
  const on = active?.some((a) => a.table === table && a.rowIndex === ri && a.colIndex === ci);
  return "sd-phmax-breakdown__num" + (on ? ` ${ACTIVE}` : "");
}

/**
 * Kompletní tabulky 1–3 přílohy k metodice PHmax PV (vyhl. 14/2005 Sb.) — pro ruční ověření.
 * Volitelně zvýrazní buňky odpovídající zadaným pracovištím (stejně jako kontrolní přehled výše).
 */
export function PhmaxPvMethodologyTables123({ activeCells }: { activeCells?: readonly PvMethodologyActiveCell[] }) {
  const ac = activeCells;
  return (
    <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 16 }}>
      <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
        Kompletní tabulky 1–3 přílohy (polodenní, celodenní, internátní provoz)
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 14, fontSize: "0.86rem", lineHeight: 1.5 }}>
        Hodnoty odpovídají maticím v aplikaci (<code className="methodology-strip__code">phmax-pv-logic.ts</code>). Čísla
        jsou v hodinách týdně (PHmax). Po vyplnění pracoviště se zvýrazní odpovídající buňka v příslušné tabulce.
      </p>

      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "14px 0 8px" }}>
        Tabulka 1 — polodenní provoz
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner">
                Počet tříd
              </th>
              {PV_POLODENNI_BAND_OPTIONS.map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {lab}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHMAX_PV_POLODENNI.map((row, ri) => (
              <tr key={ri}>
                <th scope="row" className="sd-phmax-breakdown__label">
                  {ri + 1}
                </th>
                {row.map((cell, ci) => (
                  <td key={ci} className={pvCellClass(ac, 1, ri, ci)} title={PV_POLODENNI_BAND_OPTIONS[ci]}>
                    {fmtPv(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>

      <p className="muted-text" style={{ margin: "12px 0 8px", fontSize: "0.8rem" }}>
        U tabulky 2 mají sloupce v záhlaví pořadí 1–12; úplné znění pásma průměrné doby zobrazí nápověda při najetí na
        hlavičku (title), shodně s přílohou metodiky.
      </p>
      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "18px 0 8px" }}>
        Tabulka 2 — celodenní provoz
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner">
                Počet tříd
              </th>
              {PV_CELODENNI_BAND_OPTIONS.map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHMAX_PV_CELODENNI.map((row, ri) => (
              <tr key={ri}>
                <th scope="row" className="sd-phmax-breakdown__label">
                  {ri + 1}
                </th>
                {row.map((cell, ci) => (
                  <td key={ci} className={pvCellClass(ac, 2, ri, ci)} title={PV_CELODENNI_BAND_OPTIONS[ci]}>
                    {fmtPv(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>

      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "18px 0 8px" }}>
        Tabulka 3 — internátní provoz
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner">
                Počet tříd
              </th>
              {PV_INTERNAT_BAND_OPTIONS.map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {lab}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHMAX_PV_INTERNAT.map((row, ri) => (
              <tr key={ri}>
                <th scope="row" className="sd-phmax-breakdown__label">
                  {ri + 1}
                </th>
                {row.map((cell, ci) => (
                  <td key={ci} className={pvCellClass(ac, 3, ri, ci)} title={PV_INTERNAT_BAND_OPTIONS[ci]}>
                    {fmtPv(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </details>
  );
}
