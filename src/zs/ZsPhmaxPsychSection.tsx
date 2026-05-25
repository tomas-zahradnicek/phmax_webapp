import type { CalculatorViewMode } from "../calculator-view-mode";
import { IntegerInput } from "../IntegerInput";
import { TableOuter } from "../TableOuter";
import { ZsModuleGate } from "../ZsModuleGate";
import { ZsFieldHint } from "./zs-field-hint";

export type ZsPhmaxPsychComputedRow = {
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

export type ZsPhmaxPsychSectionProps = {
  viewMode: CalculatorViewMode;
  rows: ZsPhmaxPsychComputedRow[];
  onAdd: () => void;
  onUpdate: (id: number, key: string, value: string | number) => void;
  onRemove: (id: number) => void;
};

export function ZsPhmaxPsychSection({ viewMode, rows, onAdd, onUpdate, onRemove }: ZsPhmaxPsychSectionProps) {
  return (
    <ZsModuleGate sectionId="psych" title="Škola při psychiatrické nemocnici" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-psych"
        data-section="psych"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>
          Škola při psychiatrické nemocnici{" "}
          <ZsFieldHint text="U této části se pracuje s aktuálním údajem nebo s vyšší hodnotou z aktuálního a předchozího údaje podle zvoleného režimu. Výsledek se pak určí podle příslušného pásma pro 1. stupeň, 2. stupeň nebo společnou výuku." />
        </h2>
        <p className="muted-text">Najeďte na ikonu „i“ u nadpisu pro stručnou metodickou nápovědu.</p>
        <TableOuter aria-label="Tabulka školy při psychiatrické nemocnici">
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
                        <option value="psych1">1. stupeň</option>
                        <option value="psych2">2. stupeň</option>
                        <option value="psychMix">1. a 2. stupeň společně</option>
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
