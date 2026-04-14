import React from "react";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import { HeroIconActionButton, IconJson } from "../HeroActionIconButton";
import {
  PHMAX_SS_MAX_NAMED_SNAPSHOTS,
  PHMAX_SS_MODE_OPTIONS,
  PHMAX_SS_UNITS_SECTION,
} from "./phmax-ss-constants";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { PHMAX_SS_STUDY_FORM_OPTIONS, type ModeKey, type StudyForm } from "./phmax-ss-helpers";
import { explainSingleRow } from "./phmax-ss-explainability";
import type { ServiceResolvedRow } from "./phmax-ss-service";
import { explainInputFromUnitRow } from "./phmax-ss-units-derive";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";
import {
  SsSchoolExplainabilitySummary,
  SsWhyBrulesEvalErrorPanel,
  SsWhyBrulesPanel,
  SsWhyPhmaxErrorPanel,
  SsWhyPhmaxPanel,
} from "./SsWhyPanels";
import { usePhmaxSsUnits } from "./use-phmax-ss-units";
import type { PhmaxSsUnitsModel } from "./use-phmax-ss-units";

export type { SsDashboardMetrics } from "./use-phmax-ss-units";

/** Stejný tvar jako `SsDashboardMetrics` z hooku – explicitně zde kvůli stabilnímu `tsc` v CI. */
type OnSsDashboardMetrics = (m: { rowCount: number; phmaxTotal: number }) => void;

function joinRuleMessages(msgs: readonly { message: string }[]): string {
  return msgs.map((m) => m.message).join(" · ");
}

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

