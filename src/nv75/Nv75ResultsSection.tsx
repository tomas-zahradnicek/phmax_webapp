import React from "react";
import { LegisTooltipRef } from "../LegisTooltipRef";
import { CollapsibleSection } from "../CollapsibleSection";
import type { CalculatorViewMode } from "../calculator-view-mode";
import { NV75_DEPUTY_LEGIS_TOOLTIPS, NV75_DEPUTY_LEGIS_URL } from "../nv75-deputy-legislativa";
import type { Nv75DeputyBankResult } from "../nv75-deputy-bank";
import { NV75_KIND_LABEL } from "./nv75-deputy-kind-options";
import { buildNv75RuleExplanation } from "./nv75-rule-explanation";

function Nv75LegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={NV75_DEPUTY_LEGIS_TOOLTIPS} />;
}

export type Nv75ResultsSectionProps = {
  bank: Nv75DeputyBankResult;
  viewMode: CalculatorViewMode;
  rowCount: number;
  ovGroupsSchool: number;
  ovGroupsInstructor: number;
};

export function Nv75ResultsSection({
  bank,
  viewMode,
  rowCount,
  ovGroupsSchool,
  ovGroupsInstructor,
}: Nv75ResultsSectionProps) {
  const ruleExplanation = buildNv75RuleExplanation(bank.appliedRule);
  const ovInstructorGroupsCounted = Math.floor(Math.max(0, Math.floor(ovGroupsInstructor)) / 2);
  const hasOvGroups = ovGroupsSchool > 0 || ovGroupsInstructor > 0 || bank.ovGroupsEquivalent > 0;

  return (
    <section className="card muted section-card section-card--overview" data-section="nv75-vysledek">
      <h2 className="section-title">Výsledek banky odpočtů</h2>
      <div className="grid four">
        <div className="result-card">
          <p className="result-card__label">
            Pravidlo <Nv75LegisRef citeId="nv75-4b" label="§4b" />
          </p>
          <p className="result-card__value">{bank.appliedRule}</p>
        </div>
        <div className="result-card">
          <p className="result-card__label">
            Základ <Nv75LegisRef citeId="nv75-4b" label="§4b" />
          </p>
          <p className="result-card__value">{bank.bankHoursBase4b}</p>
        </div>
        <div className="result-card">
          <p className="result-card__label">
            Bonus <Nv75LegisRef citeId="nv75-4c1" label="§4c" /> + <Nv75LegisRef citeId="nv75-4d" label="§4d" />
          </p>
          <p className="result-card__value">{bank.bonus4cHours + bank.bonus4dHours}</p>
        </div>
        <div className="result-card" style={{ border: "2px solid #0f766e", background: "#ecfeff" }}>
          <p className="result-card__label">Banka odpočtů celkem (h/týden)</p>
          <p className="result-card__value" style={{ color: "#0f766e", fontWeight: 800 }}>
            {bank.bankHoursTotal}
          </p>
        </div>
        <div className="result-card">
          <p className="result-card__label">
            <Nv75LegisRef citeId="nv75-4c1" label="§4c odst. 1" /> – žáci započtení
          </p>
          <p className="result-card__value">{bank.practicalStudentsGeneralCounted}</p>
        </div>
        <div className="result-card">
          <p className="result-card__label">OV ekvivalent skupin</p>
          <p className="result-card__value">{bank.ovGroupsEquivalent}</p>
        </div>
        <div className="result-card">
          <p className="result-card__label">
            OV funkce dle <Nv75LegisRef citeId="vyhl13-7" label="vyhl. 13/2005" />
          </p>
          <p className="result-card__value">{bank.ovDeputyEntitlementCount}</p>
        </div>
      </div>
      <CollapsibleSection
        summary="Detailní audit pracovišť a pásma"
        count={rowCount}
        defaultOpen={viewMode === "expert"}
        level="advanced"
      >
        <div className="sd-phmax-breakdown-scroll" style={{ marginTop: 12 }}>
          <table className="sd-phmax-breakdown">
            <thead>
              <tr>
                <th>Pracoviště</th>
                <th>Počet jednotek</th>
                <th>Počet hodin do banky odpočtů</th>
                <th>Použitá pásma (audit)</th>
              </tr>
            </thead>
            <tbody>
              {bank.breakdown.map((row, idx) => (
                <tr key={`${row.kind}-${idx}`}>
                  <td>{NV75_KIND_LABEL[row.kind]}</td>
                  <td>{row.units}</td>
                  <td>{row.hoursByKind + row.bonus4dHours} hodin týdně</td>
                  <td>
                    <div>{`§ 4b NV 75/2005 Sb. ve vazbě na přílohu č. ${row.appendix === "p2" ? "2" : "3"}: použito pásmo ${row.reductionBand}.`}</div>
                    <div className="muted-text">{row.bonus4dRule}</div>
                  </td>
                </tr>
              ))}
              <tr>
                <th>Bonus §4c</th>
                <td>–</td>
                <td>{bank.bonus4cHours} hodin týdně</td>
                <td>
                  <span className="muted-text">Mimo pásma příloh (samostatný bonus dle §4c)</span>
                </td>
              </tr>
              <tr>
                <th>Banka odpočtů celkem</th>
                <td>–</td>
                <td>{bank.bankHoursTotal} hodin týdně</td>
                <td>
                  <strong>Součet základ + bonusy</strong>
                </td>
              </tr>
              {hasOvGroups ? (
                <>
                  <tr>
                    <th>Počet skupin odborného výcviku na školních pracovištích</th>
                    <td>{ovGroupsSchool} skupin</td>
                    <td>započítáno plně</td>
                    <td>
                      <span className="muted-text">vyhl. 13/2005, §7</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Počet skupin odborného výcviku u instruktora / ve firmách</th>
                    <td>{ovGroupsInstructor} skupin</td>
                    <td>
                      započteno {ovInstructorGroupsCounted} skupin (floor({ovGroupsInstructor} / 2))
                    </td>
                    <td>
                      <span className="muted-text">metodické pravidlo 1/2</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Počet skupin odborného výcviku celkem</th>
                    <td>{bank.ovGroupsEquivalent} skupin</td>
                    <td>školní skupiny + započtená polovina instruktorských skupin</td>
                    <td>
                      <span className="muted-text">vyhl. 13/2005, §7</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Výstup dle §13 odst. 7 vyhl. 13/2005</th>
                    <td>{bank.ovDeputyEntitlementCount} funkcí</td>
                    <td>{bank.ovDeputyEntitlementText}</td>
                    <td>
                      <span className="muted-text">prahy 10 / 20 / +20 skupin</span>
                    </td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
      <div className="card muted" style={{ marginTop: 12 }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>
          Odůvodnění výsledku (metodika + NV75)
        </h3>
        <ul className="methodology-strip__list">
          <li>{ruleExplanation}</li>
          <li>
            Základ banky: <strong>{bank.bankHoursBase4b} h/týden</strong> podle <Nv75LegisRef citeId="nv75-4b" label="§4b" />.
          </li>
          <li>
            Bonus praktického vyučování: <strong>{bank.bonus4cHours} h/týden</strong> podle{" "}
            <Nv75LegisRef citeId="nv75-4c1" label="§4c" />.
          </li>
          <li>
            Bonus dalších pracovišť: <strong>{bank.bonus4dHours} h/týden</strong> podle{" "}
            <Nv75LegisRef citeId="nv75-4d" label="§4d" />.
            Způsobilost se počítá z detailu dalších pracovišť (MŠ/ZŠ/SŠ nejméně 3 jednotky; ŠPZ každé další
            pracoviště).
          </li>
          <li>
            Celkem: <strong>{bank.bankHoursTotal} h/týden</strong>.
          </li>
          {hasOvGroups ? (
            <li>
              OV: <strong>{ovGroupsSchool} školních skupin</strong> +{" "}
              <strong>{ovInstructorGroupsCounted} započtených instruktorských skupin</strong> = ekvivalent{" "}
              <strong>{bank.ovGroupsEquivalent} skupin</strong> {"=>"}{" "}
              <strong>{bank.ovDeputyEntitlementText}</strong> podle{" "}
              <Nv75LegisRef citeId="vyhl13-7" label="vyhl. 13/2005" />.
            </li>
          ) : null}
        </ul>
        <p className="muted-text" style={{ marginTop: 8 }}>
          Odkazy:{" "}
          <a
            href={NV75_DEPUTY_LEGIS_URL.nv75}
            target="_blank"
            rel="noopener noreferrer"
            className="status-link ss-why-panel__link"
          >
            NV 75/2005
          </a>
          {" · "}
          <a
            href={NV75_DEPUTY_LEGIS_URL.vyhl13}
            target="_blank"
            rel="noopener noreferrer"
            className="status-link ss-why-panel__link"
          >
            vyhl. 13/2005
          </a>
          {" · "}
          <a
            href={NV75_DEPUTY_LEGIS_URL.skolsky561}
            target="_blank"
            rel="noopener noreferrer"
            className="status-link ss-why-panel__link"
          >
            školský zákon 561/2004
          </a>
        </p>
      </div>
      {bank.notes.length > 0 ? (
        <p className="muted-text" style={{ marginTop: 10 }}>
          {bank.notes.join(" | ")}
        </p>
      ) : null}
    </section>
  );
}
