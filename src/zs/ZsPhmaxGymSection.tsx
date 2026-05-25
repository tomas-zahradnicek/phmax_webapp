import type { CalculatorViewMode } from "../calculator-view-mode";
import type { GymRow } from "../phmax-zs-logic";
import { TABLE_SCROLL_HINT } from "../calculator-ui-constants";
import { IntegerInput } from "../IntegerInput";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import { ZsModuleGate } from "../ZsModuleGate";

export type ZsPhmaxGymComputedRow = {
  id: number;
  kind: string;
  classes: number;
  pupils: number;
  avg: number;
  bandLabel: string;
  perClass: number;
  subtotal: number;
};

export type ZsPhmaxGymSectionProps = {
  viewMode: CalculatorViewMode;
  rows: ZsPhmaxGymComputedRow[];
  onAdd: () => void;
  onUpdate: (id: number, key: keyof GymRow, value: string | number) => void;
  onRemove: (id: number) => void;
};

export function ZsPhmaxGymSection({ viewMode, rows, onAdd, onUpdate, onRemove }: ZsPhmaxGymSectionProps) {
  return (
    <ZsModuleGate sectionId="gym" title="Nižší ročníky víceletých gymnázií" viewMode={viewMode}>
      <section
        className="card section-card section-card--module section-card--module-gym"
        data-section="gym"
        data-wizard-step="3"
        data-phmax-pane="exceptions"
      >
        <h2>Nižší ročníky víceletých gymnázií</h2>
        <p className="muted-text gym-module__lead">
          Každý řádek je jeden typ nižšího ročníku gymnázia. Zadejte třídy a žáci; průměr, pásmo a PHmax se dopočítají.
          Tabulka používá celou šířku karty – na velmi úzkém displeji se může zobrazit posuvník.
        </p>
        <ScrollGrabRegion className="gym-table-scroll">
          <p className="table-outer__hint table-outer__hint--inset">{TABLE_SCROLL_HINT}</p>
          <table className="table table--gym">
            <thead>
              <tr>
                <th scope="col">Typ gymnázia</th>
                <th scope="col">Třídy</th>
                <th scope="col">Žáci</th>
                <th scope="col">Průměr</th>
                <th scope="col">Pásmo</th>
                <th scope="col">PHmax / třída</th>
                <th scope="col">Mezisoučet</th>
                <th scope="col">
                  <span className="gym-table__sr-head">Smazat</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted-text">
                    Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select value={row.kind} onChange={(e) => onUpdate(row.id, "kind", e.target.value)}>
                        <option value="gym6">Gymnázium šestileté</option>
                        <option value="gym8">Gymnázium osmileté</option>
                        <option value="sport8">Gymnázium sportovní 8leté</option>
                        <option value="sport6">Gymnázium sportovní 6leté</option>
                      </select>
                    </td>
                    <td>
                      <IntegerInput value={row.classes} onChange={(v) => onUpdate(row.id, "classes", v)} />
                    </td>
                    <td>
                      <IntegerInput value={row.pupils} onChange={(v) => onUpdate(row.id, "pupils", v)} />
                    </td>
                    <td>{row.avg}</td>
                    <td>{row.bandLabel}</td>
                    <td>{row.perClass}</td>
                    <td>{row.subtotal}</td>
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
        </ScrollGrabRegion>
        <button type="button" className="btn ghost gym-module__add" onClick={onAdd}>
          Přidat třídu / řádek
        </button>
      </section>
    </ZsModuleGate>
  );
}
