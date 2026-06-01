import React from "react";
import {
  INLINE_VALIDATION_MSG_POSITIVE_INTEGER,
  INLINE_VALIDATION_MSG_REQUIRED_FIELD,
} from "../calculator-ui-constants";
import { FieldWhyPhmaxDetails } from "../FieldWhyPhmax";
import { NumberField } from "../phmax-zs-ui";
import { PvLegisRef } from "../PhmaxProductLegisUi";
import type { Pv1d3ReductionResult } from "../phmax-pv-1d3-reduction";
import { computePvPhmaxTotal, getPvMaxClassCount, type PvProvozKind } from "../phmax-pv-logic";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import {
  PV_PROVOZ_OPTIONS,
  pvAvgHoursField,
  pvDurationBandTableNo,
  type PvWorkplaceRowState,
} from "./pv-workplace-shared";

type PvRowComputed = ReturnType<typeof computePvPhmaxTotal>;

export type PvWorkplaceRowsSectionRow = {
  row: PvWorkplaceRowState;
  computed: PvRowComputed;
  phaMax: number | null;
  provozLabel: string;
  reduction1d3: Pv1d3ReductionResult | null;
};

export type PvWorkplaceRowsSectionProps = {
  rows: readonly PvWorkplaceRowsSectionRow[];
  workplaceCount: number;
  onPatchRow: (id: string, patch: Partial<PvWorkplaceRowState>) => void;
  onRemoveRow: (id: string) => void;
};

