import React, { useCallback, useEffect, useMemo, useState } from "react";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";
import {
  calculateExpensesSubtotal,
  calculateProfitOrLoss,
  calculateRevenueSubtotal,
  formatCzkAmount,
} from "./vyrocni-zprava-section11-finance-helpers";
import {
  createDefaultSection11GrantRow,
  createDefaultSection11InvestmentRow,
  type Section11Readiness,
} from "./vyrocni-zprava-section11-data-logic";
import type {
  AnnualReportSection11Data,
  AnnualReportSection11GrantOrSubsidy,
  AnnualReportSection11InvestmentOrRepair,
  Section11SupplementaryActivityStatus,
} from "./vyrocni-zprava-section11-types";

type VyrocniZpravaSection11DataFormProps = {
  section11Data: AnnualReportSection11Data;
  savedAt: string | null;
  readiness: Section11Readiness;
  onSave: (data: AnnualReportSection11Data) => void;
  onReset: () => void;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function displayNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function MoneyField(props: { label: string; value: number | undefined; onChange: (value: number | undefined) => void }) {
  return (
    <label className="vyrocni-zprava-field">
      <span className="vyrocni-zprava-field__label">{props.label}</span>
      <input className="input" value={displayNumber(props.value)} onChange={(event) => props.onChange(parseOptionalNumber(event.target.value))} />
    </label>
  );
}

function GrantsTable(props: {
  rows: AnnualReportSection11GrantOrSubsidy[];
  onChange: (rows: AnnualReportSection11GrantOrSubsidy[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section11-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section11-form__panel-title">E) Dotace, granty a projekty</h4>
      <div className="vyrocni-zprava-section11-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section11-form__table">
          <thead>
            <tr>
              <th scope="col">Název dotace / projektu</th>
              <th scope="col">Poskytovatel</th>
              <th scope="col">Částka</th>
              <th scope="col">Účel</th>
              <th scope="col">Čerpáno</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted-text">
                  Zatím není přidána žádná dotace/projekt.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`grant-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.provider ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, provider: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.amount)}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, amount: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.purpose ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, purpose: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.usedAmount)}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, usedAmount: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat dotaci/projekt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection11GrantRow()])}>
        Přidat dotaci/projekt
      </button>
    </section>
  );
}

function InvestmentsTable(props: {
  rows: AnnualReportSection11InvestmentOrRepair[];
  onChange: (rows: AnnualReportSection11InvestmentOrRepair[]) => void;
}) {
  const { rows, onChange } = props;
  return (
    <section className="vyrocni-zprava-section11-form__panel card card--elevated">
      <h4 className="vyrocni-zprava-section11-form__panel-title">G) Investice, opravy a větší nákupy</h4>
      <div className="vyrocni-zprava-section11-form__table-wrap">
        <table className="app-data-table vyrocni-zprava-section11-form__table">
          <thead>
            <tr>
              <th scope="col">Název akce / pořízení</th>
              <th scope="col">Částka</th>
              <th scope="col">Zdroj financování</th>
              <th scope="col">Popis</th>
              <th scope="col">Poznámka</th>
              <th scope="col">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted-text">
                  Zatím není přidána žádná investice/oprava.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`investment-${index}`}>
                  <td>
                    <input
                      className="input"
                      value={row.title}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={displayNumber(row.amount)}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, amount: parseOptionalNumber(event.target.value) } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.fundingSource ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, fundingSource: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.description ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={row.note ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))
                      }
                    />
                  </td>
                  <td className="app-data-table__num">
                    <button type="button" className="btn ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                      Odebrat investici/opravu
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn ghost" onClick={() => onChange([...(rows ?? []), createDefaultSection11InvestmentRow()])}>
        Přidat investici/opravu
      </button>
    </section>
  );
}

export function VyrocniZpravaSection11DataForm({
  section11Data,
  savedAt,
  readiness,
  onSave,
  onReset,
}: VyrocniZpravaSection11DataFormProps) {
  const [draft, setDraft] = useState(section11Data);

  useEffect(() => {
    setDraft(section11Data);
  }, [section11Data, savedAt]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm("Opravdu chcete vymazat údaje kapitoly 11 uložené v tomto prohlížeči?");
    if (confirmed) onReset();
  }, [onReset]);

  const revenueSubtotal = useMemo(() => calculateRevenueSubtotal(draft.revenue), [draft.revenue]);
  const expensesSubtotal = useMemo(() => calculateExpensesSubtotal(draft.expenses), [draft.expenses]);
  const calculatedProfit = useMemo(
    () => calculateProfitOrLoss(draft.revenue.totalRevenue, draft.expenses.totalExpenses),
    [draft.revenue.totalRevenue, draft.expenses.totalExpenses],
  );

  return (
    <div className="vyrocni-zprava-detail__block vyrocni-zprava-section11-form" role="region" aria-labelledby="vyrocni-zprava-section11-form-title">
      <div className="vyrocni-zprava-section11-form__header">
        <div>
          <h3 id="vyrocni-zprava-section11-form-title" className="vyrocni-zprava-detail__block-title">
            Základní údaje o hospodaření školy
          </h3>
          <p className="muted-text vyrocni-zprava-section11-form__lead">
            Sekce 11 převádí pouze ručně zadané ekonomické údaje bez vytváření účetních nebo právních závěrů.
          </p>
        </div>
        <div className="vyrocni-zprava-section11-form__meta">
          <VyrocniZpravaStatusBadge status={readiness.status === "PRIPRAVENO" ? "PRIPRAVENO" : "CHYBI_UDAJE"} compact />
          {savedAt ? <p className="vyrocni-zprava-section11-form__saved muted-text">Uloženo v tomto prohlížeči: {savedAt}</p> : null}
        </div>
      </div>

      {readiness.missingData.length > 0 ? (
        <div className="vyrocni-zprava-section11-form__subsection">
          <h4 className="vyrocni-zprava-section11-form__subtitle">Chybějící povinné údaje</h4>
          <ul className="vyrocni-zprava-detail__missing-list">
            {readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.recommendedData.length > 0 ? (
        <div className="vyrocni-zprava-section11-form__subsection">
          <h4 className="vyrocni-zprava-section11-form__subtitle">Doporučené doplňující údaje</h4>
          <ul className="vyrocni-zprava-section11-form__list muted-text">
            {readiness.recommendedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="vyrocni-zprava-section11-form__subsection">
          <h4 className="vyrocni-zprava-section11-form__subtitle">Upozornění k ověření</h4>
          <ul className="vyrocni-zprava-section11-form__warnings">
            {readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">A) Účetní / vykazované období</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Období, za které jsou údaje o hospodaření uváděny</span>
          <input
            className="input"
            value={draft.reportingPeriod ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, reportingPeriod: event.target.value }))}
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">B) Příjmy / výnosy školy</h4>
        <div className="vyrocni-zprava-section11-form__grid">
          <MoneyField
            label="Příspěvek ze státního rozpočtu"
            value={draft.revenue.stateBudgetContribution}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, stateBudgetContribution: value } }))}
          />
          <MoneyField
            label="Příspěvek zřizovatele"
            value={draft.revenue.founderContribution}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, founderContribution: value } }))}
          />
          <MoneyField
            label="Dotace a projekty"
            value={draft.revenue.grantsAndProjects}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, grantsAndProjects: value } }))}
          />
          <MoneyField
            label="Vlastní příjmy"
            value={draft.revenue.ownRevenue}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, ownRevenue: value } }))}
          />
          <MoneyField
            label="Dary"
            value={draft.revenue.donations}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, donations: value } }))}
          />
          <MoneyField
            label="Ostatní příjmy"
            value={draft.revenue.otherRevenue}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, otherRevenue: value } }))}
          />
          <MoneyField
            label="Příjmy / výnosy celkem"
            value={draft.revenue.totalRevenue}
            onChange={(value) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, totalRevenue: value } }))}
          />
        </div>
        <p className="muted-text">Orientační součet zadaných položek: {formatCzkAmount(revenueSubtotal)}</p>
        {revenueSubtotal !== undefined &&
        draft.revenue.totalRevenue !== undefined &&
        revenueSubtotal !== draft.revenue.totalRevenue ? (
          <p className="vyrocni-zprava-section11-form__warning-inline">
            Upozornění: orientační součet se liší od hodnoty „Příjmy / výnosy celkem“.
          </p>
        ) : null}
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.revenue.note ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, revenue: { ...prev.revenue, note: event.target.value } }))}
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">C) Výdaje / náklady školy</h4>
        <div className="vyrocni-zprava-section11-form__grid">
          <MoneyField
            label="Mzdové náklady"
            value={draft.expenses.salaryCosts}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, salaryCosts: value } }))}
          />
          <MoneyField
            label="Zákonné odvody"
            value={draft.expenses.statutoryContributions}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, statutoryContributions: value } }))}
          />
          <MoneyField
            label="Provozní náklady"
            value={draft.expenses.operatingCosts}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, operatingCosts: value } }))}
          />
          <MoneyField
            label="Energie"
            value={draft.expenses.energyCosts}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, energyCosts: value } }))}
          />
          <MoneyField
            label="Opravy a údržba"
            value={draft.expenses.repairsAndMaintenance}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, repairsAndMaintenance: value } }))}
          />
          <MoneyField
            label="Vybavení a materiál"
            value={draft.expenses.equipmentAndMaterials}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, equipmentAndMaterials: value } }))}
          />
          <MoneyField
            label="Služby"
            value={draft.expenses.services}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, services: value } }))}
          />
          <MoneyField
            label="Výdaje projektů a dotací"
            value={draft.expenses.grantsAndProjectsExpenses}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, grantsAndProjectsExpenses: value } }))}
          />
          <MoneyField
            label="Ostatní výdaje"
            value={draft.expenses.otherExpenses}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, otherExpenses: value } }))}
          />
          <MoneyField
            label="Výdaje / náklady celkem"
            value={draft.expenses.totalExpenses}
            onChange={(value) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, totalExpenses: value } }))}
          />
        </div>
        <p className="muted-text">Orientační součet zadaných položek: {formatCzkAmount(expensesSubtotal)}</p>
        {expensesSubtotal !== undefined &&
        draft.expenses.totalExpenses !== undefined &&
        expensesSubtotal !== draft.expenses.totalExpenses ? (
          <p className="vyrocni-zprava-section11-form__warning-inline">
            Upozornění: orientační součet se liší od hodnoty „Výdaje / náklady celkem“.
          </p>
        ) : null}
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.expenses.note ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, expenses: { ...prev.expenses, note: event.target.value } }))}
          />
        </label>
      </section>

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">D) Hospodářský výsledek</h4>
        <div className="vyrocni-zprava-section11-form__grid">
          <MoneyField
            label="Hospodářský výsledek"
            value={draft.economicResult.profitOrLoss}
            onChange={(value) => setDraft((prev) => ({ ...prev, economicResult: { ...prev.economicResult, profitOrLoss: value } }))}
          />
          <MoneyField
            label="Výsledek hlavní činnosti"
            value={draft.economicResult.mainActivityResult}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, economicResult: { ...prev.economicResult, mainActivityResult: value } }))
            }
          />
          <MoneyField
            label="Výsledek doplňkové činnosti"
            value={draft.economicResult.supplementaryActivityResult}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, economicResult: { ...prev.economicResult, supplementaryActivityResult: value } }))
            }
          />
          <MoneyField
            label="Příděl do rezervního fondu"
            value={draft.economicResult.reserveFundAllocation}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, economicResult: { ...prev.economicResult, reserveFundAllocation: value } }))
            }
          />
        </div>
        {calculatedProfit !== undefined ? (
          <p className="muted-text">Orientační výsledek z celkových příjmů a výdajů: {formatCzkAmount(calculatedProfit)}</p>
        ) : null}
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.economicResult.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, economicResult: { ...prev.economicResult, note: event.target.value } }))
            }
          />
        </label>
      </section>

      <GrantsTable rows={draft.grantsAndSubsidies} onChange={(rows) => setDraft((prev) => ({ ...prev, grantsAndSubsidies: rows }))} />

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">F) Doplňková činnost</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Byla vykonávána doplňková činnost?</span>
          <select
            className="input"
            value={draft.supplementaryActivity.carriedOut ?? "NEUVEDENO"}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: {
                  ...prev.supplementaryActivity,
                  carriedOut: event.target.value as Section11SupplementaryActivityStatus,
                },
              }))
            }
          >
            <option value="ANO">ANO</option>
            <option value="NE">NE</option>
            <option value="NEUVEDENO">NEUVEDENO</option>
          </select>
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Popis doplňkové činnosti</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supplementaryActivity.description ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: { ...prev.supplementaryActivity, description: event.target.value },
              }))
            }
          />
        </label>
        <div className="vyrocni-zprava-section11-form__grid">
          <MoneyField
            label="Výnosy"
            value={draft.supplementaryActivity.revenue}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: { ...prev.supplementaryActivity, revenue: value },
              }))
            }
          />
          <MoneyField
            label="Náklady"
            value={draft.supplementaryActivity.expenses}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: { ...prev.supplementaryActivity, expenses: value },
              }))
            }
          />
          <MoneyField
            label="Výsledek"
            value={draft.supplementaryActivity.result}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: { ...prev.supplementaryActivity, result: value },
              }))
            }
          />
        </div>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámka</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={2}
            value={draft.supplementaryActivity.note ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                supplementaryActivity: { ...prev.supplementaryActivity, note: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <InvestmentsTable
        rows={draft.investmentsAndRepairs}
        onChange={(rows) => setDraft((prev) => ({ ...prev, investmentsAndRepairs: rows }))}
      />

      <section className="vyrocni-zprava-section11-form__panel card card--elevated">
        <h4 className="vyrocni-zprava-section11-form__panel-title">H) Souhrnný komentář</h4>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Souhrnný komentář k hospodaření školy</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={4}
            value={draft.summaryCommentary ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, summaryCommentary: event.target.value }))}
          />
        </label>
        <label className="vyrocni-zprava-field">
          <span className="vyrocni-zprava-field__label">Poznámky</span>
          <textarea
            className="input vyrocni-zprava-detail__textarea"
            rows={3}
            value={draft.notes ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </label>
      </section>

      <div className="vyrocni-zprava-section11-form__actions">
        <button type="button" className="btn primary" onClick={handleSave}>
          Uložit údaje
        </button>
        <button type="button" className="btn ghost" onClick={handleReset}>
          Vymazat údaje
        </button>
      </div>
    </div>
  );
}