function PhmaxSsUnitsFormView({
  model,
  hideBackupSubcard = false,
}: {
  model: PhmaxSsUnitsModel;
  hideBackupSubcard?: boolean;
}) {
  const sec = PHMAX_SS_UNITS_SECTION;
  const {
    rows,
    updateRow,
    addRow,
    removeRow,
    whyPhmaxRowId,
    setWhyPhmaxRowId,
    whyBrulesRowId,
    setWhyBrulesRowId,
    preview,
    brulesPreview,
    computedRows,
    roundedTotal,
    schoolPhmaxExplain,
    namedSnapshots,
    selectedNamedId,
    setSelectedNamedId,
    namedSaveName,
    setNamedSaveName,
    uiNotice,
    saveNamedSsSnapshot,
    restoreNamedSsSnapshot,
    deleteNamedSsSnapshot,
    handleExportSsAuditJson,
    handleCompareSsWithNamedSnapshot,
  } = model;

  const tableDescId = "phmax-ss-units-form-desc";

  const showEmptyHint =
    rows.length === 1 &&
    !rows[0].label &&
    !rows[0].educationField &&
    !rows[0].classType &&
    !rows[0].note &&
    !rows[0].averageStudents &&
    rows[0].classCount === "1" &&
    rows[0].phmaxMode === "" &&
    rows[0].oborCountInClass === "1" &&
    !rows[0].additionalOborCodes &&
    !rows[0].oborStudentCountsRaw &&
    !rows[0].isArt82TalentClass;

  return (
    <section
      className="card section-card section-card--ss"
      aria-labelledby="ss-units-heading"
      style={{ marginTop: 24, marginBottom: 24 }}
    >
      <h2 id="ss-units-heading" className="section-title">
        {sec.heading}
      </h2>
      <p id={tableDescId} className="muted-text" style={{ marginTop: 10, lineHeight: 1.55 }}>
        {sec.lead}
      </p>
      <p className="muted-text" style={{ marginTop: 8, lineHeight: 1.55 }}>
        {sec.storageNote}
      </p>

      {hideBackupSubcard && uiNotice ? (
        <p className="muted-text" role="status" style={{ marginTop: 12, lineHeight: 1.5 }}>
          {uiNotice}
        </p>
      ) : null}

      {!hideBackupSubcard ? (
      <div className="subcard ss-units-actions" aria-label="Auditní protokol a zálohy">
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem", fontWeight: 700 }}>
          Auditní protokol a pojmenované zálohy
        </h3>
        <p className="muted-text" style={{ marginTop: 0, marginBottom: 0, lineHeight: 1.55, fontSize: "0.9rem" }}>
          Stejný formát JSON jako u PV, ŠD a ZŠ. V tomto prohlížeči lze uložit až {PHMAX_SS_MAX_NAMED_SNAPSHOTS}{" "}
          pojmenovaných stavů řádků.
        </p>
        {uiNotice ? (
          <p className="muted-text" role="status" style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
            {uiNotice}
          </p>
        ) : null}
        <div className="toolbar" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <HeroIconActionButton
            className="btn ghost"
            label="Stáhnout auditní protokol (JSON)"
            icon={<IconJson />}
            onClick={handleExportSsAuditJson}
          />
        </div>
        <div className="grid two ss-named-backups" style={{ marginTop: 16, gap: "12px 18px", alignItems: "end" }}>
          <label className="field" style={{ marginTop: 0 }}>
            <span className="field__label">Název zálohy</span>
            <input
              type="text"
              className="input"
              placeholder="např. varianta A"
              value={namedSaveName}
              onChange={(e) => setNamedSaveName(e.target.value)}
              aria-label="Název pojmenované zálohy"
            />
          </label>
          <div style={{ alignSelf: "end" }}>
            <button type="button" className="btn ghost" style={{ width: "100%" }} onClick={saveNamedSsSnapshot}>
              Uložit do seznamu
            </button>
          </div>
        </div>
        <label className="field" style={{ marginTop: 14 }}>
          <span className="field__label">Vybrat uloženou zálohu</span>
          <select
            className="input"
            value={selectedNamedId}
            onChange={(e) => setSelectedNamedId(e.target.value)}
            aria-label="Vybrat uloženou zálohu"
          >
            <option value="">Vyberte uloženou zálohu…</option>
            {namedSnapshots.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
              </option>
            ))}
          </select>
        </label>
        <div className="toolbar" style={{ marginTop: 12, flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="btn ghost" onClick={restoreNamedSsSnapshot}>
            Obnovit zálohu
          </button>
          <button type="button" className="btn ghost" onClick={deleteNamedSsSnapshot}>
            Smazat zálohu
          </button>
        </div>
        <button type="button" className="btn ghost" style={{ marginTop: 12, width: "100%" }} onClick={handleCompareSsWithNamedSnapshot}>
          Porovnat aktuální stav se zálohou (JSON)…
        </button>
      </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn btn--light" onClick={addRow}>
          {sec.addRow}
        </button>
      </div>

      <ScrollGrabRegion className="app-table-wrap app-table-wrap--spaced" role="region" aria-labelledby="ss-units-heading">
        <table className="app-data-table" aria-describedby={tableDescId}>
          <caption className="app-data-table__caption">{sec.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{sec.colLabel}</th>
              <th scope="col">{sec.colEducationField}</th>
              <th scope="col">{sec.colAvgStudents}</th>
              <th scope="col">{sec.colClassCount}</th>
              <th scope="col">{sec.colStudyForm}</th>
              <th scope="col">{sec.colPhmaxMode}</th>
              <th scope="col">{sec.colOborCountInClass}</th>
              <th scope="col">{sec.colArt82Talent}</th>
              <th scope="col">{sec.colAdditionalObors}</th>
              <th scope="col">{sec.colOborStudentCounts}</th>
              <th scope="col">{sec.colClassType}</th>
              <th scope="col">{sec.colNote}</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    aria-label={`${sec.colLabel}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.educationField}
                    onChange={(e) => updateRow(row.id, { educationField: e.target.value })}
                    aria-label={`${sec.colEducationField}, řádek ${row.id}`}
                    spellCheck={false}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    inputMode="decimal"
                    value={row.averageStudents}
                    onChange={(e) => updateRow(row.id, { averageStudents: e.target.value })}
                    aria-label={`${sec.colAvgStudents}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    inputMode="numeric"
                    value={row.classCount}
                    onChange={(e) => updateRow(row.id, { classCount: e.target.value })}
                    aria-label={`${sec.colClassCount}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <select
                    className="input"
                    value={row.studyForm}
                    onChange={(e) => updateRow(row.id, { studyForm: e.target.value as StudyForm })}
                    aria-label={`${sec.colStudyForm}, řádek ${row.id}`}
                  >
                    {PHMAX_SS_STUDY_FORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="input"
                    value={row.phmaxMode}
                    onChange={(e) =>
                      updateRow(row.id, { phmaxMode: e.target.value as "" | ModeKey })
                    }
                    aria-label={`${sec.colPhmaxMode}, řádek ${row.id}`}
                  >
                    {PHMAX_SS_MODE_OPTIONS.map((o) => (
                      <option key={o.value || "auto"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    inputMode="numeric"
                    value={row.oborCountInClass}
                    onChange={(e) => updateRow(row.id, { oborCountInClass: e.target.value })}
                    aria-label={`${sec.colOborCountInClass}, řádek ${row.id}`}
                    title="Pro režim „Automaticky“; při ručním režimu se pole typicky nechá 1."
                  />
                </td>
                <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                  <input
                    type="checkbox"
                    checked={row.isArt82TalentClass}
                    onChange={(e) => updateRow(row.id, { isArt82TalentClass: e.target.checked })}
                    aria-label={`${sec.colArt82Talent}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.additionalOborCodes}
                    onChange={(e) => updateRow(row.id, { additionalOborCodes: e.target.value })}
                    aria-label={`${sec.colAdditionalObors}, řádek ${row.id}`}
                    placeholder="kód, kód…"
                    spellCheck={false}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.oborStudentCountsRaw}
                    onChange={(e) => updateRow(row.id, { oborStudentCountsRaw: e.target.value })}
                    aria-label={`${sec.colOborStudentCounts}, řádek ${row.id}`}
                    placeholder="KÓD:15 …"
                    spellCheck={false}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.classType}
                    onChange={(e) => updateRow(row.id, { classType: e.target.value })}
                    aria-label={`${sec.colClassType}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="input"
                    value={row.note}
                    onChange={(e) => updateRow(row.id, { note: e.target.value })}
                    aria-label={`${sec.colNote}, řádek ${row.id}`}
                  />
                </td>
                <td>
                  <button type="button" className="btn ghost" onClick={() => removeRow(row.id)}>
                    {sec.removeRow}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>

      {showEmptyHint ? (
        <p className="muted-text" style={{ marginTop: 12 }}>
          {sec.emptyHint}
        </p>
      ) : null}

      <div style={{ marginTop: 22 }}>
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
                const toggleWhyPhmax = () =>
                  setWhyPhmaxRowId((cur) => (cur === p.rowId ? null : p.rowId));

                if (p.skipped) {
                  return (
                    <tr key={p.rowId}>
                      <td>{p.label || "—"}</td>
                      <td colSpan={5} className="muted-text">
                        (nezadáno pro výpočet)
                      </td>
                      <td className="muted-text">—</td>
                    </tr>
                  );
                }
                if ("error" in p) {
                  const open = whyPhmaxRowId === p.rowId;
                  return (
                    <React.Fragment key={p.rowId}>
                      <tr>
                        <td>{p.label || "—"}</td>
                        <td>{code}</td>
                        <td className="muted-text">—</td>
                        <td colSpan={2} className="muted-text">
                          —
                        </td>
                        <td className="app-data-table__num">—</td>
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
                return (
                  <React.Fragment key={p.rowId}>
                    <tr>
                      <td>{p.label || "—"}</td>
                      <td>{r.code}</td>
                      <td className="muted-text">{r.modeKey}</td>
                      <td>{r.intervalLabel}</td>
                      <td className="app-data-table__num">{r.adjustedPhmaxPerClass}</td>
                      <td className="app-data-table__num app-data-table__num--emph">{r.totalPhmax}</td>
                      <td className="muted-text">
                        OK
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
        {schoolPhmaxExplain ? (
          <details
            className="card muted ss-explain-school-wrap"
            style={{ marginTop: 14, padding: "12px 14px", textAlign: "left" }}
          >
            <summary className="ss-why-panel__title" style={{ cursor: "pointer", listStyle: "none" }}>
              <strong>Celkový výklad PHmax</strong> — součet platných řádků (explainability)
            </summary>
            <p className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", lineHeight: 1.5 }}>
              Do souhrnu jsou sloučeny výsledky z tabulky „Kontrola pravidel“ pro každý platný řádek PHmax (prefix{" "}
              <code className="methodology-strip__code">[označení řádku]</code> u zpráv). Řádky bez vyplněného oboru pro
              kontrolu se do pravidel nezapočítávají. Engine:{" "}
              <code className="methodology-strip__code">phmax-ss-explainability</code>.
            </p>
            <SsSchoolExplainabilitySummary result={schoolPhmaxExplain} />
          </details>
        ) : null}
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "1.05rem", fontWeight: 700 }}>{sec.brulesHeading}</h3>
        <p className="muted-text" style={{ marginBottom: 12, lineHeight: 1.5 }}>
          {sec.brulesHint}
        </p>
        <ScrollGrabRegion className="app-table-wrap" role="region" aria-label={sec.brulesHeading}>
          <table className="app-data-table">
            <thead>
              <tr>
                <th scope="col">Označení</th>
                <th scope="col">Obory ve třídě</th>
                <th scope="col">Povoleno</th>
                <th scope="col">Návrh výpočtu / režim</th>
                <th scope="col">Zprávy</th>
              </tr>
            </thead>
            <tbody>
              {brulesPreview.map((b) => {
                const toggleWhyBrules = () =>
                  setWhyBrulesRowId((cur) => (cur === b.rowId ? null : b.rowId));

                if (b.skipped) {
                  return (
                    <tr key={b.rowId}>
                      <td>{b.label || "—"}</td>
                      <td colSpan={3} className="muted-text">
                        (zadáním kódu oboru v řádku výše)
                      </td>
                      <td className="muted-text">—</td>
                    </tr>
                  );
                }
                if ("error" in b) {
                  const openErr = whyBrulesRowId === b.rowId;
                  return (
                    <React.Fragment key={b.rowId}>
                      <tr>
                        <td>{b.label || "—"}</td>
                        <td>{b.codesStr}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                          <span style={{ color: "var(--danger, #b91c1c)" }}>{b.error}</span>
                          <button
                            type="button"
                            className="btn ghost ss-why-btn"
                            onClick={toggleWhyBrules}
                            aria-expanded={openErr}
                            aria-controls={`ss-why-brules-${b.rowId}`}
                          >
                            Proč?
                          </button>
                        </td>
                      </tr>
                      {openErr ? (
                        <tr className="ss-why-row">
                          <td colSpan={5} id={`ss-why-brules-${b.rowId}`}>
                            <SsWhyBrulesEvalErrorPanel error={b.error} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                }
                const r = b.result;
                const suggestion = [r.suggestedComputation ?? "—", r.recommendedMode ?? "—"].join(" · ");
                const errT = joinRuleMessages(r.errors);
                const warnT = joinRuleMessages(r.warnings);
                const infoT = joinRuleMessages(r.info);
                const openB = whyBrulesRowId === b.rowId;
                return (
                  <React.Fragment key={b.rowId}>
                    <tr>
                      <td>{b.label || "—"}</td>
                      <td>{b.codesStr}</td>
                      <td>{r.allowed ? "Ano" : "Ne"}</td>
                      <td className="muted-text">{suggestion}</td>
                      <td style={{ lineHeight: 1.45, fontSize: "0.92rem" }}>
                        {errT ? (
                          <div style={{ color: "var(--danger, #b91c1c)", marginBottom: 4 }}>{errT}</div>
                        ) : null}
                        {warnT ? (
                          <div style={{ color: "var(--warning, #b45309)", marginBottom: 4 }}>{warnT}</div>
                        ) : null}
                        {infoT ? <div className="muted-text">{infoT}</div> : null}
                        {!errT && !warnT && !infoT ? <span className="muted-text">—</span> : null}
                        <button
                          type="button"
                          className="btn ghost ss-why-btn"
                          onClick={toggleWhyBrules}
                          aria-expanded={openB}
                          aria-controls={`ss-why-brules-${b.rowId}`}
                        >
                          Proč?
                        </button>
                      </td>
                    </tr>
                    {openB ? (
                      <tr className="ss-why-row">
                        <td colSpan={5} id={`ss-why-brules-${b.rowId}`}>
                          <SsWhyBrulesPanel result={r} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </ScrollGrabRegion>
      </div>
    </section>
  );
}

function PhmaxSsUnitsFormWithOwnState({
  onDashboardMetrics,
  hideBackupSubcard,
}: {
  onDashboardMetrics?: OnSsDashboardMetrics;
  hideBackupSubcard?: boolean;
}) {
  const model = usePhmaxSsUnits(onDashboardMetrics);
  return <PhmaxSsUnitsFormView model={model} hideBackupSubcard={hideBackupSubcard} />;
}

export type PhmaxSsUnitsFormProps = {
  model?: PhmaxSsUnitsModel;
  hideBackupSubcard?: boolean;
  onDashboardMetrics?: OnSsDashboardMetrics;
};

export function PhmaxSsUnitsForm({ model, hideBackupSubcard, onDashboardMetrics }: PhmaxSsUnitsFormProps) {
  if (model) {
    return <PhmaxSsUnitsFormView model={model} hideBackupSubcard={hideBackupSubcard} />;
  }
  return (
    <PhmaxSsUnitsFormWithOwnState onDashboardMetrics={onDashboardMetrics} hideBackupSubcard={hideBackupSubcard} />
  );
}
