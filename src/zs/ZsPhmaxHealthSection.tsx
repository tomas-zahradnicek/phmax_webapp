import type { CalculatorViewMode } from "../calculator-view-mode";
import { IntegerInput } from "../IntegerInput";
import { TableOuter } from "../TableOuter";
import { ZsModuleGate } from "../ZsModuleGate";
import { ZsFieldHint } from "./zs-field-hint";

export type ZsPhmaxHealthComputedRow = {
  id: number;
  kind: string;
  mode: string;
  currentPupils: number;
  currentClasses: number;
  prevPupils: number;
  prevClasses: number;
  usedAvg: number;
  bandLabel: string;
  perClass: number;
};

export type ZsPhmaxHealthSectionProps = {
  viewMode: CalculatorViewMode;
  rows: ZsPhmaxHealthComputedRow[];
  onAdd: () => void;
  onUpdate: (id: number, key: string, value: string | number) => void;
  onRemove: (id: number) => void;
};

export function ZsPhmaxHealthSection({ viewMode, rows, onAdd, onUpdate, onRemove }: ZsPhmaxHealthSectionProps) {
  return (
    <ZsModuleGate sectionId="health" title="ZŠ při zdravotnickém zařízení" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-psych"
        data-section="health"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>
          ZŠ při zdravotnickém zařízení (mimo psychiatrii){" "}
          <ZsFieldHint text="Řádky B11–B13 dle metodiky ZV v5. Průměr žáků ve třídě se stanoví jako vyšší z průměru za předchozí školní rok a z údaje k aktuálnímu sběru (stejná logika jako u psychiatrické školy). B11 = 1. stupeň, B12 = 2. stupeň, B13 = společná výuka 1. a 2. stupně." />
        </h2>
        <p className="muted-text">Nezahrnuje školy při psychiatrické nemocnici – ty mají samostatný režim (B14–B16).</p>
        <TableOuter aria-label="Tabulka ZŠ při zdravotnickém zařízení">
          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Zdroj</th>
                <th>Akt. žáci</th>
                <th>Akt. třídy</th>
                <th>Před. žáci</th>
                <th>Před. třídy</th>
                <th>Průměr</th>
                <th>Výsledek</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="muted-text">
                    Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select value={row.kind} onChange={(e) => onUpdate(row.id, "kind", e.target.value)}>
                        <option value="health1">1. stupeň (ř. B11)</option>
                        <option value="health2">2. stupeň (ř. B12)</option>
                        <option value="healthMix">1. a 2. stupeň společně (ř. B13)</option>
                      </select>
                    </td>
                    <td>
                      <select value={row.mode} onChange={(e) => onUpdate(row.id, "mode", e.target.value)}>
                        <option value="higher_of_two">Vyšší z obou údajů</option>
                        <option value="current_only">Jen aktuální rok</option>
                      </select>
                    </td>
                    <td>
                      <IntegerInput value={row.currentPupils} onChange={(v) => onUpdate(row.id, "currentPupils", v)} />
                    </td>
                    <td>
                      <IntegerInput value={row.currentClasses} onChange={(v) => onUpdate(row.id, "currentClasses", v)} />
                    </td>
                    <td>
                      <IntegerInput value={row.prevPupils} onChange={(v) => onUpdate(row.id, "prevPupils", v)} />
                    </td>
                    <td>
                      <IntegerInput value={row.prevClasses} onChange={(v) => onUpdate(row.id, "prevClasses", v)} />
                    </td>
                    <td>{row.usedAvg}</td>
                    <td>
                      {row.bandLabel} / {row.perClass}
                    </td>
                    <td>
                      <button type="button" className="icon-btn" onClick={() => onRemove(row.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableOuter>
        <button type="button" className="btn ghost" onClick={onAdd}>
          Přidat třídu / řádek
        </button>
      </section>
    </ZsModuleGate>
  );
}
