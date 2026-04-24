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

function renderBandLabelWithBreak(label: string) {
  const splitToken = " do ";
  const idx = label.indexOf(splitToken);
  if (idx < 0) return label;
  const first = label.slice(0, idx).trimEnd();
  const second = `do ${label.slice(idx + splitToken.length).trimStart()}`;
  return (
    <>
      {first}
      <br />
      {second}
    </>
  );
}

export type PvMethodologyActiveCell = { table: 1 | 2 | 3; rowIndex: number; colIndex: number };

const ACTIVE = "sd-phmax-breakdown__cell--pv-active";

/** Čistá logika filtru tabulek 1–3 (pro UI i unit testy). */
export function getPvMethodologyAppendixVisibility(showAll: boolean, activeCells?: readonly PvMethodologyActiveCell[] | null) {
  const list = activeCells ?? [];
  const connected = new Set(list.map((x) => x.table));
  const hasActive = list.length > 0;
  const filter = !showAll && hasActive;
  return {
    show1: !filter || connected.has(1),
    show2: !filter || connected.has(2),
    show3: !filter || connected.has(3),
    showEmptyHint: !hasActive && !showAll,
  };
}

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
  const [showAll, setShowAll] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const vis = getPvMethodologyAppendixVisibility(showAll, ac);
  const show = (t: 1 | 2 | 3) => (t === 1 ? vis.show1 : t === 2 ? vis.show2 : vis.show3);
  return (
    <details
      className="subcard sd-phmax-breakdown-wrap"
      style={{ marginTop: 16 }}
      onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className="section-title"
        style={{ fontSize: "1.05rem", cursor: "pointer" }}
        aria-expanded={detailsOpen}
      >
        Kompletní tabulky 1–3 přílohy (polodenní, celodenní, internátní provoz)
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 14, fontSize: "0.86rem", lineHeight: 1.5 }}>
        Hodnoty odpovídají maticím v aplikaci (<code className="methodology-strip__code">phmax-pv-logic.ts</code>). Čísla
        jsou v hodinách týdně (PHmax). Po vyplnění pracoviště se zvýrazní odpovídající buňka v příslušné tabulce.
      </p>
      <p className="muted-text" style={{ marginTop: -4, marginBottom: 8, fontSize: "0.84rem" }}>
        Legenda: zelená = aktivní buňka podle výpočtu.
      </p>
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 10 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          aria-label="Zobrazit všechny tabulky 1–3 přílohy metodiky PV"
        />
        Zobrazit všechny tabulky 1–3
      </label>
      {vis.showEmptyHint ? (
        <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.84rem" }}>
          Zatím není vyplněné žádné pracoviště s tabulkou 1–3. Pro náhled všech matic zapněte „Zobrazit všechny tabulky
          1–3“, nebo vyplňte pracoviště — pak se zobrazí jen příslušná tabulka.
        </p>
      ) : null}

      {show(1) ? (
      <>
      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "14px 0 8px" }}>
        Tabulka 1 — polodenní provoz
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown pv-methodology-table">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner pv-methodology-table__classes-col">
                Počet tříd
              </th>
              {PV_POLODENNI_BAND_OPTIONS.map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {renderBandLabelWithBreak(lab)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHMAX_PV_POLODENNI.map((row, ri) => (
              <tr key={ri}>
                <th scope="row" className="sd-phmax-breakdown__label pv-methodology-table__classes-col">
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
      </>
      ) : null}

      {show(2) ? (
      <>
      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "18px 0 8px" }}>
        Tabulka 2 — celodenní provoz
      </h4>
      <p className="muted-text" style={{ marginTop: 2, marginBottom: 8, fontSize: "0.82rem", lineHeight: 1.45 }}>
        Tabulka je rozdělena do navazujících bloků pro lepší čitelnost — druhý blok navazuje v pořadí pásem.
      </p>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown pv-methodology-table">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner pv-methodology-table__classes-col">
                Počet tříd
              </th>
              {PV_CELODENNI_BAND_OPTIONS.slice(0, 6).map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {renderBandLabelWithBreak(lab)}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner pv-methodology-table__classes-col">
                Pokračování
              </th>
              {PV_CELODENNI_BAND_OPTIONS.slice(6).map((lab, i) => (
                <th key={`cont-${i}`} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {renderBandLabelWithBreak(lab)}
                </th>
              ))}
            </tr>
          </thead>
          {PHMAX_PV_CELODENNI.map((row, ri) => (
            <tbody key={ri} className="pv-methodology-tbody--celodenni-pair">
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label pv-methodology-table__classes-col">
                  {ri + 1}
                </th>
                {row.slice(0, 6).map((cell, ci) => (
                  <td key={ci} className={pvCellClass(ac, 2, ri, ci)} title={PV_CELODENNI_BAND_OPTIONS[ci]}>
                    {fmtPv(cell)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label pv-methodology-table__classes-col">
                  {ri + 1}
                </th>
                {row.slice(6).map((cell, ci) => {
                  const sourceCol = ci + 6;
                  return (
                    <td
                      key={`cont-${ci}`}
                      className={pvCellClass(ac, 2, ri, sourceCol)}
                      title={PV_CELODENNI_BAND_OPTIONS[sourceCol]}
                    >
                      {fmtPv(cell)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          ))}
        </table>
      </ScrollGrabRegion>
      </>
      ) : null}

      {show(3) ? (
      <>
      <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "18px 0 8px" }}>
        Tabulka 3 — internátní provoz
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown pv-methodology-table">
          <thead>
            <tr>
              <th scope="col" className="sd-phmax-breakdown__corner pv-methodology-table__classes-col">
                Počet tříd
              </th>
              {PV_INTERNAT_BAND_OPTIONS.map((lab, i) => (
                <th key={i} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {renderBandLabelWithBreak(lab)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHMAX_PV_INTERNAT.map((row, ri) => (
              <tr key={ri}>
                <th scope="row" className="sd-phmax-breakdown__label pv-methodology-table__classes-col">
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
      </>
      ) : null}
    </details>
  );
}