export function PvWorkplaceRowsSection({
  rows,
  workplaceCount,
  onPatchRow,
  onRemoveRow,
}: PvWorkplaceRowsSectionProps) {
  return (
    <div className="pv-workplace-rows">
      {rows.map(({ row, computed, phaMax, provozLabel, reduction1d3 }, index) => {
        const maxClasses = getPvMaxClassCount(row.provoz);
        const avgMeta = pvAvgHoursField(row.provoz);
        const hoursForPha = row.provoz === "zdravotnicke" ? 8 : row.avgHours;

        return (
          <div key={row.id} className="pv-workplace-row" data-pv-row-id={row.id}>
            <div
              className="pv-workplace-row-header"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <h3 className="section-title" style={{ fontSize: "1.05rem", margin: 0, flex: "1 1 200px" }}>
                Pracoviště {index + 1}
                {row.label.trim() ? ` – ${row.label.trim()}` : ""}
              </h3>
              <div
                className="pv-workplace-row-header__controls"
                style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", flex: "1 1 280px" }}
              >
                <label className="field pv-label-field" style={{ flex: "1 1 200px", margin: 0, minWidth: 0 }}>
                  <span>Označení (volitelně)</span>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => onPatchRow(row.id, { label: e.target.value })}
                    placeholder="např. pracoviště Veřejná"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={workplaceCount <= 1}
                  aria-label={`Odstranit pracoviště ${index + 1}`}
                  onClick={() => onRemoveRow(row.id)}
                >
                  Odstranit pracoviště
                </button>
              </div>
            </div>

            <div className="grid two">
              <div className="subcard">
                <h3>Druh provozu</h3>
                <label className="field">
                  <span>Typ</span>
                  <select
                    value={row.provoz}
                    onChange={(e) => {
                      const next = e.target.value as PvProvozKind;
                      onPatchRow(row.id, {
                        provoz: next,
                        avgHours: 0,
                        classCount: Math.min(Math.max(0, row.classCount), getPvMaxClassCount(next)),
                      });
                    }}
                  >
                    {PV_PROVOZ_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField
                  label={`Počet tříd pracoviště MŠ v tomto druhu provozu (0–${maxClasses}, dle přílohy platí ≥ 1 pro výpočet)`}
                  value={row.classCount}
                  onChange={(v) => onPatchRow(row.id, { classCount: v })}
                  min={0}
                  max={maxClasses}
                />
                {row.classCount <= 0 ? (
                  <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
                    {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} Pro toto pole platí rozsah 1 až {maxClasses}; bez počtu tříd
                    se pracoviště do PHmax nezapočte.
                  </p>
                ) : null}
                {row.provoz === "zdravotnicke" ? (
                  <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
                    U MŠ při zdravotnickém zařízení je PHmax <strong>31 hodin/třídu</strong> týdně – tabulky 1–3 se
                    nepoužívají.
                  </p>
                ) : null}
              </div>

              <div className="subcard">
                <h3>Navýšení dle vyhlášky</h3>
                <NumberField
                  label="Počet tříd (škol) zřízených podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)"
                  value={row.sec16Count}
                  onChange={(v) => onPatchRow(row.id, { sec16Count: v })}
                  min={0}
                  max={30}
                />
                <NumberField
                  label="Počet skupin pro jazykovou přípravu (+1 h PHmax / skupinu, § 1d odst. 11)"
                  value={row.languageGroups}
                  onChange={(v) => onPatchRow(row.id, { languageGroups: v })}
                  min={0}
                  max={50}
                />
              </div>
            </div>

            {row.provoz !== "zdravotnicke" ? (
              <div className="subcard pv-input-duration">
                <h3 className="section-title" style={{ fontSize: "1.02rem", marginBottom: 10 }}>
                  Průměrná doba provozu (tabulka {pvDurationBandTableNo(row.provoz)} přílohy)
                </h3>
                <NumberField
                  label="Průměrná doba provozu pracoviště v hodinách za den"
                  value={row.avgHours}
                  onChange={(v) => onPatchRow(row.id, { avgHours: v })}
                  min={avgMeta.min}
                  max={avgMeta.max}
                  step={avgMeta.step}
                  hint={avgMeta.hint}
                />
                {row.avgHours <= 0 ? (
                  <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
                    {INLINE_VALIDATION_MSG_REQUIRED_FIELD} Zadejte hodnotu v rozsahu {avgMeta.min} až {avgMeta.max} h.
                  </p>
                ) : row.avgHours < avgMeta.min || row.avgHours > avgMeta.max ? (
                  <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
                    Hodnota neodpovídá vybranému typu provozu. Povolený rozsah je {avgMeta.min} až {avgMeta.max} h.
                  </p>
                ) : null}
              </div>
            ) : null}

            {row.provoz !== "zdravotnicke" && row.classCount > 0 ? (
              <div className="pv-row-method-hint ux-semantic--info" role="note">
                <p style={{ margin: 0, lineHeight: 1.45 }}>
                  <strong>Krácení PHmax (</strong>
                  <PvLegisRef citeId="pv-1d3" label="§ 1d odst. 3 vyhl. 14/2005 Sb." />
                  <strong>):</strong> orientační výpočet po doplnění polí níže; závazné je rozhodnutí KÚ.
                </p>
                <div className="grid two" style={{ marginTop: 10 }}>
                  <NumberField
                    label="Skutečný počet dětí na pracovišti"
                    value={row.pv1dActualChildren}
                    onChange={(v) => onPatchRow(row.id, { pv1dActualChildren: Math.max(0, Math.round(v)) })}
                  />
                  <NumberField
                    label="Nejnižší počet dětí (vyhláška / KÚ)"
                    value={row.pv1dMinimumChildren}
                    onChange={(v) => onPatchRow(row.id, { pv1dMinimumChildren: Math.max(0, Math.round(v)) })}
                  />
                  <NumberField
                    label="PHmax z rozhodnutí KÚ (h/týden, volitelné)"
                    value={row.pv1dKuPhmaxCap}
                    onChange={(v) => onPatchRow(row.id, { pv1dKuPhmaxCap: Math.max(0, v) })}
                  />
                  <label className="field">
                    <span className="field__label">Č. jednací / označení rozhodnutí KÚ</span>
                    <input
                      type="text"
                      className="input"
                      value={row.pv1dKuDecisionRef}
                      onChange={(e) => onPatchRow(row.id, { pv1dKuDecisionRef: e.target.value })}
                      placeholder="volitelné"
                    />
                  </label>
                  <label className="checks" style={{ alignSelf: "end" }}>
                    <input
                      type="checkbox"
                      checked={row.pv1dExemption}
                      onChange={(e) => onPatchRow(row.id, { pv1dExemption: e.target.checked })}
                    />
                    § 1d odst. 3 se na pracoviště nevztahuje
                  </label>
                </div>
                {reduction1d3 && reduction1d3.status === "reduced" ? (
                  <p className="muted-text" style={{ marginTop: 8, marginBottom: 0 }}>
                    <strong>Orientační PHmax po krácení:</strong> {reduction1d3.phmaxAfter} h/týden (
                    {reduction1d3.reason})
                  </p>
                ) : reduction1d3 && reduction1d3.status === "no_reduction" ? (
                  <p className="muted-text" style={{ marginTop: 8, marginBottom: 0 }}>
                    {reduction1d3.reason}
                  </p>
                ) : reduction1d3 && reduction1d3.status === "pending_ku" ? (
                  <p className="muted-text ux-semantic--warning" style={{ marginTop: 8, marginBottom: 0 }}>
                    {reduction1d3.reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            <FieldWhyPhmaxDetails>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                <li>
                  <strong>Druh provozu a počet tříd</strong> určují základ PHmax za třídu (tabulky 1–3 přílohy; u MŠ při
                  zdravotnickém zařízení platí jednotná sazba 31 h/třídu).
                </li>
                <li>
                  <strong>Průměrná denní doba provozu</strong> zařazuje řádek do správného sloupce těchto tabulek – ovlivní
                  to výslednou základní složku PHmax.
                </li>
                <li>
                  <strong>§ 16 odst. 9 a jazykové skupiny</strong> přičítají sjednocené navýšení (5 h za třídu / +1 h za
                  skupinu podle aplikovaných položek metodiky).
                </li>
                <li>
                  <strong>PHAmax</strong> u řádků § 16 vychází z průměrné doby tohoto pracoviště (viz tabulku v detailu
                  řádku).
                </li>
              </ul>
            </FieldWhyPhmaxDetails>

            <details className="pv-row-details">
              <summary>
                Detail Pracoviště {index + 1} – vstupy a dílčí PHmax
              </summary>
              <ScrollGrabRegion className="app-table-wrap" role="region" aria-label={`Přehled vstupů pracoviště ${index + 1}`}>
                <table className="app-data-table">
                  <caption className="app-data-table__caption">
                    Vstupy – pracoviště {index + 1} ({provozLabel}
                    {row.label.trim() ? `, ${row.label.trim()}` : ""})
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Položka</th>
                      <th scope="col">Hodnota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Druh provozu</td>
                      <td>{provozLabel}</td>
                    </tr>
                    <tr>
                      <td>Počet tříd v tomto druhu provozu</td>
                      <td className="app-data-table__num">{row.classCount}</td>
                    </tr>
                    <tr>
                      <td>Průměrná doba provozu (h/den)</td>
                      <td className="app-data-table__num">
                        {row.provoz === "zdravotnicke" ? <span className="muted-text">–</span> : row.avgHours}
                      </td>
                    </tr>
                    <tr>
                      <td>Sloupec tabulky (pásmo doby)</td>
                      <td>
                        {row.provoz === "zdravotnicke" ? (
                          <span className="muted-text">–</span>
                        ) : computed.base ? (
                          computed.base.durationColumnLabel
                        ) : (
                          <span className="muted-text">Po opravě doby se zobrazí text ze přílohy</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Třídy zřízené podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)</td>
                      <td className="app-data-table__num">{row.sec16Count}</td>
                    </tr>
                    <tr>
                      <td>Skupiny jazykové přípravy (+1 h PHmax / skupinu, § 1d odst. 11 vyhl. 14/2005)</td>
                      <td className="app-data-table__num">{row.languageGroups}</td>
                    </tr>
                  </tbody>
                </table>
              </ScrollGrabRegion>

              {computed.issues.map((issue, i) => (
                <p key={`${row.id}-${issue.code}-${i}`} className="card card--warning" style={{ marginTop: 14, padding: 12 }}>
                  <strong>Pracoviště {index + 1}:</strong> {issue.message}
                </p>
              ))}

              {computed.base ? (
                <ScrollGrabRegion className="app-table-wrap app-table-wrap--spaced" role="region" aria-label={`PHmax pracoviště ${index + 1}`}>
                  <table className="app-data-table app-data-table--results">
                    <caption className="app-data-table__caption">
                      Výpočet PHmax pro pracoviště {index + 1} (hodiny týdně)
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Složka</th>
                        <th scope="col">Hodnota</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>PHmax ze základní tabulky metodiky (příslušná tabulka 1–3 / MŠ u zdrav. zařízení)</td>
                        <td className="app-data-table__num">{computed.base.basePhmax}</td>
                      </tr>
                      <tr>
                        <td>Pásmo / sloupec průměrné denní doby provozu</td>
                        <td>{computed.base.durationColumnLabel}</td>
                      </tr>
                      <tr>
                        <td>Navýšení § 16 odst. 9 školského zákona (5 h × počet tříd)</td>
                        <td className="app-data-table__num">{computed.sec16Bonus}</td>
                      </tr>
                      <tr>
                        <td>Navýšení jazyková příprava (1 h × počet skupin)</td>
                        <td className="app-data-table__num">{computed.languageBonus}</td>
                      </tr>
                    </tbody>
                    {computed.totalPhmax != null ? (
                      <tfoot>
                        <tr className="app-data-table__total-row">
                          <th scope="row">PHmax celkem (toto pracoviště)</th>
                          <td className="app-data-table__num app-data-table__num--emph">{computed.totalPhmax}</td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                </ScrollGrabRegion>
              ) : (
                !computed.issues.length && (
                  <p className="muted-text section-results">Upravte vstupy pracoviště {index + 1} pro výpočet základního PHmax.</p>
                )
              )}

              {phaMax != null ? (
                <ScrollGrabRegion className="app-table-wrap app-table-wrap--spaced" role="region" aria-label={`PHAmax pracoviště ${index + 1}`}>
                  <table className="app-data-table app-data-table--pha">
                    <caption className="app-data-table__caption">PHAmax – pracoviště {index + 1} (asistenti pedagoga, § 16)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Položka</th>
                        <th scope="col">Hodnota (h/týden)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          PHAmax dle metodiky v4
                          <span className="app-data-table__hint">
                            Použije se průměrná doba tohoto pracoviště ({hoursForPha.toLocaleString("cs-CZ")} h/den); při
                            provozu pod 8 h/den krácení poměrem doba/8. U MŠ při zdravotnickém zařízení odkaz 8
                            h/den.
                          </span>
                        </td>
                        <td className="app-data-table__num app-data-table__num--emph">{phaMax}</td>
                      </tr>
                    </tbody>
                  </table>
                </ScrollGrabRegion>
              ) : null}
            </details>
          </div>
        );
      })}
    </div>
  );
}
