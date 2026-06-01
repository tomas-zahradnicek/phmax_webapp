import React from "react";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import { PHMAX_SS_UNITS_SECTION } from "./phmax-ss-constants";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { explainSingleRow } from "./phmax-ss-explainability";
import { explainInputFromUnitRow } from "./phmax-ss-units-derive";
import { resolveIsPar16Class, PHMAX_SS_PAR16_ROW_SUMMARY } from "./phmax-ss-par16";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";
import type { ServiceResolvedRow } from "./phmax-ss-service";
import {
  SsWhyPhmaxErrorPanel,
  SsWhyPhmaxPanel,
} from "./SsWhyPanels";
import type { PhmaxSsUnitsModel } from "./use-phmax-ss-units";

function SsWhyPhmaxWithExplain({ resolved, unitRow }: { resolved: ServiceResolvedRow; unitRow: PhmaxSsUnitRow }) {
  let explanation: ReturnType<typeof explainSingleRow>["explanation"] | undefined;
  const inp = explainInputFromUnitRow(unitRow);
  if (inp) {
    try {
      explanation = explainSingleRow(phmaxSsDataset, inp).explanation;
    } catch {
      explanation = undefined;
    }
  }
  return <SsWhyPhmaxPanel row={resolved} explanation={explanation} />;
}

export function SsResultsSection({
  model,
}: {
  model: PhmaxSsUnitsModel;
  showExpertPanels?: boolean;
}) {
  const sec = PHMAX_SS_UNITS_SECTION;
  const { rows, preview, computedRows, roundedTotal, whyPhmaxRowId, setWhyPhmaxRowId } = model;

  return (
    <div style={{ marginTop: 22 }} data-section="ss-vysledek">
      <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "1.05rem", fontWeight: 700 }}>{sec.previewHeading}</h3>
      <p className="muted-text" style={{ marginBottom: 12, lineHeight: 1.5 }}>
        {sec.previewHint}
      </p>
      <ScrollGrabRegion className="app-table-wrap" role="region" aria-label={sec.previewHeading}>
        <table className="app-data-table app-data-table--results">
          <thead>
            <tr>
              <th scope="col">Označení</th>
              <th scope="col">Kód oboru</th>
              <th scope="col">Režim</th>
              <th scope="col">Pásmo</th>
              <th scope="col" className="app-data-table__num">
                PHmax / třídu (upr.)
              </th>
              <th scope="col" className="app-data-table__num">
                PHmax celkem
              </th>
              <th scope="col">Stav</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p) => {
              const src = rows.find((r) => r.id === p.rowId);
              const code = src?.educationField.trim() ?? "";
              const toggleWhyPhmax = () => setWhyPhmaxRowId((cur) => (cur === p.rowId ? null : p.rowId));

              if (p.skipped) {
                return (
                  <tr key={p.rowId}>
                    <td>{p.label || "–"}</td>
                    <td colSpan={5} className="muted-text">
                      (nezadáno pro výpočet)
                    </td>
                    <td className="muted-text">–</td>
                  </tr>
                );
              }
              if ("error" in p) {
                const open = whyPhmaxRowId === p.rowId;
                return (
                  <React.Fragment key={p.rowId}>
                    <tr>
                      <td>{p.label || "–"}</td>
                      <td>{code}</td>
                      <td className="muted-text">–</td>
                      <td colSpan={2} className="muted-text">
                        –
                      </td>
                      <td className="app-data-table__num">–</td>
                      <td>
                        <span style={{ color: "var(--danger, #b91c1c)" }}>{p.error}</span>
                        <button
                          type="button"
                          className="btn ghost ss-why-btn"
                          onClick={toggleWhyPhmax}
                          aria-expanded={open}
                          aria-controls={`ss-why-phmax-${p.rowId}`}
                        >
                          Proč?
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="ss-why-row">
                        <td colSpan={7} id={`ss-why-phmax-${p.rowId}`}>
                          <SsWhyPhmaxErrorPanel error={p.error} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              }
              const r = p.resolved;
              const openOk = whyPhmaxRowId === p.rowId;
              const par16Row = src ? resolveIsPar16Class(src) : false;
              return (
                <React.Fragment key={p.rowId}>
                  <tr>
                    <td>{p.label || "–"}</td>
                    <td>{r.code}</td>
                    <td className="muted-text">{r.modeKey}</td>
                    <td>{r.intervalLabel}</td>
                    <td className="app-data-table__num">{r.adjustedPhmaxPerClass}</td>
                    <td className="app-data-table__num app-data-table__num--emph">{r.totalPhmax}</td>
                    <td className="muted-text">
                      {par16Row ? <span title={sec.par16CheckboxHint}>§ 16</span> : "OK"}
                      <button
                        type="button"
                        className="btn ghost ss-why-btn"
                        onClick={toggleWhyPhmax}
                        aria-expanded={openOk}
                        aria-controls={`ss-why-phmax-${p.rowId}`}
                      >
                        Proč?
                      </button>
                    </td>
                  </tr>
                  {openOk ? (
                    <tr className="ss-why-row">
                      <td colSpan={7} id={`ss-why-phmax-${p.rowId}`}>
                        {src ? <SsWhyPhmaxWithExplain resolved={r} unitRow={src} /> : <SsWhyPhmaxPanel row={r} />}
                        {par16Row ? (
                          <p className="muted-text ss-par16-row-summary" style={{ marginTop: 10 }}>
                            {PHMAX_SS_PAR16_ROW_SUMMARY}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ) : par16Row ? (
                    <tr className="ss-par16-summary-row">
                      <td colSpan={7}>
                        <p className="muted-text ss-par16-row-summary">{PHMAX_SS_PAR16_ROW_SUMMARY}</p>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
          {computedRows.length > 0 ? (
            <tfoot>
              <tr className="app-data-table__total-row">
                <th scope="row" colSpan={5}>
                  Součet PHmax (platné řádky)
                </th>
                <td className="app-data-table__num app-data-table__num--emph">{roundedTotal}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </ScrollGrabRegion>
    </div>
  );
}
